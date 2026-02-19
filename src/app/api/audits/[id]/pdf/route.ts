import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";

interface AuditResult {
  overall_score: number;
  summary: string;
  industry_detected: string;
  violations: Array<{
    id: number;
    category: string;
    severity: string;
    title: string;
    description: string;
    location: string;
    recommendation: string;
    regulatory_reference: string;
  }>;
  compliant_areas: string[];
  priority_fixes: string[];
}

interface AuditRow {
  id: string;
  user_id: string;
  file_name: string;
  industry_type: string;
  status: string;
  overall_score: number | null;
  result_json: AuditResult | null;
  pdf_eligible: boolean;
  created_at: string;
}

// Colors
const BRAND_ACCENT = [99, 102, 241] as const; // indigo-500
const BRAND_ACCENT2 = [168, 85, 247] as const; // purple-500
const COLOR_DANGER = [239, 68, 68] as const;
const COLOR_WARNING = [245, 158, 11] as const;
const COLOR_SUCCESS = [34, 197, 94] as const;
const COLOR_MUTED = [115, 115, 130] as const;
const COLOR_DARK = [15, 15, 25] as const;

function getScoreColor(score: number): readonly [number, number, number] {
  if (score >= 80) return COLOR_SUCCESS;
  if (score >= 50) return COLOR_WARNING;
  return COLOR_DANGER;
}

function getSeverityColor(severity: string): readonly [number, number, number] {
  switch (severity.toLowerCase()) {
    case "critical":
      return COLOR_DANGER;
    case "high":
      return [220, 38, 38];
    case "medium":
      return COLOR_WARNING;
    case "low":
      return [59, 130, 246];
    default:
      return COLOR_MUTED;
  }
}

function drawShieldLogo(doc: jsPDF, x: number, y: number, size: number) {
  const s = size / 24;
  // Shield body
  doc.setFillColor(...BRAND_ACCENT);
  doc.roundedRect(x, y, 18 * s, 22 * s, 3 * s, 3 * s, "F");
  // Shield bottom triangle
  doc.setFillColor(...BRAND_ACCENT);
  doc.triangle(
    x, y + 16 * s,
    x + 18 * s, y + 16 * s,
    x + 9 * s, y + 24 * s,
    "F"
  );
  // Inner accent stripe
  doc.setFillColor(...BRAND_ACCENT2);
  doc.roundedRect(x + 3 * s, y + 3 * s, 12 * s, 14 * s, 2 * s, 2 * s, "F");
  // Checkmark
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2 * s);
  doc.line(x + 5.5 * s, y + 10 * s, x + 8 * s, y + 13 * s);
  doc.line(x + 8 * s, y + 13 * s, x + 13 * s, y + 6 * s);
}

