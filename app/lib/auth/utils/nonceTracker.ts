import { mongoNonceStore } from './mongoNonceStore';

/**
 * NonceTracker now uses MongoDB for persistent, atomic nonce operations
 * This prevents replay attacks after server restarts and eliminates race conditions
 */
class NonceTracker {
  /**
   * Store a nonce for an address (used during nonce generation)
   */
  async storeNonce(address: string, nonce: string): Promise<void> {
    try {
      await mongoNonceStore.storeNonce(address, nonce);
    } catch (error) {
      console.error('Failed to store nonce:', error);
      throw new Error('Failed to store nonce');
    }
  }

  /**
   * Atomically check if a nonce is valid and mark it as used
   * This replaces the old addNonce method with atomic MongoDB operation
   */
  async checkAndUseNonce(address: string, nonce: string): Promise<void> {
    const isValid = await mongoNonceStore.checkAndUseNonce(address, nonce);
    if (!isValid) {
      throw new Error('Nonce has already been used or is invalid');
    }
  }

  /**
   * @deprecated Use checkAndUseNonce instead for atomic operations
   * Kept for backward compatibility but now uses MongoDB
   */
  async addNonce(address: string, nonce: string): Promise<void> {
    await this.checkAndUseNonce(address, nonce);
  }

  /**
   * @deprecated Use checkAndUseNonce instead
   * Kept for backward compatibility
   */
  async validateNonce(address: string, nonce: string): Promise<boolean> {
    try {
      await this.checkAndUseNonce(address, nonce);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get nonce count for debugging/monitoring
   */
  async getNonceCount(address: string): Promise<number> {
    return await mongoNonceStore.getNonceCount(address);
  }

  /**
   * Clean up expired nonces (optional, MongoDB TTL handles this automatically)
   */
  async cleanupExpiredNonces(address?: string): Promise<number> {
    return await mongoNonceStore.cleanupExpiredNonces(address);
  }
}

export const nonceTracker = new NonceTracker(); 