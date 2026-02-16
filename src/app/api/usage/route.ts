import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getUserUsage } from "@/lib/usage";

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getUserUsage(auth.user.id);

    return NextResponse.json(usage);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
