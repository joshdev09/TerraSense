/**
 * Complete list of cities and barangays in Pampanga, Philippines.
 * Source: City-and-Barangays-of-Pampanga.md
 *
 * Coordinates are the parent-city centroid for all barangays (exact
 * per-barangay coordinates require GeoJSON data not yet available).
 * Zoom level 14 is used for barangays, 12 for cities.
 */

export interface PampangaLocation {
  name:       string
  parentCity: string
  coords:     [number, number]
  type:       'City' | 'Barangay'
  zoom:       number
}

const SF:  [number, number] = [15.0244, 120.6928]   // City of San Fernando
const MAB: [number, number] = [15.2108, 120.5754]   // Mabalacat City
const ANG: [number, number] = [15.1450, 120.5886]   // Angeles City

// ── City of San Fernando — 35 barangays ───────────────────────────────────────
const SAN_FERNANDO_BARANGAYS = [
  'Alasas', 'Baliti', 'Bulaon', 'Calulut', 'Dela Paz Norte', 'Dela Paz Sur',
  'Del Carmen', 'Del Pilar', 'Del Rosario', 'Dolores', 'Juliana', 'Lara',
  'Lourdes', 'Magliman', 'Maimpis', 'Malino', 'Malpitic', 'Pandaras',
  'Panipuan', 'Pulung Bulu', 'Quebiawan', 'Saguin', 'San Agustin', 'San Felipe',
  'San Isidro', 'San Jose', 'San Juan', 'San Nicolas', 'San Pedro Cutud',
  'Santa Lucia', 'Santa Teresita', 'Santo Niño', 'Santo Rosario (Poblacion)',
  'Sindalan', 'Telabastagan',
]

// ── Mabalacat City — 27 barangays ─────────────────────────────────────────────
const MABALACAT_BARANGAYS = [
  'Atlu-Bola', 'Bical', 'Bundagul', 'Cacutud', 'Calumpang', 'Camachiles',
  'Dapdap', 'Dau', 'Dolores', 'Duquit', 'Lakandula', 'Mabiga',
  'Macapagal Village', 'Mamatitang', 'Mangalit', 'Marcos Village', 'Mawaque',
  'Paralayunan', 'Poblacion', 'San Francisco', 'San Joaquin', 'Santa Ines',
  'Santa Maria', 'Santo Rosario', 'Sapangbalen', 'Sapang Biabas', 'Tabun',
]

// ── Angeles City — 33 barangays ───────────────────────────────────────────────
const ANGELES_BARANGAYS = [
  'Agapito del Rosario', 'Amsic', 'Anunas', 'Balibago', 'Capaya',
  'Claro M. Recto', 'Cuayan', 'Cutcut', 'Cutud', 'Lourdes North West',
  'Lourdes Sur (Talimundoc)', 'Lourdes Sur East', 'Malabañas', 'Margot',
  'Marisol (Ninoy Aquino)', 'Mining', 'Pampang (Santo Niño)', 'Pandan',
  'Pulung Bulu', 'Pulung Cacutud', 'Pulung Maragul', 'Salapungan', 'San José',
  'San Nicolas', 'Santa Teresita', 'Santa Trinidad', 'Santo Cristo',
  'Santo Domingo', 'Santo Rosario (Población)', 'Sapalibutad', 'Sapangbato',
  'Tabun', 'Virgen Delos Remedios',
]

// ── Assembled list ─────────────────────────────────────────────────────────────
export const PAMPANGA_LOCATIONS: PampangaLocation[] = [
  // Cities first (appear at top of search results)
  { name: 'City of San Fernando', parentCity: 'City of San Fernando', coords: SF,  type: 'City', zoom: 12 },
  { name: 'Mabalacat City',       parentCity: 'Mabalacat City',       coords: MAB, type: 'City', zoom: 12 },
  { name: 'Angeles City',         parentCity: 'Angeles City',         coords: ANG, type: 'City', zoom: 12 },

  // San Fernando barangays
  ...SAN_FERNANDO_BARANGAYS.map(name => ({
    name, parentCity: 'City of San Fernando', coords: SF, type: 'Barangay' as const, zoom: 14,
  })),

  // Mabalacat barangays
  ...MABALACAT_BARANGAYS.map(name => ({
    name, parentCity: 'Mabalacat City', coords: MAB, type: 'Barangay' as const, zoom: 14,
  })),

  // Angeles barangays
  ...ANGELES_BARANGAYS.map(name => ({
    name, parentCity: 'Angeles City', coords: ANG, type: 'Barangay' as const, zoom: 14,
  })),
]

/** Convenience: just the 3 city names for dropdown filters. */
export const PAMPANGA_CITIES = [
  'City of San Fernando',
  'Mabalacat City',
  'Angeles City',
]
