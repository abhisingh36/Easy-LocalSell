import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";
import { fetchListingById, fetchUserProfile, createReviewAPI } from "../../services/api";

function condBadge(cond) {
  if (cond === "Like new") return "badge-blue";
  if (cond === "Good")     return "badge-amber";
  return "badge-gray";
}

function Stars({ count }) {
  const filled = Math.max(0, Math.min(5, Math.round(count)));
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" fill={s <= filled ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

const CATEGORIES = ["Electronics","Furniture","Clothing","Books","Vehicles","Sports","Kitchen"];
const CONDITIONS  = ["New","Like new","Good","Fair","For parts"];

export default function Listing() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { wishlist, toggleWishlist, startChat, showToast, isLoggedIn, triggerLoginModal, listings, currentUser, updateListing, deleteListing } = useApp();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerStats, setSellerStats] = useState(null);
  const [sellerStatsLoading, setSellerStatsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [togglingSold, setTogglingSold] = useState(false);
  const loadedIdRef = useRef(null);

  // Rate Seller modal
  const [showRateModal, setShowRateModal]     = useState(false);
  const [rateStars,     setRateStars]         = useState(5);
  const [rateHover,     setRateHover]         = useState(0);
  const [rateText,      setRateText]          = useState("");
  const [rateLoading,   setRateLoading]       = useState(false);
  const [rateError,     setRateError]         = useState("");
  const [rateSuccess,   setRateSuccess]       = useState(false);

  const handleToggleSold = async () => {
    if (togglingSold) return;
    setTogglingSold(true);
    try {
      const success = await updateListing(p.id, { sold: !p.sold });
      if (success) {
        showToast(p.sold ? "Marked as available!" : "Marked as sold!", "success");
        setP(prev => ({ ...prev, sold: !prev.sold }));
      }
    } finally {
      setTogglingSold(false);
    }
  };

  const handleDeleteListing = async () => {
    setShowDeleteConfirm(false);
    const success = await deleteListing(p.id);
    if (success) {
      showToast("Listing deleted successfully!", "info");
      navigate("/profile");
    }
  };

  // Load listing — first check local state, then fetch from API
  useEffect(() => {
    const rawId = searchParams.get("id");
    if (!rawId) return;

    // If this listing is already loaded (same ID), don't overwrite it
    // This prevents context re-renders from replacing API-fetched data with stale local data
    if (loadedIdRef.current === rawId && p !== null) {
      return;
    }

    // Check if listing is already in local context state
    const found = listings.find(x => x.id === rawId);
    if (found && loadedIdRef.current !== rawId) {
      setP(found);
      setLoading(false);
      loadedIdRef.current = rawId;
      // Still fetch from API in background to get full/fresh data
      fetchListingById(rawId)
        .then(mapped => {
          setP(mapped);
          loadedIdRef.current = rawId;
        })
        .catch(() => {/* silently keep context data if API fails */});
      return;
    }

    if (loadedIdRef.current === rawId) return;

    // Not in local state — fetch directly from API
    setLoading(true);
    fetchListingById(rawId)
      .then(mapped => {
        setP(mapped);
        setLoading(false);
        loadedIdRef.current = rawId;
      })
      .catch(err => {
        console.error("Error fetching listing details:", err);
        showToast("Could not load listing details", "danger");
        setLoading(false);
      });
  }, [searchParams, showToast]);

  // Fetch seller stats whenever the listing changes and has a valid sellerId
  useEffect(() => {
    if (!p) return;
    const sellerId = p.sellerId;
    // sellerId must be a valid 24-char MongoDB ObjectId string
    if (!sellerId || typeof sellerId !== "string" || !/^[a-f\d]{24}$/i.test(sellerId)) return;

    setSellerStatsLoading(true);
    fetchUserProfile(sellerId)
      .then(profile => setSellerStats(profile.stats))
      .catch(err => console.warn("Could not load seller stats:", err.message))
      .finally(() => setSellerStatsLoading(false));
  }, [p?.sellerId]);

  const [activeThumb, setActiveThumb] = useState(0);
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Modal & Zoom states
  const [showImageModal, setShowImageModal] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  function openImageModal() {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
    setShowImageModal(true);
  }

  const thumbs    = p ? (p.thumbs && p.thumbs.length > 0 ? p.thumbs : [p.img]) : [];
  const totalThumbs = thumbs.length;
  const activeImg = thumbs[activeThumb] || (p ? p.img : "");
  const isWished  = p ? wishlist.includes(p.id) : false;
  const sellerListings = p ? listings.filter(l => (l.sellerId === p.sellerId || l.seller === p.seller) && l.id !== p.id) : [];
  const related   = p ? listings.filter(l => l.category === p.category && l.id !== p.id).slice(0, 4) : [];
  // BUG-07 FIX: Removed `p.seller === currentUser.name` — checking ownership by name
  // is unsafe (users with the same name would see Edit/Delete/Mark Sold controls on
  // listings they don't own). Always use IDs for ownership checks.
  const isOwnListing = p && currentUser && (
    p.sellerId === currentUser._id || p.sellerId === currentUser.id
  );

  async function handleMessageSeller() {
    if (isLoggedIn) {
      const convId = await startChat(p);
      if (convId) navigate(`/messages?conv=${convId}`);
    } else {
      triggerLoginModal("Please log in to message the seller.");
    }
  }

  async function handleRateSeller(e) {
    e.preventDefault();
    if (!rateText.trim()) { setRateError("Please write something."); return; }
    if (!isLoggedIn) { triggerLoginModal("Please log in to leave a review."); return; }
    setRateLoading(true); setRateError("");
    try {
      await createReviewAPI({
        reviewerId:   currentUser._id || currentUser.id,
        reviewerName: currentUser.name,
        sellerId:     p.sellerId,
        listingId:    p.id,
        rating:       rateStars,
        text:         rateText.trim(),
      });
      setRateSuccess(true);
      // Refresh seller stats so rating updates in UI
      if (p.sellerId && /^[a-f\d]{24}$/i.test(p.sellerId)) {
        fetchUserProfile(p.sellerId)
          .then(pr => setSellerStats(pr.stats))
          .catch(() => {});
      }
    } catch (err) {
      setRateError(err.data?.message || err.message || "Failed to submit. Please try again.");
    } finally {
      setRateLoading(false);
    }
  }

  if (loading || !p) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg)"}}>
        <div className="text-gray-500 text-lg font-medium">Loading listing details...</div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen" style={{background:"var(--bg)"}}>
      <Navbar />

      {/* Page body */}
      <div className="max-w-[1440px] mx-auto px-4 py-5">

        {/* Breadcrumb */}
        <div className="flex items-center flex-wrap gap-1.5 text-sm text-gray-500 mb-4 font-medium">
          <span onClick={() => navigate("/home")} className="cursor-pointer text-gray-500 hover:text-blue-600">Browse</span>
          <span className="text-gray-300">›</span>
          <span onClick={() => navigate("/home")} className="cursor-pointer text-gray-500 hover:text-blue-600">{p.category}</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-500">{p.title.split("—")[0].trim()}</span>
        </div>

        {/* Main two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* Main image */}
            <div className="rounded-xl overflow-hidden mb-2.5 relative w-full aspect-[4/3] sm:aspect-auto sm:h-[360px] lg:h-[420px]" style={{background:"#111"}}>
              {p.sold && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.65)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  zIndex: 2,
                  pointerEvents: "none"
                }}>
                  Sold
                </div>
              )}

              {/* Blurred background — fills side gaps */}
              <img
                src={activeImg}
                aria-hidden="true"
                style={{
                  position:"absolute", inset:0, width:"100%", height:"100%",
                  objectFit:"cover", filter:"blur(22px)", transform:"scale(1.08)",
                  opacity:0.75,
                }}
              />

              {/* Actual image — full, uncropped */}
              <img
                src={activeImg}
                alt={p.title}
                onClick={openImageModal}
                style={{
                  position:"absolute", inset:0, width:"100%", height:"100%",
                  objectFit:"contain", display:"block", zIndex:1, cursor:"pointer"
                }}
              />

              {activeThumb > 0 && (
                <button className="listing-nav-btn left-2.5" onClick={() => setActiveThumb(t => t-1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              {activeThumb < totalThumbs - 1 && (
                <button className="listing-nav-btn right-2.5" onClick={() => setActiveThumb(t => t+1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              )}

            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mb-5">
              {thumbs.map((img, i) => (
                <button key={i} id={`thumb-${i}`} onClick={() => img && setActiveThumb(i)}
                  className={`flex-1 h-[72px] rounded-lg overflow-hidden flex items-center justify-center p-0 transition-colors border-[1.5px] ${i===activeThumb ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50"} ${img ? "cursor-pointer" : "cursor-default"}`}>
                  {img
                    ? <img src={img} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-gray-300 text-xl">+</span>
                  }
                </button>
              ))}
            </div>

            {/* Price & Title */}
            <div className="mb-3.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-3xl font-extrabold text-gray-900">{p.priceLabel}</span>
                <span className="text-sm text-gray-400 line-through">{p.originalPrice}</span>
                <span className={`badge ${condBadge(p.condition)}`}>{p.condition}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2.5 leading-snug">{p.title}</h1>
              <div className="flex gap-1.5 flex-wrap">
                {[p.category, p.location, p.distLabel, p.listedAgo].map(tag => (
                  <span key={tag} className="badge badge-gray text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card px-4 py-3.5 mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
            </div>

            {/* Details table */}
            <div className="card px-4 py-4 mb-6">
              <p className="text-sm font-bold text-gray-700 mb-3.5">Item details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                {/* BUG-20 FIX: Filter out empty values so blank rows don't render */}
                {[["Brand",p.brand],["Model",p.model],["Age",p.age],["Original price",p.originalPrice],["Colour",p.colour],["Warranty",p.warranty]]
                  .filter(([, value]) => value && String(value).trim())
                  .map(([label,value]) => (
                  <div key={label} className="detail-cell">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: Seller Card + Related ── */}
          <div className="w-full lg:w-[400px] shrink-0" style={{position:"sticky", top:"70px", alignSelf:"start"}}>
            <div className="card p-5 mb-4">

              {/* Seller */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                    {p.sellerInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.seller}</p>
                    <p className="text-xs text-gray-400">
                      Member since {sellerStats?.memberSince ?? "—"}
                    </p>
                  </div>
                </div>
                {!isOwnListing && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowSellerModal(true)}>View</button>
                )}
              </div>

              {/* Rating row — dynamic */}
              {!isOwnListing && (
                <div className="flex items-center gap-1 mb-3">
                  {sellerStats?.rating != null ? (
                    <>
                      <Stars count={sellerStats.rating} />
                      <span className="text-sm font-semibold text-gray-900 ml-1">
                        {sellerStats.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        · {sellerStats.reviews} review{sellerStats.reviews !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      {sellerStatsLoading ? "Loading…" : "No reviews yet"}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="seller-stats-grid">
                {[
                  [sellerStatsLoading ? "…" : (sellerStats?.sold ?? "—"), "sold"],
                  [sellerStatsLoading ? "…" : (sellerStats?.active ?? "—"), "active"],
                  [sellerStatsLoading ? "…" : (sellerStats?.response ?? "—"), "response"],
                ].map(([val, label]) => (
                  <div key={label}>
                    <p className={`text-lg font-bold ${label === "response" ? "text-blue-600" : "text-gray-900"}`}>{val}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                {isOwnListing ? (
                  <>
                     <button id="mark-sold-btn" className={`btn btn-w-full rounded-lg justify-center ${p.sold ? "btn-secondary" : "btn-primary bg-green-600 hover:bg-green-700 text-white border-0"}`} onClick={handleToggleSold} disabled={togglingSold}>
                      {togglingSold ? "Updating..." : p.sold ? "Mark as Available" : "Mark as Sold"}
                    </button>
                    <button id="edit-listing-btn" className="btn btn-secondary btn-w-full rounded-lg justify-center" onClick={() => navigate("/post", { state: { editListing: p } })}>
                      Edit Listing
                    </button>
                    <button id="delete-listing-btn" className="btn btn-danger btn-w-full rounded-lg justify-center" onClick={() => setShowDeleteConfirm(true)}>
                      Delete Listing
                    </button>
                  </>
                ) : (
                  <>
                    <button id="message-seller-btn" className="btn btn-primary btn-w-full rounded-lg justify-center" onClick={handleMessageSeller}>
                      Message seller
                    </button>
                    <button id="wishlist-btn"
                      className={`btn btn-w-full rounded-lg justify-center${isWished ? " btn-danger" : " btn-secondary"}`}
                      onClick={() => toggleWishlist(p.id)}>
                      {isWished ? "Saved to wishlist" : "Save to wishlist"}
                    </button>
                    {/* Rate Seller — only for logged-in non-owners */}
                    {isLoggedIn && p.sellerId && (
                      <button id="rate-seller-btn"
                        className="btn btn-secondary btn-w-full rounded-lg justify-center gap-1.5"
                        onClick={() => { setShowRateModal(true); setRateSuccess(false); setRateError(""); setRateText(""); setRateStars(5); }}>
                        <svg width="14" height="14" fill="#f59e0b" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        Rate Seller
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="safety-tip">
                Meet in a public place. Inspect before paying. Never share OTPs or bank details.
              </div>
            </div>

            {/* Related listings — below seller card */}
            {related.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">More in {p.category}</p>
                <div className="flex flex-col gap-3">
                  {related.map(item => (
                    <div key={item.id} className="related-card" onClick={() => navigate(`/listing?id=${item.id}`)}>
                      <div className="flex gap-3 p-2.5 items-center">
                        <div className="w-[72px] h-[72px] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-0.5">{item.priceLabel}</p>
                          <p className="text-xs text-gray-500 truncate">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Image Modal Overlay */}
      {showImageModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999,
          display: "flex", flexDirection: "column"
        }}>
          <div style={{ 
            padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "linear-gradient(rgba(0,0,0,0.7), transparent)", zIndex: 10000
          }}>
            <span style={{ color: "white", fontWeight: "600", fontSize: 18 }}>{p.title}</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "white", border: "none", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} 
                onClick={() => setZoomScale(s => Math.max(0.5, s - 0.5))}
              >
                -
              </button>
              <button 
                style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "white", border: "none", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} 
                onClick={() => setZoomScale(s => Math.min(5, s + 0.5))}
              >
                +
              </button>
              <button 
                style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "white", border: "none", fontSize: 20, cursor: "pointer", marginLeft: 16, display: "flex", alignItems: "center", justifyContent: "center" }} 
                onClick={() => setShowImageModal(false)}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div 
            style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: isDragging ? "grabbing" : "grab" }}
            onWheel={(e) => {
              if (e.deltaY < 0) setZoomScale(s => Math.min(5, s + 0.25));
              else setZoomScale(s => Math.max(0.5, s - 0.25));
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <img 
              src={activeImg} 
              alt={p.title}
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
                maxWidth: "90vw",
                maxHeight: "85vh",
                objectFit: "contain",
                userSelect: "none"
              }}
            />
          </div>
        </div>
      )}

      {/* Seller Profile Modal */}
      {showSellerModal && (
        <>
          {/* Overlay */}
          <div className="modal-overlay" onClick={() => setShowSellerModal(false)} />
          
          {/* Modal */}
          <div className="modal-wrap">
            <div className="modal-card shadow-lg" style={{ maxWidth: "520px" }}>
              <div className="modal-body p-4 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3 sm:mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400 shrink-0 border-2 border-blue-200 dark:border-blue-900">
                      {p.sellerInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {p.seller}
                        <span className="flex items-center justify-center bg-blue-500 text-white rounded-full p-0.5" title="Verified Seller" style={{ width: 16, height: 16 }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Member since {sellerStats?.memberSince ?? "—"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Stars count={sellerStats?.rating ? Math.round(sellerStats.rating) : 4}/>
                        <span className="text-xs font-semibold text-gray-800 ml-1">
                          {sellerStats?.rating ?? "4.8"}
                        </span>
                        <span className="text-xs text-gray-400">
                          · {sellerStats?.reviews ?? "—"} reviews
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="modal-close w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors" onClick={() => setShowSellerModal(false)}>✕</button>
                </div>
                
                <div className="divider my-3 sm:my-4"></div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center bg-gray-50 dark:bg-gray-200/50 border border-gray-200 dark:border-gray-300 rounded-xl p-3 sm:p-4 mb-3 sm:mb-5">
                  <div>
                    <p className="text-xl font-extrabold text-gray-900">
                      {sellerStatsLoading ? "…" : (sellerStats?.sold ?? "—")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">sold</p>
                  </div>
                  <div className="border-x border-gray-200 dark:border-gray-300">
                    <p className="text-xl font-extrabold text-gray-900">
                      {sellerStatsLoading ? "…" : (sellerStats?.active ?? "—")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">active</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                      {sellerStatsLoading ? "…" : (sellerStats?.response ?? "—")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">response</p>
                  </div>
                </div>

                {/* Verified Badges */}
                <div className="mb-3 sm:mb-5">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 text-left">Trust & Verification</p>
                  <div className="flex flex-wrap gap-2">
                    {["Phone Verified", "Email Verified", "ID Verified"].map(badge => (
                      <span key={badge} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Response speed & Active Status */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-5 text-left">
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-200/50 rounded-xl border border-gray-200 dark:border-gray-300">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Response Speed</p>
                    <p className="text-sm font-bold text-gray-800">Replies within 1 hr</p>
                  </div>
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-200/50 rounded-xl border border-gray-200 dark:border-gray-300">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Activity status</p>
                    <p className="text-sm font-bold text-gray-800">Active 10 mins ago</p>
                  </div>
                </div>

                {/* Other listings from this seller */}
                <div className="text-left mb-4 sm:mb-6">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Other listings from {p.seller}</p>
                  {sellerListings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No other listings from this seller.</p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {sellerListings.map(item => (
                        <div 
                          key={item.id} 
                          className="w-[150px] shrink-0 border border-gray-200 dark:border-gray-300 rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-gray-100 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                          onClick={() => {
                            setShowSellerModal(false);
                            navigate(`/listing?id=${item.id}`);
                          }}
                        >
                          <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                            <img src={item.img} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2.5 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate mb-1">{item.title}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-extrabold">{item.priceLabel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2 sm:gap-2.5">
                  <a href={`tel:${p.phone}`} className="btn btn-primary btn-w-full rounded-xl justify-center items-center text-sm font-bold py-2.5 sm:py-3 text-white no-underline transition-all">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {p.seller} ({p.phone})
                  </a>
                  <button className="btn btn-secondary btn-w-full rounded-xl justify-center text-sm font-bold py-2.5 sm:py-3 transition-all" onClick={() => { setShowSellerModal(false); handleMessageSeller(); }}>
                    Message seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Rate Seller Modal ── */}
      {showRateModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowRateModal(false)} />
          <div className="modal-wrap">
            <div className="modal-card" style={{ maxWidth: "420px" }}>
              <div className="modal-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-extrabold text-gray-900">Rate {p.seller}</h3>
                  <button className="modal-close" onClick={() => setShowRateModal(false)}>✕</button>
                </div>

                {rateSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-base font-bold text-gray-900 mb-1">Review submitted!</p>
                    <p className="text-sm text-gray-500 mb-4">Thank you for your feedback.</p>
                    <button className="btn btn-primary btn-sm rounded-lg" onClick={() => setShowRateModal(false)}>Done</button>
                  </div>
                ) : (
                  <form onSubmit={handleRateSeller} className="flex flex-col gap-4">
                    {/* Star picker */}
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Your rating</p>
                      <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button"
                            onMouseEnter={() => setRateHover(s)}
                            onMouseLeave={() => setRateHover(0)}
                            onClick={() => setRateStars(s)}
                            className="transition-transform hover:scale-110">
                            <svg width="36" height="36" fill={s <= (rateHover || rateStars) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-amber-500 mt-1.5">
                        {["Poor","Fair","Good","Great","Excellent!"][rateStars - 1]}
                      </p>
                    </div>

                    {/* Text */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your review</label>
                      <textarea rows={3} maxLength={500} placeholder="Share your experience with this seller..."
                        value={rateText}
                        onChange={e => { setRateText(e.target.value); setRateError(""); }}
                        className={`input w-full resize-none${rateError ? " error" : ""}`} />
                      <div className="flex justify-between mt-1">
                        {rateError ? <p className="text-xs text-red-500 font-medium">{rateError}</p> : <span />}
                        <p className="text-xs text-gray-400">{rateText.length}/500</p>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm" disabled={rateLoading}>
                      {rateLoading ? "Submitting…" : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} />
          <div className="modal-wrap">
            <div className="modal-card" style={{ maxWidth: "400px" }}>
              <div className="modal-body p-6 text-center">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4 border border-red-100 dark:border-red-900/40">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Listing</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{p.title}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-secondary flex-1 rounded-xl justify-center font-bold" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger flex-1 rounded-xl justify-center font-bold" onClick={handleDeleteListing}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
