import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  fetchAllListings,
  createListing as apiCreateListing,
  updateListingAPI,
  deleteListingAPI,
  fetchUserProfile,
  updateUserProfileAPI,
  fetchConversations,
  fetchMessages,
  startConversation
} from "../services/api";
import { io } from "socket.io-client";

// ─── Context ────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const getInitialUser = () => {
    try {
      const saved = localStorage.getItem("currentUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  // BUG-21 FIX: Socket stored as ref inside component, not module-level variable.
  // Module-level let causes duplicate socket connections in React Strict Mode.
  const socketRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(getInitialUser());
  const [listings, setListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("currentUser"));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState("");

  const triggerLoginModal = useCallback((reason = "") => {
    setLoginReason(reason);
    setShowLoginModal(true);
  }, []);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ name: "Hazratganj", radius: "5 km", coords: [26.8467, 80.9462] });
  const [filters, setFilters] = useState({
    category: "All listings", radius: "5 km",
    conditions: ["New", "Like new", "Good", "Fair", "For parts"], priceMax: 250000,
  });

  // ── Theme ───────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // ── Messaging state ─────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // mapped by conversationId
  const [typing, setTyping] = useState({});

  // Socket and Messages Effect
  useEffect(() => {
    if (currentUser) {
      // BUG-21 FIX: Use socketRef.current instead of module-level `socket` variable
      socketRef.current = io(import.meta.env.VITE_API_BASE?.replace('/api', '') || "http://localhost:5000");
      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to socket server");
      });

      socket.on("receive_message", (message) => {
        const myId = currentUser._id || currentUser.id;
        const senderId = message.sender._id || message.sender;

        setMessages((prev) => {
          const msgs = prev[message.conversationId] || [];

          // Check if this is our own message that we optimistically added
          if (senderId === myId) {
            // Find a temp message with the same text
            const tempIndex = msgs.findIndex(m => String(m._id).startsWith("temp-") && m.text === message.text);
            if (tempIndex !== -1) {
              const newMsgs = [...msgs];
              newMsgs[tempIndex] = message; // Replace temp message with real one
              return { ...prev, [message.conversationId]: newMsgs };
            }
          }

          // Otherwise, just append it (avoid exact duplicates)
          if (msgs.some(m => m._id === message._id)) return prev;

          return {
            ...prev,
            [message.conversationId]: [...msgs, message]
          };
        });

        // BUG-04 FIX: Use String() for safe comparison to avoid ObjectId type mismatches
        setConversations(prev => prev.map(c =>
          String(c.id) === String(message.conversationId)
            ? {
                ...c,
                lastMessage: message,
                preview: message.isDeleted ? "🚫 This message was deleted" : message.text,
                unread: senderId === myId ? 0 : (c.unread || 0) + 1,
                time: "now"
              }
            : c
        ));
      });

      socket.on("message_edited", (updatedMessage) => {
        setMessages((prev) => {
          const msgs = prev[updatedMessage.conversationId] || [];
          const newMsgs = msgs.map(m => m._id === updatedMessage._id ? updatedMessage : m);
          return { ...prev, [updatedMessage.conversationId]: newMsgs };
        });

        // BUG-04 FIX: Use String() for safe comparison
        setConversations(prev => prev.map(c => {
          if (String(c.id) === String(updatedMessage.conversationId) && c.lastMessage?._id === updatedMessage._id) {
            return { ...c, lastMessage: updatedMessage, preview: updatedMessage.text };
          }
          return c;
        }));
      });

      socket.on("message_deleted", (deletedMessage) => {
        setMessages((prev) => {
          const msgs = prev[deletedMessage.conversationId] || [];
          const newMsgs = msgs.map(m => m._id === deletedMessage._id ? deletedMessage : m);
          return { ...prev, [deletedMessage.conversationId]: newMsgs };
        });

        // BUG-04 FIX: Use String() for safe comparison
        setConversations(prev => prev.map(c => {
          if (String(c.id) === String(deletedMessage.conversationId) && c.lastMessage?._id === deletedMessage._id) {
            return { ...c, lastMessage: deletedMessage, preview: "🚫 This message was deleted" };
          }
          return c;
        }));
      });

      // Load initial conversations
      fetchConversations(currentUser._id || currentUser.id).then(data => {
        // Map to expected format
        const mappedConvs = data.map(conv => ({
          ...conv,
          id: conv._id,
          name: conv.participants.find(p => p._id !== (currentUser._id || currentUser.id))?.name || "User",
          initials: conv.participants.find(p => p._id !== (currentUser._id || currentUser.id))?.name?.substring(0, 2).toUpperCase() || "U",
          item: conv.listingId?.title || "Item",
          price: conv.listingId ? `₹${Number(conv.listingId.price).toLocaleString("en-IN")}` : "",
          preview: conv.lastMessage?.text || "New conversation",
          time: conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now",
          unread: 0,
          img: conv.listingId?.images?.[0] || "",
          listingId: conv.listingId?._id
        }));
        setConversations(mappedConvs);

        // BUG-14 FIX: Join rooms only after socket is confirmed connected
        // socket.io will queue emits, but using the connect event is safer
        const joinRooms = () => data.forEach(conv => socket.emit("join_conversation", conv._id));
        if (socket.connected) {
          joinRooms();
        } else {
          socket.once("connect", joinRooms);
        }
      }).catch(err => console.error("Failed to fetch conversations", err));

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const msgs = await fetchMessages(conversationId);
      setMessages(prev => ({ ...prev, [conversationId]: msgs }));
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, []);

  // ── Toast system ────────────────────────────────────
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

  // ── Wishlist toggle ─────────────────────────────────
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const toggleWishlist = useCallback((id) => {
    if (!isLoggedIn) {
      triggerLoginModal("Please log in to save items to your wishlist.");
      return;
    }
    const isAdding = !wishlistRef.current.includes(id);
    setWishlist(prev => isAdding ? [...prev, id] : prev.filter(x => x !== id));
    showToast(
      isAdding ? "Added to wishlist" : "Removed from wishlist",
      isAdding ? "success" : "info"
    );
  }, [isLoggedIn, triggerLoginModal, showToast]);

  // ── Send message ────────────────────────────────────
  const sendMessage = useCallback((convId, text) => {
    if (!text.trim() || !currentUser) return;

    // BUG-21 FIX: Use socketRef.current
    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        conversationId: convId,
        senderId: currentUser._id || currentUser.id,
        text: text.trim()
      });
    }

    // Optimistic update locally
    const tempId = "temp-" + Date.now();
    const newMsg = {
      _id: tempId,
      conversationId: convId,
      sender: { _id: currentUser._id || currentUser.id, name: currentUser.name },
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), newMsg] }));
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, preview: text.trim(), time: "now", unread: 0, lastMessage: newMsg } : c)
    );
  }, [currentUser]);

  // ── Edit message ────────────────────────────────────
  const editMessage = useCallback((msgId, convId, newText) => {
    // BUG-21 FIX: Use socketRef.current
    if (!newText.trim() || !currentUser || !socketRef.current) return;

    socketRef.current.emit("edit_message", {
      messageId: msgId,
      conversationId: convId,
      text: newText.trim()
    });

    // Optimistic update
    setMessages(prev => {
      const msgs = prev[convId] || [];
      const newMsgs = msgs.map(m => m._id === msgId ? { ...m, text: newText.trim(), isEdited: true } : m);
      return { ...prev, [convId]: newMsgs };
    });
  }, [currentUser]);

  // ── Delete message ──────────────────────────────────
  const deleteMessage = useCallback((msgId, convId) => {
    // BUG-21 FIX: Use socketRef.current
    if (!currentUser || !socketRef.current) return;

    socketRef.current.emit("delete_message", {
      messageId: msgId,
      conversationId: convId
    });

    // Optimistic update
    setMessages(prev => {
      const msgs = prev[convId] || [];
      const newMsgs = msgs.map(m => m._id === msgId ? { ...m, text: "", isDeleted: true } : m);
      return { ...prev, [convId]: newMsgs };
    });
  }, [currentUser]);

  // ── Mark conv as read ───────────────────────────────
  const markRead = useCallback((convId) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unread: 0 } : c)
    );
  }, []);

  // ── Mark sold ───────────────────────────────────────
  const toggleSold = useCallback((convId) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, sold: !c.sold } : c)
    );
  }, []);

  // ── Start new chat from listing ─────────────────────
  const startChat = useCallback(async (listing) => {
    if (!currentUser) {
      triggerLoginModal("Please log in to contact the seller.");
      return null;
    }

    // BUG-03 FIX: Use String() for consistent ID comparison.
    // listingId in conversations can be an ObjectId string from API or a plain id from local state.
    const existsLocally = conversations.find(c => String(c.listingId) === String(listing.id));
    if (existsLocally) return existsLocally.id;

    try {
      const conv = await startConversation(
        currentUser._id || currentUser.id,
        listing.sellerId,
        listing.id
      );

      // Map to UI format
      const newConv = {
        ...conv,
        id: conv._id,
        name: conv.participants.find(p => p._id !== (currentUser._id || currentUser.id))?.name || "Seller",
        initials: conv.participants.find(p => p._id !== (currentUser._id || currentUser.id))?.name?.substring(0, 2).toUpperCase() || "S",
        item: listing.title,
        price: listing.priceLabel,
        preview: "New conversation",
        time: "now",
        unread: 0,
        img: listing.img,
        listingId: listing.id,
      };

      setConversations(prev => [newConv, ...prev]);
      setMessages(prev => ({ ...prev, [newConv.id]: [] }));

      // BUG-21 FIX: Use socketRef.current
      if (socketRef.current) {
        socketRef.current.emit("join_conversation", conv._id);
      }
      return newConv.id;
    } catch (err) {
      console.error("Error starting chat:", err);
      showToast(err.message || "Error starting chat", "danger");
      return null;
    }
  }, [currentUser, triggerLoginModal, conversations]);

  // ── Listings: Fetch from API ────────────────────────
  const fetchListings = useCallback(async () => {
    try {
      const mapped = await fetchAllListings();
      
      const userLoc = (userLocation?.name || "Hazratganj").toLowerCase();
      const lucknowAreas = ["lucknow", "hazratganj", "gomti nagar", "aliganj", "indira nagar"];
      
      const updated = mapped.map(l => {
        let d = l.distance || 1.5;
        const lLoc = (l.location || "").toLowerCase();
        
        const userInLucknow = lucknowAreas.some(a => userLoc.includes(a));
        const listingInLucknow = lucknowAreas.some(a => lLoc.includes(a));
        
        if (userInLucknow && listingInLucknow) {
          // Keep database distance
        } else if (!userLoc.includes(lLoc) && !lLoc.includes(userLoc)) {
          // completely different city
          d = 50 + Math.floor(Math.random() * 50);
        } else {
          // exact or partial match
          d = Math.random() * 3 + 1;
        }
        
        d = Math.round(d * 10) / 10;
        return { ...l, distance: d, distLabel: `${d} km` };
      });
      
      setListings(updated);
    } catch (err) {
      console.error("Error loading listings from API:", err);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ── Listings: Create ────────────────────────────────
  const addListing = useCallback(async (listingData) => {
    try {
      const mapped = await apiCreateListing(listingData);
      setListings(prev => [mapped, ...prev]);
      fetchListings(); // sync with backend
      return true;
    } catch (err) {
      console.error("Error adding listing:", err);
      showToast("Error publishing listing to backend", "danger");
      return false;
    }
  }, [fetchListings, showToast]);

  // ── Listings: Update ────────────────────────────────
  const updateListing = useCallback(async (id, fields) => {
    try {
      // Optimistic update
      setListings(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...fields, priceLabel: fields.price ? `₹${Number(fields.price).toLocaleString("en-IN")}` : item.priceLabel }
          : item
      ));

      await updateListingAPI(id, fields);
      fetchListings(); // sync with backend
      return true;
    } catch (err) {
      console.error("Error updating listing:", err);
      showToast("Error updating listing on backend", "danger");
      fetchListings(); // revert optimistic update
      return false;
    }
  }, [fetchListings, showToast]);

  // ── Listings: Delete ────────────────────────────────
  const deleteListing = useCallback(async (id) => {
    try {
      // Optimistic removal
      setListings(prev => prev.filter(item => item.id !== id));

      await deleteListingAPI(id);
      fetchListings(); // sync with backend
      return true;
    } catch (err) {
      console.error("Error deleting listing:", err);
      showToast("Error deleting listing on backend", "danger");
      fetchListings(); // revert optimistic removal
      return false;
    }
  }, [fetchListings, showToast]);

  // ── Auth ────────────────────────────────────────────
  const login = useCallback(async (userData) => {
    // userData comes directly from the backend (has _id, name, email, phone, token)
    const base = {
      ...userData,
      initials: userData?.name
        ? userData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
        : "U",
      location: "Lucknow, India",
      avatar: null,
      joinedYear: new Date().getFullYear().toString(),
      // Stats start at 0; they'll be refreshed from the backend
      sold: 0,
      active: 0,
      response: "98%",
    };

    localStorage.setItem("currentUser", JSON.stringify(base));
    setCurrentUser(base);
    setIsLoggedIn(true);

    // Immediately fetch live stats from backend and update stored user
    if (userData._id) {
      try {
        const profile = await fetchUserProfile(userData._id);
        const withStats = {
          ...base,
          sold: profile.stats?.sold ?? 0,
          active: profile.stats?.active ?? 0,
          response: profile.stats?.response ?? "98%",
          phone: profile.phone || base.phone || "",
          joinedYear: profile.createdAt
            ? new Date(profile.createdAt).getFullYear().toString()
            : base.joinedYear,
        };
        localStorage.setItem("currentUser", JSON.stringify(withStats));
        setCurrentUser(withStats);
      } catch (e) {
        // Non-fatal — we already have base info
        console.warn("Could not fetch user profile stats:", e.message);
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setIsLoggedIn(false);
  }, []);

  // ── Update current user profile ─────────────────────
  const updateUser = useCallback(async (payload) => {
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return false;
    try {
      const updatedUser = await updateUserProfileAPI(userId, payload);

      setCurrentUser(prev => {
        const nextName = updatedUser.name || prev?.name;
        const newInitials = nextName
          ? nextName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
          : prev?.initials || "U";

        const next = {
          ...prev,
          ...updatedUser,
          initials: newInitials,
        };
        localStorage.setItem("currentUser", JSON.stringify(next));
        return next;
      });
      return true;
    } catch (e) {
      console.error("updateUser error:", e.message);
      return false;
    }
  }, [currentUser]);

  // ── Refresh current user stats from backend ──────────
  const refreshCurrentUserStats = useCallback(async () => {
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;
    try {
      const profile = await fetchUserProfile(userId);
      setCurrentUser(prev => {
        if (!prev) return prev;
        const nextName = profile.name || prev.name;
        const newInitials = nextName
          ? nextName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
          : prev.initials;

        const updated = {
          ...prev,
          name:         nextName,
          initials:     newInitials,
          sold:         profile.stats?.sold     ?? prev.sold,
          active:       profile.stats?.active   ?? prev.active,
          response:     profile.stats?.response ?? prev.response,
          phone:        profile.phone           || prev.phone || "",
          location:     profile.location        || prev.location || "",
          profileImage: profile.profileImage !== undefined ? profile.profileImage : prev.profileImage,
          joinedYear: profile.createdAt
            ? new Date(profile.createdAt).getFullYear().toString()
            : prev.joinedYear,
        };
        localStorage.setItem("currentUser", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("refreshCurrentUserStats error:", e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id, currentUser?.id]);

  // ── Context value ───────────────────────────────────
  const value = {
    currentUser, wishlist, toggleWishlist,
    listings, searchQuery, setSearchQuery, addListing, updateListing, deleteListing, fetchListings,
    filters, setFilters,
    isLoggedIn, login, logout, refreshCurrentUserStats, updateUser,
    theme, toggleTheme,
    showLoginModal, setShowLoginModal,
    loginReason, setLoginReason, triggerLoginModal,
    showLocationModal, setShowLocationModal,
    userLocation, setUserLocation,  // BUG-01 FIX: Removed duplicate userLocation, setUserLocation entry
    conversations, messages, typing, loadMessages,
    sendMessage, editMessage, deleteMessage, markRead, toggleSold, startChat,
    toasts, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
