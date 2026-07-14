import { MapContainer, TileLayer } from 'react-leaflet'; //GEOJson
import 'leaflet/dist/leaflet.css';
//import pampangaData from '../data/pampanga-boundary.json';

const PAMPANGA_CENTER: [number, number] = [15.0794, 120.6200];
const PAMPANGA_BOUNDS: [[number, number], [number, number]] = [
  [14.70, 120.30], 
  [15.40, 121.05], 
];

export default function PampangaMap() {

//   const defaultStyle = {
//     color: '#3b82f6',    
//     weight: 2,           
//     opacity: 0.8,         
//     fillColor: '#93c5fd', 
//     fillOpacity: 0.1,    
//     className: 'glow-layer' 
//   };

  // const onEachFeature = (feature: any, layer: any) => {
    
  //   const cityName = feature.properties?.MUNICIPALI || "Unknown City";

  //   layer.bindTooltip(cityName, {
  //     sticky: true, 
  //     direction: 'auto',
  //     className: 'city-tooltip' 
  //   });

  //   layer.on({
  //     mouseover: (e: any) => {
  //       const hoveredLayer = e.target;
  //       hoveredLayer.setStyle({
  //         weight: 4,
  //         color: '#60a5fa', 
  //         fillOpacity: 0.4, 
  //       });
  //       hoveredLayer.bringToFront(); 
  //     },
  //     mouseout: (e: any) => {
  //       const hoveredLayer = e.target;
  //       hoveredLayer.setStyle(defaultStyle);
  //     },
  //   });
  // };

  return (
    <div
      style={{ 
        flexGrow: 1,
        height: '100%',
        width: '100%', 
        position: 'relative', 
        zIndex: 0 
      }}
    >
      <MapContainer
        center={PAMPANGA_CENTER}
        zoom={11}
        minZoom={10}
        maxZoom={18}
        maxBounds={PAMPANGA_BOUNDS}
        maxBoundsViscosity={1.0}   
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}     
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* {pampangaData && (
          <GeoJSON 
            data={pampangaData as any} 
            style={defaultStyle} 
            onEachFeature={onEachFeature} 
          />
        )} */}

      </MapContainer>
    </div>
  );
}