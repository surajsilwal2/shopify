import 'express'



// This file extends Express's Request type globally
// So every service that imports from @repo/shared gets these types automatically
// Never declare these inside controllers — that's local scope only

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
      seller?: {
        sellerId: string;
        role: string;
      };
    }
  }
}

export {}; // Makes this a module — required for global augmentation to work