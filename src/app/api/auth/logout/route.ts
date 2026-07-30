import { NextResponse } from 'next/server';

export async function POST() {
  // Client is responsible for clearing the token from localStorage
  return NextResponse.json({ success: true });
}