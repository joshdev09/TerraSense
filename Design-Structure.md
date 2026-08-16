# TerraSense: Pampanga Environmental Monitoring & Geospatial Accountability Dashboard

> **A Web-Based Public Ecological Ledger & Climate Risk Platform**  
> Tracking agricultural land conversion, monitoring subsidence and flood hazards, and generating automated municipal audits across Pampanga, Philippines.

---

## 1. Executive Summary & Problem Statement

In the province of Pampanga (covering 19 municipalities and 2 component cities), rapid urbanization and commercial expansion are converting prime agricultural lands at an unprecedented pace. Critical portions of this development are occurring inside high-risk flood zones and rapid ground subsidence (sinking) areas.

Land conversion and zoning approvals often occur without public transparency, preventing local government units (LGUs), disaster managers, and citizens from monitoring environmental risk or enforcing zoning compliance.

**TerraSense** solves this by uniting Earth Observation (EO) satellite data, machine learning, and citizen crowdsourcing. It computes land-use shifts, cross-references urban sprawl with natural disaster layers, and translates complex spatial metrics into actionable reports using LLM synthesis.

---

## 2. System Architecture & Tech Stack

### Full-Stack Overview
* **Frontend:** React, Tailwind CSS
  * *Mapping & Graphics:* WebGL Canvas / Map framework (vector tile rendering, GeoJSON overlay management)
  * *Export Engines:* `html2canvas` (client-side snapshotting), `jsPDF` / `@react-pdf/renderer` (in-browser PDF composition)
* **Backend:** Node.js / Express
  * Geospatial calculations and metric aggregations (hectares lost, conversion velocity, intersection ratios)
  * API proxy for LLM report synthesis
* **AI & Machine Learning:**
  * **Land Classification:** Random Forest / CART Classifier (trained on Sentinel-2 satellite data in Google Earth Engine or NVIDIA ML acceleration)
  * **Executive Report Synthesis:** Gemini 2.5 Flash-Lite API
* **External Geospatial Data Sources:**
  * **Flood Hazard:** Project NOAH / UP LiPAD (100-year flood depth vectors)
  * **Land Subsidence:** Copernicus EMSN091 (ground displacement / sinking heatmaps)
  * **Satellite Feeds & Boundaries:** PhilSA, Sentinel-2 imagery, OpenStreetMap / NAMRIA boundary vectors

---

## 3. Separation of Concerns: AI vs. Code Execution

To ensure cost efficiency, speed, and privacy:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERRASENSE SYSTEM FLOW                          │
└────────────────────────────────────────────────────────────────────────┘
 [User Triggers Report]
         │
         ├───► [Client WebGL Canvas] ──► html2canvas ──► Silent Map Snapshot (PNG)
         │                                                      │
         └───► [Node.js Backend]                                │
                    │                                           │
                    ├──► Computes Math (e.g., 400ha lost)       │
                    │                                           │
                    └──► Calls Gemini 2.5 Flash-Lite API        │
                              │                                 │
                              ▼                                 ▼
                     [Structured Summary]             [Embedded Map Image]
                              │                                 │
                              └───────────────┬─────────────────┘
                                              ▼
                                 [jsPDF / React-PDF Engine]
                                              ▼
                                 [Official PDF Download]
