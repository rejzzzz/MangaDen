# Cache Usage Guide

## Quick Start

The trending service automatically caches results. No additional configuration needed.

```typescript
import { getTrendingManga, cacheManager } from "./trending.service.js";

// Automatically uses cache
const result = await getTrendingManga("7d", 24, 0);
// First call: ~500-1000ms (cache miss, computes from DB)
// Second call: ~10-50ms (cache hit, returns from Redis)
```

## Cache Behavior

### Automatic Caching

- **First request**: Computes from database, stores in cache
- **Subsequent requests**: Returns from cache (3-hour TTL)
- **Cache miss**: Automatically recomputes and updates cache
- **Cache failure**: Gracefully falls back to computing from database

### Response Metadata

```typescript
interface TrendingResult {
    period: '1d' | '7d' | '30d';
    limit: number;
    offset: number;
    total: number;
    manga: Array<{...}>;
    generatedAt: string;      // When result was generated
    expiresAt: string;         // When cache expires
    cached?: boolean;          // true if from cache
}
```

## Manual Cache Management

### Invalidate Specific Period

```typescript
import { cacheManager } from "./trending.service.js";

// When manga data changes, invalidate the cache
await cacheManager.invalidatePeriod("7d");
```

### Invalidate All Cache

```typescript
// Full cache refresh
await cacheManager.invalidateAll();
```

### Integration Example

```typescript
// In manga update route
import { cacheManager } from "../services/trending.service.js";

app.put("/manga/:id", async (c) => {
    const id = c.req.param("id");
    const data = await c.req.json();

    // Update manga
    await updateManga(id, data);

    // Invalidate trending cache
    await cacheManager.invalidateAll();

    return c.json({ success: true });
});
```

## Cache Keys

Understanding cache keys helps with debugging:

```
trending:7d:24:0      → 7-day trending, 24 items, offset 0
trending:7d:24:24     → 7-day trending, 24 items, offset 24 (page 2)
trending:metrics:7d   → Computed metrics for 7-day period
```

## Monitoring

Check logs for cache operations:

```
[Trending] Cache hit for period=7d, limit=24, offset=0
[Trending] Cache miss for period=7d, limit=24, offset=0. Computing...
[TrendingCache] Error retrieving trending result: ...
```

## Performance Metrics

### Expected Response Times

| Scenario      | Time       | Notes                        |
| ------------- | ---------- | ---------------------------- |
| Cache hit     | 10-50ms    | Redis lookup + serialization |
| Cache miss    | 500-1000ms | DB queries + computation     |
| Cache failure | 500-1000ms | Falls back to computing      |

### Database Load Reduction

- **Without cache**: 2 DB queries per request
- **With cache**: 0 DB queries for cache hits
- **Typical hit rate**: 95%+ after warm-up
- **Reduction**: ~95% fewer database queries

## TTL Configuration

Current TTL settings (in `trending.service.ts`):

```typescript
const CACHE_CONFIG = {
    TRENDING_TTL: 3 * 60 * 60, // 3 hours
    METRICS_TTL: 1 * 60 * 60, // 1 hour
};
```

To adjust TTL, modify these values and redeploy.

## Troubleshooting

### Cache Not Working

1. Check Redis connection:

    ```bash
    # Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
    ```

2. Check logs for cache errors:

    ```
    [TrendingCache] Error retrieving trending result: ...
    ```

3. Manually invalidate cache:
    ```typescript
    await cacheManager.invalidateAll();
    ```

### High Cache Miss Rate

- Cache may have expired (3-hour TTL)
- Redis may have been restarted
- Check if data is being updated frequently (invalidating cache)

### Memory Usage

- Monitor Redis memory usage
- Each cached result is ~5-10KB
- 1000 cached results ≈ 5-10MB

## Best Practices

1. **Invalidate on updates**: Always invalidate cache when manga data changes
2. **Monitor hit rates**: Track cache performance in production
3. **Set appropriate TTL**: Balance freshness vs. performance
4. **Handle failures gracefully**: Cache failures should not break the app
5. **Log cache operations**: Use logs to debug cache issues

## Advanced: Custom Cache Strategies

To implement different cache strategies, extend `TrendingCacheManager`:

```typescript
class CustomCacheManager extends TrendingCacheManager {
    async getTrendingResult(period, limit, offset) {
        // Custom logic here
        return super.getTrendingResult(period, limit, offset);
    }
}
```

Then update the singleton:

```typescript
const cacheManager = new CustomCacheManager();
```
