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

  // Swipe logic state
  const [touchStartY, setTouchStartY] = useState(null);
  const isWheeling = useRef(false);

  // Upload form state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [title, setTitle] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [uploading, setUploading] = useState(false);

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
          vRef.play().catch(() => {});
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
    <div className="page-enter bg-black min-h-[100dvh]">
      
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
      <div className="fixed top-0 bottom-[70px] sm:bottom-0 left-0 right-0 sm:left-[50%] sm:-translate-x-1/2 sm:max-w-[450px] w-full bg-black overflow-hidden z-10 touch-none">
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
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pb-6 z-20 flex items-end justify-between gap-3">
                      
                      {/* Seller & Details */}
                      <div className="flex-1 pr-2 text-white">
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

                        <p className="text-sm font-semibold leading-snug drop-shadow-lg mb-3 line-clamp-2">{reel.title}</p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {reel.tags && reel.tags.filter(t => t !== '#Reel' && t !== '#Marketplace').map((t, idx) => (
                            <span key={idx} className="badge px-2 py-0.5" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#bae6fd' }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {reel.listingId && (
                          <button
                            onClick={() => navigate(`/listing?id=${reel.listingId}`)}
                            className="bg-gray-100 hover:bg-white text-gray-900 font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                            style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}
                          >
                            <span>View Product Details</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Right Side Actions (Like, Share, Upload) */}
                      <div className="flex flex-col items-center gap-5 text-white pb-2 pr-1">
                        
                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(reel._id)}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl border ${
                            isLoggedIn && reel.likes.includes(currentUser?._id) 
                            ? "bg-gradient-to-tr from-red-600 to-pink-500 text-white border-red-400/50 shadow-[0_4px_20px_rgba(225,29,72,0.4)] scale-110" 
                            : "bg-black/30 border-white/10 text-white hover:bg-white/20 hover:scale-105"
                          }`}>
                            <svg className="w-6 h-6 drop-shadow-md" fill={isLoggedIn && reel.likes.includes(currentUser?._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLoggedIn && reel.likes.includes(currentUser?._id) ? "1.5" : "2"} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold tracking-wide drop-shadow-md">{reel.likes.length}</span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                          }}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div className="w-12 h-12 rounded-full bg-black/30 border border-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
                            <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
                            <div className="w-12 h-12 rounded-full bg-black/30 border border-white/10 backdrop-blur-xl text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-105">
                              <svg className="w-5.5 h-5.5 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                          <div className="w-11 h-11 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all backdrop-blur-md">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {listings.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Link to Listing</label>
                      <select
                        value={selectedListingId}
                        onChange={(e) => setSelectedListingId(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-70 text-sm"
                        disabled={uploading}
                      >
                        <option value="">-- No linked product --</option>
                        {listings.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title} ({item.priceLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
            <div className="bg-white dark:bg-gray-900 w-full max-w-[400px] rounded-3xl shadow-2xl pointer-events-auto p-6 text-center border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4 border border-red-100 dark:border-red-900/40">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Reel</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
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
    </div>
  );
}
