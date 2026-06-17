import { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── All Listings (single source of truth) ─────────────────
export const ALL_LISTINGS = [
  { id: 1, title: "Sony WH-1000XM4 Wireless Headphones", price: 5500, priceLabel: "₹5,500", distance: 2.1, distLabel: "2.1 km", condition: "Like new", category: "Electronics", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85", listedAgo: "2 days ago", location: "Hazratganj" },
  { id: 2, title: "iPhone 12 Pro (128GB)", price: 42000, priceLabel: "₹42,000", distance: 0.8, distLabel: "0.8 km", condition: "Good", category: "Electronics", img: "https://citizenside.com/wp-content/uploads/2024/03/iphone-12-pro-max-unlock-unlocking-iphone-12-pro-max-1709543027.jpg", listedAgo: "1 day ago", location: "Gomti Nagar" },
  { id: 3, title: 'Dell Inspiron 15" Laptop', price: 28000, priceLabel: "₹28,000", distance: 1.5, distLabel: "1.5 km", condition: "Good", category: "Electronics", img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=85", listedAgo: "3 days ago", location: "Aliganj" },
  { id: 4, title: "Wooden Study Chair", price: 3200, priceLabel: "₹3,200", distance: 0.5, distLabel: "0.5 km", condition: "Like new", category: "Furniture", img: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=85", listedAgo: "5 days ago", location: "Indira Nagar" },
  { id: 5, title: "IKEA Coffee Table", price: 4500, priceLabel: "₹4,500", distance: 1.3, distLabel: "1.3 km", condition: "Good", category: "Furniture", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=85", listedAgo: "1 week ago", location: "Vikas Nagar" },
  { id: 6, title: "Nike Air Jordan Shoes (Size 42)", price: 6000, priceLabel: "₹6,000", distance: 1.1, distLabel: "1.1 km", condition: "Like new", category: "Clothing", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85", listedAgo: "4 days ago", location: "Hazratganj" },
  { id: 7, title: "Levi's 511 Slim Jeans (32x32)", price: 1800, priceLabel: "₹1,800", distance: 2.4, distLabel: "2.4 km", condition: "Good", category: "Clothing", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85", listedAgo: "2 days ago", location: "Rajajipuram" },
  { id: 8, title: "NCERT Class 12 Complete Set", price: 800, priceLabel: "₹800", distance: 0.4, distLabel: "0.4 km", condition: "Good", category: "Books", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85", listedAgo: "6 days ago", location: "Hazratganj" },
  { id: 9, title: "Atomic Habits — James Clear", price: 220, priceLabel: "₹220", distance: 0.9, distLabel: "0.9 km", condition: "Like new", category: "Books", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=85", listedAgo: "3 days ago", location: "Gomti Nagar" },
  { id: 10, title: 'Trek MTB 21-speed 26"', price: 12000, priceLabel: "₹12,000", distance: 1.2, distLabel: "1.2 km", condition: "Good", category: "Vehicles", img: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=85", listedAgo: "5 days ago", location: "Aliganj" },
  { id: 11, title: "Cosco Football Size 5", price: 650, priceLabel: "₹650", distance: 0.6, distLabel: "0.6 km", condition: "Like new", category: "Sports", img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=85", listedAgo: "1 day ago", location: "Hazratganj" },
  { id: 12, title: "Instant Pot 6 Qt Pressure Cooker", price: 4200, priceLabel: "₹4,200", distance: 1.8, distLabel: "1.8 km", condition: "Like new", category: "Kitchen", img: "https://cb.scene7.com/is/image/Crate/InstantPt6qDPSPrsCkAV2SHS22_VND?$web_pdp_main_carousel_med$", listedAgo: "2 days ago", location: "Indira Nagar" },
];

// ─── Detailed product data ──────────────────────────────────
export const PRODUCTS_DETAIL = {
  1: { originalPrice: "₹29,990", brand: "Sony", model: "WH-1000XM4", age: "6 months", colour: "Black", warranty: "No", phone: "+91 98765 43210", seller: "Rahul Kumar", sellerInitials: "RK", thumb2: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=85", description: "Bought 6 months ago, barely used at home. Comes with original box, USB-C cable, 3.5mm cable, and carry case. Battery life is still excellent (28+ hrs per charge). Industry-leading noise cancellation works perfectly. Selling because I upgraded to the XM5." },
  2: { originalPrice: "₹1,19,900", brand: "Apple", model: "iPhone 12 Pro", age: "1.5 years", colour: "Pacific Blue", warranty: "No", phone: "+91 91234 56789", seller: "Priya Verma", sellerInitials: "PV", thumb2: "https://images.unsplash.com/photo-1574755393849-623942496936?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=85", description: "Used iPhone 12 Pro in excellent condition. Minor micro-scratches on back, screen is perfect. Comes with original charger and box. Battery health is at 87%." },
  3: { originalPrice: "₹52,000", brand: "Dell", model: "Inspiron 15", age: "2 years", colour: "Silver", warranty: "3 months remaining", phone: "+91 99887 76655", seller: "Amit Sharma", sellerInitials: "AS", thumb2: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=85", description: "Dell Inspiron laptop with Core i5 processor, 8GB RAM and 512GB SSD. Works perfectly for office work, coding, and everyday tasks. Comes with original charger." },
  4: { originalPrice: "₹7,500", brand: "Featherlite", model: "Study Pro", age: "8 months", colour: "Walnut Brown", warranty: "No", phone: "+91 98000 11223", seller: "Sneha Gupta", sellerInitials: "SG", thumb2: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85", description: "Comfortable ergonomic wooden study chair in near-mint condition. Height adjustable and has lumbar support cushion. Perfect for long study or work sessions." },
  5: { originalPrice: "₹8,999", brand: "IKEA", model: "LACK", age: "1 year", colour: "White", warranty: "No", phone: "+91 97777 88888", seller: "Rohan Das", sellerInitials: "RD", thumb2: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=85", description: "IKEA LACK coffee table with lower shelf for extra storage. Minor scuff on one leg, otherwise in good condition. Dismantled and ready to pickup." },
  6: { originalPrice: "₹11,495", brand: "Nike", model: "Air Jordan 1", age: "4 months", colour: "White/Black/Red", warranty: "No", phone: "+91 93456 78901", seller: "Aman Khanna", sellerInitials: "AK", thumb2: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85", description: "Barely worn Air Jordan 1 Retro. Wore only twice to indoor events. Still looks and smells brand new. Original box included." },
  7: { originalPrice: "₹3,999", brand: "Levi's", model: "511 Slim", age: "1 year", colour: "Dark Indigo", warranty: "No", phone: "+91 91111 22222", seller: "Pooja Singh", sellerInitials: "PS", thumb2: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85", description: "Classic Levi's 511 slim fit jeans in dark wash. Only slight fading, no tears or holes. Washed and ready. Great everyday jeans." },
  8: { originalPrice: "₹1,800", brand: "NCERT", model: "Class 12", age: "1 year", colour: "Various", warranty: "N/A", phone: "+91 98000 11223", seller: "Sneha Gupta", sellerInitials: "SG", thumb2: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=85", description: "Complete set of NCERT textbooks for Class 12 (Physics, Chemistry, Maths, Bio, English). Some books have light pencil notes. Great for JEE/NEET prep." },
  9: { originalPrice: "₹499", brand: "Penguin", model: "Hardcover", age: "5 months", colour: "—", warranty: "N/A", phone: "+91 95555 66666", seller: "Karan Mehta", sellerInitials: "KM", thumb2: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=85", description: "Atomic Habits hardcover, read once. No dog-ears, no highlighting. One of the best books on habits and self-improvement. Selling because I have a digital copy." },
  10: { originalPrice: "₹22,000", brand: "Trek", model: "Marlin 5", age: "2 years", colour: "Matte Black", warranty: "No", phone: "+91 90000 12345", seller: "Priya Sharma", sellerInitials: "PS", thumb2: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=85", description: "Trek Marlin 5 mountain bike with 21-speed Shimano gears. Recently serviced — new brake pads, tires in good shape. Great for city riding and light trails." },
  11: { originalPrice: "₹1,200", brand: "Cosco", model: "Tornado", age: "3 months", colour: "Black & White", warranty: "No", phone: "+91 98765 43210", seller: "Rahul Kumar", sellerInitials: "RK", thumb2: "https://facts.net/wp-content/uploads/2023/07/16-facts-about-football-1689928910.jpg", thumb3: "https://static.vecteezy.com/system/resources/thumbnails/002/977/419/original/soccer-ball-on-the-football-field-background-free-video.jpg", description: "Cosco match quality football, used only a handful of times at indoor turf. No visible wear. Pumped and ready to play. Great price." },
  12: { originalPrice: "₹8,995", brand: "Instant Pot", model: "Duo 6 Qt", age: "9 months", colour: "Stainless Steel", warranty: "1 year remaining", phone: "+91 99999 00000", seller: "Meera Joshi", sellerInitials: "MJ", thumb2: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85", thumb3: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85", description: "Instant Pot 7-in-1 multi-cooker. Used occasionally, always cleaned thoroughly. Comes with original lid, inner pot and all accessories. Works perfectly." },
};

// ─── Conversations ──────────────────────────────────────────
// TODO(backend): Replace INIT_CONVERSATIONS with an API call, e.g.:
//   const { data } = await fetch("/api/conversations");
//   setConversations(data);
// Each conversation object shape:
//   { id, name, initials, item, price, preview, time, unread, img, online, sold, listingId }
const INIT_CONVERSATIONS = [];

// TODO(backend): Replace INIT_MESSAGES with an API call, e.g.:
//   const { data } = await fetch(`/api/conversations/${convId}/messages`);
//   setMessages(prev => ({ ...prev, [convId]: data }));
// Each message object shape:
//   { id, sender ("me" | "other"), text, time, read }
const INIT_MESSAGES = {};

// ─── Auto-reply pool ────────────────────────────────────────
const AUTO_REPLIES = [
  "Sure, that works for me!",
  "Can we meet at Hazratganj metro station?",
  "The item is exactly as described, you'll love it.",
  "I'm available tomorrow morning if that works?",
  "Is there any flexibility on the price?",
  "Can you share more photos?",
  "I can do cash on delivery.",
  "Let me check and get back to you.",
];

// ─── Context ────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser] = useState({
    name: "Rahul Kumar", initials: "RK", email: "rahul.kumar@gmail.com",
    phone: "+91 98765 43210", location: "Hazratganj, Lucknow",
    avatar: null, joinedYear: "2024", sold: 18, active: 5, response: "98%",
  });

  const [wishlist, setWishlist] = useState([1, 6]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ name: "Hazratganj", radius: "5 km", coords: [26.8467, 80.9462] });
  const [filters, setFilters] = useState({
    category: "All listings", radius: "5 km",
    conditions: ["Like new", "Good", "Fair"], priceMax: 250000,
  });

  const [conversations, setConversations] = useState(INIT_CONVERSATIONS);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [typing, setTyping] = useState({});

  // ── Toast system ────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, duration);
  }, []);

  // ── Wishlist toggle ─────────────────────────────────────
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const toggleWishlist = useCallback((id) => {
    const isAdding = !wishlistRef.current.includes(id);
    setWishlist(prev => isAdding ? [...prev, id] : prev.filter(x => x !== id));
    showToast(
      isAdding ? "Added to wishlist" : "Removed from wishlist",
      isAdding ? "success" : "info"
    );
  }, [showToast]);

  // ── Send message ────────────────────────────────────────
  const sendMessage = useCallback((convId, text) => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { id: Date.now(), sender: "me", text: text.trim(), time: timeStr, read: false };

    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), newMsg] }));
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, preview: text.trim(), time: "now", unread: 0 } : c)
    );

    // Simulate "other is typing" after 800ms, then auto-reply after 2s
    setTimeout(() => setTyping(prev => ({ ...prev, [convId]: true })), 800);
    setTimeout(() => {
      setTyping(prev => ({ ...prev, [convId]: false }));
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const replyMsg = { id: Date.now() + 1, sender: "other", text: reply, time: replyTime, read: true };
      setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), replyMsg] }));
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, preview: reply, time: replyTime } : c)
      );
    }, 2500);
  }, []);

  // ── Mark conv as read ────────────────────────────────────
  const markRead = useCallback((convId) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unread: 0 } : c)
    );
  }, []);

  // ── Mark sold ────────────────────────────────────────────
  const toggleSold = useCallback((convId) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, sold: !c.sold } : c)
    );
  }, []);

  // ── Start new chat from listing ──────────────────────────
  const startChat = useCallback((listing) => {
    const exists = conversations.find(c => c.listingId === listing.id);
    if (exists) return exists.id;
    const detail = PRODUCTS_DETAIL[listing.id];
    const newConv = {
      id: Date.now(), name: detail?.seller || "Seller",
      initials: detail?.sellerInitials || "S",
      item: listing.title, price: listing.priceLabel,
      preview: "New conversation", time: "now", unread: 0,
      img: listing.img, online: false, sold: false, listingId: listing.id,
    };
    setConversations(prev => [newConv, ...prev]);
    setMessages(prev => ({ ...prev, [newConv.id]: [] }));
    return newConv.id;
  }, [conversations]);

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const value = {
    currentUser, wishlist, toggleWishlist,
    listings: ALL_LISTINGS, searchQuery, setSearchQuery,
    filters, setFilters,
    isLoggedIn, login, logout,
    showLoginModal, setShowLoginModal,
    showLocationModal, setShowLocationModal,
    userLocation, setUserLocation,
    conversations, messages, typing,
    sendMessage, markRead, toggleSold, startChat,
    toasts, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
