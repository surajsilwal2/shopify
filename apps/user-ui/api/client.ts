import axios from "axios";

export const api = axios.create({
  // create an axios instance with default configuration and inherit get, post, put, delete methods
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  withCredentials: true, // include cookies in requests for authentication
});

let isRefreshing = false;
let failedQueue: any[] = [];

api.interceptors.response.use(
  // intercept EVERY response from server and check if it has a 401 status code (Unauthorized)
  (response) => response, // if the response is successful, just return it
  async (error) => { // if the response has an error, we check if it's a 401 error and if we haven't already tried to refresh the token for this request


    const originalRequest = error.config;
   // 'original' contains the URL, the Method, and the Data of the failed call.
    //  error.config: It is the "Original Instruction Manual" for the request that failed.
    // Purpose 1: It tells us where to go when we want to retry the request.
    // Purpose 2: it acts as a "Sticker Book" where we can place the _retry flag so we know if we've already tried to fix this specific request once before.
  
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          // iserver says unauthorized
          // AND we haven't retried this request yet

          if (isRefreshing) {
            // some other request already refreshing token
            return new Promise((resolve, reject) => {
              // we create a promise and make them wait in queue
              failedQueue.push((token: string) => {
                resolve(api(originalRequest));
              });
            });
          }
          originalRequest._retry = true; // Mark request so it won't retry infinitely.
          isRefreshing = true; // lock the refresh system 

          try {
            await api.post("/refresh-token");
            failedQueue.forEach((callback) => callback()); // Runs all stored retry functions.
            failedQueue = [];
            return api(originalRequest);
          } catch (refreshError) {
            failedQueue = [];
            window.location.href = "/login"; // redirect to login page on refresh failure
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false; // unlock the refresh system so other requests can try to refresh token if they get 401 error
          }
        }
    return Promise.reject(error);
  },
);
