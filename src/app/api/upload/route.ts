import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { getUserUsage } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check usage before allowing upload
    const usage = await getUserUsage(auth.user.id);
    if (!usage.canAudit) {
      return NextResponse.json(
        {
          error:
            usage.plan === "none"
              ? "No active plan. Please purchase an audit or subscribe to a plan."
              : "You have reached your audit limit for this billing period. Please upgrade your plan.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const industry = (formData.get("industry") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Convert image to base64 data URL for in-memory processing (no storage)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create audit record with base64 image (cleared after analysis)
    const { data: audit, error: insertError } = await supabase
      .from("audits")
      .insert({
        user_id: auth.user.id,
        image_url: dataUrl,
        file_name: file.name,
        industry_type: industry,
        status: "pending",
        pdf_eligible: usage.plan === "pro",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create audit record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ auditId: audit.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
