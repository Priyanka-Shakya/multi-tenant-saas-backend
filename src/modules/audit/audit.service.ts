import crypto from 'crypto';
import db from '../../config/db';

const computeHash = (content: string, previousHash: string): string => {
  return crypto
    .createHash('sha256')
    .update(content + previousHash)
    .digest('hex');
};

const normalizeValue = (value: any) => {
  if (value === null || value === undefined) return null;
  return JSON.parse(JSON.stringify(value, Object.keys(value).sort()));
};

const buildContent = (data: {
  tenantId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  apiKeyUsed?: string | null;
}) => {
  return JSON.stringify({
    tenantId: data.tenantId,
    userId: data.userId ?? null,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId ?? null,
    previousValue: normalizeValue(data.previousValue),
    newValue: normalizeValue(data.newValue),
    ipAddress: data.ipAddress ?? null,
    apiKeyUsed: data.apiKeyUsed ?? null,
  });
};

export const createAuditLog = async ({
  tenantId,
  userId,
  action,
  resourceType,
  resourceId,
  previousValue,
  newValue,
  ipAddress,
  apiKeyUsed,
}: {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  apiKeyUsed?: string;
}) => {
  const lastEntry = await db.auditLog.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  const previousHash = lastEntry ? lastEntry.chainHash : '0000000000000000';

  const content = buildContent({
    tenantId,
    userId,
    action,
    resourceType,
    resourceId,
    previousValue,
    newValue,
    ipAddress,
    apiKeyUsed,
  });

  const chainHash = computeHash(content, previousHash);

  const auditLog = await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      previousValue,
      newValue,
      ipAddress,
      apiKeyUsed,
      chainHash,
    },
  });

  return auditLog;
};

export const getAuditLogs = async ({
  tenantId,
  userId,
  action,
  resourceType,
  startDate,
  endDate,
  cursor,
  limit = 10,
}: {
  tenantId: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}) => {
  const where: any = { tenantId };

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await db.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { createdAt: 'desc' },
  });

  let nextCursor = null;
  if (logs.length > limit) {
    const nextItem = logs.pop();
    nextCursor = nextItem!.id;
  }

  return { logs, nextCursor };
};

export const verifyAuditChain = async (tenantId: string) => {
  const logs = await db.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });

  if (logs.length === 0) {
    return { intact: true, message: 'No audit logs found' };
  }

  let previousHash = '0000000000000000';

  for (const log of logs) {
    const content = buildContent({
      tenantId: log.tenantId,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      previousValue: log.previousValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      apiKeyUsed: log.apiKeyUsed,
    });

    const expectedHash = computeHash(content, previousHash);

    if (expectedHash !== log.chainHash) {
      return {
        intact: false,
        message: 'Audit chain has been tampered!',
        tamperedEntryId: log.id,
      };
    }

    previousHash = log.chainHash;
  }

  return { intact: true, message: 'Audit chain is intact ✅' };
};