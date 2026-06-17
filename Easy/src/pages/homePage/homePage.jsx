import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import Sidebar from "../../components/sidebar/sidebar";
import Map from "../map/Map";
import { useApp } from "../../context/AppContext";

const RADIUS_KM = { "1 km": 1, "2 km": 2, "5 km": 5, "10 km": 10, "20 km": 20 };

function condColor(cond) {
  if (cond === "Like new") return "badge-blue";
  if (cond === "Good")     return "badge-amber";
  return "badge-gray";
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44" />
      <div className="p-3.5">
        <div className="skeleton h-4 w-3/5 mb-2 rounded" />
        <div className="skeleton h-3 w-11/12 mb-2.5 rounded" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-5 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { listings, wishlist, toggleWishlist, searchQuery, filters } = useApp();
  const [activeTab, setActiveTab] = useState("nearby");
  const [showMap,   setShowMap]   = useState(true);
  const [loading]                 = useState(false);

  const filtered = useMemo(() => {
    let result = [...listings];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
      );
    }
    if (filters.category !== "All listings") result = result.filter(l => l.category === filters.category);
    const radiusLimit = RADIUS_KM[filters.radius] || 5;
    result = result.filter(l => l.distance <= radiusLimit);
    result = result.filter(l => filters.conditions.includes(l.condition));
    result = result.filter(l => l.price <= filters.priceMax);
    if (activeTab === "nearby") result.sort((a, b) => a.distance - b.distance);
    else result.sort((a, b) => a.id - b.id).reverse();
    return result;
  }, [listings, searchQuery, filters, activeTab]);

  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 px-6 py-5 min-w-0">

          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200 mb-4">
            {["nearby", "newest"].map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                className={`tab-btn${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "nearby" ? "Nearby" : "Newest first"}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 shrink-0">
              {filtered.length} listing{filtered.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {/* Map section */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Nearby on Map</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMap(v => !v)}>
                {showMap ? "Hide map" : "Show map"}
              </button>
            </div>
            {showMap && <Map />}
          </div>

          {/* Grid header */}
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-base font-bold text-gray-900">
              {filters.category === "All listings" ? "All Listings" : filters.category}
            </p>
            {searchQuery && (
              <span className="text-xs text-gray-500">
                Results for "<strong className="text-gray-700">{searchQuery}</strong>"
              </span>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="listing-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-gray-600 mb-1.5">No listings found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="listing-grid">
              {filtered.map(item => {
                const isWished = wishlist.includes(item.id);
                return (
                  <div
                    key={item.id}
                    id={`listing-card-${item.id}`}
                    className="listing-card"
                    onClick={() => navigate(`/listing?id=${item.id}`)}
                  >
                    {/* Image */}
                    <div className="h-44 relative overflow-hidden bg-gray-100">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                      <button
                        id={`wishlist-${item.id}`}
                        className="wishlist-btn-overlay"
                        onClick={e => { e.stopPropagation(); toggleWishlist(item.id); }}
                      >
                        <svg width="13" height="13" fill={isWished ? "#ef4444" : "none"} stroke={isWished ? "#ef4444" : "#9ca3af"} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <span className="listing-cat-label">{item.category}</span>
                    </div>

                    {/* Info */}
                    <div className="px-3.5 py-3">
                      <p className="text-lg font-bold text-gray-900 mb-1">{item.priceLabel}</p>
                      <p className="text-sm text-gray-500 mb-2.5 truncate">{item.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{item.distLabel}</span>
                        <span className={`badge ${condColor(item.condition)}`}>{item.condition}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}