import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";


function getTimeSep(msgs, idx) {
  if (idx === 0) return msgs[idx].time;
  const prev = msgs[idx - 1];
  const cur  = msgs[idx];
  return prev.time === cur.time ? null : cur.time;
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initConvId = Number(searchParams.get("conv")) || null;

  const { conversations, messages, typing, sendMessage, markRead, toggleSold, showToast } = useApp();
  const [activeConv, setActiveConv] = useState(initConvId || conversations[0]?.id || null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [locationShared, setLocationShared] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const emojiRef       = useRef(null);

  const conv = conversations.find(c => c.id === activeConv);
  const msgs = messages[activeConv] || [];
  const isTyping = typing[activeConv] || false;

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isTyping]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handle(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function selectConv(id) {
    setActiveConv(id);
    markRead(id);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  function handleSend() {
    if (!inputText.trim()) return;
    sendMessage(activeConv, inputText);
    setInputText("");
    setShowEmoji(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleShareLocation() {
    if (locationShared[activeConv]) return;
    sendMessage(activeConv, "Meet me at: Hazratganj, Lucknow — near the clock tower. Available after 5 PM.");
    setLocationShared(p => ({ ...p, [activeConv]: true }));
    showToast("Location shared!", "info");
  }

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.item.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }} className="page-enter">
      <Navbar />

      {/* TODO(backend): On mount, fetch conversations: GET /api/conversations
          Then for active conv, fetch messages: GET /api/conversations/:id/messages
          Use WebSocket/SSE for real-time new messages */}
      <div style={{ flex: 1, width: "100%", display: "flex", height: "calc(100vh - var(--navbar-h))", overflow: "hidden" }}>

        {/* ═══ Left: Conversation List ═══ */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: "1px solid var(--gray-200)",
          display: "flex", flexDirection: "column", background: "#fff"
        }}>

          {/* Header */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--gray-100)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--gray-900)" }}>Messages</p>
              {totalUnread > 0 && (
                <span className="badge badge-blue">{totalUnread} new</span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="13" height="13" fill="none" stroke="var(--gray-400)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                className="input"
                style={{ paddingLeft: 30, fontSize: 13 }}
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--gray-400)" }}>
                <p>No conversations found</p>
              </div>
            ) : filtered.map(c => (
              <div
                key={c.id}
                id={`conv-${c.id}`}
                onClick={() => selectConv(c.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px", cursor: "pointer",
                  borderBottom: "1px solid var(--gray-50)",
                  borderLeft: `3px solid ${c.id === activeConv ? "var(--blue-600)" : "transparent"}`,
                  background: c.id === activeConv ? "var(--blue-50)" : "#fff",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => { if (c.id !== activeConv) e.currentTarget.style.background = "var(--gray-50)"; }}
                onMouseLeave={e => { if (c.id !== activeConv) e.currentTarget.style.background = "#fff"; }}
              >
                {/* Avatar with online dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, background: "var(--gray-100)", borderRadius: 10, overflow: "hidden" }}>
                    <img src={c.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {c.online && (
                    <div style={{
                      position: "absolute", bottom: -1, right: -1, width: 11, height: 11,
                      background: "var(--green-500)", border: "2px solid #fff", borderRadius: "50%"
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <p style={{
                      fontSize: 13.5, fontWeight: c.unread > 0 ? 700 : 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: c.id === activeConv ? "var(--blue-600)" : "var(--gray-900)"
                    }}>{c.name}</p>
                    <span style={{ fontSize: 11, color: "var(--gray-400)", flexShrink: 0, marginLeft: 4 }}>{c.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <p style={{ fontSize: 11.5, color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {c.item} · {c.price}
                    </p>
                    {c.sold && <span className="badge badge-green" style={{ fontSize: 9, padding: "1px 5px", flexShrink: 0 }}>SOLD</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 11.5, color: "var(--gray-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {c.preview}
                    </p>
                    {c.unread > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, background: "var(--blue-600)", color: "#fff",
                        fontSize: 10, fontWeight: 700, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginLeft: 4, padding: "0 4px"
                      }}>{c.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Right: Chat Area ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#fff" }}>

          {conv ? (
            <>
              {/* Chat header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", borderBottom: "1px solid var(--gray-100)", flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", background: "var(--gray-100)" }}>
                    <img src={conv.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)" }}>{conv.name}</p>
                    <p style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, color: conv.online ? "var(--green-600)" : "var(--gray-400)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: conv.online ? "var(--green-500)" : "var(--gray-300)", display: "inline-block" }} />
                      {conv.online ? "Online now" : "Offline"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="btn-icon"
                    title="Voice call"
                    onClick={() => showToast("Voice call feature coming soon!", "info")}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/listing?id=${conv.listingId}`)}>
                    View listing
                  </button>
                </div>
              </div>

              {/* Item banner */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px", background: "var(--gray-50)", borderBottom: "1px solid var(--gray-100)", flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "var(--gray-100)", flexShrink: 0 }}>
                    <img src={conv.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-800)" }}>{conv.item}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--blue-600)" }}>{conv.price}</p>
                  </div>
                  {conv.sold && <span className="badge badge-green" style={{ marginLeft: 8 }}>Sold</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    id="mark-sold-btn"
                    className={`btn btn-sm ${conv.sold ? "btn-secondary" : "btn-primary"}`}
                    onClick={() => {
                      toggleSold(activeConv);
                      showToast(conv.sold ? "Listing marked as active" : "Listing marked as sold!", conv.sold ? "info" : "success");
                    }}
                    style={{ background: conv.sold ? "var(--green-50)" : "var(--blue-600)", color: conv.sold ? "var(--green-600)" : "#fff", border: conv.sold ? "1.5px solid var(--green-100)" : "none" }}
                  >
                    {conv.sold ? "Sold" : "Mark sold"}
                  </button>
                  <button
                    id="share-location-btn"
                    className="btn btn-secondary btn-sm"
                    onClick={handleShareLocation}
                    style={{ color: locationShared[activeConv] ? "var(--green-600)" : undefined }}
                  >
                    {locationShared[activeConv] ? "Sent" : "Share location"}
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: "auto", padding: "20px 24px",
                display: "flex", flexDirection: "column", gap: 12,
                background: "var(--bg)"
              }}>
                {msgs.map((msg, idx) => {
                  const timeSep = getTimeSep(msgs, idx);
                  const isMe = msg.sender === "me";
                  const showAvatar = !isMe && (idx === 0 || msgs[idx - 1].sender !== "other");

                  return (
                    <div key={msg.id}>
                      {/* Time separator */}
                      {timeSep && idx > 0 && (
                        <div style={{ textAlign: "center", margin: "8px 0" }}>
                          <span style={{ fontSize: 11, color: "var(--gray-400)", background: "var(--gray-100)", padding: "2px 10px", borderRadius: "var(--radius-full)" }}>
                            {timeSep}
                          </span>
                        </div>
                      )}

                      <div style={{
                        display: "flex", alignItems: "flex-end", gap: 8,
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        animation: "fadeIn 0.2s ease"
                      }}>
                        {/* Other avatar */}
                        {!isMe && (
                          <div style={{ width: 28, flexShrink: 0 }}>
                            {showAvatar && (
                              <div style={{
                                width: 28, height: 28, background: "var(--blue-100)", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: "var(--blue-600)"
                              }}>
                                {conv.initials}
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <div style={{
                            maxWidth: 360, padding: "10px 14px", fontSize: 13.5, lineHeight: 1.55,
                            borderRadius: isMe ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                            background: isMe ? "var(--blue-600)" : "#fff",
                            color: isMe ? "#fff" : "var(--gray-900)",
                            border: !isMe ? "1px solid var(--gray-200)" : "none",
                          }}>
                            {msg.text}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            <p style={{ fontSize: 11, color: "var(--gray-400)" }}>{msg.time}</p>
                            {isMe && (
                              <span style={{ fontSize: 11, color: "var(--blue-300)", fontWeight: 600 }}>
                                {msg.read ? "read" : "sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeIn 0.2s ease" }}>
                    <div style={{
                      width: 28, height: 28, background: "var(--blue-100)", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--blue-600)", flexShrink: 0
                    }}>{conv.initials}</div>
                    <div style={{
                      padding: "12px 16px", background: "#fff", border: "1px solid var(--gray-200)",
                      borderRadius: "4px 16px 16px 16px", display: "flex", gap: 4, alignItems: "center"
                    }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: "12px 20px", borderTop: "1px solid var(--gray-200)",
                display: "flex", alignItems: "center", gap: 10, background: "#fff", flexShrink: 0, position: "relative"
              }}>

                {/* Emoji picker */}
                <div ref={emojiRef} style={{ position: "relative" }}>
                  <button
                    id="emoji-btn"
                    className="btn-icon"
                    style={{ border: "none", width: 34, height: 34, fontSize: 18 }}
                    onClick={() => setShowEmoji(v => !v)}
                    title="Emoji"
                  >
                    EM
                  </button>
                  {showEmoji && (
                    <div className="emoji-picker">
                      {EMOJIS.map(e => (
                        <button
                          key={e}
                          className="emoji-btn"
                          onClick={() => { setInputText(t => t + e); inputRef.current?.focus(); }}
                        >{e}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attach */}
                <button
                  id="attach-btn"
                  className="btn-icon"
                  style={{ border: "none", width: 34, height: 34 }}
                  onClick={() => showToast("File attachment coming soon!", "info")}
                  title="Attach file"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Text input */}
                <input
                  id="message-input"
                  ref={inputRef}
                  type="text"
                  placeholder={`Message ${conv.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  style={{
                    flex: 1, padding: "9px 16px", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-full)", fontSize: 13.5, outline: "none",
                    color: "var(--gray-900)", transition: "var(--transition)", fontFamily: "inherit"
                  }}
                  onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "var(--blue-600)"; e.target.style.boxShadow = "0 0 0 3px rgba(2,132,199,0.10)"; }}
                  onBlur={e => { e.target.style.background = "var(--gray-50)"; e.target.style.borderColor = "var(--gray-200)"; e.target.style.boxShadow = "none"; }}
                />

                {/* Send button */}
                <button
                  id="send-btn"
                  onClick={handleSend}
                  style={{
                    width: 40, height: 40, background: inputText.trim() ? "var(--blue-600)" : "var(--gray-200)",
                    border: "none", borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: inputText.trim() ? "pointer" : "default",
                    flexShrink: 0, transition: "all 0.15s"
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* Empty state — shown when no conversation is selected or list is empty */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--gray-400)", gap: 8 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}></div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--gray-700)", marginBottom: 4 }}>
                {conversations.length === 0 ? "No messages yet" : "Select a conversation"}
              </p>
              <p style={{ fontSize: 13.5, color: "var(--gray-400)", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
                {conversations.length === 0
                  ? "When you contact a seller or a buyer messages you, conversations will appear here."
                  : "Choose a conversation from the list to start chatting."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
