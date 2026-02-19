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

// ── Design tokens ───────────────────────────────────────────
const BRAND_ACCENT = [99, 102, 241] as const;
const BRAND_ACCENT2 = [168, 85, 247] as const;
const COLOR_DANGER = [239, 68, 68] as const;
const COLOR_WARNING = [245, 158, 11] as const;
const COLOR_SUCCESS = [34, 197, 94] as const;
const COLOR_MUTED = [120, 120, 138] as const;
const COLOR_DARK = [20, 20, 35] as const;
const COLOR_LIGHT_BG = [247, 247, 250] as const;
const COLOR_CARD_BORDER = [230, 230, 238] as const;

// Spacing constants
const LINE_SM = 15;        // small body text line height
const LINE_MD = 17;        // body text line height
const LINE_LG = 20;        // larger text line height
const SECTION_GAP = 28;    // gap between major sections
const INNER_PAD = 14;      // padding inside cards
const CARD_RADIUS = 8;

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
  doc.setFillColor(...BRAND_ACCENT);
  doc.roundedRect(x, y, 18 * s, 22 * s, 3 * s, 3 * s, "F");
  doc.setFillColor(...BRAND_ACCENT);
  doc.triangle(x, y + 16 * s, x + 18 * s, y + 16 * s, x + 9 * s, y + 24 * s, "F");
  doc.setFillColor(...BRAND_ACCENT2);
  doc.roundedRect(x + 3 * s, y + 3 * s, 12 * s, 14 * s, 2 * s, 2 * s, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2 * s);
  doc.line(x + 5.5 * s, y + 10 * s, x + 8 * s, y + 13 * s);
  doc.line(x + 8 * s, y + 13 * s, x + 13 * s, y + 6 * s);
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function pageBreak(doc: jsPDF, y: number, needed: number, margin: number): number {
  const footerReserve = 48;
  if (y + needed > doc.internal.pageSize.getHeight() - margin - footerReserve) {
    doc.addPage();
    return margin;
  }
  return y;
}

/** Draw a subtle card background */
function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor?: readonly [number, number, number],
  borderColor?: readonly [number, number, number],
) {
  doc.setFillColor(...(fillColor || COLOR_LIGHT_BG));
  doc.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "F");
  if (borderColor) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "S");
  }
}

