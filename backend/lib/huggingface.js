/**
 * huggingface.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls nvidia/LocateAnything-3B via Hugging Face Inference Endpoints.
 * Model: https://huggingface.co/nvidia/LocateAnything-3B
 * Docs:  https://github.com/NVlabs/Eagle/tree/main/Embodied
 *
 * in the format: [x_min, y_min, x_max, y_max] normalised to [0, 1].
 */

// Reads your Google Colab ngrok/localtunnel URL from the .env file!
const apiUrl = (process.env.COLAB_ENDPOINT_URL || "https://router.huggingface.co/hf-inference/models/nvidia/LocateAnything-3B").trim()

const URBAN_PROMPTS = [
  'Locate newly built subdivisions and residential estates.',
  'Locate concrete structures and paved roads.',
  'Locate commercial buildings and warehouses.',
  'Locate construction sites and cleared land.',
]

/**
 * Run LocateAnything-3B against an image URL with urban-sprawl prompts.
 *
 * @param {string} imageUrl   Publicly accessible URL to the satellite image
 * @returns {Promise<Array<{label: string, bbox: [number,number,number,number], score: number}>>}
 */
export async function detectUrbanExpansion(imageUrl) {
  const token = process.env.HF_API_TOKEN
  if (!token || token === 'your_huggingface_token_here') {
    throw new Error('HF_API_TOKEN is not set. Add it to backend/.env')
  }

  const allDetections = []

  // Run one request per prompt, collect all bounding boxes
  for (const prompt of URBAN_PROMPTS) {
    const body = {
      inputs: {
        image: imageUrl,
        text:  prompt,
      },
    }

    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.status === 503) {
      // Model is loading — wait and retry once
      await new Promise(r => setTimeout(r, 8000))
      const retry = await fetch(apiUrl, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(body),
      })
      if (!retry.ok) continue
      const data = await retry.json()
      allDetections.push(...normalise(data, prompt))
      continue
    }

    if (!res.ok) {
      console.warn(`HF API returned ${res.status} for prompt: "${prompt}"`)
      continue
    }

    const data = await res.json()
    allDetections.push(...normalise(data, prompt))
  }

  return allDetections
}

/**
 * Normalise the raw model output into a consistent array shape.
 * LocateAnything-3B returns: { detections: [{ label, score, box: {x1,y1,x2,y2} }] }
 */
function normalise(raw, prompt) {
  const detections = raw?.detections ?? raw ?? []
  if (!Array.isArray(detections)) return []

  return detections
    .filter(d => (d.score ?? 1) > 0.35)   // confidence threshold
    .map(d => ({
      label: d.label ?? prompt,
      score: d.score ?? 1,
      bbox:  d.box
        ? [d.box.x1, d.box.y1, d.box.x2, d.box.y2]
        : (d.bbox ?? [0, 0, 1, 1]),
    }))
}
