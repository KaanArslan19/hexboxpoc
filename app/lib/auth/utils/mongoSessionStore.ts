import { MongoClient, Collection } from 'mongodb';
import { SessionData } from './sessionManager';

interface MongoSession {
  jti: string;
  address: string;
  data: SessionData;
  createdAt: Date;
  expiresAt: Date;
}

class MongoSessionStore {
  private client: MongoClient;
  private collection: Collection<MongoSession> | null = null;
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly INACTIVE_SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI || '');
  }

  private async getCollection(): Promise<Collection<MongoSession>> {
    if (!this.collection) {
      await this.client.connect();
      const db = this.client.db('auth');
      this.collection = db.collection<MongoSession>('sessions');
      
      // Create indexes
      await this.collection.createIndex({ jti: 1 }, { unique: true });
      await this.collection.createIndex({ address: 1 });
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await this.collection.createIndex({ 'data.status': 1 });
      await this.collection.createIndex({ 'data.deactivatedAt': 1 }, { expireAfterSeconds: this.INACTIVE_SESSION_TTL });
    }
    return this.collection;
  }

  async storeSession(address: string, jti: string, data: SessionData): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    console.log('MongoDB: Storing session:', {
      address,
      jti,
      status: data.status
    });

    try {
      await collection.updateOne(
        { address, jti },
        {
          $set: {
            data,
            updatedAt: now,
            expiresAt: new Date(now.getTime() + this.SESSION_TTL * 1000)
          }
        },
        { upsert: true }
      );
      console.log('MongoDB: Session stored successfully');
    } catch (error) {
      console.error('MongoDB: Error storing session:', error);
      throw error;
    }
  }

  async getSession(address: string, jti: string): Promise<MongoSession | null> {
    const collection = await this.getCollection();
    console.log('MongoDB: Looking up session:', { address, jti });
    
    const session = await collection.findOne({ address, jti });
    console.log('MongoDB: Session lookup result:', {
      found: !!session,
      address: session?.address,
      jti: session?.jti,
      status: session?.data.status
    });
    
    return session;
  }

  async removeSession(address: string, jti: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ address, jti });
  }

  async getActiveSessions(address: string): Promise<MongoSession[]> {
    const collection = await this.getCollection();
    return collection.find({ 
      address,
      'data.status': 'active'
    }).toArray();
  }

  async cleanupExpiredSessions(): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    
    // Clean up expired active sessions
    await collection.deleteMany({ 
      expiresAt: { $lt: now },
      'data.status': 'active'
    });

    // Clean up old inactive sessions
    const inactiveCutoff = new Date(now.getTime() - this.INACTIVE_SESSION_TTL * 1000);
    await collection.deleteMany({
      'data.status': 'inactive',
      'data.deactivatedAt': { $lt: inactiveCutoff }
    });
  }

  async getBlacklistedSessions(address: string): Promise<MongoSession[]> {
    const collection = await this.getCollection();
    return collection.find({ 
      address,
      'data.status': 'blacklisted'
    }).toArray();
  }

  async getInactiveSessions(address: string): Promise<MongoSession[]> {
    const collection = await this.getCollection();
    return collection.find({ 
      address,
      'data.status': 'inactive'
    }).toArray();
  }
}

export const mongoSessionStore = new MongoSessionStore(); 