import { checkGlobalLimit, checkBurstLimit } from '../modules/rateLimit/rateLimit.service';
import redis from '../config/redis';

describe('Rate Limiting - Sliding Window', () => {
    const testTenantId = 'test-tenant-123';
    const testApiKey = 'test-api-key-123';

    // Har test ke baad Redis keys clean karo
    afterEach(async () => {
        await redis.del(`ratelimit:global:${testTenantId}`);
        await redis.del(`ratelimit:burst:${testApiKey}`);
    });

    // Sab connections band karo
    afterAll(async () => {
        await redis.quit();
    });

    test('Global limit — requests allow hone chahiye limit tak', async () => {
        const result = await checkGlobalLimit(testTenantId);
        expect(result.allowed).toBe(true);
        expect(result.tier).toBe('global');
        expect(result.limit).toBe(1000);
    });

    test('Burst limit — 50 requests ke baad block hona chahiye', async () => {
        // 50 requests karo
        for (let i = 0; i < 50; i++) {
            await checkBurstLimit(testApiKey);
        }

        // 51st request block honi chahiye
        const result = await checkBurstLimit(testApiKey);
        expect(result.allowed).toBe(false);
        expect(result.tier).toBe('burst');
        expect(result.limit).toBe(50);
    });

    test('Sliding window — current count sahi hona chahiye', async () => {
        // 5 requests karo
        for (let i = 0; i < 5; i++) {
            await checkGlobalLimit(testTenantId);
        }

        const result = await checkGlobalLimit(testTenantId);
        expect(result.current).toBe(6);
        expect(result.allowed).toBe(true);
    });
    
    test('Burst limit — 50 requests tak allow hona chahiye', async () => {
        let lastResult: any;
        for (let i = 0; i < 50; i++) {
            lastResult = await checkBurstLimit(testApiKey);
        }
        expect(lastResult.allowed).toBe(true);
    });
});