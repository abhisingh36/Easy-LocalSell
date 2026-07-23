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
  const { listings, wishlist, toggleWishlist, searchQuery, setSearchQuery, filters, setFilters } = useApp();
  const [activeTab, setActiveTab] = useState("nearby");
  const [showMap,   setShowMap]   = useState(true);
  const [loading]                 = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
    // BUG-11 FIX: Old code did `a.id - b.id` which gives NaN on MongoDB ObjectId strings.
    // Now properly sorts by createdAt date descending (newest first).
    else result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return result;
  }, [listings, searchQuery, filters, activeTab]);

  return (
    <div className="page-enter flex flex-col" style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden" }}>
      <Navbar />

      {/* Mobile Categories Bar */}
      <div className="lg:hidden bg-white border-b border-[var(--gray-200)] overflow-x-auto whitespace-nowrap scrollbar-hide px-3 py-0 flex gap-2 items-center shadow-sm">
        {/* Hamburger -> Opens Filters */}
        <button 
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 text-[14px] font-bold text-gray-800 shrink-0 py-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          All
        </button>

        {/* Categories */}
        {["All listings", "Electronics", "Furniture", "Clothing", "Books", "Vehicles", "Sports", "Kitchen"].map((catName) => {
          const isActive = filters.category === catName;
          return (
            <button
              key={catName}
              onClick={(e) => {
                setFilters((prev) => ({ ...prev, category: catName }));
                const container = e.currentTarget.parentElement;
                const button = e.currentTarget;
                const scrollLeft = button.offsetLeft - (container.clientWidth / 2) + (button.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
              }}
              className={`shrink-0 text-[14px] px-3 py-1.5 rounded-md transition-all ${
                isActive 
                  ? "font-bold text-blue-700 bg-blue-50" 
                  : "font-semibold text-gray-600 hover:text-gray-900"
              }`}
            >
              {catName}
            </button>
          );
        })}
      </div>

      {/* Mobile Search Bar — below categories */}
      <div className="lg:hidden px-3 py-2 border-b border-[var(--gray-200)]" style={{background: "var(--white)"}}>
        <div style={{position: "relative", width: "100%"}}>
          <span style={{position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", display: "flex", alignItems: "center"}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search items, categories..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); }}
            className="navbar-search"
            style={{width: "100%", paddingLeft: 32}}
          />
        </div>
      </div>

      <div className="flex relative" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Mobile Backdrop */}
        {showFilters && (
          <div 
            className="fixed inset-0 bg-black/50 md:hidden" 
            style={{ zIndex: 40 }}
            onClick={() => setShowFilters(false)}
          />
        )}
        
        <div 
          className={`lg:block lg:h-full ${showFilters ? "fixed left-0 top-0 bottom-0 w-[280px] pt-[60px] flex flex-col shadow-2xl bg-white lg:relative lg:w-auto lg:pt-0 lg:shadow-none lg:flex-none" : "hidden"}`}
          style={{ zIndex: 45 }}
        >
          <div className="h-full overflow-y-auto lg:overflow-hidden">
            <Sidebar mobileOpen={showFilters} />
          </div>
          {/* Close button inside sidebar on mobile */}
          <div className="p-4 border-t border-[var(--gray-200)] lg:hidden bg-white shrink-0">
            <button className="btn btn-primary btn-w-full" onClick={() => setShowFilters(false)}>
              Apply Filters
            </button>
          </div>
        </div>

        <main className="flex-1 px-3 md:px-6 pt-2 pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-5 min-w-0" style={{ overflowY: "auto", height: "100%" }}>

          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200 mb-2 md:mb-4">
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
          <div className="mb-5 map-section-wrapper">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Nearby on Map</p>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm border border-[var(--gray-200)] md:border-none" onClick={() => setShowMap(v => !v)}>
                  {showMap ? "Hide map" : "Show map"}
                </button>
              </div>
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
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                      {item.sold && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-lg uppercase tracking-wider z-[5]">
                          SOLD
                        </div>
                      )}
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
