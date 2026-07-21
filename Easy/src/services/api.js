// ─────────────────────────────────────────────────────────
// Centralized API Service Layer
// All backend communication goes through this file.
// ─────────────────────────────────────────────────────────

/**
 * Base URL for all API calls.
 * In development, Vite proxy forwards /api → http://localhost:5000/api.
 * In production, set VITE_API_BASE to your deployed backend URL.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// ─── Helpers ────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json" };
  try {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token) {
        headers["Authorization"] = `Bearer ${parsed.token}`;
      }
    }
  } catch (err) {
    // ignore parse error
  }

  const config = {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Data Mapping ───────────────────────────────────────

/**
 * Maps a raw listing object from the backend API
 * into the shape the frontend components expect.
 * This is the SINGLE source of truth for this transformation.
 */
export function mapListingFromAPI(item) {
  return {
    id: item._id,
    title: item.title,
    price: item.price,
    priceLabel: `₹${Number(item.price).toLocaleString("en-IN")}`,
    distance: item.distance || 1.5,
    distLabel: `${item.distance || 1.5} km`,
    condition: item.condition,
    category: item.category,
    img:
      item.images && item.images[0]
        ? item.images[0]
        : "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80",
    listedAgo: item.createdAt ? formatTimeAgo(item.createdAt) : "Just now",
    location: item.location,
    description: item.description || "",
    originalPrice: item.originalPrice || `₹${(item.price * 1.5).toFixed(0)}`,
    brand: item.brand || "",
    model: item.model || "",
    age: item.age || "",
    colour: item.colour || "",
    warranty: item.warranty || "",
    seller: item.sellerName || "Unknown Seller",
    sellerInitials:
      item.sellerInitials ||
      (item.sellerName
        ? item.sellerName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U"),
    phone: item.sellerPhone || "",
    sellerId: item.seller,
    thumbs: item.images || [],
    sold: item.sold || false,
    // BUG-12 FIX: Expose createdAt so the frontend can sort by newest correctly
    createdAt: item.createdAt || null,
  };
}

/**
 * Human-friendly relative time (e.g. "2 days ago").
 */
export function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

// ─── Listings API ───────────────────────────────────────

export async function fetchAllListings() {
  const data = await request("/listings");
  return data.map(mapListingFromAPI);
}

export async function fetchListingById(id) {
  const data = await request(`/listings/${id}`);
  return mapListingFromAPI(data);
}

export async function createListing(listingData) {
  const data = await request("/listings", {
    method: "POST",
    body: JSON.stringify(listingData),
  });
  return mapListingFromAPI(data);
}

export async function updateListingAPI(id, fields) {
  const data = await request(`/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return mapListingFromAPI(data);
}

export async function deleteListingAPI(id) {
  return request(`/listings/${id}`, { method: "DELETE" });
}

// ─── Auth API ───────────────────────────────────────────

export async function loginUser(identifier, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function signupUser(name, email, phone, password, location) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password, location }),
  });
}

export async function sendOtpAPI(email, phone) {
  return request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email, phone }),
  });
}

export async function verifyOtpAPI(email, emailOtp) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, emailOtp }),
  });
}

export async function forgotPasswordAPI(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordAPI(email, otp, newPassword) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

// ─── Users API ──────────────────────────────────────────

/**
 * Fetch a user's profile + live computed stats from the backend.
 * Returns: { _id, name, email, phone, createdAt, stats: { sold, active, total, rating, reviews, response } }
 */
export async function fetchUserProfile(userId) {
  return request(`/users/${userId}`);
}

/**
 * Fetch all listings posted by a specific seller.
 */
export async function fetchUserListings(userId) {
  const data = await request(`/users/${userId}/listings`);
  return data.map(mapListingFromAPI);
}

// ─── Messages API ───────────────────────────────────────

export async function fetchConversations(userId) {
  return request(`/messages/conversations/${userId}`);
}

export async function fetchMessages(conversationId) {
  return request(`/messages/${conversationId}`);
}

export async function startConversation(senderId, receiverId, listingId) {
  return request("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ senderId, receiverId, listingId }),
  });
}

// ─── Reviews API ──────────────────────────────────────────

/**
 * Fetch all reviews for a seller.
 * Returns array of review objects.
 */
export async function fetchReviewsBySeller(sellerId) {
  return request(`/reviews/seller/${sellerId}`);
}

/**
 * Post a new review.
 * @param {{ reviewerId, reviewerName, sellerId, listingId?, rating, text }} data
 */
export async function createReviewAPI(data) {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a review (reviewer only).
 * @param {string} reviewId - the review _id
 * @param {string} reviewerId - must match review.reviewer to authorize
 */
export async function deleteReviewAPI(reviewId, reviewerId) {
  return request(`/reviews/${reviewId}`, {
    method: "DELETE",
    body: JSON.stringify({ reviewerId }),
  });
}
