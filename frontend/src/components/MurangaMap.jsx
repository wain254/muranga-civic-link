import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for missing default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const townCoordinates = {
  'murang\'a': [-0.7167, 37.1500], 'kenol': [-0.9667, 37.1333], 'kangema': [-0.6833, 36.9667],
  'kigumo': [-0.7500, 37.0167], 'kandara': [-0.8833, 37.0167], 'mathioya': [-0.6500, 36.9000],
  'gatanga': [-0.9333, 36.9833], 'maragua': [-0.7833, 37.0167]
};

export default function MurangaMap({ requests }) {
  const center = [-0.7167, 37.1500];

  const getCoordinates = (locationString) => {
    const loc = locationString.toLowerCase();
    
    // Check if GPS coordinates were used
    if (loc.includes('lat:')) {
        const parts = loc.replace('lat:', '').split(',lng:');
        if (parts.length === 2) return [parseFloat(parts[0]), parseFloat(parts[1])];
    }

    for (const town in townCoordinates) {
      if (loc.includes(town)) {
        return [townCoordinates[town][0] + (Math.random() - 0.5) * 0.02, townCoordinates[town][1] + (Math.random() - 0.5) * 0.02];
      }
    }
    return [center[0] + (Math.random() - 0.5) * 0.1, center[1] + (Math.random() - 0.5) * 0.1];
  };

  return (
    <div className="h-100 w-full rounded-lg overflow-hidden shadow-md border-2 border-muranga-green z-0 relative">
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {requests.map((req) => {
          const position = getCoordinates(req.location);
          const isCritical = req.priority === 'Urgent';
          
          return (
            <div key={req.id}>
              {/* Heatmap effect (Circles) */}
              <Circle center={position} radius={2000} pathOptions={{ color: isCritical ? 'red' : 'orange', fillColor: isCritical ? 'red' : 'yellow', fillOpacity: 0.3 }} />
              
              {/* Pin Marker */}
              <Marker position={position}>
                <Popup>
                  <div className="text-sm">
                    <strong className={isCritical ? "text-red-600" : "text-yellow-600"}>{isCritical ? '🚨 CRITICAL: ' : '⚠️ MODERATE: '}{req.category}</strong><br/>
                    <span className="text-gray-600">{req.location}</span><br/>
                    <span className="font-bold">Status: {req.status}</span>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}