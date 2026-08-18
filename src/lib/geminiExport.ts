/**
 * geminiExport.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls Gemini 2.5 Flash-Lite to generate a formal executive summary from
 * raw map metrics. The API key is read from the VITE_GEMINI_API_KEY env var.
 */

export interface ExportMetrics {
  location:   string   // e.g. "City of San Fernando" or "All Pampanga"
  fromYear:   number
  toYear:     number
  layers: {
    agriLoss:   boolean
    floodRisk:  boolean
    subsidence: boolean
  }
}

export interface GeminiSummary {
  situation:       string
  impact:          string
  risk:            string
  recommendations: string[]
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

function buildPrompt(m: ExportMetrics): string {
  const layerList = [
    m.layers.agriLoss   && 'Agricultural Land Loss (ML-classified satellite data)',
    m.layers.floodRisk  && 'Flood Risk Vulnerability (Project NOAH / LiPAD topographic data)',
    m.layers.subsidence && 'Land Subsidence (Copernicus EMSN091 radar interferometry)',
  ].filter(Boolean).join(', ')

  return `
You are an expert environmental policy analyst preparing an official briefing report
for the Local Government Unit (LGU) of Pampanga, Philippines.

Based on the following raw monitoring data, generate a formal executive summary.

RAW DATA PAYLOAD:
{
  "location": "${m.location}",
  "monitoring_period": "${m.fromYear} to ${m.toYear}",
  "active_data_layers": ["${layerList}"],
  "province": "Pampanga, Central Luzon, Philippines",
  "context": "Urban sprawl, agricultural land conversion, flood risk, and ground subsidence monitoring."
}

Generate your response as a JSON object with EXACTLY this shape:
{
  "situation": "<2-3 sentence paragraph describing current land-use situation>",
  "impact":    "<2-3 sentence paragraph describing measurable impact on agriculture and environment>",
  "risk":      "<2-3 sentence paragraph describing flood and subsidence risk to new developments>",
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>",
    "<actionable recommendation 4>"
  ]
}

Write in formal, professional language suitable for an official government document.
Return ONLY the JSON object — no markdown fences, no extra text.
`.trim()
}

export async function generateGeminiSummary(metrics: ExportMetrics): Promise<GeminiSummary> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'VITE_GEMINI_API_KEY is not set. Add it to your .env file and restart the dev server.'
    )
  }

  const body = {
    contents: [
      {
        parts: [{ text: buildPrompt(metrics) }],
      },
    ],
    generationConfig: {
      temperature:     0.4,
      maxOutputTokens: 1024,
    },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip any accidental markdown fences Gemini may add despite instructions
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned) as GeminiSummary
    // Basic shape validation
    if (!parsed.situation || !parsed.impact || !parsed.risk || !Array.isArray(parsed.recommendations)) {
      throw new Error('Unexpected response shape from Gemini')
    }
    return parsed
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON. Raw: ${raw.slice(0, 300)}`)
  }
}
