import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ method: "PATCH", path: "tickets/[id]/update" });
}
