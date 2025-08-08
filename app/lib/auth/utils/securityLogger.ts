interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'session_revoked' | 'suspicious_activity' | 'nonce_reuse';
  address?: string;
  ip: string;
  userAgent: string;
  deviceId?: string;
  sessionId?: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class SecurityLogger {
  private logToConsole: boolean;
  private logToDatabase: boolean;

  constructor(options: { console?: boolean; database?: boolean } = {}) {
    this.logToConsole = options.console ?? true;
    this.logToDatabase = options.database ?? false; // Can be enabled later with MongoDB collection
  }

  private extractRequestInfo(request: Request): { ip: string; userAgent: string } {
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              request.headers.get('cf-connecting-ip') || 
              'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return { ip, userAgent };
  }

  async logAuthSuccess(request: Request, address: string, deviceId: string, sessionId: string) {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    const event: SecurityEvent = {
      type: 'auth_success',
      address,
      ip,
      userAgent,
      deviceId,
      sessionId,
      timestamp: new Date()
    };

    await this.logEvent(event);
  }

  async logAuthFailure(request: Request, reason: string, address?: string) {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    const event: SecurityEvent = {
      type: 'auth_failure',
      address,
      ip,
      userAgent,
      reason,
      timestamp: new Date()
    };

    await this.logEvent(event);
  }

  async logRateLimit(request: Request, endpoint: string) {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    const event: SecurityEvent = {
      type: 'rate_limit',
      ip,
      userAgent,
      reason: `Rate limit exceeded for ${endpoint}`,
      timestamp: new Date(),
      metadata: { endpoint }
    };

    await this.logEvent(event);
  }

  async logSessionRevoked(address: string, sessionId: string, reason: string) {
    const event: SecurityEvent = {
      type: 'session_revoked',
      address,
      sessionId,
      reason,
      ip: 'system',
      userAgent: 'system',
      timestamp: new Date()
    };

    await this.logEvent(event);
  }

  async logSuspiciousActivity(request: Request, activity: string, address?: string, metadata?: Record<string, any>) {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      address,
      ip,
      userAgent,
      reason: activity,
      timestamp: new Date(),
      metadata
    };

    await this.logEvent(event);
  }

  async logNonceReuse(request: Request, address: string, nonce: string) {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    const event: SecurityEvent = {
      type: 'nonce_reuse',
      address,
      ip,
      userAgent,
      reason: 'Attempted nonce reuse detected',
      timestamp: new Date(),
      metadata: { nonce: nonce.substring(0, 8) + '...' } // Log partial nonce for privacy
    };

    await this.logEvent(event);
  }

  private async logEvent(event: SecurityEvent) {
    if (this.logToConsole) {
      const logLevel = event.type === 'auth_success' ? 'info' : 'warn';
      const message = `[SECURITY] ${event.type.toUpperCase()}: ${event.reason || 'N/A'} | IP: ${event.ip} | Address: ${event.address || 'N/A'}`;
      
      if (logLevel === 'info') {
        console.log(message, event.metadata || '');
      } else {
        console.warn(message, event.metadata || '');
      }
    }

    if (this.logToDatabase) {
      // TODO: Implement MongoDB security events collection
      // await mongoSecurityStore.storeEvent(event);
    }
  }

  // Helper method to detect suspicious patterns
  async detectSuspiciousActivity(request: Request, address?: string): Promise<boolean> {
    const { ip, userAgent } = this.extractRequestInfo(request);
    
    // Basic suspicious activity detection
    const suspiciousPatterns = [
      userAgent.includes('curl'),
      userAgent.includes('wget'),
      userAgent.includes('python'),
      userAgent.includes('bot') && !userAgent.includes('googlebot'),
      userAgent.length < 10,
      ip === 'unknown'
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern);
    
    if (isSuspicious) {
      await this.logSuspiciousActivity(request, 'Suspicious user agent or IP detected', address, {
        userAgent,
        ip,
        patterns: suspiciousPatterns.map((p, i) => p ? i : null).filter(i => i !== null)
      });
    }

    return isSuspicious;
  }
}

export const securityLogger = new SecurityLogger({ console: true, database: false });
