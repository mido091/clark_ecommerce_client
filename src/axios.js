/**
 * @file axios.js
 * @description Global Axios configuration and HTTP interceptors.
 *
 * This configured Axios instance (`api`) is used for all backend communication.
 *
 * Configuration rules:
 *  - withCredentials: true (Mandatory for sending and receiving HttpOnly JWT cookies)
 *  - X-Requested-With (Mandatory for passing the backend's CSRF check)
 *  - Dynamic baseURL: Uses Vite proxy in development (/api), and direct URL in production
 *
 * Interceptors:
 *  - Handle global 401 Unauthorized errors by clearing local state and redirecting to login.
 *  - Handle 503/Network Errors by redirecting to a global Maintenance/Offline page.
 */

import axios from "axios";

// ── Instance Configuration ─────────────────────────────────────────────────────
// Create an Axios instance pointing at the Vite proxy (/api → localhost:5000/api)
// NOTE: Do NOT set a default Content-Type here.
// Axios auto-sets "application/json" for plain objects and
// "multipart/form-data; boundary=..." for FormData — setting it
// globally here would break Multer file uploads because the boundary would be missing.
const api = axios.create({
  // Use /api in development (Vite proxy handles it)
  // Use VITE_API_URL in production (proxied via vercel.json or direct URL)
  baseURL: import.meta.env.MODE === "development" 
    ? "/api" 
    : (import.meta.env.VITE_API_URL || "/api"),
    
  // Allows cookies (JWT token) to be sent cross-origin 
  withCredentials: true,
  
  // Required by backend security.js to prevent CSRF attacks
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ── Request Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // No manual token handling logic here!
    // Because we use HttpOnly cookies, the browser automatically attaches the token
    // securely to every request natively.
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ───────────────────────────────────────────────────────
// Handles global API errors centrally so components don't have to catch everything.
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    const status = error.response?.status;
    
    // Allow specific requests to opt-out of the automatic login redirect
    // (e.g., background session refreshes shouldn't suddenly redirect the user)
    const skipAuthRedirect = error.config?.skipAuthRedirect;

    // Handle 401 Unauthorized (Token expired, invalid, or missing)
    if (status === 401 && !skipAuthRedirect) {
      // Clear stale local auth state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login page if they aren't already there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    } 
    // Handle Network Errors or Server Down (503 Service Unavailable, 502 Bad Gateway)
    else if (
      status === 503 ||
      status === 502 ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNREFUSED"
    ) {
      // Backend is unreachable — redirect to the maintenance/offline fallback page
      if (!window.location.pathname.startsWith("/maintenance")) {
        window.location.href = "/maintenance";
      }
    }

    // Always reject the promise so the calling component can handle specific field errors (like 400 Bad Request)
    return Promise.reject(error);
  },
);

export default api;
