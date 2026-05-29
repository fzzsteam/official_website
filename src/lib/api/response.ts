import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessBody<T> {
  data: T;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>({ data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}
