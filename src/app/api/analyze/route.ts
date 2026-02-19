import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { analyzeImage } from "@/lib/openai";
import { incrementUsage } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch the audit
    const { data: audit, error: fetchError } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .eq("user_id", auth.user.id)
      .single();

    if (fetchError || !audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.status === "completed") {
      return NextResponse.json({ message: "Already analyzed" });
    }

    // Update status to processing
    await supabase
      .from("audits")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", auditId);

    try {
      // Detect bulk upload (image_url is a JSON array string)
      let imageInput: string | string[] = audit.image_url;
      if (audit.image_url.startsWith("[")) {
        try {
          imageInput = JSON.parse(audit.image_url) as string[];
        } catch {
          // Not valid JSON array, treat as single URL
        }
      }

      // Run analysis
      const result = await analyzeImage(imageInput, audit.industry_type);

      // Update audit with results and discard the image data
      await supabase
        .from("audits")
        .update({
          status: "completed",
          overall_score: result.overall_score,
          violations_count: result.violations.length,
          result_json: result,
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auditId);

      // Increment usage
      await incrementUsage(auth.user.id);

      return NextResponse.json({ success: true, result });
    } catch (analysisError) {
      // Mark as failed — log internally but don't expose raw error to user
      console.error("Analysis failed for audit", auditId, analysisError);
      await supabase
        .from("audits")
        .update({
          status: "failed",
          processing_error: "Something went wrong while analyzing your image. Please try again.",
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auditId);

      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
