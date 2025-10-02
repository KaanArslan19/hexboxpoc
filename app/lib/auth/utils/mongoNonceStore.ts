import { MongoClient, Collection } from 'mongodb';

interface NonceDocument {
  _id?: string;
  address?: string; // Optional - may not be known at generation time
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean; // Track if nonce has been used
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
      // Make nonce unique by itself (not combined with address)
      await this.collection.createIndex(
        { nonce: 1 }, 
        { unique: true }
      );
      await this.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 }
      );
      await this.collection.createIndex({ address: 1 });
      await this.collection.createIndex({ used: 1 });
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
      
      // Atomically find and update the nonce to mark it as used and associate with address
      // This works regardless of whether the nonce was stored with or without an address
      const result = await collection.findOneAndUpdate(
        {
          nonce: nonce,
          used: false,
          expiresAt: { $gt: now }
        },
        {
          $set: {
            used: true,
            address: address.toLowerCase(),
            usedAt: now
          }
        },
        {
          returnDocument: 'after'
        }
      );
      
      console.log('MongoDB: Nonce check result:', {
        found: !!result,
        nonce,
        address: address.toLowerCase()
      });

      // If we found and updated a document, the nonce was valid and unused
      return result !== null;
    } catch (error) {
      console.error('MongoDB nonce validation error:', error);
      return false;
    }
  }

  /**
   * Store a new nonce (optionally with an address)
   * This is called when generating a nonce
   * Address can be undefined if not known at generation time
   */
  async storeNonce(address: string | undefined, nonce: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.NONCE_TTL * 1000));

      const document: NonceDocument = {
        nonce: nonce,
        createdAt: now,
        expiresAt: expiresAt,
        used: false
      };
      
      // Only include address if provided and not a placeholder
      if (address && address !== 'pending') {
        document.address = address.toLowerCase();
      }
      
      console.log('MongoDB: Storing nonce document:', document);
      
      const result = await collection.insertOne(document);
      
      console.log('MongoDB: Insert result:', {
        insertedId: result.insertedId,
        acknowledged: result.acknowledged
      });

      console.log('MongoDB: Successfully stored nonce');
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
