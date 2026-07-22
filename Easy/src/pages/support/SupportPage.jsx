import { useState } from "react";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";

export default function SupportPage() {
  const { showToast, currentUser } = useApp();

  // Tab state: "chat" | "faqs" | "ticket"
  const [activeTab, setActiveTab] = useState("chat");

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      id: "bot-1",
      sender: "bot",
      text: "Hi! Welcome to Easy LocalSell Customer Support. How can we help you today?",
      time: "Just now",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Ticket Form State
  const [ticketCategory, setTicketCategory] = useState("General Query");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const FAQS = [
    {
      q: "How do I list an item for sale?",
      a: "Click on the 'Sell something' (+) button in the navbar or bottom navigation, fill in the item details, add photos, set a price, and click 'Publish listing'. Your listing will be visible immediately!",
    },
    {
      q: "Is buying and selling safe on Easy LocalSell?",
      a: "Yes! We recommend meeting sellers/buyers in safe, public places during daylight hours. Inspect the item thoroughly before making any cash or UPI payment.",
    },
    {
      q: "How do I chat with a buyer or seller?",
      a: "Click 'Chat with Seller' on any item page to open a direct messaging thread. You can negotiate prices, ask questions, and arrange meetings securely.",
    },
    {
      q: "How can I edit or delete my listing?",
      a: "Go to your Profile page, find your active listing, and click on 'Edit' or 'Delete' option.",
    },
    {
      q: "What should I do if I encounter a scammer or fake listing?",
      a: "Click the report button on the item page or contact Customer Support immediately through Live Chat or Ticket. We take swift action against fraudulent accounts.",
    },
  ];

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const userMsgObj = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsgObj]);
    setInputMsg("");
    setIsTyping(true);

    // Auto Bot Response Simulation
    setTimeout(() => {
      let replyText = "Thank you for reaching out! A support specialist is reviewing your message.";
      const lower = userText.toLowerCase();

      if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        replyText = "Hello! What can I help you with regarding your listings or purchases?";
      } else if (lower.includes("refund") || lower.includes("pay")) {
        replyText = "Payments & transactions are handled directly between buyers and sellers upon item inspection. Ensure you verify the item before paying.";
      } else if (lower.includes("sell") || lower.includes("post")) {
        replyText = "To sell an item, tap the '+' Sell button in the bottom navigation bar or header!";
      } else if (lower.includes("contact") || lower.includes("number") || lower.includes("call")) {
        replyText = "You can call our helpline at +91 1800-123-4567 or email support@easylocalsell.com.";
      }

      const botMsgObj = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, botMsgObj]);
      setIsTyping(false);
    }, 800);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      showToast("Please complete all required ticket fields.", "danger");
      return;
    }

    const ticketId = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketSubmitted({
      id: ticketId,
      category: ticketCategory,
      subject: ticketSubject,
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    });

    showToast("Support ticket raised successfully!", "success");
    setTicketSubject("");
    setTicketDescription("");
  };

  return (
    <div className="page-enter min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="max-w-[850px] mx-auto px-4 pt-4 sm:pt-6">

        {/* Header Hero */}
        <div className="support-hero">
          <div className="relative z-10 max-w-xl mx-auto">
            <span className="support-hero-icon">
              🎧
            </span>
            <h1 className="support-hero-title">How can we help you?</h1>
            <p className="support-hero-subtitle">
              We're here to help you buy, sell, and deal safely in your local marketplace.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-20 border-b border-gray-200 mb-8 pb-px overflow-x-auto scrollbar-hide px-2 sm:px-0">
          {[
            { id: "chat", label: "Live Chat" },
            { id: "faqs", label: "FAQs" },
            { id: "ticket", label: "Raise Ticket" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`tab-btn text-sm pb-3 px-2 font-semibold transition-all shrink-0 ${activeTab === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Live Chat ── */}
        {activeTab === "chat" && (
          <div className="support-chat-container">
            {/* Chat Header */}
            <div className="support-chat-header">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="support-chat-avatar">
                    ES
                  </div>
                  <span className="support-chat-status-dot" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Easy Support Assistant</h3>
                  <p className="text-[11px] text-green-500 font-bold uppercase tracking-wider">Online · Responds instantly</p>
                </div>
              </div>

              <div className="flex gap-2">
                <a href="tel:+9118001234567" className="support-call-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </a>
              </div>
            </div>

            {/* Chat Body */}
            <div className="support-chat-body flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <div
                    className={`support-chat-bubble px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.sender === "user"
                        ? "user"
                        : "bot"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 mt-1.5 px-1">{msg.time}</span>
                </div>
              ))}

              {isTyping && (
                <div className="support-typing-indicator mr-auto text-[11px] font-medium italic px-4 py-2 rounded-xl">
                  Assistant is typing…
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="support-chat-input-area p-3 flex gap-2">
              <input
                type="text"
                placeholder="Ask support anything..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="input flex-1 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button type="submit" className="btn btn-primary rounded-xl px-5 text-sm font-bold">
                Send
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: FAQs ── */}
        {activeTab === "faqs" && (
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="card p-4 rounded-2xl cursor-pointer transition-colors"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600 font-extrabold text-base">Q.</span>
                    {faq.q}
                  </h3>
                  <span className="text-gray-400 font-bold">{openFaq === idx ? "−" : "+"}</span>
                </div>

                {openFaq === idx && (
                  <p className="support-faq-answer text-xs mt-3 pt-3 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: Raise Ticket ── */}
        {activeTab === "ticket" && (
          <div className="support-ticket-container">
            {ticketSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-3">
                  ✓
                </div>
                <h3 className="support-ticket-success-title">Ticket Generated!</h3>
                <p className="text-xs text-gray-500 mb-4">Ticket ID: <span className="font-bold text-blue-600">{ticketSubmitted.id}</span></p>
                <p className="support-ticket-success-desc">
                  Our customer support team will investigate your request and respond to your email within 24 hours.
                </p>
                <button
                  onClick={() => setTicketSubmitted(null)}
                  className="btn btn-secondary btn-sm rounded-xl px-5 font-bold"
                >
                  + Raise Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="input-label mb-1 block">Issue Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="input w-full"
                  >
                    <option value="General Query">General Query</option>
                    <option value="Listing Issues">Listing Issues</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="Report Fraud / Scam">Report Fraud / Scam</option>
                  </select>
                </div>

                <div>
                  <label className="input-label mb-1 block">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the issue..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="input-label mb-1 block">Detailed Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about your query or report..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="input w-full resize-none"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm font-bold rounded-xl">
                  Submit Support Ticket →
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
