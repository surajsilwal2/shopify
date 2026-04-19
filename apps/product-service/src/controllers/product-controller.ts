import { Response, Request, NextFunction } from "express";
import {
  handleCreateProduct,
  handleDeleteProduct,
  handleGetAllProducts,
  handleGetProduct,
  handleGetSellerProducts,
  handleUpdateProduct,
  handleUploadImages,
} from "../services/product-service";

export const uploadImages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      return res.status(400).json({ error: "No images provided" });
    }
    const images = await handleUploadImages(files);
    res.json({ images });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await handleCreateProduct({
      ...req.body,
      sellerId: req.seller!.sellerId,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Query params come in as strings — convert types explicitly
    const result = await handleGetAllProducts({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      category: req.query.category as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sort: req.query.sort as any,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

type ProductParams = {
  id: string;
};

export const getProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await handleGetProduct(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await handleGetSellerProducts(
      req.seller!.sellerId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await handleUpdateProduct(
      req.params.id,
      req.seller!.sellerId,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
   try {
     const result = await handleDeleteProduct(
       req.params.id,
       req.seller!.sellerId,
     );
     res.json(result);
   } catch (error) {
     next(error); 
   }
};  