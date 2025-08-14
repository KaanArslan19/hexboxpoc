/**
 * Authentication debugging utility
 * Helps track and debug authentication flow issues
 */

interface AuthDebugEvent {
  timestamp: number;
  event: string;
  details: any;
  source: string;
}

class AuthDebugger {
  private events: AuthDebugEvent[] = [];
  private maxEvents = 50; // Keep last 50 events

  log(event: string, details: any = {}, source: string = 'unknown') {
    const debugEvent: AuthDebugEvent = {
      timestamp: Date.now(),
      event,
      details,
      source
    };

    this.events.push(debugEvent);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Console log with timestamp for immediate debugging
    const timestamp = new Date(debugEvent.timestamp).toISOString();
    console.log(`[AUTH-DEBUG ${timestamp}] [${source}] ${event}`, details);
  }

  getEvents(): AuthDebugEvent[] {
    return [...this.events];
  }

  getRecentEvents(minutes: number = 5): AuthDebugEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  clear() {
    this.events = [];
  }

  // Export events for debugging
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Get summary of authentication attempts
  getAuthSummary(): {
    totalEvents: number;
    authAttempts: number;
    successfulAuths: number;
    failedAuths: number;
    recentEvents: AuthDebugEvent[];
  } {
    const authAttempts = this.events.filter(e => 
      e.event.includes('auth') || e.event.includes('nonce') || e.event.includes('sign')
    );
    
    const successfulAuths = this.events.filter(e => 
      e.event.includes('success') || e.event.includes('complete')
    );
    
    const failedAuths = this.events.filter(e => 
      e.event.includes('failed') || e.event.includes('error')
    );

    return {
      totalEvents: this.events.length,
      authAttempts: authAttempts.length,
      successfulAuths: successfulAuths.length,
      failedAuths: failedAuths.length,
      recentEvents: this.getRecentEvents(2) // Last 2 minutes
    };
  }
}

// Global instance
export const authDebugger = new AuthDebugger();

// Helper function to add to window for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).authDebugger = authDebugger;
}
