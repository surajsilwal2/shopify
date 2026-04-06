import { sellerApi } from "./client";

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


export const sellerRegister = (data: SellerRegisterInput) => sellerApi.post('/seller-register', data)
export const sellerVerify = (data: SellerVerifyInput) => sellerApi.post('/seller-verify', data)
export const sellerLogin = (data: SellerLoginInput) => sellerApi.post('/seller-login', data)
export const createShop = (data: CreateShopInput) => sellerApi.post('/seller-create-shop', data)
export const getSellerMe = () => sellerApi.get("/seller-me");
export const sellerLogout = () => sellerApi.post('/seller-logout')