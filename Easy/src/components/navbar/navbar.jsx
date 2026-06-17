import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const NOTIFICATIONS = [
  { text: "Rahul Kumar sent you a message",      time: "5 min ago",  unread: true  },
  { text: "Your listing got 12 new views today", time: "1 hr ago",   unread: true  },
  { text: "New listing nearby: iPhone 14 Pro",   time: "2 hr ago",   unread: false },
  { text: "Priya Sharma left you a 5-star review", time: "Yesterday", unread: false },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { currentUser, searchQuery, setSearchQuery, isLoggedIn, logout, setShowLoginModal, setShowLocationModal, userLocation, filters } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifRead,    setNotifRead]    = useState(false);
  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);

  const notifUnread = notifRead ? 0 : NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate("/home");
  }

  function handleSearch(e) {
    setSearchQuery(e.target.value);
    if (location.pathname !== "/home") navigate("/home");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/home" className="navbar-logo">EASY</Link>

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

        <div className="navbar-spacer" />

        {/* Location */}
        <button
          id="location-btn"
          className="btn btn-secondary btn-sm navbar-location-btn"
          onClick={() => setShowLocationModal(true)}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{flexShrink:0}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
          </svg>
          {userLocation.name} · {filters.radius}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-btn"
            className="btn-icon relative"
            onClick={() => { setNotifOpen(v => !v); setNotifRead(true); }}
            title="Notifications"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifUnread > 0 && <span className="notif-dot" />}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div className="dropdown" style={{width:300}}>
              <div className="notif-header">
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                <span className="text-xs text-sky-600 cursor-pointer font-medium">Mark all read</span>
              </div>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} className={`notif-item ${n.unread && !notifRead ? "notif-item-unread" : "notif-item-read"}`}>
                  <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              ))}
              <div className="p-2.5 text-center">
                <span className="text-sm text-sky-600 cursor-pointer font-medium">View all</span>
              </div>
            </div>
          )}
        </div>

        {/* Login / Avatar */}
        {!isLoggedIn ? (
          <button
            id="login-btn"
            className="btn btn-secondary shrink-0"
            onClick={() => setShowLoginModal(true)}
          >
            Login
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div id="avatar-btn" className="avatar" onClick={() => setDropdownOpen(v => !v)}>
              {currentUser.initials}
            </div>

            {dropdownOpen && (
              <div className="dropdown" style={{width:220}}>
                {/* User info */}
                <div className="user-dd-header">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="user-dd-avatar">{currentUser.initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-400">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="badge badge-blue">{currentUser.active} active</span>
                    <span className="badge badge-green">{currentUser.sold} sold</span>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { label: "My Profile",  action: "/profile"  },
                  { label: "My Listings", action: "/home"     },
                  { label: "Messages",    action: "/messages" },
                  { label: "Settings",    action: null        },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    className="dropdown-item"
                    onClick={() => { setDropdownOpen(false); if (action) navigate(action); }}
                  >
                    {label}
                  </button>
                ))}

                <div className="border-t border-gray-100">
                  <button id="logout-btn" className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sell button */}
        <button
          id="sell-btn"
          className="btn btn-primary shrink-0"
          onClick={() => navigate("/post")}
        >
          Sell something
        </button>

      </div>
    </nav>
  );
}
