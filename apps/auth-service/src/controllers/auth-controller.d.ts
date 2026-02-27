import { NextFunction, Response, Request } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}
export declare const userRegistration: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const verifyUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const loginUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const userForgetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyForgetPasswordOtp: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const resetUserPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMe: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth-controller.d.ts.map