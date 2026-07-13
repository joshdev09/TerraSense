import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PAMPANGA_CENTER: [number, number] = [15.0794, 120.6200];

const PAMPANGA_BOUNDS: [[number, number], [number, number]] = [
  [14.85, 120.40],
  [15.35, 120.85],
];

export default function PampangaMap() {
  return (
    <div
      style={{ height: 'calc(100vh - 57px)', width: '100%', position: 'relative', zIndex: 0 }}
    >
      <MapContainer
        center={PAMPANGA_CENTER}
        zoom={11}
        minZoom={10}
        maxZoom={14}
        maxBounds={PAMPANGA_BOUNDS}
        maxBoundsViscosity={1.0}   
        scrollWheelZoom={true}
        zoomControl={false}     
        style={{ height: '100%', width: '100%' }}
      >
        {/* Light tile — CartoCDN Positron (clean, minimal, light) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* GeoJSON hazard layers go here */}
      </MapContainer>
    </div>
  );
}