/** Draw a section heading with a small accent bar */
function drawSectionHeading(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  color: readonly [number, number, number],
): number {
  // Accent bar
  doc.setFillColor(...color);
  doc.roundedRect(x, y - 10, 3, 16, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...color);
  doc.text(text, x + 12, y);
  return y + LINE_LG + 4;
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
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // =============================================================
    //  HEADER
    // =============================================================
    drawShieldLogo(doc, margin, y, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...COLOR_DARK);
    doc.text("Viotraix", margin + 42, y + 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("AI Workplace Safety Audit Report", margin + 42, y + 38);

    // Gradient-style accent line (two overlapping colored lines)
    y += 58;
    doc.setDrawColor(...BRAND_ACCENT);
    doc.setLineWidth(2.5);
    doc.line(margin, y, margin + contentWidth * 0.6, y);
    doc.setDrawColor(...BRAND_ACCENT2);
    doc.setLineWidth(2.5);
    doc.line(margin + contentWidth * 0.6, y, pageWidth - margin, y);

    y += SECTION_GAP;

    // =============================================================
    //  AUDIT INFO + SCORE  (side-by-side card)
    // =============================================================
    const date = new Date(a.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const score = result.overall_score;
    const scoreColor = getScoreColor(score);

    // Measure score badge first so we know how much right-side space it needs
    const scoreText = `${score} / 100`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const stw = doc.getTextWidth(scoreText);
    const badgeW = stw + 28;
    const badgeH = 36;
    const infoCardH = 82;

    drawCard(doc, margin, y, contentWidth, infoCardH, COLOR_LIGHT_BG, COLOR_CARD_BORDER);

    // Right side — score badge (vertically centered in card)
    const badgeX = margin + contentWidth - INNER_PAD - badgeW;
    const badgeY = y + (infoCardH - badgeH) / 2;

    // Glow
    doc.setFillColor(...scoreColor);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(badgeX - 4, badgeY - 4, badgeW + 8, badgeH + 8, 10, 10, "F");
    doc.setGState(doc.GState({ opacity: 1 }));

    // Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setFillColor(...scoreColor);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(scoreText, badgeX + 14, badgeY + 25);

    // Left side — meta info (constrained so it doesn't overlap badge)
    const infoX = margin + INNER_PAD + 2;
    let infoY = y + INNER_PAD + 12;

    // Row 1: labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("FILE", infoX, infoY);
    doc.text("INDUSTRY", infoX + 160, infoY);
    infoY += 14;

    // Row 2: values
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_DARK);
    const displayName = a.file_name.length > 22 ? a.file_name.slice(0, 20) + "..." : a.file_name;
    doc.text(displayName, infoX, infoY);
    const industry = result.industry_detected || a.industry_type;
    doc.text(industry.charAt(0).toUpperCase() + industry.slice(1), infoX + 160, infoY);
    infoY += 18;

    // Row 3: date (full width under the labels)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("DATE", infoX, infoY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_DARK);
    doc.text(date, infoX + 42, infoY);

    y += infoCardH + SECTION_GAP;

    // =============================================================
    //  SUMMARY
    // =============================================================
    y = pageBreak(doc, y, 80, margin);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_MUTED);
    const summaryLines = wrap(doc, result.summary, contentWidth - INNER_PAD * 2);
    const summaryCardH = INNER_PAD * 2 + 18 + summaryLines.length * LINE_MD + 4;

    drawCard(doc, margin, y, contentWidth, summaryCardH, COLOR_LIGHT_BG, COLOR_CARD_BORDER);

    // Section title inside card
    let sy = y + INNER_PAD + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLOR_DARK);
    doc.text("Summary", margin + INNER_PAD, sy);
    sy += LINE_LG + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_MUTED);
    summaryLines.forEach((line: string) => {
      doc.text(line, margin + INNER_PAD, sy);
      sy += LINE_MD;
    });

    y += summaryCardH + SECTION_GAP;

    // =============================================================
    //  PRIORITY FIXES
    // =============================================================
    if (result.priority_fixes.length > 0) {
      y = pageBreak(doc, y, 60, margin);
      y = drawSectionHeading(doc, "Priority Fixes", margin, y, BRAND_ACCENT);

      result.priority_fixes.forEach((fix, i) => {
        y = pageBreak(doc, y, 36, margin);

        // Numbered circle
        doc.setFillColor(...BRAND_ACCENT);
        doc.circle(margin + 10, y - 3, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(String(i + 1), margin + 10, y + 1, { align: "center" });

        // Fix text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLOR_DARK);
        const fixLines = wrap(doc, fix, contentWidth - 32);
        fixLines.forEach((line: string, li: number) => {
          if (li > 0) {
            y += LINE_MD;
            y = pageBreak(doc, y, LINE_MD, margin);
          }
          doc.text(line, margin + 28, y);
        });
        y += LINE_MD + 6;
      });

      y += SECTION_GAP - 6;
    }

    // =============================================================
    //  VIOLATIONS
    // =============================================================
    if (result.violations.length > 0) {
      y = pageBreak(doc, y, 60, margin);
      y = drawSectionHeading(doc, `Violations (${result.violations.length})`, margin, y, COLOR_DARK);

      result.violations.forEach((v, vi) => {
        y = pageBreak(doc, y, 110, margin);

        // ── Violation header row: severity badge + category + title ──
        const sevColor = getSeverityColor(v.severity);
        const sevText = v.severity.toUpperCase();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const sevTextW = doc.getTextWidth(sevText);
        const sevBadgeW = sevTextW + 14;

        doc.setFillColor(...sevColor);
        doc.roundedRect(margin, y - 11, sevBadgeW, 17, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(sevText, margin + 7, y);

        // Category pill
        const catText = v.category.replace(/_/g, " ").toUpperCase();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const catTextW = doc.getTextWidth(catText);
        const catX = margin + sevBadgeW + 8;
        doc.setFillColor(235, 235, 242);
        doc.roundedRect(catX, y - 10, catTextW + 10, 15, 3, 3, "F");
        doc.setTextColor(...COLOR_MUTED);
        doc.text(catText, catX + 5, y);

        y += LINE_SM + 2;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.setTextColor(...COLOR_DARK);
        const titleLines = wrap(doc, v.title, contentWidth);
        titleLines.forEach((line: string) => {
          y = pageBreak(doc, y, LINE_LG, margin);
          doc.text(line, margin, y);
          y += LINE_LG;
        });
        y += 4;

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_MUTED);
        const descLines = wrap(doc, v.description, contentWidth);
        descLines.forEach((line: string) => {
          y = pageBreak(doc, y, LINE_SM, margin);
          doc.text(line, margin, y);
          y += LINE_SM;
        });
        y += 8;

        // Detail rows (Location, Recommendation, Regulatory Ref)
        const detailIndent = margin + 2;

        if (v.location) {
          y = pageBreak(doc, y, LINE_SM + 4, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_DARK);
          doc.text("Location", detailIndent, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_MUTED);
          const locLines = wrap(doc, v.location, contentWidth - 70);
          locLines.forEach((line: string, li: number) => {
            if (li === 0) {
              doc.text(line, detailIndent + 62, y);
            } else {
              y += LINE_SM;
              y = pageBreak(doc, y, LINE_SM, margin);
              doc.text(line, detailIndent + 62, y);
            }
          });
          y += LINE_SM + 4;
        }

        if (v.recommendation) {
          y = pageBreak(doc, y, LINE_SM + 4, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_ACCENT);
          doc.text("Fix", detailIndent, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_DARK);
          const recLines = wrap(doc, v.recommendation, contentWidth - 70);
          recLines.forEach((line: string, li: number) => {
            if (li === 0) {
              doc.text(line, detailIndent + 62, y);
            } else {
              y += LINE_SM;
              y = pageBreak(doc, y, LINE_SM, margin);
              doc.text(line, detailIndent + 62, y);
            }
          });
          y += LINE_SM + 4;
        }

        if (v.regulatory_reference) {
          y = pageBreak(doc, y, LINE_SM + 4, margin);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...BRAND_ACCENT2);
          doc.text("Regulation", detailIndent, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_MUTED);
          const refLines = wrap(doc, v.regulatory_reference, contentWidth - 70);
          refLines.forEach((line: string, li: number) => {
            if (li === 0) {
              doc.text(line, detailIndent + 62, y);
            } else {
              y += LINE_SM;
              y = pageBreak(doc, y, LINE_SM, margin);
              doc.text(line, detailIndent + 62, y);
            }
          });
          y += LINE_SM + 2;
        }

        // Divider (skip after last item)
        if (vi < result.violations.length - 1) {
          y += 4;
          y = pageBreak(doc, y, 10, margin);
          doc.setDrawColor(...COLOR_CARD_BORDER);
          doc.setLineWidth(0.5);
          doc.line(margin, y, pageWidth - margin, y);
          y += 16;
        } else {
          y += 8;
        }
      });

      y += SECTION_GAP - 8;
    }

    // =============================================================
    //  COMPLIANT AREAS
    // =============================================================
    if (result.compliant_areas.length > 0) {
      y = pageBreak(doc, y, 60, margin);
      y = drawSectionHeading(doc, "Compliant Areas", margin, y, COLOR_SUCCESS);

      result.compliant_areas.forEach((area) => {
        y = pageBreak(doc, y, 22, margin);

        // Green checkmark circle
        doc.setFillColor(...COLOR_SUCCESS);
        doc.circle(margin + 8, y - 3, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("\u2713", margin + 8, y + 1, { align: "center" });

        // Area text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLOR_DARK);
        const areaLines = wrap(doc, area, contentWidth - 30);
        areaLines.forEach((line: string, li: number) => {
          if (li > 0) {
            y += LINE_MD;
            y = pageBreak(doc, y, LINE_MD, margin);
          }
          doc.text(line, margin + 24, y);
        });
        y += LINE_MD + 4;
      });
    }

    // =============================================================
    //  FOOTER (all pages)
    // =============================================================
    const pageCount = doc.getNumberOfPages();
    const footerDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      const pageH = doc.internal.pageSize.getHeight();

      // Gradient accent line
      doc.setDrawColor(...BRAND_ACCENT);
      doc.setLineWidth(1);
      doc.line(margin, pageH - 40, margin + contentWidth * 0.6, pageH - 40);
      doc.setDrawColor(...BRAND_ACCENT2);
      doc.line(margin + contentWidth * 0.6, pageH - 40, pageWidth - margin, pageH - 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(
        `Generated by Viotraix  \u2014  AI Workplace Safety Audits  |  ${footerDate}`,
        margin,
        pageH - 24,
      );
      doc.text(
        `Page ${p} of ${pageCount}`,
        pageWidth - margin,
        pageH - 24,
        { align: "right" },
      );
    }

    // =============================================================
    //  RETURN PDF
    // =============================================================
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
