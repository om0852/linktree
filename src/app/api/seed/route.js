import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'TreeInBio production mode active. Demo seeding disabled.',
    profiles: [],
  });
}
