import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";


function getTimeSep(msgs, idx) {
  if (idx === 0) return msgs[idx].time;
  return msgs[idx - 1].time === msgs[idx].time ? null : msgs[idx].time;
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initConvId = Number(searchParams.get("conv")) || null;

  const { conversations, messages, typing, sendMessage, markRead, toggleSold, showToast } = useApp();
  const [activeConv, setActiveConv] = useState(initConvId || conversations[0]?.id || null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [locationShared, setLocationShared] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const conv = conversations.find(c => c.id === activeConv);
  const msgs = messages[activeConv] || [];
  const isTyping = typing[activeConv] || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isTyping]);


  function selectConv(id) {
    setActiveConv(id);
    markRead(id);
    inputRef.current?.focus();
  }

  function handleSend() {
    if (!inputText.trim()) return;
    sendMessage(activeConv, inputText);
    setInputText("");
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
    <div className="page-enter flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Chat layout: full remaining height */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 58px)" }}>

        {/* ── Left: Conversation list ── */}
        <div className="conv-sidebar">

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
                    <p className={`text-sm truncate ${c.unread > 0 ? "font-bold" : "font-semibold"} ${c.id === activeConv ? "text-sky-600" : "text-gray-900"}`}>
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
        <div className="chat-main">
          {conv ? (
            <>
              {/* Chat header */}
              <div className="chat-header">
                <div className="flex items-center gap-2.5">
                  <div className="chat-avatar-sm">
                    <img src={conv.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{conv.name}</p>
                    <p className={`text-xs flex items-center gap-1 ${conv.online ? "text-green-600" : "text-gray-400"}`}>
                      <span className={`online-dot ${conv.online ? "online-dot-on" : "online-dot-off"}`} />
                      {conv.online ? "Online now" : "Offline"}
                    </p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/listing?id=${conv.listingId}`)}>
                  View listing
                </button>
              </div>

              {/* Item banner */}
              <div className="chat-item-banner">
                <div className="flex items-center gap-2.5">
                  <div className="chat-item-thumb">
                    <img src={conv.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{conv.item}</p>
                    <p className="text-sm font-bold text-sky-600">{conv.price}</p>
                  </div>
                  {conv.sold && <span className="badge badge-green ml-2">Sold</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    id="mark-sold-btn"
                    className={`btn btn-sm ${conv.sold ? "btn-secondary mark-sold-active" : "btn-primary"}`}
                    onClick={() => {
                      toggleSold(activeConv);
                      showToast(conv.sold ? "Listing marked as active" : "Listing marked as sold!", conv.sold ? "info" : "success");
                    }}
                  >
                    {conv.sold ? "Sold" : "Mark sold"}
                  </button>
                  <button
                    id="share-location-btn"
                    className={`btn btn-secondary btn-sm${locationShared[activeConv] ? " location-sent" : ""}`}
                    onClick={handleShareLocation}
                  >
                    {locationShared[activeConv] ? "Sent" : "Share location"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {msgs.map((msg, idx) => {
                  const timeSep = getTimeSep(msgs, idx);
                  const isMe = msg.sender === "me";
                  const showAvtr = !isMe && (idx === 0 || msgs[idx - 1].sender !== "other");

                  return (
                    <div key={msg.id}>
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
                        <div>
                          <div className={isMe ? "bubble-me" : "bubble-other"}>{msg.text}</div>
                          <div className={`msg-meta ${isMe ? "justify-end" : "justify-start"}`}>
                            <p className="text-xs text-gray-400">{msg.time}</p>
                            {isMe && <span className="msg-status">{msg.read ? "read" : "sent"}</span>}
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
              <div className="chat-input-bar">
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
    </div>
  );
}
