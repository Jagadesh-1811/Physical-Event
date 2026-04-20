import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  center: { lat: number; lng: number };
  density: number[];
  venueName: string;
}

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({ center, density, venueName }) => {
  const position: [number, number] = [center.lat, center.lng];

  return (
    <div className="w-full h-full min-h-[350px] relative rounded-xl overflow-hidden glass border border-sky-500/30">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={position} />
        <Marker position={position}>
          <Popup>
            <div className="font-mono text-xs">
              <p className="font-bold text-sky-600">{venueName}</p>
              <p className="opacity-60">Status: Monitoring Sync</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Visual Crowd Zones using Circles based on density array */}
        {density.slice(0, 5).map((d, i) => {
          // Offsetting circles slightly from the center to simulate sector coverage
          const offset = 0.002;
          const latOffset = Math.sin((i * 2 * Math.PI) / 5) * offset;
          const lngOffset = Math.cos((i * 2 * Math.PI) / 5) * offset;
          return (
            <Circle
              key={i}
              center={[center.lat + latOffset, center.lng + lngOffset]}
              radius={100 + (d * 50)}
              pathOptions={{ 
                fillColor: d > 0.8 ? '#fb923c' : '#38bdf8', 
                color: 'transparent',
                fillOpacity: 0.4 + (d * 0.2)
              }}
            />
          );
        })}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] glass px-3 py-2 rounded-lg pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-400"></div>
            <span className="text-[10px] text-white/60 uppercase">Normal Density</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-[10px] text-white/60 uppercase">High Surge</span>
          </div>
        </div>
      </div>
      
      {/* HUD Info */}
      <div className="absolute top-4 right-4 z-[1000] glass px-4 py-2 rounded-lg pointer-events-none">
        <div className="text-[10px] text-sky-400 font-mono flex items-center gap-2 uppercase">
          <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div>
          Live OSM Feed
        </div>
      </div>
    </div>
  );
};
