import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: 'billing_auth_token',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
