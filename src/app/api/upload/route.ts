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
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const industry = (formData.get("industry") as string) || "general";
    const auditName = (formData.get("audit_name") as string) || null;

    // Support both "file" (single, backward compat) and "files" (bulk)
    const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Only Pro users can upload multiple files
    if (allFiles.length > 1 && usage.plan !== "pro") {
      return NextResponse.json(
        { error: "Bulk upload is only available on the Pro plan." },
        { status: 403 }
      );
    }

    // Max 10 files per bulk upload
    if (allFiles.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images per bulk upload." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    // Validate all files
    for (const file of allFiles) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Please upload JPG, PNG, or WebP.` },
          { status: 400 }
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 10MB.` },
          { status: 400 }
        );
      }
    }

    const supabase = getServiceSupabase();

    // Convert all images to base64 data URLs
    const dataUrls: string[] = [];
    for (const file of allFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      dataUrls.push(`data:${file.type};base64,${base64}`);
    }

    const isBulk = allFiles.length > 1;
    const imageUrl = isBulk ? JSON.stringify(dataUrls) : dataUrls[0];

    // Create audit record
    const { data: audit, error: insertError } = await supabase
      .from("audits")
      .insert({
        user_id: auth.user.id,
        image_url: imageUrl,
        file_name: allFiles[0].name,
        audit_name: auditName,
        image_count: allFiles.length,
        industry_type: industry,
        status: "pending",
        pdf_eligible: usage.plan === "pro",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Audit insert error:", insertError);
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
