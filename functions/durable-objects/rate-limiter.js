/**
 * Durable Objects Rate Limiter
 * 
 * Phase 32: Production Infrastructure Migration
 * 
 * Provides distributed rate limiting across Cloudflare Workers using Durable Objects.
 */

export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const method = request.method;
      
      if (method === 'POST') {
        return await this.checkLimit(url);
      } else if (method === 'DELETE') {
        return await this.resetLimit();
      } else if (method === 'GET') {
        return await this.getStats();
      } else {
        return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      console.error('RateLimiter error:', error);
      return new Response(JSON.stringify({
        error: true,
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  async checkLimit(url) {
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const windowSeconds = parseInt(url.searchParams.get('window') || '60');
    
    const currentCount = await this.state.storage.get('count') || 0;
    const windowStart = await this.state.storage.get('windowStart') || Date.now();
    
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowEnd = windowStart + windowMs;
    
    if (now > windowEnd) {
      await this.state.storage.put('count', 1);
      await this.state.storage.put('windowStart', now);
      
      return new Response(JSON.stringify({
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
        limit: limit,
        current: 1
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (currentCount >= limit) {
      const retryAfter = Math.ceil((windowEnd - now) / 1000);
      
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter: retryAfter,
        limit: limit,
        current: currentCount
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        }
      });
    }
    
    const newCount = currentCount + 1;
    await this.state.storage.put('count', newCount);
    
    return new Response(JSON.stringify({
      allowed: true,
      remaining: limit - newCount,
      resetAt: windowEnd,
      limit: limit,
      current: newCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  async resetLimit() {
    await this.state.storage.deleteAll();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Rate limit reset successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  async getStats() {
    const count = await this.state.storage.get('count') || 0;
    const windowStart = await this.state.storage.get('windowStart') || Date.now();
    
    return new Response(JSON.stringify({
      count,
      windowStart,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
