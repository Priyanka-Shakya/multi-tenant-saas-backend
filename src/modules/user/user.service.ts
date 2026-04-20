import db from '../../config/db';
import { Role } from '@prisma/client';

// User create karna
export const createUser = async (
  name: string,
  email: string,
  role: Role,
  tenantId: string
) => {
  const user = await db.user.create({
    data: { name, email, role, tenantId },
  });
  return user;
};

// Tenant ke saare users lana
export const getUsersByTenant = async (tenantId: string) => {
  const users = await db.user.findMany({
    where: { tenantId },
  });
  return users;
};