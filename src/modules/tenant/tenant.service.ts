import db from '../../config/db';

// Tenant create karna
export const createTenant = async (name: string) => {
  const tenant = await db.tenant.create({
    data: { name },
  });
  return tenant;
};

// Tenant ID se dhundna
export const getTenantById = async (id: string) => {
  const tenant = await db.tenant.findUnique({
    where: { id },
  });
  return tenant;
};

// Saare tenants lana
export const getAllTenants = async () => {
  const tenants = await db.tenant.findMany();
  return tenants;
};