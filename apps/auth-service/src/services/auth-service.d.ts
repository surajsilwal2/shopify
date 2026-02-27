import { NextFunction, Request, Response } from "express";
export declare const validateRegister: (data: any, userType: "user" | "seller") => Promise<void>;
export declare const checkOtpRestriction: (email: string) => Promise<void>;
export declare const trackOtpRequests: (email: string) => Promise<void>;
export declare const sendOtp: (name: string, email: string) => Promise<void>;
export declare const verifyOtp: (email: string, otp: string) => Promise<void>;
export declare const handleForgetPassword: (req: Request, res: Response, next: NextFunction, userType: "user" | "seller") => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleVerifyForgetPasswordOtp: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const handleResetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth-service.d.ts.map