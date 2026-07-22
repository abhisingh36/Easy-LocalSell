import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, triggerLoginModal, currentUser } = useApp();

  const activePath = location.pathname;

  const handleSellClick = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate("/post");
    } else {
      triggerLoginModal("Please log in to sell items.");
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      triggerLoginModal("Please log in to view your profile.");
    }
  };

  const isHome = activePath === "/home" || activePath === "/";
  const isReels = activePath === "/reels";
  const isSupport = activePath === "/support";
  const isProfile = activePath === "/profile";

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        
        {/* 1. Home */}
        <Link
          to="/home"
          className={`mobile-nav-item ${isHome ? "active" : ""}`}
        >
          {isHome ? (
            <svg className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.707 2.293a1 1 0 011.414 0l8 8a1 1 0 01-1.414 1.414L18 10.414V19a2 2 0 01-2 2h-3a1 1 0 01-1-1v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a1 1 0 01-1 1H6a2 2 0 01-2-2v-8.586l-.293.293a1 1 0 01-1.414-1.414l8-8z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6" />
            </svg>
          )}
          <span className="mobile-nav-label">Home</span>
        </Link>

        {/* 2. Reels / Short Video Upload */}
        <Link
          to="/reels"
          className={`mobile-nav-item ${isReels ? "active" : ""}`}
        >
          {isReels ? (
            <svg className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm14.553 2.106A1 1 0 0017 7v10a1 1 0 001.553.894l4-2.5a1 1 0 000-1.788l-4-2.5z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="mobile-nav-label">Reels</span>
        </Link>

        {/* 3. Center Sell Something (+ Button) */}
        <button
          onClick={handleSellClick}
          className="mobile-nav-sell-btn"
          aria-label="Sell Something"
          title="Sell Something"
        >
          <div className="mobile-sell-icon-wrap">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mobile-nav-label font-extrabold text-blue-600 dark:text-blue-400">Sell</span>
        </button>

        {/* 4. Customer Support */}
        <Link
          to="/support"
          className={`mobile-nav-item ${isSupport ? "active" : ""}`}
        >
          {isSupport ? (
            <svg className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12v4a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1H4a8 8 0 1116 0h-1a1 1 0 00-1 1v4a1 1 0 001 1h1a2 2 0 002-2v-4c0-5.523-4.477-10-10-10z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm18 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
            </svg>
          )}
          <span className="mobile-nav-label">Support</span>
        </Link>

        {/* 5. Profile */}
        <button
          onClick={handleProfileClick}
          className={`mobile-nav-item ${isProfile ? "active" : ""}`}
        >
          {isLoggedIn && currentUser?.profileImage ? (
            <img src={currentUser.profileImage} alt="" className={`w-5.5 h-5.5 rounded-full object-cover ${isProfile ? "ring-2 ring-blue-600" : ""}`} />
          ) : isProfile ? (
            <svg className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.761-3.582-5-8-5z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          <span className="mobile-nav-label">Profile</span>
        </button>

      </div>
    </div>
  );
}
