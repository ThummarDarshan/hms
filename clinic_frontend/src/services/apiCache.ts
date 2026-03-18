// Simple in-memory cache for API responses
class APICache {
  private storageKey = 'clinic_api_cache_v1';
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private ttl: Record<string, number> = {
    'doctors': 600000,      // 10 minutes
    'departments': 600000,   // 10 minutes
    'patients': 600000,      // 10 minutes
    'appointments': 300000,  // 5 minutes
    'billing': 300000,       // 5 minutes
    'beds': 300000,          // 5 minutes
    'laboratory': 600000,    // 10 minutes
    'records': 300000,       // 5 minutes
    'notifications': 60000,  // 1 minute
  };

  constructor() {
    this.hydrateFromSession();
  }

  private getCategory(url: string): string {
    for (const category of Object.keys(this.ttl)) {
      if (url.includes(category)) {
        return category;
      }
    }
    return 'default';
  }

  private getTTL(url: string): number {
    const category = this.getCategory(url);
    return this.ttl[category] || 300000; // 5 minutes default
  }

  get(url: string): any | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(url);
      this.persistToSession();
      return null;
    }

    return cached.data;
  }

  set(url: string, data: any, ttlOverride?: number): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
      ttl: ttlOverride ?? this.getTTL(url),
    });
    this.persistToSession();
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    }
    this.persistToSession();
  }

  private persistToSession(): void {
    try {
      const entries = Array.from(this.cache.entries()).slice(-120);
      sessionStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch {
      // Ignore storage failures (private mode/quota)
    }
  }

  private hydrateFromSession(): void {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Array<[string, { data: any; timestamp: number; ttl: number }]>;
      const now = Date.now();
      parsed.forEach(([key, value]) => {
        if (now - value.timestamp <= value.ttl) {
          this.cache.set(key, value);
        }
      });
    } catch {
      // Ignore parse failures and start with empty cache
    }
  }
}

export const apiCache = new APICache();
    