import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context/AppContext";

// Fix Leaflet default icon broken in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_POS = [26.8467, 80.9462]; // Hazratganj, Lucknow

/* ── Fixes blank map: calls invalidateSize after mount ── */
function MapInit() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 400);
  }, [map]);
  return null;
}

/* ── Listens for map clicks ── */
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

/* ── Flies to a new position imperatively ── */
function FlyController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.8 });
  }, [target]);
  return null;
}

export default function LocationModal() {
  const {
    showLocationModal, setShowLocationModal,
    userLocation, setUserLocation, showToast,
  } = useApp();

  const [pin, setPin] = useState(userLocation?.coords || DEFAULT_POS);
  const [label, setLabel] = useState(userLocation?.name);
  const [search, setSearch] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Reset state every time modal opens
  useEffect(() => {
    if (showLocationModal) {
      setSearch(""); setSuggestions([]); setShowSug(false);
      setLabel(userLocation.name);
      setPin(userLocation.coords || DEFAULT_POS); setFlyTarget(null);
    }
  }, [showLocationModal, userLocation]);

  // ESC closes modal
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setShowLocationModal(false); }
    if (showLocationModal) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showLocationModal, setShowLocationModal]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = showLocationModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLocationModal]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleOut(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    if (!search.trim() || search.length < 2) { setSuggestions([]); setShowSug(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSug(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(search)}&lat=${DEFAULT_POS[0]}&lon=${DEFAULT_POS[1]}&limit=15`
        );
        const json = await res.json();

        const mapped = (json.features || []).map(f => {
          const p = f.properties;
          const primaryName = p.name || p.street || p.locality || p.city || p.county || "Unknown";
          const subParts = [p.district, p.city, p.state].filter(x => x && x !== primaryName);
          const display_name = primaryName + (subParts.length > 0 ? ", " + subParts.join(", ") : "");

          return {
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            display_name: display_name,
            address: {
              suburb: p.district || p.locality,
              town: p.city,
              village: p.village,
              neighbourhood: p.neighbourhood
            },
            _rawName: primaryName
          };
        });

        // Deduplicate by name
        const unique = [];
        const seen = new Set();
        for (const item of mapped) {
          const nm = item._rawName.toLowerCase();
          if (!seen.has(nm)) {
            seen.add(nm);
            unique.push(item);
          }
        }

        const finalSug = unique.slice(0, 6);
        setSuggestions(finalSug);
        setShowSug(finalSug.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSug(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Pick a suggestion
  function pickSuggestion(item) {
    const newPos = [parseFloat(item.lat), parseFloat(item.lon)];
    const place =
      item.address?.suburb ||
      item.address?.neighbourhood ||
      item.address?.village ||
      item.address?.town ||
      item.display_name.split(",")[0];
    setPin(newPos);
    setLabel(place);
    setFlyTarget(newPos);
    setSearch(place);
    setShowSug(false);
    setSuggestions([]);
  }

  // Map click → reverse geocode
  const handleMapClick = useCallback(async (latlng) => {
    const newPos = [latlng.lat, latlng.lng];
    setPin(newPos);
    setShowSug(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=en`
      );
      const data = await res.json();
      const place =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.village ||
        data.address?.town ||
        data.address?.city ||
        data.display_name?.split(",")[0] ||
        "Selected location";
      setLabel(place);
      setSearch(place);
    } catch {
      setLabel("Selected location");
    }
  }, []);

  function handleConfirm() {
    setUserLocation({ name: label, radius: userLocation.radius, coords: pin });
    setShowLocationModal(false);
    showToast(`Location set: ${label}`, "success");
  }

  if (!showLocationModal) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={() => setShowLocationModal(false)} />

      {/* Modal */}
      <div className="modal-wrap">
        <div className="loc-map-card">

          {/* Header */}
          <div className="loc-map-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" fill="none" stroke="var(--blue-600)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--gray-900)" }}>
                Choose your location
              </span>
            </div>
            <button className="modal-close" onClick={() => setShowLocationModal(false)}>✕</button>
          </div>

          {/* Search bar with autocomplete */}
          <div className="loc-search-bar" ref={wrapRef}>
            <div style={{ position: "relative", flex: 1 }}>
              {/* Search icon */}
              <span className="loc-search-icon">
                {loadingSug
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                      style={{ animation: "spin 1s linear infinite", transformOrigin: "center" }} />
                  </svg>
                  : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                }
              </span>

              <input
                id="loc-map-search"
                type="text"
                placeholder="Search area, locality..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                className="input input-sm loc-search-input"
                autoComplete="off"
              />

              {/* Suggestions dropdown */}
              {showSug && suggestions.length > 0 && (
                <div className="loc-suggestions">
                  {suggestions.map((item, i) => {
                    const name =
                      item.address?.suburb ||
                      item.address?.neighbourhood ||
                      item.address?.village ||
                      item.address?.town ||
                      item.display_name.split(",")[0];
                    const sub = item.display_name.split(",").slice(1, 3).join(",").trim();
                    return (
                      <button
                        key={i}
                        className="loc-sug-item"
                        onMouseDown={() => pickSuggestion(item)}
                      >
                        <svg width="12" height="12" fill="none" stroke="var(--gray-400)" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                        </svg>
                        <span style={{ minWidth: 0 }}>
                          <span className="loc-sug-name">{name}</span>
                          {sub && <span className="loc-sug-sub">{sub}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div style={{ position: "relative", flexShrink: 0, padding: "0 20px" }}>
            <MapContainer
              key={String(showLocationModal)}
              center={userLocation.coords || DEFAULT_POS}
              zoom={14}
              scrollWheelZoom={true}
              className="loc-modal-map"
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapInit />
              <ClickHandler onMapClick={handleMapClick} />
              {flyTarget && <FlyController target={flyTarget} />}
              {pin && <Marker position={pin} />}
            </MapContainer>

          </div>

          {/* Footer */}
          <div className="loc-map-footer">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 2 }}>Selected location</p>
              <p style={{
                fontSize: 13, fontWeight: 600, color: "var(--gray-900)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {label || "—"}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!label}
              style={{ flexShrink: 0 }}
            >
              Apply
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