```

1. **AI Component (Token-Efficient Text Generation):**
   * The LLM never processes raw image or map files.
   * Node.js aggregates raw numbers (e.g., *Municipality: San Fernando | 400 ha converted | 35% in Flood Zone*) and prompts Gemini 2.5 Flash-Lite to produce a 4-part structured executive summary.
2. **Client-Side Visual Capture (Zero API Cost):**
   * The React client captures a static raster snapshot of the current WebGL map view directly from the user's browser.
3. **Document Assembly:**
   * `jsPDF` or `@react-pdf/renderer` merges the Gemini text, the map snapshot, and localized charts into a standardized PDF report.

---

## 4. Key Features & Modules

### 4.1. Core Map Workspace & Navigation
* **Floating Search Bar:**
  * Rounded bar anchored at the top of the map.
  * Autocomplete search for Pampanga municipalities and barangays (e.g., *Balibago*, *San Fernando*).
  * Smooth `fly-to` camera animations on selection.
  * Automatic boundary vector highlighting around selected LGUs.
* **Floating Layer Controller (Toggle Panel):**
  * Located on the right screen edge.
  * **Urban Expansion:** Renders ML-classified land transitioned from green cover to concrete (2018–2026).
  * **Remaining Agriculture:** Highlights active crop and arable land.
  * **Flood Depth:** Displays color-coded risk bands (Low, Medium, High Risk).
  * **Subsidence (Sinking):** Heatmap overlay of active land subsidence.
  * **Timeline Slider:** A dynamic slider (2018–2026) that reveals multi-year conversion steps when the Urban Expansion layer is enabled.

---

### 4.2. Analytics & Reports View

#### A. LGU Summary (Urbanization Overview)
* **Top-Level KPI Cards:**
  * *Total Farmland Lost:* Displays cumulative hectares lost (with relative percentage change since 2018).
  * *Current Rate of Expansion:* Hectares paved per year.
  * *Remaining Arable Land:* Current percentage of municipal territory.
* **The "Watchlist" Data Table:**
  * Columns: `Barangay Name` | `Hectares Lost` | `Primary Conversion Type` (e.g., Residential, Commercial Sprawl).
* **Automated Trend Snippets:**
  * Contextual plain-text insight generated below velocity graphs (e.g., *"Urban expansion in San Fernando has accelerated by 15% following NLEX interchange developments."*).
* **Global-to-Local Hierarchy:**
  * **Default (Provincial):** Summarizes all 19 municipalities + 2 cities.
  * **Filtered (Local):** Dropdown filter instantly scopes KPI cards, velocity charts, and barangay watchlist rows to the selected municipality.

#### B. Risk Profiles (Hazard Intersections)
* **Vulnerability Scorecards:** Visual status badges (*"Critical Flood Risk"* in red, *"Moderate Subsidence"* in yellow).
* **Exposure Metrics:** Quantified overlap between ML expansion boundaries and climate models (e.g., *"120 ha of new development located within 100-year flood zones"*).
* **Critical Intersection Alerts:** Automated warning banners prioritizing drainage and zoning audits.

---

### 4.3. Community Reports View (Citizen Science & Ground Truth)

```
┌──────────────────────────────┬──────────────────────────────────────────┐
│      CHOROPLETH MAP          │           REGION-SPECIFIC FEED           │
│                              │                                          │
│  [Barangay Vectors]          │  [Viewing: Brgy San Jose (42 Reports)]   │
│   - Low: Neutral Color       │                                          │
│   - Moderate: Warning Color  │  • [Flood: Knee-High] [Timestamp]        │
│   - High: Alert Color        │    "Road impassable near market."        │
│                              │    [User Photo]  [ Upvote Verify]        |
│  (Clicking boundary filters  │                                          │
│   feed to selected area)     │  • [ Illegal Fill]   [Timestamp]         │
│                              │    "Farmland fenced for warehouse."      │
└──────────────────────────────┴──────────────────────────────────────────┘
```

* **Choropleth Map Canvas:**
  * Vector borders for every barangay.
  * Dynamic color-fill mapped to citizen report density and severity (Neutral / Warning / Critical).
  * Clicking a barangay boundary filters the sidebar feed to that locality.
* **Region-Specific Feed:**
  * Displays active incident cards with category pills (e.g., *Flood Depth: Knee High*, *Unpermitted Land Fill*, *Crop Loss*), timestamps, user photos, and descriptions.
  * **Upvote Validation Engine:** Allows residents to confirm active incidents to filter out noise.
* **Neighborhood Submission Tool:**
  * **Mobile-First Flow:** GPS auto-detects the current barangay boundary. Users select a category, add descriptions, and upload a geo-tagged image.
  * **Desktop Web Drawer:** Side drawer supporting drag-and-drop EXIF image metadata extraction for automated pin positioning, with manual cascading dropdown fallback (Municipality → Barangay).

---

### 4.4. LGU Data Export Hub

A split-screen control center designed for municipal planners, journalists, and engineers:

1. **Configuration Panel (Left Column):**
   * Geographic Scope selector (`All Pampanga` or specific municipality).
   * Timeframe range (Date range / Multi-year window).
   * Data Layer Checkboxes:
     - `[x]` Agricultural Land Loss Analysis (ML Data)
     - `[x]` Flood Risk Vulnerability (Project NOAH)
     - `[x]` Land Subsidence Estimates (Copernicus)
   * **Action Button:** `"Generate Official Report"`
2. **Interactive Document Preview (Center/Right Column):**
   * Loading skeleton transition.
   * Document Header (Auto-generated title, timestamp, LGU metadata).
   * AI Executive Summary structure:
     * **The Situation:** Urbanization velocity and spatial summary.
     * **The Impact:** Hectares of arable land compromised.
     * **The Risk:** Spatial overlap with subsidence and flood vectors.
     * **Recommendations:** Targeted policy and zoning actions.
   * Embedded high-resolution map snapshot with highlighted conversion zones.
   * Embedded statistical trend and breakdown charts.
3. **Asset Download Center (Sticky Layout):**

| Export Type | Action | Deliverable Scope |
| :--- | :--- | :--- |
| **Official Briefing (PDF)** | `Download PDF Report` | AI narrative, localized raster map layout, and embedded statistical charts for executive review. |
| **Tabular Metrics (CSV)** | `Export Spreadsheet (.csv)` | Raw numerical points, barangay-level hectare calculations, and percentage shifts for Excel / Google Sheets. |
| **Geospatial Layer (GeoJSON)** | `Download Spatial Layer (.geojson)` | Complete vector geometries with attribute tables for QGIS, ArcGIS, and custom web maps. |

---

### 4.5. Smart Share System
* Dynamic social share card generator producing graphic summaries with embedded map snippets.
* Formatted alert strings for community updates, researchers, and local cycling / commuter groups:
  > *"🚨 Environmental Alert: According to the Pampanga Geo-Intelligence Tracker, [Barangay Name] has seen a [X]% increase in built-up areas, escalating localized flood risks. Check the live data map: [URL]"*

---

## 5. Machine Learning & Geospatial Pipelines

1. **Urban vs. Agriculture Classifier:**
   * **Algorithm:** Random Forest Classifier (CART) via Google Earth Engine / NVIDIA model pipelines.
   * **Input Data:** Sentinel-2 multi-spectral satellite imagery (Pampanga region).
   * **Training Methodology:** Polygons labeled across known agricultural baselines and urban expansion corridors.
   * **Resolution:** 10m x 10m pixel classification exported as GeoJSON vector layers.
2. **Hazard Layers (Direct Pipeline Integration):**
   * *Subsidence:* Copernicus EMSN091 SAR interferometry displacement vectors.
   * *Flood Inundation:* Project NOAH / UP LiPAD topographical flood depth models.
   * *Integration:* Pre-processed vector/raster overlays toggled directly in the client map canvas.

---

## 6. Directory Structure

```text
terrasense/
├── client/                     # React Frontend
│   ├── public/
│   │   └── data/               # Static GeoJSON hazard layers (NOAH, Copernicus)
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/      # KPI cards, Watchlist tables, Velocity graphs
│   │   │   ├── community/      # Incident drawer, Choropleth feed, Upvote system
│   │   │   ├── export/         # Document preview, PDF builder, GeoJSON/CSV exporters
│   │   │   ├── map/            # Map canvas, Layer controllers, Search bar
│   │   │   └── shared/         # Navbar, Status badges, Modal wrappers
│   │   ├── hooks/              # Geolocation, EXIF reader, Layer state hooks
│   │   ├── services/           # Backend API connectors
│   │   └── App.jsx
│   └── package.json
├── server/                     # Node.js Backend
│   ├── controllers/
│   │   ├── auditController.js  # Geospatial calculations & aggregation
│   │   ├── geminiController.js # Gemini 2.5 Flash-Lite API report synthesis
│   │   └── reportController.js # Community report ingest & upvote DB handlers
│   ├── routes/
│   │   └── api.js
│   ├── index.js
│   └── package.json
├── ml-pipeline/                # Earth Observation & Training Scripts
│   ├── gee_sentinel_classifier.py
│   └── export_geojson.js
└── README.md
```

---

## 7. Sources & Methodology

* **Philippine Space Agency (PhilSA):** Satellite remote sensing standards and validation.
* **Copernicus EMSN091:** Radar interferometry data for ground subsidence measurements.
* **Project NOAH & UP LiPAD:** High-resolution digital elevation models and river basin flood simulations.
* **Sentinel-2 (ESA):** Multispectral surface reflectance imagery for land cover classification.
