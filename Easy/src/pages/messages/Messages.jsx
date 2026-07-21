import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon broken in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function formatTime(isoString) {
  if (!isoString) return "now";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getTimeSep(msgs, idx) {
  const current = formatTime(msgs[idx].createdAt);
  if (idx === 0) return current;
  const prev = formatTime(msgs[idx - 1].createdAt);
  return prev === current ? null : current;
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initConvId = searchParams.get("conv") || null;

  const { conversations, messages, loadMessages, typing, sendMessage, editMessage, deleteMessage, markRead, toggleSold, showToast, isLoggedIn, triggerLoginModal, listings, currentUser, userLocation } = useApp();
  const [activeConv, setActiveConv] = useState(() => {
    if (initConvId) return initConvId;
    const firstWithMsg = conversations.find(c => c.lastMessage);
    return firstWithMsg ? firstWithMsg.id : null;
  });
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);

  useEffect(() => {
    if (activeConv && !messages[activeConv]) {
      loadMessages(activeConv);
    }
  }, [activeConv, messages, loadMessages]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [locationShared, setLocationShared] = useState({});
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const conv = conversations.find(c => c.id === activeConv);
  const msgs = messages[activeConv] || [];
  const isTyping = typing[activeConv] || false;

  const listing = listings.find(l => l.id === conv?.listingId);
  // BUG-06 FIX: Removed `listing.seller === currentUser.name` — checking ownership by
  // name is dangerous (two users with the same name would both see seller controls).
  // Ownership must always be verified by ID.
  const isSeller = listing && currentUser && (
    listing.sellerId === currentUser._id || listing.sellerId === currentUser.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isTyping]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/home");
      triggerLoginModal("Please log in to view your messages.");
    }
  }, [isLoggedIn, navigate, triggerLoginModal]);


  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenu(null);
      setShowActionsMenu(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  function handleContextMenu(e, msg, isMe) {
    if (!isMe || msg.isDeleted || String(msg._id).startsWith("temp-")) return;
    e.preventDefault();
    
    // Calculate safe coordinates to prevent popup from going off-screen
    const menuWidth = 140; // approx width for w-32 + padding
    const menuHeight = 100;
    
    let x = e.clientX - 2;
    let y = e.clientY - 4;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({
      mouseX: x,
      mouseY: y,
      msgId: msg._id,
      text: msg.text,
      isLocation: msg.text.startsWith("[LOCATION]")
    });
  }

  function selectConv(id) {
    setActiveConv(id);
    markRead(id);
    setEditingMsgId(null);
    setInputText("");
    inputRef.current?.focus();
  }

  function handleSend() {
    if (!inputText.trim()) return;
    if (editingMsgId) {
      editMessage(editingMsgId, activeConv, inputText);
      setEditingMsgId(null);
    } else {
      sendMessage(activeConv, inputText);
    }
    setInputText("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleShareLocation() {
    if (locationShared[activeConv]) return;
    const { name, coords } = userLocation || {};
    const lat = coords?.[0] || 26.8467;
    const lng = coords?.[1] || 80.9462;
    const locName = name || "Hazratganj";
    
    sendMessage(activeConv, `[LOCATION]${lat},${lng},${locName}`);
    setLocationShared(p => ({ ...p, [activeConv]: true }));
    showToast("Location shared!", "info");
  }

  function renderMessageContent(text) {
    if (!text) return text;
    if (text.startsWith("[LOCATION]")) {
      const parts = text.replace("[LOCATION]", "").split(",");
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      const name = parts.slice(2).join(",");
      if (!isNaN(lat) && !isNaN(lng)) {
        return (
          <a 
            href={`https://www.google.com/maps?q=${lat},${lng}`} 
            target="_blank" 
            rel="noreferrer"
            className="block w-72 h-56 sm:w-96 sm:h-72 rounded-xl overflow-hidden flex flex-col shadow-md ring-4 ring-blue-500 bg-white hover:opacity-95 transition-opacity m-1"
          >
            <div className="flex-1 w-full relative pointer-events-none">
              <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
            <div className="bg-white px-3 py-2 text-sm text-gray-800 font-medium truncate border-t border-gray-100 flex items-center gap-1.5 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {name}
            </div>
          </a>
        );
      }
    }
    return text;
  }

  const filtered = conversations.filter(c => {
    // Hide empty conversations unless it is the currently active one
    const hasMessage = !!c.lastMessage;
    if (!hasMessage && c.id !== activeConv) return false;

    return c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.item.toLowerCase().includes(search.toLowerCase());
  });
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="page-enter flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Chat layout: full remaining height */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 58px)" }}>

        {/* ── Left: Conversation list ── */}
        <div className={`conv-sidebar ${activeConv ? 'hidden-mobile' : ''}`}>

          {/* Header */}
          <div className="conv-header">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold text-gray-900">Messages</p>
              {totalUnread > 0 && <span className="badge badge-blue">{totalUnread} new</span>}
            </div>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                className="input text-sm"
                style={{ paddingLeft: 30 }}
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="conv-list-scroll">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <p className="text-sm">No conversations found</p>
              </div>
            ) : filtered.map(c => (
              <div
                key={c.id}
                id={`conv-${c.id}`}
                className={`conv-item${c.id === activeConv ? " active" : ""}`}
                onClick={() => selectConv(c.id)}
              >
                <div className="conv-avatar-wrap">
                  <div className="conv-avatar">
                    <img src={c.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  {c.online && <div className="online-indicator" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-sm truncate ${c.unread > 0 ? "font-bold" : "font-semibold"} ${c.id === activeConv ? "text-blue-600" : "text-gray-900"}`}>
                      {c.name}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">{c.time}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-xs text-gray-500 truncate flex-1">{c.item} · {c.price}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400 truncate flex-1">{c.preview}</p>
                    {c.unread > 0 && <span className="unread-count">{c.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Chat Area ── */}
        <div className={`chat-main ${!activeConv ? 'hidden-mobile' : ''}`}>
          {conv ? (
            <>
              {/* Combined Chat Header */}
              {/* Combined Chat Header */}
              <div className="chat-header flex items-center justify-between gap-1 sm:gap-2 p-2 sm:p-3 border-b border-gray-100 min-h-[60px]">
                {/* Left: Back btn + User Info */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
                  {/* Mobile Back Button */}
                  <button className="md:hidden text-gray-500 hover:text-gray-900 p-1 shrink-0 -ml-1 transition-colors" onClick={() => selectConv(null)}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="chat-avatar-sm shrink-0 shadow-sm" style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden' }}>
                    <img src={conv.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{conv.name}</p>
                    <p className={`text-[11px] sm:text-xs flex items-center gap-1 mt-0.5 ${conv.online ? "text-green-600 font-medium" : "text-gray-400"}`}>
                      <span className={`online-dot ${conv.online ? "online-dot-on" : "online-dot-off"}`} />
                      {conv.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Middle: Item Info (Desktop only) */}
                <div className="hidden md:flex items-center gap-3 shrink-0 px-4 border-l border-gray-200 min-w-0">
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                    <img src={conv.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{conv.item}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-blue-600">{conv.price}</p>
                      {conv.sold && <span className="badge badge-green px-1.5 py-0.5" style={{fontSize: 10}}>Sold</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Actions Dropdown */}
                <div className="relative shrink-0 ml-auto">
                  <button 
                    className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(!showActionsMenu);
                      setContextMenu(null);
                    }}
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showActionsMenu && (
                    <div 
                      className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-1.5 z-50 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                        onClick={() => {
                          navigate(`/listing?id=${conv.listingId}`);
                          setShowActionsMenu(false);
                        }}
                      >
                        <svg className="text-gray-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        View Listing
                      </button>
                      
                      {isSeller && (
                        <>
                          <button 
                            className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2.5 ${conv.sold ? 'text-amber-600 hover:bg-amber-50' : 'text-blue-600 hover:bg-blue-50'}`}
                            onClick={() => {
                              toggleSold(activeConv);
                              showToast(conv.sold ? "Listing marked as active" : "Listing marked as sold!", conv.sold ? "info" : "success");
                              setShowActionsMenu(false);
                            }}
                          >
                            <svg className={conv.sold ? 'text-amber-500' : 'text-blue-500'} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {conv.sold ? "Mark as Active" : "Mark as Sold"}
                          </button>
                          
                          <button 
                            className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2.5 ${locationShared[activeConv] ? 'text-gray-400 bg-gray-50' : 'text-green-600 hover:bg-green-50'}`}
                            onClick={() => {
                              handleShareLocation();
                              setShowActionsMenu(false);
                            }}
                          >
                            <svg className={locationShared[activeConv] ? 'text-gray-400' : 'text-green-500'} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {locationShared[activeConv] ? "Location Sent" : "Share Location"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {msgs.map((msg, idx) => {
                  const timeSep = getTimeSep(msgs, idx);
                  const senderId = msg.sender?._id || msg.sender;
                  const currentUserId = currentUser?._id || currentUser?.id;
                  const isMe = senderId === currentUserId;
                  const prevSenderId = idx > 0 ? (msgs[idx - 1].sender?._id || msgs[idx - 1].sender) : null;
                  const showAvtr = !isMe && (idx === 0 || prevSenderId !== senderId);

                  return (
                    <div key={msg._id || idx}>
                      {timeSep && idx > 0 && (
                        <div className="text-center my-2">
                          <span className="time-sep-label">{timeSep}</span>
                        </div>
                      )}
                      <div className={isMe ? "msg-me" : "msg-other"}>
                        {!isMe && (
                          <div className="w-[26px] shrink-0">
                            {showAvtr && <div className="avatar-initials">{conv.initials}</div>}
                          </div>
                        )}
                        <div onContextMenu={(e) => handleContextMenu(e, msg, isMe)} className={isMe ? "cursor-context-menu" : ""}>
                          <div className={isMe ? "bubble-me" : "bubble-other"} style={msg.text?.startsWith("[LOCATION]") ? { padding: 0, overflow: "hidden", border: "none", background: "none" } : {}}>
                            {msg.isDeleted ? (
                              <span className="italic opacity-70">🚫 This message was deleted</span>
                            ) : (
                              renderMessageContent(msg.text)
                            )}
                          </div>
                          <div className={`msg-meta ${isMe ? "justify-end" : "justify-start"}`}>
                            <p className="text-xs text-gray-400">{formatTime(msg.createdAt)}</p>
                            {msg.isEdited && !msg.isDeleted && <span className="text-xs text-gray-400 italic ml-1">(edited)</span>}
                            {isMe && <span className="msg-status">{msg.readBy && msg.readBy.length > 0 ? "read" : "sent"}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="msg-other">
                    <div className="avatar-initials shrink-0">{conv.initials}</div>
                    <div className="typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="chat-input-bar relative">
                {editingMsgId && (
                  <div className="absolute -top-10 left-4 text-xs text-blue-600 flex items-center gap-2 bg-white px-3 py-1.5 rounded-md shadow-md border border-blue-100 font-medium">
                    <span>Editing message</span>
                    <button onClick={() => { setEditingMsgId(null); setInputText(""); }} className="ml-2 font-bold text-gray-400 hover:text-gray-800 transition-colors">✕</button>
                  </div>
                )}
                <input
                  id="message-input"
                  ref={inputRef}
                  type="text"
                  placeholder={`Message ${conv.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  className="input flex-1 text-sm rounded-full bg-gray-50"
                />

                <button
                  id="send-btn"
                  onClick={handleSend}
                  className={`send-btn ${inputText.trim() ? "send-btn-on" : "send-btn-off"}`}
                >
                  <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <p className="text-lg font-bold text-gray-700 mb-1">
                {conversations.length === 0 ? "No messages yet" : "Select a conversation"}
              </p>
              <p className="text-sm text-gray-400 text-center max-w-[280px] leading-relaxed">
                {conversations.length === 0
                  ? "When you contact a seller, conversations will appear here."
                  : "Choose a conversation from the list to start chatting."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white shadow-xl rounded-md border border-gray-100 z-50 overflow-hidden w-32"
          style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
        >
          {!contextMenu.isLocation && (
            <div 
              className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer font-medium text-gray-700"
              onClick={() => {
                setEditingMsgId(contextMenu.msgId);
                setInputText(contextMenu.text);
                setContextMenu(null); // BUG-18 FIX: Explicitly close menu on action click
                inputRef.current?.focus();
              }}
            >
              Edit
            </div>
          )}
          <div 
            className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer font-medium border-t border-gray-100"
            onClick={() => {
              setMessageToDelete(contextMenu.msgId);
              setContextMenu(null); // BUG-18 FIX: Explicitly close menu on action click
            }}
          >
            Delete
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {messageToDelete && (
        <>
          <div className="modal-overlay" onClick={() => setMessageToDelete(null)} />
          <div className="modal-wrap">
            <div className="modal-card" style={{ maxWidth: "400px" }}>
              <div className="modal-body p-6 text-center">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-4 border border-red-100 dark:border-red-900/40">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Message</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button className="btn btn-secondary flex-1 rounded-xl justify-center font-bold" onClick={() => setMessageToDelete(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger flex-1 rounded-xl justify-center font-bold" onClick={() => {
                    deleteMessage(messageToDelete, activeConv);
                    setMessageToDelete(null);
                  }}>
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
