import { Prisma } from '@prisma/client';
import { fail } from '@/lib/api/response';

export function isPrismaDuplicateError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function failFromPrismaDuplicateResource(error: Prisma.PrismaClientKnownRequestError) {
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target || '');
  const message = error.message;

  if (target.includes('phone') || message.includes('uk_admin_users_phone')) {
    return fail('PHONE_ALREADY_EXISTS', '手机号已存在', 409);
  }
  if (
    target.includes('credit_code') ||
    target.includes('creditCode') ||
    message.includes('organizations_credit_code_key')
  ) {
    return fail('CREDIT_CODE_ALREADY_EXISTS', '统一社会信用代码已存在', 409);
  }
  return fail('DUPLICATE_RESOURCE', '提交的数据已存在，请检查后重试', 409, error);
}
