import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash karo koi bhi string (API key, password)
export const hashValue = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, SALT_ROUNDS);
};

// Compare karo raw value aur hashed value
export const compareValue = async (
  value: string,
  hashedValue: string
): Promise<boolean> => {
  return await bcrypt.compare(value, hashedValue);
};