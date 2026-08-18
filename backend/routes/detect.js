/**
 * detect.js  —  POST /api/detect
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full urban-expansion detection pipeline:
 *   1. Receives WebGL canvas snapshot (Base64) from the React frontend
 *   2. Forwards image to the custom NVIDIA LocateAnything-3B Colab Server
 *   3. Returns raw pixel bounding boxes to the frontend for GeoJSON projection
 * 
 * NOTE: Legacy DIWATA-2/Sentinel-2 and Hugging Face API logic has been 
 * removed in favor of the Canvas Extraction + Colab GPU method.
 */

import { Router } from 'express'
import fetch from 'node-fetch'
import fs from 'fs'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { imageBase64, prompt = 'rectangular metal rooftops' } = req.body
    
    // 1. Log the incoming request from React
    console.log(`\n==================================================`)
    console.log(`[${new Date().toISOString()}] 🛰️ INCOMING SATELLITE SCAN`)
    console.log(`==================================================`)
    console.log(`[FRONTEND] 📸 Received WebGL Canvas Extraction...`)
    console.log(`[FRONTEND] 🎯 Target Feature: "${prompt}"`)
    
    if (!imageBase64) {
      console.log(`[ERROR]    ❌ No image payload received.`);
      return res.status(400).json({ ok: false, error: 'Missing imageBase64 payload' });
    }

    console.log(`[DATA]     📦 Image Payload Size: ${(imageBase64.length / 1024).toFixed(2)} KB`)

    try {
      // Strip the Base64 header 
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      // Convert text to binary buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Ensure the 'satellite-captured' folder exists
      const dirPath = 'satellite-captured';
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Save locally with a timestamp inside the new folder
      const fileName = `satellite_capture_${Date.now()}.jpg`;
      const filePath = `${dirPath}/${fileName}`;
      
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`[SYSTEM]   💾 Saved snapshot locally as: ${filePath}`);
    } catch (saveError) {
      console.log(`[SYSTEM]   ⚠️ Could not save image to folder: ${saveError.message}`);
    }

    // Ensure you replace this URL with your live Colab LocalTunnel link during testing
    const apiUrl = "https://warm-peas-cry.loca.lt" 
    
    // 2. Log the hand-off to the Colab Server
    console.log(`\n[NETWORK]  🚀 Routing to NVIDIA LocateAnything-3B GPU Cluster...`)
    console.log(`[NETWORK]  🔗 Endpoint: ${apiUrl}`)
    
    const startTime = Date.now()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
      },
      body: JSON.stringify({
        image: imageBase64,
        prompt: prompt,
      }),
    })

    const data = await response.json()
    const inferenceTime = ((Date.now() - startTime) / 1000).toFixed(2)

    // 3. Log the successful return and display the raw AI data
    if (data.success) {
      console.log(`[NETWORK]  ✅ 200 OK: Inference completed in ${inferenceTime} seconds.`)
      console.log(`\n[AI MODEL] 🧠 Raw Output Tensors (Pixel Bounding Boxes):`)
      console.log(data.detections) 
      
      console.log(`\n[BACKEND]  🗺️ Sending pixel coordinates back to React for GPS projection...`)
      console.log(`==================================================\n`)
      
      // Returns { ok: true, data: "<box_2d>..." } to match your frontend expectations
      return res.status(200).json({ ok: true, data: data.detections })
    } else {
      console.log(`[ERROR]    ❌ AI Server failed to process the image.`)
      console.log(data.error)
      return res.status(500).json({ ok: false, error: data.error })
    }

  } catch (err) {
    console.log(`[FATAL]    🚨 Pipeline Crash: ${err.message}`)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

export default router