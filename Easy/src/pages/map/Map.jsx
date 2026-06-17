import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context/AppContext";

// Fix Leaflet default icon broken in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Demo listing markers near Hazratganj, Lucknow
const MARKERS = [
  { pos: [26.8467, 80.9462], label: "Sony Headphones",  price: "₹5,500"  },
  { pos: [26.8510, 80.9500], label: "iPhone 12 Pro",    price: "₹42,000" },
  { pos: [26.8430, 80.9400], label: "Wooden Chair",     price: "₹3,200"  },
  { pos: [26.8550, 80.9380], label: "Trek MTB Bike",    price: "₹12,000" },
  { pos: [26.8490, 80.9570], label: "Dell Laptop",      price: "₹28,000" },
];

const RADIUS_MAP = { "1 km": 1000, "2 km": 2000, "5 km": 5000, "10 km": 10000, "20 km": 20000 };

/* ── Auto-fit map to radius circle whenever center or radius changes ── */
/* ── Calculates exact fractional zoom so circle diameter = map height ── */
function FitToRadius({ center, radiusM }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !radiusM) return;
    const lat_rad   = center[0] * Math.PI / 180;
    const R         = 6378137; // Earth radius in metres
    const mapHeight = map.getSize().y;           // actual pixel height
    const targetPx  = (mapHeight / 2) - 4;       // circle radius in px (4px edge gap)
    // Web Mercator: metersPerPixel = (2π·R·cos(lat)) / (256 · 2^zoom)
    const zoom = Math.log2(
      (2 * Math.PI * R * Math.cos(lat_rad)) / (256 * (radiusM / targetPx))
    );
    map.setView(center, zoom, { animate: true });
  }, [center?.[0], center?.[1], radiusM]);
  return null;
}

const Map = () => {
  const { userLocation, filters } = useApp();
  const center  = userLocation.coords || [26.8467, 80.9462];
  const radiusM = RADIUS_MAP[filters.radius] || 5000;

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <MapContainer
        center={center}
        zoom={14}
        zoomSnap={0}
        zoomDelta={0.5}
        scrollWheelZoom={false}
        style={{ height: "280px", width: "100%" }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radius circle */}
        <Circle
          center={center}
          radius={radiusM}
          pathOptions={{
            color:       "#0284c7",
            fillColor:   "#0ea5e9",
            fillOpacity: 0.08,
            weight:      2,
            dashArray:   "6 4",
          }}
        />

        {/* Centre marker (user location) */}
        <Marker position={center}>
          <Popup>
            <strong style={{ fontSize: 13 }}>{userLocation.name}</strong>
            <br />
            <span style={{ color: "#0284c7", fontWeight: 600, fontSize: 12 }}>
              Your location · {filters.radius}
            </span>
          </Popup>
        </Marker>

        {/* Listing markers */}
        {MARKERS.map((m, i) => (
          <Marker key={i} position={m.pos}>
            <Popup>
              <strong style={{ fontSize: 13 }}>{m.label}</strong>
              <br />
              <span style={{ color: "#0284c7", fontWeight: 700 }}>{m.price}</span>
            </Popup>
          </Marker>
        ))}

        {/* Auto-fit to radius whenever it changes */}
        <FitToRadius center={center} radiusM={radiusM} />
      </MapContainer>
    </div>
  );
};

export default Map;
