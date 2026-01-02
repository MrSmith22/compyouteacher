// app/api/role/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// IMPORTANT: import your NextAuth options from wherever you define them.
// If you have a file that exports `authOptions`, point to it here.
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'; 
// ^^^ If your project defines authOptions directly inside [...nextauth]/route.(ts|js),
// you can export it from there, or create a small `authOptions.ts` file next to it.

export async function GET() {
  // 1) Who is logged in?
  const session = await getServerSession(authOptions);

  // 2) If not logged in, treat as student
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ role: 'student' }, { status: 200 });
  }

  // 3) Look up role by email
  const { data, error } = await supabaseAdmin
    .from('app_roles')
    .select('role')
    .eq('user_email', email)
    .maybeSingle();

  if (error) {
    console.error('role lookup error', error);
    return NextResponse.json({ role: 'student' }, { status: 200 });
  }

  // 4) Default to student when not found
  return NextResponse.json({ role: data?.role ?? 'student' }, { status: 200 });
}