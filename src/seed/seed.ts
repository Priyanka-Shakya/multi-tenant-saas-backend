import db from '../config/db';
import { hashValue } from '../utils/hash';
import { createAuditLog } from '../modules/audit/audit.service';
import crypto from 'crypto';

const generateApiKey = (): string => {
  return `vg_${crypto.randomBytes(32).toString('hex')}`;
};

async function main() {
  console.log('🌱 Seeding database...');

  // Purana data clean karo
  await db.auditLog.deleteMany();
  await db.emailLog.deleteMany();
  await db.apiKey.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();

  console.log('✅ Cleaned existing data');

  // Tenant 1 banao
  const tenant1 = await db.tenant.create({
    data: { name: 'TechCorp' },
  });

  // Tenant 2 banao
  const tenant2 = await db.tenant.create({
    data: { name: 'StartupHub' },
  });

  console.log('✅ Tenants created');

  // Tenant 1 users banao
  const owner1 = await db.user.create({
    data: {
      name: 'Alice Owner',
      email: 'alice@techcorp.com',
      role: 'OWNER',
      tenantId: tenant1.id,
    },
  });

  const member1a = await db.user.create({
    data: {
      name: 'Bob Member',
      email: 'bob@techcorp.com',
      role: 'MEMBER',
      tenantId: tenant1.id,
    },
  });

  const member1b = await db.user.create({
    data: {
      name: 'Charlie Member',
      email: 'charlie@techcorp.com',
      role: 'MEMBER',
      tenantId: tenant1.id,
    },
  });

  // Tenant 2 users banao
  const owner2 = await db.user.create({
    data: {
      name: 'Diana Owner',
      email: 'diana@startuphub.com',
      role: 'OWNER',
      tenantId: tenant2.id,
    },
  });

  const member2a = await db.user.create({
    data: {
      name: 'Eve Member',
      email: 'eve@startuphub.com',
      role: 'MEMBER',
      tenantId: tenant2.id,
    },
  });

  const member2b = await db.user.create({
    data: {
      name: 'Frank Member',
      email: 'frank@startuphub.com',
      role: 'MEMBER',
      tenantId: tenant2.id,
    },
  });

  console.log('✅ Users created');

  // API keys banao
  const rawKey1 = generateApiKey();
  const rawKey2 = generateApiKey();

  await db.apiKey.create({
    data: {
      keyHash: await hashValue(rawKey1),
      tenantId: tenant1.id,
      createdBy: owner1.id,
    },
  });

  await db.apiKey.create({
    data: {
      keyHash: await hashValue(rawKey2),
      tenantId: tenant2.id,
      createdBy: owner2.id,
    },
  });

  console.log('✅ API Keys created');
  console.log('🔑 Tenant 1 API Key:', rawKey1);
  console.log('🔑 Tenant 2 API Key:', rawKey2);

  // Audit logs banao — valid chain (minimum 10 entries)
  const auditActions = [
    { action: 'CREATE_USER', resourceType: 'User', resourceId: owner1.id, newValue: { name: owner1.name, email: owner1.email, role: owner1.role } },
    { action: 'CREATE_USER', resourceType: 'User', resourceId: member1a.id, newValue: { name: member1a.name, email: member1a.email, role: member1a.role } },
    { action: 'CREATE_USER', resourceType: 'User', resourceId: member1b.id, newValue: { name: member1b.name, email: member1b.email, role: member1b.role } },
    { action: 'CREATE_API_KEY', resourceType: 'ApiKey', resourceId: tenant1.id, newValue: { tenantId: tenant1.id } },
    { action: 'LOGIN', resourceType: 'User', resourceId: owner1.id, newValue: { email: owner1.email } },
    { action: 'UPDATE_USER', resourceType: 'User', resourceId: member1a.id, previousValue: { role: 'MEMBER' }, newValue: { role: 'MEMBER' } },
    { action: 'CREATE_USER', resourceType: 'User', resourceId: owner2.id, newValue: { name: owner2.name, email: owner2.email, role: owner2.role } },
    { action: 'CREATE_USER', resourceType: 'User', resourceId: member2a.id, newValue: { name: member2a.name, email: member2a.email, role: member2a.role } },
    { action: 'CREATE_USER', resourceType: 'User', resourceId: member2b.id, newValue: { name: member2b.name, email: member2b.email, role: member2b.role } },
    { action: 'CREATE_API_KEY', resourceType: 'ApiKey', resourceId: tenant2.id, newValue: { tenantId: tenant2.id } },
  ];

  for (const audit of auditActions) {
    await createAuditLog({
      tenantId: tenant1.id,
      userId: owner1.id,
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId,
      previousValue: audit.previousValue || null,
      newValue: audit.newValue,
      ipAddress: '127.0.0.1',
      apiKeyUsed: rawKey1,
    });
  }

  console.log('✅ Audit logs created (10 entries with valid chain)');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });