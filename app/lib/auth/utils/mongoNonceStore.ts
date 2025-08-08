import { MongoClient, Collection } from 'mongodb';

interface NonceDocument {
  _id?: string;
  address: string;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
}

class MongoNonceStore {
  private client: MongoClient;
  private collection: Collection<NonceDocument> | null = null;
  private readonly NONCE_TTL = 5 * 60; // 5 minutes in seconds

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI || '');
  }

  private async getCollection(): Promise<Collection<NonceDocument>> {
    if (!this.collection) {
      await this.client.connect();
      const db = this.client.db('auth');
      this.collection = db.collection<NonceDocument>('nonces');
      
      // Create indexes for performance and automatic cleanup
      await this.collection.createIndex(
        { address: 1, nonce: 1 }, 
        { unique: true }
      );
      await this.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 }
      );
      await this.collection.createIndex({ address: 1 });
    }
    return this.collection;
  }

  /**
   * Atomically check if a nonce is valid and mark it as used
   * This prevents race conditions and ensures each nonce can only be used once
   */
  async checkAndUseNonce(address: string, nonce: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      console.log('MongoDB: Checking nonce:', {
        address: address.toLowerCase(),
        nonce,
        currentTime: now.toISOString()
      });
      
      // First, let's see what nonces exist (check both by address and by nonce)
      const existingNoncesByAddress = await collection.find({
        address: address.toLowerCase()
      }).toArray();
      
      const existingNoncesByValue = await collection.find({
        nonce: nonce
      }).toArray();
      
      console.log('MongoDB: Existing nonces for address:', existingNoncesByAddress);
      console.log('MongoDB: Existing nonces for nonce value:', existingNoncesByValue);
      
      // Try to find and delete the nonce by nonce value first (for pending addresses)
      // This handles the case where nonce was stored with 'pending' address
      let result = await collection.findOneAndDelete({
        nonce: nonce,
        expiresAt: { $gt: now } // Only find non-expired nonces
      });
      
      console.log('MongoDB: findOneAndDelete by nonce result:', result);
      
      // If found by nonce value, update it with the actual address before returning
      if (result) {
        console.log('MongoDB: Found nonce by value, associating with address:', address.toLowerCase());
        return true;
      }
      
      // Fallback: try to find by both address and nonce (for cases where address was known)
      result = await collection.findOneAndDelete({
        address: address.toLowerCase(),
        nonce: nonce,
        expiresAt: { $gt: now }
      });
      
      console.log('MongoDB: findOneAndDelete by address+nonce result:', result);

      // If we found and deleted a document, the nonce was valid and unused
      return result !== null;
    } catch (error) {
      console.error('MongoDB nonce validation error:', error);
      return false;
    }
  }

  /**
   * Store a new nonce for an address
   * This is called when generating a nonce
   */
  async storeNonce(address: string, nonce: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.NONCE_TTL * 1000));

      const document = {
        address: address.toLowerCase(),
        nonce: nonce,
        createdAt: now,
        expiresAt: expiresAt
      };
      
      console.log('MongoDB: Storing nonce document:', document);
      
      const result = await collection.insertOne(document);
      
      console.log('MongoDB: Insert result:', {
        insertedId: result.insertedId,
        acknowledged: result.acknowledged
      });

      console.log('MongoDB: Successfully stored nonce for address:', address);
    } catch (error) {
      // Handle duplicate key error (nonce already exists)
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        console.error('MongoDB: Duplicate nonce error:', { address, nonce });
        throw new Error('Nonce already exists');
      }
      console.error('MongoDB nonce storage error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired nonces for an address (optional, as MongoDB TTL handles this automatically)
   */
  async cleanupExpiredNonces(address?: string): Promise<number> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      const filter: any = { expiresAt: { $lt: now } };
      if (address) {
        filter.address = address.toLowerCase();
      }

      const result = await collection.deleteMany(filter);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('MongoDB nonce cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get nonce count for an address (for debugging/monitoring)
   */
  async getNonceCount(address: string): Promise<number> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      return await collection.countDocuments({
        address: address.toLowerCase(),
        expiresAt: { $gt: now }
      });
    } catch (error) {
      console.error('MongoDB nonce count error:', error);
      return 0;
    }
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}

export const mongoNonceStore = new MongoNonceStore();
