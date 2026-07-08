import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { errorMessage } from "@/lib/api/errors";

export async function getAuthenticatedUserEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
}

export function failedResultResponse(result) {
  return NextResponse.json(
    { ok: false, error: errorMessage(result.error) },
    { status: 500 }
  );
}

export function okResponse(body = {}) {
  return NextResponse.json({ ok: true, ...body }, { status: 200 });
}

export function serverErrorResponse(label, err) {
  console.error(label, err);
  return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
}
