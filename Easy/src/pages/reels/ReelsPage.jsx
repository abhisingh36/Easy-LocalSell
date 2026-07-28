import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function ReelsPage() {
  const navigate = useNavigate();
  const { listings, currentUser, isLoggedIn, triggerLoginModal, showToast } = useApp();

  const [reels, setReels] = useState([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reelToDelete, setReelToDelete] = useState(null);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Swipe logic state
  const [touchStartY, setTouchStartY] = useState(null);
  const isWheeling = useRef(false);

  // Upload form state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [title, setTitle] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const videoRefs = useRef([]);

  // Fetch reels from backend
  const fetchReels = async () => {
    try {
      const res = await fetch(`${API_BASE}/reels`);
      const data = await res.json();
      setReels(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch reels:", err);
      showToast("Failed to load reels", "danger");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    // Auto-play active reel video and pause others
    videoRefs.current.forEach((vRef, idx) => {
      if (vRef) {
        if (idx === activeReelIndex && isPlaying) {
          vRef.play().catch(() => { });
        } else {
          vRef.pause();
        }
      }
    });
  }, [activeReelIndex, isPlaying, reels]);

  const handleDeleteReel = async () => {
    if (!reelToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/reels/${reelToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      if (!res.ok) throw new Error("Delete failed");

      showToast("Reel deleted successfully", "success");
      setShowDeleteConfirm(false);
      setReelToDelete(null);
      await fetchReels();
      setActiveReelIndex(0);
    } catch (err) {
      console.error(err);
      showToast("Error deleting reel", "danger");
    }
  };

  const handleToggleLike = async (reelId) => {
    if (!isLoggedIn) {
      triggerLoginModal("Please log in to like a reel.");
      return;
    }

    // Optimistic UI update
    setReels((list) =>
      list.map((r) => {
        if (r._id === reelId) {
          const isLiked = r.likes.includes(currentUser._id);
          return {
            ...r,
            likes: isLiked ? r.likes.filter(id => id !== currentUser._id) : [...r.likes, currentUser._id]
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`${API_BASE}/reels/${reelId}/like`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`
        }
      });
      if (!res.ok) throw new Error("Failed to like reel");
    } catch (err) {
      console.error(err);
      showToast("Error liking reel", "danger");
    }
  };

  const handleAddComment = async (e, reelId) => {
    e.preventDefault();
    if (!isLoggedIn) {
      triggerLoginModal("Please log in to comment.");
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/reels/${reelId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const updatedReel = await res.json();

      setReels((list) => list.map(r => r._id === reelId ? updatedReel : r));
      setCommentText("");
    } catch (err) {
      console.error(err);
      showToast("Error adding comment", "danger");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (reelId, commentId) => {
    try {
      const res = await fetch(`${API_BASE}/reels/${reelId}/comment/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      const updatedReel = await res.json();
      setReels((list) => list.map(r => r._id === reelId ? updatedReel : r));
      setActiveCommentMenu(null);
      showToast("Comment deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Error deleting comment", "danger");
    }
  };

  const handleEditCommentSubmit = async (reelId, commentId) => {
    if (!editCommentText.trim()) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/reels/${reelId}/comment/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ text: editCommentText.trim() })
      });
      if (!res.ok) throw new Error("Failed to edit comment");
      const updatedReel = await res.json();
      setReels((list) => list.map(r => r._id === reelId ? updatedReel : r));
      setEditingCommentId(null);
      setEditCommentText("");
      setActiveCommentMenu(null);
      showToast("Comment updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Error updating comment", "danger");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast("Video size must be less than 50MB", "danger");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleUploadReel = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      triggerLoginModal("Please log in to upload video reels.");
      return;
    }
    if (!videoFile) {
      showToast("Please select a video file", "danger");
      return;
    }
    if (!title.trim()) {
      showToast("Please enter a title for your reel", "danger");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title.trim());
    if (selectedListingId) {
      formData.append("listingId", selectedListingId);
    }

    try {
      const res = await fetch(`${API_BASE}/reels`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      showToast("Your 1-minute video reel is published!", "success");

      // Refresh reels
      await fetchReels();

      setActiveReelIndex(0);
      setUploading(false);
      setShowUploadModal(false);
      setTitle("");
      setVideoFile(null);
      setVideoPreview("");
    } catch (err) {
      console.error(err);
      showToast("Error uploading video. Please try again.", "danger");
      setUploading(false);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY || reels.length <= 1) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;

    // Threshold of 50px for a swipe
    if (diffY > 50) {
      // Swiped up -> Next Reel
      setActiveReelIndex((prev) => (prev + 1) % reels.length);
      setIsPlaying(true);
    } else if (diffY < -50) {
      // Swiped down -> Previous Reel
      setActiveReelIndex((prev) => (prev === 0 ? reels.length - 1 : prev - 1));
      setIsPlaying(true);
    }
    setTouchStartY(null);
  };

  const handleWheel = (e) => {
    if (reels.length <= 1 || isWheeling.current) return;

    // Threshold to prevent tiny accidental scrolls
    if (Math.abs(e.deltaY) > 20) {
      isWheeling.current = true;
      if (e.deltaY > 0) {
        // Scrolled down -> Next Reel
        setActiveReelIndex((prev) => (prev + 1) % reels.length);
      } else {
        // Scrolled up -> Previous Reel
        setActiveReelIndex((prev) => (prev === 0 ? reels.length - 1 : prev - 1));
      }
      setIsPlaying(true);

      // Cooldown to prevent skipping multiple reels rapidly
      setTimeout(() => {
        isWheeling.current = false;
      }, 800);
    }
  };

  return (
    <div className="page-enter bg-gray-50 min-h-[100dvh]">

      {/* Floating Back Button & Top Gradient */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-[400] pointer-events-none"></div>
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[500] w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:bg-white/40 transition-all"
      >
        <svg className="w-6 h-6 pr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Foolproof Fixed Position for Video Player */}
      <div className="fixed top-0 bottom-[calc(60px+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 sm:left-[50%] sm:-translate-x-1/2 sm:max-w-[450px] w-full bg-black overflow-hidden z-10 touch-none">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-medium text-gray-500 text-sm">Loading Reels...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && reels.length === 0 && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="card p-10 text-center rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-full relative z-20">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No Reels Yet</h2>
              <p className="text-gray-500 font-medium mb-6 text-sm">Be the first to showcase your item in a 1-minute video!</p>
              <button
                onClick={() => {
                  if (isLoggedIn) setShowUploadModal(true);
                  else triggerLoginModal("Please log in to upload a video reel.");
                }}
                className="btn btn-primary rounded-xl px-6 py-2.5 font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
              >
                Upload First Reel
              </button>
            </div>
          </div>
        )}

        {/* Reels Main Player View - Smooth Scroll Track */}
        {!isLoading && reels.length > 0 && (
          <div
            className="relative h-full w-full overflow-hidden bg-black touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Global Mute Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((m) => !m);
              }}
              className="absolute top-6 right-4 sm:right-6 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-50"
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            {/* Scrollable Track */}
            <div
              className="h-full w-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${activeReelIndex * 100}%)` }}
            >
              {reels.map((reel, index) => {
                const isActive = index === activeReelIndex;
                return (
                  <div key={reel._id} className="relative h-full w-full flex-shrink-0 bg-black overflow-hidden">

                    {/* Blurred Background Layer (for non-vertical videos) */}
                    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                      <video
                        src={reel.videoUrl}
                        className="w-full h-full object-cover opacity-40 blur-2xl scale-110 pointer-events-none"
                        loop
                        playsInline
                        muted
                        autoPlay={isActive}
                      />
                    </div>

                    {/* Main Video Player */}
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={reel.videoUrl}
                      className="relative z-10 w-full h-full object-contain cursor-pointer"
                      loop
                      playsInline
                      muted={isMuted}
                      onClick={() => isActive && setIsPlaying((p) => !p)}
                    />

                    {/* Play/Pause Overlay Indicator (Only for active video) */}
                    {isActive && !isPlaying && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 pointer-events-none transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pl-1 shadow-lg">
                          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Swipe Up Indicator (Visible briefly on first video) */}
                    {isActive && index === 0 && reels.length > 1 && (
                      <div className="absolute top-[40%] right-4 text-white/50 animate-bounce pointer-events-none z-10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    )}

                    {/* Bottom Overlay Content */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pb-8 lg:pb-10 z-20 flex items-end justify-between gap-3">

                      {/* Details & Seller */}
                      <div className="flex-1 pr-2 text-white">

                        {/* View Product Details Button (Moved to top) */}
                        {reel.listingId && (
                          <button
                            onClick={() => navigate(`/listing?id=${reel.listingId}`)}
                            className="bg-gray-100 hover:bg-white text-gray-900 font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 mb-4"
                            style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}
                          >
                            <span>View Product Details</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        )}

                        {/* Seller Profile */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white/40 overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm">
                            {reel.sellerAvatar ? (
                              <img src={reel.sellerAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              reel.sellerName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-none drop-shadow-md">{reel.sellerName}</p>
                            <p className="text-xs text-blue-300 font-semibold mt-1 drop-shadow-md">{reel.price}</p>
                          </div>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-semibold leading-snug drop-shadow-lg mb-3 line-clamp-2">{reel.title}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {(() => {
                            const listing = listings.find(l => String(l.id || l._id) === String(reel.listingId));
                            const locTag = listing?.location ? `#${listing.location.replace(/\s+/g, '')}` : null;
                            const allTags = [...(reel.tags || [])];
                            if (locTag && !allTags.includes(locTag)) allTags.push(locTag);
                            return allTags.filter(t => t !== '#Reel' && t !== '#Marketplace').map((t, idx) => (
                              <span key={idx} className="badge px-2 py-0.5" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#bae6fd' }}>
                                {t}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Right Side Actions (Like, Share, Upload) */}
                      <div className="flex flex-col items-center gap-5 text-white pb-2 pr-1">

                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(reel._id)}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className="flex items-center justify-center transition-transform hover:scale-110">
                            <svg width="34" height="34" fill={isLoggedIn && reel.likes.includes(currentUser?._id) ? "#ef4444" : "none"} stroke={isLoggedIn && reel.likes.includes(currentUser?._id) ? "#ef4444" : "#ffffff"} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold tracking-wide drop-shadow-md">{reel.likes.length}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => {
                            if (!isLoggedIn) {
                              triggerLoginModal("Please log in to comment.");
                              return;
                            }
                            setShowCommentsModal(true);
                          }}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className="flex items-center justify-center transition-transform hover:scale-110">
                            <svg width="32" height="32" fill="none" stroke="#ffffff" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold tracking-wide drop-shadow-md">{reel.comments?.length || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                          }}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className="flex items-center justify-center transition-transform hover:scale-110">
                            <svg width="30" height="30" fill="none" stroke="#ffffff" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold tracking-wide drop-shadow-md">Share</span>
                        </button>

                        {/* Delete Button (Only for owner) */}
                        {isLoggedIn && (currentUser?._id === reel.seller || currentUser?.id === reel.seller) && (
                          <button
                            onClick={() => {
                              setReelToDelete(reel._id);
                              setShowDeleteConfirm(true);
                            }}
                            className="flex flex-col items-center gap-1.5 group"
                          >
                            <div className="flex items-center justify-center transition-transform hover:scale-110">
                              <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold drop-shadow-md text-red-100">Delete</span>
                          </button>
                        )}

                        {/* Upload Button */}
                        <button
                          onClick={() => {
                            if (isLoggedIn) setShowUploadModal(true);
                            else triggerLoginModal("Please log in to upload a video reel.");
                          }}
                          className="flex flex-col items-center gap-1 group mt-1"
                        >
                          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.4)] hover:scale-105 transition-all backdrop-blur-md">
                            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </button>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Upload 1-Min Video Reel Modal - Soft UI */}
      {showUploadModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 w-full max-w-[480px] rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800">

              <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-sm">
                    📹
                  </div>
                  Upload Reel
                </h3>
                <button
                  disabled={uploading}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  onClick={() => setShowUploadModal(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleUploadReel} className="flex flex-col gap-5">

                  {/* File Upload Box */}
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-2 text-center transition-colors hover:border-blue-400 dark:hover:border-blue-500">
                    {videoPreview ? (
                      <div className="relative aspect-[9/16] max-h-[220px] mx-auto rounded-xl overflow-hidden bg-black shadow-sm">
                        <video src={videoPreview} className="w-full h-full object-cover" controls />
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => { setVideoFile(null); setVideoPreview(""); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 backdrop-blur-sm text-white flex items-center justify-center text-xs font-bold hover:bg-red-500 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center mb-2 transition-transform hover:scale-105">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Click to select video</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">MP4, MOV up to 50MB</p>
                        <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" disabled={uploading} />
                      </label>
                    )}
                  </div>

                  {/* Title / Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Reel Title</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro overview..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-70 text-sm"
                      required
                      disabled={uploading}
                    />
                  </div>

                  {/* Link Active Listing */}
                  {(() => {
                    const myListings = listings.filter(l => String(l.sellerId) === String(currentUser?._id || currentUser?.id));
                    return myListings.length > 0 && (
                      <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Link to Listing</label>
                        <div
                          className={`w-full bg-white dark:bg-gray-800 border ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white rounded-xl px-4 py-2.5 cursor-pointer flex justify-between items-center transition-all text-sm ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          <span className="truncate pr-2">
                            {selectedListingId
                              ? (() => {
                                const s = myListings.find(l => l.id === selectedListingId);
                                return s ? `${s.title} (${s.priceLabel})` : "-- No linked product --";
                              })()
                              : "-- No linked product --"
                            }
                          </span>
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>

                        {/* Dropdown Menu (Floating Upwards) */}
                        {isDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                            <div className="absolute z-50 w-full mb-1 bottom-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[220px] overflow-y-auto overflow-x-hidden overscroll-contain">
                              <div
                                className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedListingId === "" ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/40' : 'text-gray-900 dark:text-white'}`}
                                onClick={() => { setSelectedListingId(""); setIsDropdownOpen(false); }}
                              >
                                -- No linked product --
                              </div>
                              {myListings.map((item) => (
                                <div
                                  key={item.id}
                                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors truncate ${selectedListingId === item.id ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/40' : 'text-gray-900 dark:text-white'}`}
                                  title={`${item.title} (${item.priceLabel})`}
                                  onClick={() => { setSelectedListingId(item.id); setIsDropdownOpen(false); }}
                                >
                                  {item.title} <span className="text-gray-500 dark:text-gray-400 font-normal">({item.priceLabel})</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <button
                    type="submit"
                    className="btn btn-primary w-full justify-center rounded-xl py-3 mt-2 shadow-md shadow-blue-500/20 font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                    disabled={uploading}
                  >
                    {uploading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    {uploading ? "Uploading to Cloudinary..." : "Publish Reel"}
                  </button>

                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl pointer-events-auto p-6 text-center border border-gray-100">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Reel</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to delete this reel? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1 rounded-xl justify-center font-bold" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary flex-1 rounded-xl justify-center font-bold bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 !border-0" onClick={handleDeleteReel}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Comments Modal */}
      {showCommentsModal && reels[activeReelIndex] && (
        <>
          <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCommentsModal(false)} />
          <div className="fixed inset-x-3 bottom-[4.5rem] sm:inset-x-4 sm:bottom-20 z-[1010] flex flex-col bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200 h-[65vh] transition-transform overflow-hidden md:inset-x-auto md:right-8 lg:right-16 md:bottom-12 md:top-12 md:h-auto md:w-[380px] lg:w-[420px] md:shadow-2xl">

            {/* Modal Header (Fixed) */}
            <div className="flex-none px-5 sm:px-6 pt-5 pb-4 border-b border-gray-200 relative shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full absolute top-2.5 left-1/2 -translate-x-1/2 md:hidden"></div>
              <div className="flex justify-between items-center mt-3 md:mt-0">
                <h3 className="text-xl font-bold text-gray-900">Comments ({reels[activeReelIndex].comments?.length || 0})</h3>
                <button onClick={() => setShowCommentsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Scrollable Comments Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 scrollbar-hide">

              {(!reels[activeReelIndex].comments || reels[activeReelIndex].comments.length === 0) ? (
                <div className="text-center py-10 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {reels[activeReelIndex].comments.map((comment, i) => (
                    <div key={comment._id || i} className="flex gap-3 relative group">
                      <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {comment.user?.profileImage ? (
                          <img src={comment.user.profileImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-blue-600 font-bold text-sm">{(comment.user?.name || "U").slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5 relative">
                          <p className="text-sm font-bold text-gray-900">{comment.user?.name || "User"}</p>
                          {currentUser && (currentUser._id || currentUser.id) === (comment.user?._id || comment.user?.id) && (
                            <div className="relative">
                              <button onClick={() => setActiveCommentMenu(activeCommentMenu === comment._id ? null : comment._id)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                              </button>
                              {activeCommentMenu === comment._id && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[1020] overflow-hidden">
                                  <button onClick={() => { setEditingCommentId(comment._id); setEditCommentText(comment.text); setActiveCommentMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                                  <button onClick={() => handleDeleteComment(reels[activeReelIndex]._id, comment._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment._id ? (
                          <div className="mt-1">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full bg-transparent border border-gray-200 focus:border-blue-500/50 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 text-gray-900 transition-all placeholder-gray-500 resize-none"
                              rows="2"
                              disabled={isSavingEdit}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => { setEditingCommentId(null); setEditCommentText(""); }} disabled={isSavingEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                              <button onClick={() => handleEditCommentSubmit(reels[activeReelIndex]._id, comment._id)} disabled={isSavingEdit || !editCommentText.trim()} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">{isSavingEdit ? "Saving..." : "Save"}</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">{comment.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 bg-white/60 backdrop-blur-xl border-t border-gray-200">
              <form onSubmit={(e) => handleAddComment(e, reels[activeReelIndex]._id)} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmittingComment}
                  className="flex-1 min-w-0 bg-transparent border border-gray-200 focus:border-blue-500/50 rounded-2xl px-5 h-12 text-sm focus:ring-4 focus:ring-blue-500/10 text-gray-900 transition-all placeholder-gray-500"
                />
                <button type="submit" disabled={!commentText.trim() || isSubmittingComment} className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 h-12 font-bold disabled:opacity-50 flex items-center justify-center min-w-[80px] shrink-0 transition-colors">
                  {isSubmittingComment ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "Post"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
