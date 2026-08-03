import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import Sidebar from "../../components/sidebar/sidebar";
import Map from "../map/Map";
import { useApp } from "../../context/AppContext";
import { CATEGORY_ICONS } from "../../utils/categoryIcons";

const RADIUS_KM = { "1 km": 1, "2 km": 2, "5 km": 5, "10 km": 10, "20 km": 20 };

function condColor(cond) {
  if (cond === "New") return "badge-green";
  if (cond === "Like new") return "badge-blue";
  if (cond === "Good") return "badge-amber";
  if (cond === "Fair") return "badge-orange";
  if (cond === "For parts") return "badge-purple";
  return "badge-gray";
}

function SkeletonCard() {
  return (
    <div className="listing-card overflow-hidden">
      {/* Image area — matches actual card's aspect-[16/9] */}
      <div className="skeleton aspect-[16/9] w-full" style={{ borderRadius: 0 }} />
      {/* Info area — matches actual card's px-3 py-2 */}
      <div className="px-3 py-2">
        {/* Price line — text-lg font-bold */}
        <div className="skeleton h-5 w-2/5 mb-1 rounded" />
        {/* Title line — text-sm */}
        <div className="skeleton h-3.5 w-4/5 mb-2 rounded" />
        {/* Bottom row: distance + badge */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-5 w-1/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { listings, listingsLoading, wishlist, toggleWishlist, searchQuery, setSearchQuery, filters, setFilters, userLocation, currentUser, triggerLoginModal } = useApp();
  const getInitialShowMap = () => {
    try {
      const saved = localStorage.getItem("showMap");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  };

  const [activeTab, setActiveTab] = useState("nearby");
  const [showMap, setShowMap] = useState(getInitialShowMap);

  useEffect(() => {
    localStorage.setItem("showMap", JSON.stringify(showMap));
  }, [showMap]);

  const [showFilters, setShowFilters] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

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
    if (activeTab === "my_listings") {
      const uId = currentUser?._id || currentUser?.id;
      result = result.filter(l => l.sellerId === uId);
    }

    if (activeTab === "nearby") result.sort((a, b) => a.distance - b.distance);
    // BUG-11 FIX: Old code did `a.id - b.id` which gives NaN on MongoDB ObjectId strings.
    // Now properly sorts by createdAt date descending (newest first).
    else result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return result;
  }, [listings, searchQuery, filters, activeTab, currentUser]);

  return (
    <div className="page-enter fixed inset-0 flex flex-col" style={{ background: "var(--bg)", zIndex: 10 }}>
      <Navbar />

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-3 py-2 border-b border-[var(--gray-200)]" style={{ background: "var(--white)" }}>
        <div style={{ position: "relative", width: "100%" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", display: "flex", alignItems: "center" }}>
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
            style={{ width: "100%", paddingLeft: 32 }}
          />
        </div>
      </div>

      {/* Mobile Categories Bar */}
      <div className="lg:hidden bg-white border-b border-[var(--gray-200)] overflow-x-auto whitespace-nowrap scrollbar-hide px-3 py-1.5 flex gap-2 items-center shadow-sm">
        {/* Hamburger -> Opens Filters */}
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1 text-[12.5px] font-semibold text-gray-800 shrink-0 py-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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
              className={`shrink-0 flex items-center gap-1.5 text-[12.5px] px-2.5 py-1 rounded-md transition-all ${isActive
                ? "font-semibold text-blue-700 bg-blue-50"
                : "font-medium text-gray-600 hover:text-gray-900"
                }`}
            >
              <span className={`flex items-center justify-center ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                {CATEGORY_ICONS[catName]}
              </span>
              {catName}
            </button>
          );
        })}
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
          <div className="flex items-center border-b border-gray-200 mb-2 md:mb-4 overflow-x-auto scrollbar-hide shrink-0">
            {["nearby", "newest", "my_listings"].map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                className={`tab-btn shrink-0 ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  if (tab === "my_listings" && !currentUser) {
                    triggerLoginModal();
                    return;
                  }
                  setActiveTab(tab);
                }}
              >
                {tab === "nearby" ? "Nearby" : tab === "newest" ? "Newest" : "My Listing"}
              </button>
            ))}
            <span className="ml-auto pl-2 text-[11px] sm:text-xs text-gray-400 shrink-0">
              {filtered.length} found
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
            <div className="relative" style={{ pointerEvents: mapModalOpen ? 'auto' : 'none' }}>
              {showMap && (
                <>
                  <Map />
                  {/* Clickable overlay on mobile to open full screen map */}
                  <div 
                    className="absolute inset-0 z-[1000] cursor-pointer"
                    style={{ display: 'var(--map-overlay-display, none)', pointerEvents: 'auto' }}
                    onClick={() => setMapModalOpen(true)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Centered Interactive Map Modal */}
          {mapModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}>
              <div
                className="rounded-2xl overflow-hidden flex flex-col w-full max-w-lg shadow-2xl h-[75vh]"
                style={{
                  backgroundColor: 'var(--white)',
                  border: '2px solid var(--gray-300)',
                  boxShadow: '0 24px 48px -8px rgba(0,0,0,0.25), 0 0 0 1px var(--gray-200)'
                }}
              >
                {/* Header */}
                <div
                  className="px-5 py-4 flex justify-between items-center shrink-0"
                  style={{ borderBottom: '2px solid var(--gray-200)' }}
                >
                  <h2 className="text-base font-bold" style={{ color: 'var(--gray-900)' }}>
                    Interactive Map
                  </h2>
                  <button
                    onClick={() => setMapModalOpen(false)}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', padding: 0,
                      backgroundColor: 'var(--gray-200)',
                      border: '1.5px solid var(--gray-300)',
                      color: 'var(--gray-800)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Radius Pills */}
                <div
                  className="px-5 py-3 shrink-0 flex flex-wrap items-center gap-2"
                   style={{ borderBottom: '2px solid var(--gray-200)', backgroundColor: 'var(--white)' }}
                >
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
                    Radius
                  </span>
                  {Object.keys(RADIUS_KM).map(r => {
                    const isActive = filters.radius === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setFilters(prev => ({ ...prev, radius: r }))}
                        className="text-sm font-medium transition-all"
                        style={{
                          padding: '5px 16px',
                          borderRadius: 99,
                          border: `1.5px solid ${isActive ? 'var(--blue-600)' : 'var(--gray-200)'}`,
                          backgroundColor: isActive ? 'var(--blue-600)' : 'transparent',
                          color: isActive ? '#fff' : 'var(--gray-900)',
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                {/* Map */}
                <div className="flex-1 w-full relative min-h-0" style={{ backgroundColor: 'var(--gray-100)' }}>
                  <Map interactive={true} fullScreen={true} className="" />
                </div>
              </div>
            </div>
          )}

          {/* Grid header */}
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center [&>svg]:w-[1.2em] [&>svg]:h-[1.2em] [&>svg]:stroke-[2.5]">
                {CATEGORY_ICONS[filters.category]}
              </span>
              {filters.category === "All listings" ? "All Listings" : filters.category}
            </p>
            {searchQuery && (
              <span className="text-xs text-gray-500">
                Results for "<strong className="text-gray-700">{searchQuery}</strong>"
              </span>
            )}
          </div>

          {/* Grid */}
          {listingsLoading && listings.length === 0 ? (
            <div className="listing-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-gray-600 mb-1.5">No listings found in {userLocation?.name || "your location"}</p>
              <p className="text-sm text-gray-400">Try another location or adjust your filters</p>
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
                    <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
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
                      {!(currentUser && (item.sellerId === currentUser._id || item.sellerId === currentUser.id)) && (
                        <button
                          id={`wishlist-${item.id}`}
                          className="wishlist-btn-overlay"
                          style={{ zIndex: 10, top: "8px", right: "8px", width: "28px", height: "28px", background: "transparent", border: "none", boxShadow: "none" }}
                          onClick={e => { e.stopPropagation(); toggleWishlist(item.id); }}
                        >
                          <svg width="22" height="22" fill={isWished ? "#ef4444" : "none"} stroke={isWished ? "#ef4444" : "#ffffff"} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      )}
                      <span className="listing-cat-label">{item.category}</span>
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2">
                      <p className="text-lg font-bold text-gray-900 mb-0.5">{item.priceLabel}</p>
                      <p className="text-sm text-gray-500 mb-1.5 truncate">{item.title}</p>
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
