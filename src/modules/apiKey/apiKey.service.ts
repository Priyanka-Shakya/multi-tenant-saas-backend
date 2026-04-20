import crypto from 'crypto';
import db from '../../config/db';
import { hashValue, compareValue } from '../../utils/hash';

// Random API key generate karna
export const generateApiKey = (): string => {
  return `vg_${crypto.randomBytes(32).toString('hex')}`;
};

// API key create karna
export const createApiKey = async (tenantId: string, userId: string) => {
  const rawKey = generateApiKey();
  const keyHash = await hashValue(rawKey);

  const apiKey = await db.apiKey.create({
    data: {
      keyHash,
      tenantId,
      createdBy: userId,
    },
  });

  // Raw key sirf yahan return hogi — DB mein sirf hash store hai
  return { ...apiKey, rawKey };
};

// API key verify karna — request aane pe
export const verifyApiKey = async (rawKey: string) => {
  // Saari active keys lao
  const apiKeys = await db.apiKey.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: { tenant: true }
  });

  // Har key se compare karo
  for (const apiKey of apiKeys) {
    const isMatch = await compareValue(rawKey, apiKey.keyHash);
    if (isMatch) {
      return apiKey;
    }
  }

  return null;
};