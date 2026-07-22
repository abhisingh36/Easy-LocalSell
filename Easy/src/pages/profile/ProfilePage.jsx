import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";
import EditProfileModal from "../../components/editProfileModal/EditProfileModal";
import {
  fetchReviewsBySeller,
  createReviewAPI,
  deleteReviewAPI,
} from "../../services/api";

// ─── Stars component ─────────────────────────────────────────────
function Stars({ count, size = "sm" }) {
  const dim = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={dim} fill={s <= count ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ─── Relative time helper ─────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (mins < 2)    return "just now";
  if (mins < 60)   return `${mins} minutes ago`;
  if (hours < 24)  return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7)    return `${days} day${days > 1 ? "s" : ""} ago`;
  if (weeks < 5)   return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

// ─── Leave a Review Modal ────────────────────────────────────────
function ReviewModal({ sellerId, sellerName, myListings, onClose, onSubmit }) {
  const [rating,    setRating]    = useState(5);
  const [hoverStar, setHoverStar] = useState(0);
  const [text,      setText]      = useState("");
  const [listingId, setListingId] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) { setError("Please write something about your experience."); return; }
    setLoading(true); setError("");
    try {
      await onSubmit({ rating, text: text.trim(), listingId: listingId || null });
      onClose();
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-wrap">
        <div className="modal-card">
          <div className="modal-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-gray-900">Rate {sellerName}</h3>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Star picker */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Your rating</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button"
                      onMouseEnter={() => setHoverStar(s)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110">
                      <svg className="w-9 h-9" fill={s <= (hoverStar || rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-bold text-amber-500 mt-1">
                  {["","Poor","Fair","Good","Great","Excellent!"][rating]}
                </p>
              </div>

              {/* Listing selector (optional) */}
              {myListings?.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Related listing (optional)</label>
                  <select value={listingId} onChange={e => setListingId(e.target.value)}
                    className="input input-sm w-full">
                    <option value="">— Select a listing —</option>
                    {myListings.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Review text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your review</label>
                <textarea rows={4} maxLength={500} placeholder="Share your experience with this seller..."
                  value={text} onChange={e => { setText(e.target.value); setError(""); }}
                  className={`input w-full resize-none${error ? " error" : ""}`} />
                <div className="flex justify-between mt-1">
                  {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : <span />}
                  <p className="text-xs text-gray-400">{text.length}/500</p>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm" disabled={loading}>
                {loading ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProfilePage
// ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    currentUser, wishlist, toggleWishlist,
    isLoggedIn, triggerLoginModal,
    showToast, logout, listings,
    refreshCurrentUserStats, updateUser,
  } = useApp();

  const [activeTab,       setActiveTab]       = useState("listings");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [reviews,         setReviews]         = useState([]);
  const [reviewsLoading,  setReviewsLoading]  = useState(false);
  const [reviewsFetched,  setReviewsFetched]  = useState(false); // true after first fetch
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/home");
      triggerLoginModal("Please log in to view your profile.");
    }
  }, [isLoggedIn, navigate, triggerLoginModal]);

  // ── Refresh live stats ───────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) refreshCurrentUserStats();
  }, [isLoggedIn, refreshCurrentUserStats]);

  // Refs so callbacks always read the latest value without being in deps
  const currentUserRef  = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // ── Load reviews on mount (background) so tab count is correct immediately
  // Stable [] deps — reads user via ref to avoid dep-loop with currentUser.
  const loadReviews = useCallback(async (showSpinner = true) => {
    const user = currentUserRef.current;
    if (!user) return;
    const sellerId = user._id || user.id;
    if (!sellerId) return;
    if (showSpinner) setReviewsLoading(true);
    try {
      const data = await fetchReviewsBySeller(sellerId);
      setReviews(Array.isArray(data) ? data : []);
      setReviewsFetched(true);
    } catch {
      setReviews([]);
      setReviewsFetched(true);
    } finally {
      if (showSpinner) setReviewsLoading(false);
    }
  }, []);

  // Fetch reviews silently on mount so tab label is correct from the start.
  // No refreshCurrentUserStats call here — avoids the re-render 'page reload' feeling.
  useEffect(() => {
    if (isLoggedIn) loadReviews(false); // false = no loading spinner on mount
  }, [isLoggedIn, loadReviews]);

  // When user manually opens the Reviews tab, show spinner for feedback
  useEffect(() => {
    if (activeTab === "reviews" && !reviewsFetched) loadReviews(true);
  }, [activeTab, reviewsFetched, loadReviews]);

  if (!currentUser) return null;

  const myListings = listings.filter(l =>
    l.sellerId === currentUser._id || l.sellerId === currentUser.id
  );
  const myWishlist = listings.filter(l => wishlist.includes(l.id));

  // ── Stats ────────────────────────────────────────────
  const stats        = currentUser.stats || {};
  const responseRate = stats.response;

  // Compute rating + count directly from the loaded reviews array.
  // This avoids depending on backend stats (which can be stale on first load).
  const reviewCount = reviews.length;  // always live
  const avgRating   = reviewCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  // ── Handlers ─────────────────────────────────────────────────
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    showToast("Logged out successfully", "info");
    navigate("/home");
  };

  const handleSaveProfile = async (payload) => {
    const success = await updateUser(payload);
    if (success) {
      showToast("Profile updated successfully", "success");
      setIsEditModalOpen(false);
    } else {
      showToast("Failed to update profile", "danger");
    }
  };

  const handleSubmitReview = async ({ rating, text, listingId }) => {
    const sellerId = currentUser._id || currentUser.id;
    await createReviewAPI({
      reviewerId:   currentUser._id || currentUser.id,
      reviewerName: currentUser.name,
      sellerId,
      listingId,
      rating,
      text,
    });
    showToast("Review submitted!", "success");
    await loadReviews();
    await refreshCurrentUserStats();
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReviewAPI(reviewId, currentUser._id || currentUser.id);
      showToast("Review deleted", "info");
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      await refreshCurrentUserStats();
    } catch (err) {
      showToast(err.data?.message || "Failed to delete review", "danger");
    }
  };

  return (
    <div className="page-enter min-h-screen pb-12" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-4">

        {/* Profile Card Header */}
        <div className="profile-card-header card p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

            {/* Avatar */}
            <div className="relative">
              <div className="profile-avatar-premium overflow-hidden">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser.initials
                )}
              </div>
              <span className="profile-verified-badge" title="Verified Seller">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>

            {/* User Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 mb-1.5 justify-center md:justify-start">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{currentUser.name}</h1>
                {myListings.length > 0 && (
                  <span className="badge badge-blue font-bold px-2.5 py-0.5 text-[11px] rounded-full uppercase tracking-wider">
                    Pro Seller
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1.5 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {currentUser.location || "Lucknow, India"}
                <span className="text-gray-300">•</span>
                <span>Member since {stats.memberSince || currentUser.joinedYear || new Date().getFullYear()}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button className="btn btn-secondary btn-sm rounded-lg" onClick={() => setIsEditModalOpen(true)}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
                <button className="btn btn-danger btn-sm rounded-lg" onClick={() => setShowLogoutConfirm(true)}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          </div>

          <div className="divider my-6" />

          {/* Stats Grid */}
          <div className="profile-stats-grid-premium">

            {/* Items Sold */}
            <div className="profile-stat-card">
              <span className="stat-icon-wrap icon-green">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none mb-1">{stats.sold ?? 0}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Items Sold</p>
              </div>
            </div>

            {/* Active Listings */}
            <div className="profile-stat-card">
              <span className="stat-icon-wrap icon-blue">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none mb-1">
                  {myListings.filter(l => !l.sold).length}
                </p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Listings</p>
              </div>
            </div>

            {/* Avg Rating — dynamic */}
            <div className="profile-stat-card">
              <span className="stat-icon-wrap icon-amber">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              <div>
                {avgRating != null ? (
                  <>
                    <p className="text-2xl font-black text-gray-900 leading-none mb-1">{avgRating}★</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Avg Rating <span className="text-gray-300">({reviewCount})</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-gray-300 leading-none mb-1">—</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No ratings yet</p>
                  </>
                )}
              </div>
            </div>

            {/* Response Rate — dynamic */}
            <div className="profile-stat-card">
              <span className="stat-icon-wrap icon-purple">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <div>
                {responseRate != null ? (
                  <>
                    <p className="text-2xl font-black text-gray-900 leading-none mb-1">{responseRate}</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Response Rate</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-gray-300 leading-none mb-1">—</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No messages yet</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-20 border-b border-gray-200 mb-8 pb-px overflow-x-auto scrollbar-hide px-2 sm:px-0">
          {[
            { id: "listings", label: `My Listings (${myListings.length})` },
            { id: "wishlist", label: `Wishlist (${myWishlist.length})` },
            { id: "reviews",  label: `Reviews (${reviewCount})` },
          ].map(tab => (
            <button key={tab.id}
              className={`tab-btn text-sm pb-3 px-2 font-semibold transition-all shrink-0 ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Listings Tab ── */}
        {activeTab === "listings" && (
          <div className="listing-grid">
            {myListings.map(item => (
              <div key={item.id} className="listing-card" onClick={() => navigate(`/listing?id=${item.id}`)}>
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  <img src={item.img} alt="" className="w-full h-full object-cover block" loading="lazy" />
                  {item.sold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-lg uppercase tracking-wider z-[5]">
                      Sold
                    </div>
                  )}
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-lg font-bold text-gray-900 mb-1">{item.priceLabel}</p>
                  <p className="text-sm text-gray-500 mb-2.5 truncate">{item.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item.distLabel}</span>
                    <span className={`badge ${item.condition === "Like new" ? "badge-blue" : "badge-amber"}`}>{item.condition}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="listing-card border-dashed border-2 border-gray-300 flex items-center justify-center"
              style={{minHeight: 160}}
              onClick={() => navigate("/post")}>
              <div className="text-center group p-4">
                <span className="text-5xl text-gray-400 group-hover:text-blue-600 transition-colors mb-2.5 block font-semibold">+</span>
                <p className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Add New Listing</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Wishlist Tab ── */}
        {activeTab === "wishlist" && (
          myWishlist.length === 0 ? (
            <div className="max-w-[800px] mx-auto">
              <div className="text-center py-16 card p-8 bg-white/50 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No saved items</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-[320px] mx-auto">Keep track of items you love by adding them to your wishlist.</p>
                <button className="btn btn-primary btn-sm rounded-lg" onClick={() => navigate("/home")}>Browse Listings</button>
              </div>
            </div>
          ) : (
            <div className="listing-grid">
              {myWishlist.map(item => (
                <div key={item.id} className="listing-card relative" onClick={() => navigate(`/listing?id=${item.id}`)}>
                  <button className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-200"
                    onClick={ev => { ev.stopPropagation(); toggleWishlist(item.id); }}>
                    <svg className="w-4.5 h-4.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <img src={item.img} alt="" className="w-full h-full object-cover block" loading="lazy" />
                    {item.sold && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-lg uppercase tracking-wider z-[5]">Sold</div>
                    )}
                  </div>
                  <div className="px-3.5 py-3">
                    <p className="text-lg font-bold text-gray-900 mb-1">{item.priceLabel}</p>
                    <p className="text-sm text-gray-500 mb-2.5 truncate">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === "reviews" && (
          <div className="max-w-[800px] mx-auto">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                {avgRating != null && (
                  <div className="flex items-center gap-2">
                    <Stars count={Math.round(avgRating)} size="lg" />
                    <span className="text-2xl font-black text-gray-900">{avgRating}</span>
                    <span className="text-sm text-gray-400 font-medium">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                  </div>
                )}
              </div>
              {/* Only OTHER users can leave reviews — you can't rate yourself */}
              {false && (
                <button className="btn btn-primary btn-sm rounded-lg" onClick={() => setShowReviewModal(true)}>
                  + Write a Review
                </button>
              )}
            </div>

            {/* Loading */}
            {reviewsLoading && (
              <div className="text-center py-12 text-gray-400 text-sm">Loading reviews…</div>
            )}

            {/* Empty state */}
            {!reviewsLoading && reviews.length === 0 && (
              <div className="text-center py-16 card p-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h3>
                <p className="text-sm text-gray-500 mb-5">Complete a transaction and ask your buyer to leave a review on your listing page!</p>
              </div>
            )}

            {/* Reviews list */}
            {!reviewsLoading && reviews.length > 0 && (
              <div className="flex flex-col gap-4">
                {reviews.map(r => (
                  <div key={r._id} className="card p-5 hover:border-blue-600 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 shadow-sm">
                          {r.reviewerInitials || (r.reviewerName || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{r.reviewerName}</p>
                          {r.listingTitle && (
                            <p className="text-xs text-gray-400">For: <span className="font-semibold text-gray-600">{r.listingTitle}</span></p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <Stars count={r.rating} />
                          <p className="text-[11px] text-gray-400 mt-1 font-medium">{timeAgo(r.createdAt)}</p>
                        </div>
                        {/* Delete button — only for the reviewer themselves */}
                        {String(r.reviewer) === String(currentUser._id || currentUser.id) && (
                          <button onClick={() => handleDeleteReview(r._id)}
                            className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                            title="Delete review">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {r.text && (
                      <p className="text-sm text-gray-600 leading-relaxed pl-[56px]">{r.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          sellerId={currentUser._id || currentUser.id}
          sellerName={currentUser.name}
          myListings={myListings}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)} />
          <div className="modal-wrap">
            <div className="modal-card" style={{ maxWidth: "400px" }}>
              <div className="modal-body p-6 text-center">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4 border border-red-100 dark:border-red-900/40">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Log out</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to log out of your account? You will need to sign in again to manage your listings.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-secondary flex-1 rounded-xl justify-center font-bold" onClick={() => setShowLogoutConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger flex-1 rounded-xl justify-center font-bold" onClick={handleLogout}>
                    Yes, Log out
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
