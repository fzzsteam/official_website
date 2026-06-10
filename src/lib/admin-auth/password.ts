import 'server-only';

import bcrypt from 'bcryptjs';

const ADMIN_PASSWORD_SALT_ROUNDS = 10;

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, ADMIN_PASSWORD_SALT_ROUNDS);
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
