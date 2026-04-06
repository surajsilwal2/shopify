import axios, { AxiosInstance } from "axios";

// ─── What is this file? ───────────────────────────────────────────────────────
// This file creates TWO axios instances — one for user requests, one for seller.
// Why two? Because they have different:
//   - Refresh token endpoints (/refresh-token vs /seller-refresh-token)
//   - Login redirect paths (/login vs /seller/login)
//   - Cookies (accessToken vs sellerAccessToken)
//
// If we used ONE client for both, a seller's expired token would trigger
// the user's refresh endpoint → 404 → redirect to wrong login page.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Factory function ─────────────────────────────────────────────────────────
// Instead of copy-pasting the same interceptor logic twice, we use a factory.
// A factory is just a function that CREATES and RETURNS something.
// Here it creates a fully configured axios instance with the right endpoints.
//
// Parameters:
//   refreshEndpoint  → which API route to call when access token expires
//   loginRedirect    → where to send the user if refresh also fails
// ─────────────────────────────────────────────────────────────────────────────
function createAxiosClient(
  refreshEndpoint: string,
  loginRedirect: string,
): AxiosInstance {
  // ── Create the base axios instance ─────────────────────────────────────────
  // axios.create() gives us a fresh instance with its own config and interceptors.
  // This means the user client and seller client are completely independent —
  // interceptors on one don't affect the other.
 const instance = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_URL
     ? `${process.env.NEXT_PUBLIC_API_URL}/api` // append /api to whatever env provides
     : "http://localhost:8080/api", // default also includes /api
   withCredentials: true,
 });

  // ── Refresh state ───────────────────────────────────────────────────────────
  // These two variables are SHARED across all requests made by this instance.
  // They live outside the interceptor function so they persist between calls.

  let isRefreshing = false;
  // isRefreshing is a LOCK.
  // Problem it solves: imagine 3 API calls all fail with 401 at the same time.
  // Without this lock, all 3 would try to call the refresh endpoint simultaneously.
  // That causes race conditions and token invalidation (reuse detection).
  // With the lock: only the FIRST request triggers a refresh.
  // The other 2 wait in the queue below.

  let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  // failedQueue is a WAITING ROOM for requests that arrived while a refresh was in progress.
  // Each item is a promise's resolve/reject pair.
  // When refresh succeeds → we call resolve() on all of them → they retry.
  // When refresh fails   → we call reject() on all of them → they all fail cleanly.

  // ── Queue processor ─────────────────────────────────────────────────────────
  // Called after a refresh attempt (success or failure).
  // Goes through every waiting request and either:
  //   - Releases them (resolve) if refresh succeeded
  //   - Fails them (reject) if refresh failed
  const processQueue = (error: any) => {
    failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error); // refresh failed → fail all queued requests
      } else {
        promise.resolve(); // refresh succeeded → release all queued requests to retry
      }
    });
    failedQueue = []; // clear the queue after processing
  };

  // ── Response interceptor ────────────────────────────────────────────────────
  // axios.interceptors.response.use(onSuccess, onError)
  // onSuccess → runs for every response with status 2xx (we just pass it through)
  // onError   → runs for every response with status outside 2xx (4xx, 5xx, network errors)
  instance.interceptors.response.use(
    (response) => response,
    // If the response is successful (2xx), just return it as-is.
    // We only care about errors below.

    async (error) => {
      // error.config: The "original instruction manual" for the request that failed.
      // It contains: the URL, method, headers, body data of the failed request.
      // We save it here so we can REPLAY the exact same request after token refresh.
      const originalRequest = error.config;

      // ── Should we attempt a token refresh? ───────────────────────────────
      // We only refresh if BOTH conditions are true:
      //
      // Condition 1: error.response?.status === 401
      //   → Server said "Unauthorized" — this usually means the access token expired
      //   → We use ?. (optional chaining) because network errors have no response object
      //
      // Condition 2: !originalRequest._retry
      //   → We haven't already retried this specific request
      //   → Without this check, a retry that ALSO gets 401 would trigger another refresh
      //   → That creates an infinite loop: 401 → refresh → retry → 401 → refresh → ...
      //   → _retry is a custom flag we stamp onto the request config to prevent this
      if (error.response?.status === 401 && !originalRequest._retry) {
        // ── Case 1: Refresh already in progress ───────────────────────────
        // Another request already triggered a refresh and it's in flight.
        // We don't want to call the refresh endpoint again.
        // Instead, we make this request WAIT until the refresh is done.
        if (isRefreshing) {
          return (
            new Promise((resolve, reject) => {
              // Push this request's resolve/reject into the waiting room.
              // processQueue() will call one of these when refresh completes.
              failedQueue.push({ resolve, reject });
            })
              .then(() => instance(originalRequest))
              // Once released from the queue (resolve was called),
              // retry the original request — the new cookie is now in the browser.
              .catch((err) => Promise.reject(err))
          );
          // If rejected (refresh failed), propagate the error.
        }

        // ── Case 2: We are the first request to get 401 ───────────────────
        // We take responsibility for refreshing the token.

        originalRequest._retry = true;
        // Stamp the flag BEFORE the async refresh call.
        // If somehow this request gets 401 again after retry,
        // the flag prevents it from triggering another refresh cycle.

        isRefreshing = true;
        // Engage the lock so other simultaneous 401s know to wait.

        try {
          // Call the refresh endpoint for THIS client (user or seller).
          // The browser automatically sends the correct refresh cookie
          // because withCredentials: true is set on this instance.
          //
          // User client   → POST /refresh-token        (sends refreshToken cookie)
          // Seller client → POST /seller-refresh-token (sends sellerRefreshToken cookie)
          //
          // The backend verifies the refresh token, issues a new access token,
          // and sets it as a new cookie in the response.
          await instance.post(refreshEndpoint);

          // Refresh succeeded!
          // Release all waiting requests — they'll retry with the new cookie.
          processQueue(null); // null = no error = success

          // Retry the original request that triggered this whole flow.
          // The new access token cookie is now in the browser automatically.
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed — the refresh token is also expired or invalid.
          // This means the session is completely dead. No recovery possible.

          // Fail all waiting requests — no point retrying, auth is gone.
          processQueue(refreshError);

          // Send the user to the correct login page for this client.
          // User client   → /login
          // Seller client → /seller/login
          window.location.href = loginRedirect;

          return Promise.reject(refreshError);
        } finally {
          // Always release the lock when done — whether success or failure.
          // If we don't do this and an error is thrown before this line,
          // isRefreshing stays true forever and ALL future 401s just wait forever.
          isRefreshing = false;
        }
      }

      // ── Not a 401, or already retried ─────────────────────────────────────
      // This is a different error (400, 403, 500, network error, etc.)
      // OR this is a retried request that failed again after refresh.
      // Either way, pass it through so the calling code can handle it.
      // This is what causes toast.error() to show in your mutation's onError.
      return Promise.reject(error);
    },
  );

  return instance;
}

// ─── Export two clients ───────────────────────────────────────────────────────

// USER CLIENT
// Used for all customer-facing API calls (login, register, products, cart, etc.)
// On 401 → calls POST /refresh-token → on failure → redirects to /login
export const api = createAxiosClient("/refresh-token", "/login");

// SELLER CLIENT
// Used for all seller-facing API calls (seller-login, seller-me, create-shop, etc.)
// On 401 → calls POST /seller-refresh-token → on failure → redirects to /seller/login
// This is what fixes the bug where seller token expiry was hitting the user refresh endpoint
export const sellerApi = createAxiosClient(
  "/seller-refresh-token",
  "/seller/login",
);
