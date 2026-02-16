import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");
    const industry = url.searchParams.get("industry");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("audits")
      .select("id, file_name, industry_type, status, overall_score, violations_count, created_at", {
        count: "exact",
      })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (industry) query = query.eq("industry_type", industry);

    const { data: audits, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
    }

    return NextResponse.json({ audits: audits || [], total: count || 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
