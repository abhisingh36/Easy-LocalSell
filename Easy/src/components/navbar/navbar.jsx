import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser, searchQuery, setSearchQuery, isLoggedIn,
    triggerLoginModal, setShowLocationModal, userLocation,
    filters, theme, toggleTheme, conversations
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const notifRef = useRef(null);

  const notifUnread = notifRead ? 0 : conversations.filter(c => c.unread > 0).length;

  useEffect(() => {
    function handle(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleSearch(e) {
    setSearchQuery(e.target.value);
    if (location.pathname !== "/home") navigate("/home");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/home" className="navbar-logo">
          <span className="hidden md:inline">EASY</span>
          <span className="md:hidden">ES</span>
        </Link>

        {/* Search */}
        <div className="navbar-search-wrap">
          <span className="navbar-search-icon">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </span>
          <input
            id="navbar-search"
            type="text"
            placeholder="Search items, categories..."
            value={searchQuery}
            onChange={handleSearch}
            className="navbar-search"
          />
        </div>

        {/* Location — icon-only on mobile, text+icon on desktop (via CSS) */}
        <button
          id="location-btn"
          className="navbar-loc-btn"
          onClick={() => setShowLocationModal(true)}
        >
          <svg className="navbar-loc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
          </svg>
          <span className="navbar-loc-text">
            <span className="navbar-loc-name">{userLocation.name}</span>
            <span className="navbar-loc-radius">{' · '}{filters.radius}</span>
          </span>
        </button>

        <div className="navbar-spacer" />

        {/* Theme Toggle */}
        <button className="navbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === "dark" ? (
            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notification Bell */}
        {isLoggedIn && (
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              id="notif-btn"
              className="navbar-icon-btn"
              onClick={() => { setNotifOpen(v => !v); setNotifRead(true); }}
              title="Notifications"
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifUnread > 0 && <span className="notif-dot" />}
            </button>

            {notifOpen && (
              <div className="dropdown" style={{ width: 300 }}>
                <div className="notif-header">
                  <p className="text-sm font-bold text-gray-900">Notifications</p>
                  <span className="text-xs text-blue-600 cursor-pointer font-medium" onClick={() => setNotifRead(true)}>Mark all read</span>
                </div>
                {conversations.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: "var(--gray-400)" }}>
                    No new notifications
                  </div>
                ) : (
                  conversations.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className={`notif-item cursor-pointer ${c.unread && !notifRead ? "notif-item-unread" : "notif-item-read"}`}
                      onClick={() => { setNotifOpen(false); navigate(`/messages?conv=${c.id}`); }}
                    >
                      <p className="text-sm text-gray-700 leading-snug">
                        {c.unread > 0 ? `${c.name} sent you a message: "${c.preview}"` : `Chat with ${c.name} about ${c.item}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.time}</p>
                    </div>
                  ))
                )}
                <div style={{ padding: "10px", textAlign: "center", borderTop: "1px solid var(--gray-100)" }}>
                  <span
                    className="text-sm text-blue-600 cursor-pointer font-medium"
                    onClick={() => { setNotifOpen(false); navigate("/messages"); }}
                  >
                    View all
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar / Login */}
        {!isLoggedIn ? (
          <button id="login-btn" className="navbar-login-btn" onClick={() => triggerLoginModal()}>
            Login
          </button>
        ) : (
          <div id="avatar-btn" className="navbar-avatar" onClick={() => navigate("/profile")}>
            {currentUser.profileImage ? (
              <img src={currentUser.profileImage} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              currentUser.initials
            )}
          </div>
        )}

        {/* Sell Button */}
        <button
          id="sell-btn"
          className="navbar-sell-btn"
          onClick={() => {
            if (isLoggedIn) navigate("/post");
            else triggerLoginModal("Please log in to sell items.");
          }}
        >
          {/* Desktop: text */}
          <span className="navbar-sell-text">Sell something</span>
          {/* Mobile: + icon */}
          <svg className="navbar-sell-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14" />
          </svg>
        </button>

      </div>
    </nav>
  );
}
