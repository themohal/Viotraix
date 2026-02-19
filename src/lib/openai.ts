import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ANALYSIS_PROMPT = `You are a professional workplace safety and compliance inspector. Analyze this workplace photo for safety and compliance violations.

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "overall_score": <1-100, where 100 is perfectly safe>,
  "summary": "<2-3 sentence overview of the safety state>",
  "industry_detected": "<restaurant|construction|warehouse|retail|office|general>",
  "violations": [
    {
      "id": <number starting from 1>,
      "category": "<fire_safety|electrical|ergonomic|slip_trip_fall|chemical|ppe|structural|hygiene|emergency_exit|general>",
      "severity": "<critical|high|medium|low>",
      "title": "<short violation title>",
      "description": "<detailed description of what's wrong>",
      "location": "<where in the image this is visible>",
      "recommendation": "<specific fix recommendation>",
      "regulatory_reference": "<OSHA/FDA/NFPA standard reference if applicable, or empty string>"
    }
  ],
  "compliant_areas": ["<things that look good/safe>"],
  "priority_fixes": ["<top 3 most urgent fixes>"]
}

Be thorough but accurate. Only report violations you can actually see evidence of in the image. Score higher if the space looks generally safe, lower if there are serious hazards.`;

export async function analyzeImage(imageUrl: string | string[], industryHint?: string): Promise<{
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
}> {
  const urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const isBulk = urls.length > 1;

  const industryContext = industryHint && industryHint !== "general"
    ? `\n\nThe user indicated this is a ${industryHint} environment. Pay special attention to industry-specific regulations.`
    : "";

  const bulkContext = isBulk
    ? `\n\nYou are analyzing ${urls.length} workplace photos from the same location. Provide a single combined report covering all images.`
    : "";

  const imageEntries: Array<{ type: "image_url"; image_url: { url: string; detail: "high" } }> =
    urls.map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: ANALYSIS_PROMPT + industryContext + bulkContext,
          },
          ...imageEntries,
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || "{}";

  // Clean up potential markdown code fences
  const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  return JSON.parse(cleaned);
}
