Markdown
# Demo Presentation Fixes (`demo.md`)

## Role and Context
You are preparing the TerraSense application for a live demonstration. You need to patch a specific frontend bug that is breaking the data pipeline between the React interface and the Node.js backend, and add a debugging step to the backend to verify the pipeline.

---

## Task 1: Fix the Missing Image Payload (Frontend)
**The Error:** When the user clicks the "Run AI Detection" button, the Node.js terminal logs show `[ERROR] No image payload received.` The React frontend is currently failing to attach the picture of the map to the API request.

**The Solution:**
You must update the `onClick` handler (or the corresponding detection function) in the React frontend to extract the WebGL canvas before making the `fetch` request.

Follow these exact steps:
1. **Target the Map:** MapLibre renders the map on a specific canvas element. Target it using `document.querySelector('.mapboxgl-canvas')`.
2. **Extract the Snapshot:** Convert the canvas into a Base64 image string by calling `canvas.toDataURL("image/jpeg")`.
3. **Attach to Payload:** Send the POST request to `http://localhost:3001/api/detect`. Ensure the body includes the extracted string as `imageBase64` alongside the `prompt` string.

### Code Implementation Reference
Update the frontend detection logic to match this structure:

```javascript
const runDetection = async () => {
  const mapCanvas = document.querySelector('.mapboxgl-canvas');
  
  if (!mapCanvas) {
    console.error("Map canvas not found.");
    return;
  }

  // Extract the image from the MapLibre canvas
  const snapshotBase64 = mapCanvas.toDataURL("image/jpeg");

  try {
    const response = await fetch("http://localhost:3001/api/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: snapshotBase64,
        prompt: "rectangular metal rooftops"
      }),
    });

    const data = await response.json();
    console.log("Detection Results:", data);
    
  } catch (error) {
    console.error("Pipeline Error:", error);
  }
};

Task 2: Save the Map Snapshot (Backend Debugging)
The Goal: To visually verify that the frontend is sending the correct map image, the backend must save the incoming payload as a local file before sending it to the GPU cluster.

The Solution:
Update the backend/routes/detect.js file to utilize the native Node.js fs module to save the image.

Follow these exact steps:

Import fs: Add import fs from 'fs' at the top of the file.

Process the Image: Right after the backend validates the imageBase64 string, strip the Base64 header and convert the string into a binary buffer.

Save Locally: Write the buffer to the local disk using fs.writeFileSync. Ensure the filename is unique by appending the current timestamp.

Code Implementation Reference
Insert this block into the backend detection route before the fetch call to the AI model:

JavaScript
try {
  // Strip the Base64 header 
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  // Convert text to binary buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // Save locally with a timestamp
  const fileName = `satellite_capture_${Date.now()}.jpg`;
  fs.writeFileSync(fileName, imageBuffer);
  console.log(`[SYSTEM]   💾 Saved snapshot locally as: ${fileName}`);
} catch (saveError) {
  console.log(`[SYSTEM]   ⚠️ Could not save image to folder: ${saveError.message}`);
}
Version Control Protocol
When committing these frontend demo fixes or switching branches to apply the updates to the interface, you must strictly use the branch name fix/UI. Ensure exact casing; variations are strictly prohibited and will cause repository conflicts.