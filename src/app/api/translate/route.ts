import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5-20251001";

interface TranslateRequest {
  listingId: string;
}

interface TranslationResult {
  title_en: string;
  title_kz: string;
  description_en: string;
  description_kz: string;
  amenities_en: string[];
  amenities_kz: string[];
  rules_en: string[];
  rules_kz: string[];
}

async function translateWithClaude(
  title: string,
  description: string,
  amenities: string[],
  rules: string[],
): Promise<TranslationResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const prompt = `Translate the following venue listing from Russian to English and Kazakh. Return ONLY valid JSON with no markdown formatting.

Title: ${title}

Description: ${description}

Amenities: ${JSON.stringify(amenities)}

Rules: ${JSON.stringify(rules)}

Return this exact JSON structure:
{
  "title_en": "...",
  "title_kz": "...",
  "description_en": "...",
  "description_kz": "...",
  "amenities_en": ["..."],
  "amenities_kz": ["..."],
  "rules_en": ["..."],
  "rules_kz": ["..."]
}

Rules:
- Keep proper nouns (brand names, addresses) unchanged
- Amenities should be short labels (1-3 words)
- Description should preserve the tone and formatting
- Kazakh should use modern literary Kazakh (not transliteration)
- Return arrays with the same number of items as input`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  // Extract JSON from response (handle possible markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  return JSON.parse(jsonMatch[0]) as TranslationResult;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequest;
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch listing content
    const { data: listing, error: fetchErr } = await supabase
      .from("listings")
      .select("title, description, amenities, rules")
      .eq("id", listingId)
      .single();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const title = listing.title as string;
    const description = listing.description as string;
    const amenities = (listing.amenities as string[]) ?? [];
    const rules = (listing.rules as string[]) ?? [];

    // Skip if nothing to translate
    if (!title && !description) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Translate via Claude
    const translation = await translateWithClaude(title, description, amenities, rules);

    // Save to Supabase
    const { error: updateErr } = await supabase
      .from("listings")
      .update({
        title_en: translation.title_en,
        title_kz: translation.title_kz,
        description_en: translation.description_en,
        description_kz: translation.description_kz,
        amenities_en: translation.amenities_en,
        amenities_kz: translation.amenities_kz,
        rules_en: translation.rules_en,
        rules_kz: translation.rules_kz,
      })
      .eq("id", listingId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to save translations", detail: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
