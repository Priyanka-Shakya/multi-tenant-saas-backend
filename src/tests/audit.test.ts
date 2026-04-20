import { createAuditLog, verifyAuditChain } from '../modules/audit/audit.service';
import db from '../config/db';

describe('Audit Chain Verification', () => {
  let testTenantId: string;

  // Real tenant banao test ke liye
  beforeAll(async () => {
    const tenant = await db.tenant.create({
      data: { name: 'Test Audit Tenant' },
    });
    testTenantId = tenant.id;
  });

  // Test ke baad cleanup karo
  afterAll(async () => {
    await db.auditLog.deleteMany({
      where: { tenantId: testTenantId },
    });
    await db.tenant.delete({
      where: { id: testTenantId },
    });
    await db.$disconnect();
  });

  test('Empty chain — intact honi chahiye', async () => {
    const result = await verifyAuditChain(testTenantId);
    expect(result.intact).toBe(true);
  });

  test('Valid chain — intact honi chahiye', async () => {
    // Pehle clean karo
    await db.auditLog.deleteMany({
      where: { tenantId: testTenantId },
    });

    // 5 audit logs banao
    for (let i = 0; i < 5; i++) {
      await createAuditLog({
        tenantId: testTenantId,
        action: `ACTION_${i}`,
        resourceType: 'Test',
        resourceId: `resource-${i}`,
        newValue: { index: i },
        ipAddress: '127.0.0.1',
      });
    }

    const result = await verifyAuditChain(testTenantId);
    expect(result.intact).toBe(true);
    expect(result.message).toBe('Audit chain is intact ✅');
  });

  test('Tampered chain — detect hona chahiye', async () => {
    const logs = await db.auditLog.findMany({
      where: { tenantId: testTenantId },
      orderBy: { createdAt: 'asc' },
    });

    expect(logs.length).toBeGreaterThan(0);

    // Pehli entry ka hash tamper karo
    await db.auditLog.update({
      where: { id: logs[0].id },
      data: { chainHash: 'tampered-hash-000000' },
    });

    const result = await verifyAuditChain(testTenantId);
    expect(result.intact).toBe(false);
    expect(result.message).toBe('Audit chain has been tampered!');
  });
});