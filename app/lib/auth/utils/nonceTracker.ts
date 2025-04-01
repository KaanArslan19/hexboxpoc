interface NonceEntry {
  nonce: string;
  timestamp: number;
}

class NonceTracker {
  private nonces: Map<string, NonceEntry[]>;
  private maxAge: number;

  constructor(maxAgeMs: number = 5 * 60 * 1000) { // 5 minutes default
    this.nonces = new Map();
    this.maxAge = maxAgeMs;
  }

  addNonce(address: string, nonce: string): void {
    const now = Date.now();
    const entries = this.nonces.get(address) || [];
    
    // Remove expired nonces
    const validEntries = entries.filter(
      entry => now - entry.timestamp < this.maxAge
    );
    
    // Check if nonce already exists
    if (validEntries.some(entry => entry.nonce === nonce)) {
      throw new Error("Nonce already used");
    }
    
    // Add new nonce
    validEntries.push({ nonce, timestamp: now });
    this.nonces.set(address, validEntries);
  }

  validateNonce(address: string, nonce: string): boolean {
    const now = Date.now();
    const entries = this.nonces.get(address) || [];
    
    // Remove expired nonces
    const validEntries = entries.filter(
      entry => now - entry.timestamp < this.maxAge
    );
    
    // Check if nonce exists and is valid
    const entry = validEntries.find(e => e.nonce === nonce);
    if (!entry) return false;
    
    // Remove used nonce
    this.nonces.set(
      address,
      validEntries.filter(e => e.nonce !== nonce)
    );
    
    return true;
  }
}

export const nonceTracker = new NonceTracker(); 