/** Wrap text to maxWidth, returning array of lines */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/** Add a new page and return the reset Y position */
function checkPageBreak(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

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

    const a = audit as AuditRow;

    if (!a.pdf_eligible) {
      return NextResponse.json(
        { error: "PDF reports are only available for audits created on the Pro plan." },
        { status: 403 }
      );
    }

    if (a.status !== "completed" || !a.result_json) {
      return NextResponse.json(
        { error: "Audit is not completed yet." },
        { status: 400 }
      );
    }

    const result = a.result_json;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ── Header ──────────────────────────────────────────────
    drawShieldLogo(doc, margin, y, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...COLOR_DARK);
    doc.text("Viotraix", margin + 36, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("AI Workplace Safety Audit Report", margin + 36, y + 34);

    // Horizontal rule
    y += 52;
    doc.setDrawColor(...BRAND_ACCENT);
    doc.setLineWidth(2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // ── Audit Info ──────────────────────────────────────────
    const date = new Date(a.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);

    const infoLines = [
      `File: ${a.file_name}`,
      `Industry: ${result.industry_detected || a.industry_type}`,
      `Date: ${date}`,
    ];
    infoLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 16;
    });

    // Score badge
    y += 4;
    const score = result.overall_score;
    const scoreColor = getScoreColor(score);
    const scoreText = `Score: ${score}/100`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const scoreBadgeWidth = doc.getTextWidth(scoreText) + 24;

    // Green shadow/glow behind badge
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setGState(doc.GState({ opacity: 0.18 }));
    doc.roundedRect(margin - 3, y - 3, scoreBadgeWidth + 6, 38, 9, 9, "F");
    doc.setGState(doc.GState({ opacity: 1 }));

    // Badge fill
    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin, y, scoreBadgeWidth, 32, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(scoreText, margin + 12, y + 22);
    y += 48;

    // ── Summary ─────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLOR_DARK);
    doc.text("Summary", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);
    const summaryLines = wrapText(doc, result.summary, contentWidth);
    summaryLines.forEach((line: string) => {
      y = checkPageBreak(doc, y, 14, margin);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 12;

    // ── Priority Fixes ──────────────────────────────────────
    if (result.priority_fixes.length > 0) {
      y = checkPageBreak(doc, y, 30, margin);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...BRAND_ACCENT);
      doc.text("Priority Fixes", margin, y);
      y += 18;

      result.priority_fixes.forEach((fix, i) => {
        y = checkPageBreak(doc, y, 30, margin);

        // Number circle
        doc.setFillColor(...BRAND_ACCENT);
        doc.circle(margin + 8, y - 3, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(String(i + 1), margin + 8, y, { align: "center" });

        // Fix text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_DARK);
        const fixLines = wrapText(doc, fix, contentWidth - 28);
        fixLines.forEach((line: string, li: number) => {
          if (li > 0) y = checkPageBreak(doc, y, 14, margin);
          doc.text(line, margin + 22, y);
          y += 14;
        });
        y += 4;
      });
      y += 8;
    }

    // ── Violations ──────────────────────────────────────────
    if (result.violations.length > 0) {
      y = checkPageBreak(doc, y, 30, margin);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...COLOR_DARK);
      doc.text(`Violations (${result.violations.length})`, margin, y);
      y += 20;

      result.violations.forEach((v) => {
        // Estimate height needed for this violation
        y = checkPageBreak(doc, y, 100, margin);

        // Severity badge
        const sevColor = getSeverityColor(v.severity);
        const sevText = v.severity.toUpperCase();
        doc.setFillColor(...sevColor);
        const sevWidth = doc.getTextWidth(sevText) * 1.2 + 16;
        doc.roundedRect(margin, y, sevWidth, 18, 4, 4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(sevText, margin + 8, y + 12);

        // Category
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_MUTED);
        doc.text(v.category, margin + sevWidth + 8, y + 12);
        y += 26;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...COLOR_DARK);
        const titleLines = wrapText(doc, v.title, contentWidth);
        titleLines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 14, margin);
          doc.text(line, margin, y);
          y += 14;
        });
        y += 2;

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR_MUTED);
        const descLines = wrapText(doc, v.description, contentWidth);
        descLines.forEach((line: string) => {
          y = checkPageBreak(doc, y, 13, margin);
          doc.text(line, margin, y);
          y += 13;
        });
        y += 4;

        // Location
        if (v.location) {
          y = checkPageBreak(doc, y, 16, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_DARK);
          doc.text("Location: ", margin, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLOR_MUTED);
          doc.text(v.location, margin + doc.getTextWidth("Location: "), y);
          y += 14;
        }

        // Recommendation
        if (v.recommendation) {
          y = checkPageBreak(doc, y, 16, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_DARK);
          doc.text("Recommendation: ", margin, y);
          y += 13;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLOR_MUTED);
          const recLines = wrapText(doc, v.recommendation, contentWidth);
          recLines.forEach((line: string) => {
            y = checkPageBreak(doc, y, 13, margin);
            doc.text(line, margin, y);
            y += 13;
          });
          y += 4;
        }

        // Regulatory reference
        if (v.regulatory_reference) {
          y = checkPageBreak(doc, y, 16, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_ACCENT);
          doc.text("Regulatory Ref: ", margin, y);
          doc.setFont("helvetica", "normal");
          const refLines = wrapText(doc, v.regulatory_reference, contentWidth - doc.getTextWidth("Regulatory Ref: "));
          refLines.forEach((line: string, li: number) => {
            if (li === 0) {
              doc.text(line, margin + doc.getTextWidth("Regulatory Ref: "), y);
            } else {
              y += 13;
              y = checkPageBreak(doc, y, 13, margin);
              doc.text(line, margin, y);
            }
          });
          y += 14;
        }

        // Divider between violations
        y += 4;
        y = checkPageBreak(doc, y, 8, margin);
        doc.setDrawColor(230, 230, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;
      });
    }

    // ── Compliant Areas ─────────────────────────────────────
    if (result.compliant_areas.length > 0) {
      y = checkPageBreak(doc, y, 30, margin);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...COLOR_SUCCESS);
      doc.text("Compliant Areas", margin, y);
      y += 18;

      result.compliant_areas.forEach((area) => {
        y = checkPageBreak(doc, y, 18, margin);

        // Green checkmark circle
        doc.setFillColor(...COLOR_SUCCESS);
        doc.circle(margin + 6, y - 3, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("\u2713", margin + 6, y, { align: "center" });

        // Area text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_DARK);
        const areaLines = wrapText(doc, area, contentWidth - 22);
        areaLines.forEach((line: string, li: number) => {
          if (li > 0) y = checkPageBreak(doc, y, 14, margin);
          doc.text(line, margin + 18, y);
          y += 14;
        });
        y += 2;
      });
    }

    // ── Footer ──────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    const footerDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...BRAND_ACCENT);
      doc.setLineWidth(1);
      doc.line(margin, pageH - 36, pageWidth - margin, pageH - 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(
        `Generated by Viotraix — AI Workplace Safety Audits  |  ${footerDate}`,
        margin,
        pageH - 22
      );
      doc.text(
        `Page ${p} of ${pageCount}`,
        pageWidth - margin,
        pageH - 22,
        { align: "right" }
      );
    }

    // ── Return PDF ──────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const safeName = a.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="viotraix-audit-${safeName}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
