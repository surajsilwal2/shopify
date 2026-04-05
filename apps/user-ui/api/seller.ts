import { api } from "./client";

export type SellerRegisterInput = {
  name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
};

export type SellerVerifyInput = {
  email: string;
  otp: string;
};

export type SellerLoginInput = {
  email: string;
  password: string;
};

export type CreateShopInput = {
  name: string;
  bio?: string;
  category: string;
  address?: string;
  openingHours?: string;
  website?: string;
};


export const sellerRegister = (data: SellerRegisterInput) => api.post('/api/seller-register', data)
export const sellerVerify = (data: SellerVerifyInput) => api.post('/api/seller-verify', data)
export const sellerLogin = (data: SellerLoginInput) => api.post('/api/seller-login', data)
export const createShop = (data: CreateShopInput) => api.post('/api/seller-create-shop', data)
export const getSellerMe = () => api.get("/api/seller-me");
export const sellerLogout = () => api.post('/api/seller-logout')