import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  return NextResponse.json({ method: "PATCH", path: "settings/profile/update" });
}
