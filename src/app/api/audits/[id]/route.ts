import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data: audit, error } = await supabase
      .from("audits")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json({ audit });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceSupabase();

    // Only allow deleting completed or failed audits
    const { data: audit, error: fetchError } = await supabase
      .from("audits")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (fetchError || !audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.status !== "completed" && audit.status !== "failed") {
      return NextResponse.json(
        { error: "Can only delete completed or failed audits" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("audits")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
