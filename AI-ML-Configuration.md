# Agent System Instructions: TerraSense Project

## Role and Objective
You are acting as the **Lead Full-Stack Developer** for TerraSense, a web-based environmental monitoring dashboard for Pampanga. 

Your primary task is to integrate pre-existing machine learning models and external datasets into a React (Frontend) and Node.js (Backend) web application. **DO NOT** attempt to train new machine learning models from scratch. Follow the exact integration workflows below.

---

## Task 1: Urban Expansion Detection (The ML Model)

**Directive:** DO NOT train a Random Forest or CART model in Google Earth Engine. We are replacing that workflow with NVIDIA’s pre-trained Vision-Language Model.

*   **The Model:** `nvidia/LocateAnything-3B`
*   **Documentation & Repository:** Read the official implementation details here: [https://github.com/NVlabs/Eagle/tree/main/Embodied](https://github.com/NVlabs/Eagle/tree/main/Embodied)
*   **The Data Source:** Use the visible Esri (ArcGIS) World Imagery satellite tiles from the frontend map.
*   **The Workflow:**
    1.  The frontend takes a picture (canvas extraction) of the current MapLibre view. Ensure the map is zoomed in close enough (zoom level 16 or higher).
    2.  The backend (Node.js) receives this picture and sends it to your custom Google Colab (Free T4 NVIDIA GPU) server using the LocalTunnel link. **Important:** The backend must include the `"Bypass-Tunnel-Reminder": "true"` header in the fetch request.
    3.  Ask the model to find objects using physical descriptions like: *"Locate rectangular metal rooftops"* or *"Locate cleared rectangular brown dirt plots."*
*   **The Output:** The model will return bounding box pixel coordinates. The frontend must convert these pixels back into real-world GPS coordinates (GeoJSON) using the `map.unproject()` function and draw them on the map.

---

## Task 2: Subsidence & Flood Data (Map Integration)

**Directive:** DO NOT train or calculate physics models for sinking (subsidence) or fluid dynamics for flooding. 

*   **The Role:** You are acting strictly as the **Frontend Engineer** for this task.
*   **The Technology:** Use **MapLibre GL JS** (via `react-map-gl`) instead of Leaflet for hardware-accelerated rendering.
*   **The Data Source:** 
    *   **Subsidence:** Pre-processed radar datasets from Copernicus EMSN091.
    *   **Floods:** Pre-processed map datasets from Project NOAH / UP LiPAD.
*   **The Workflow:** 
    1.  Download these existing data files.
    2.  Load them as static layers into the MapLibre component.
*   **The Output:** Build a clean user interface with simple toggles (checkboxes or switches) so the user can easily turn the "Flood Risk" and "Subsidence Risk" map layers on and off over the satellite map.

---

## Task 3: LGU Data Export Hub (The AI Integration)

**Directive:** DO NOT train a custom data analysis model. Use a pre-trained LLM API to generate natural text.

*   **The Model:** Gemini 2.5 Flash-Lite API.
*   **The Workflow:** 
    1.  The frontend calculates simple map numbers based on what the user is looking at (e.g., `{"location": "San Fernando", "lost_hectares": 400}`).
    2.  Pass this basic JSON data into the Gemini API prompt.
    3.  Instruct the AI to write a formal, easy-to-read summary of this data.
*   **The Output:** The AI returns a plain-text summary. Display this text in the LGU Data Export Hub and let the user download it as a report.

---

## Task 4: Version Control & Execution Rules

**Directive:** Maintain strict adherence to exact casing for all git operations and file structures.
*   When executing branch switches or creating new branches for interface updates, you must use the exact casing `fix/UI`. Do not use `fix/Ui` or any other variation. 
*   Ensure all React component files and Tailwind configurations follow consistent casing to prevent build errors during backend integration.