import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  return NextResponse.json({ method: "GET", path: "usage/[clientId]" });
}
