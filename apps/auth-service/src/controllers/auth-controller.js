import { checkOtpRestriction, handleForgetPassword, handleResetPassword, handleVerifyForgetPasswordOtp, sendOtp, trackOtpRequests, validateRegister, verifyOtp, } from "../services/auth-service.js";
import { ValidationError } from "@repo/shared";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/setCookie.js";
import { prisma } from "database";
export const userRegistration = async (req, res, next) => {
    try {
        await validateRegister(req.body, "user");
        const { name, email } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return next(new ValidationError("Email already exists. You can't register with same email. Please use different email."));
        }
        await checkOtpRestriction(email);
        await trackOtpRequests(email);
        await sendOtp(name, email);
        return res.status(200).json({
            message: "OTP is sent to your email. Please verify your account",
        });
    }
    catch (error) {
        next(error);
    }
};
export const verifyUser = async (req, res, next) => {
    try {
        const { name, email, password, otp } = req.body;
        if (!name || !email || !password || !otp) {
            return next(new ValidationError("Missing required fields for verification"));
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return next(new ValidationError("Email already exists. You can't register with same email. Please use different email."));
        }
        await verifyOtp(email, otp);
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new ValidationError("Email and password are required for login");
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return next(new ValidationError("Invalid email or password"));
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return next(new ValidationError("Invalid email or password"));
        }
        const accessToken = jwt.sign({ userId: user.id, role: "user" }, process.env.ACCESS_SECRET, { expiresIn: "15min" });
        const refreshToken = jwt.sign({ userId: user.id, role: "user" }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
        setCookie(res, "accessToken", accessToken);
        setCookie(res, "refreshToken", refreshToken);
        await prisma.session.create({
            data: {
                refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email },
        });
    }
    catch (error) {
        next(error);
    }
};
export const userForgetPassword = async (req, res, next) => {
    try {
        await handleForgetPassword(req, res, next, "user");
    }
    catch (error) {
        next(error);
    }
};
export const verifyForgetPasswordOtp = async (req, res, next) => {
    try {
        await handleVerifyForgetPasswordOtp(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
export const resetUserPassword = async (req, res, next) => {
    try {
        await handleResetPassword(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
export const refreshToken = async (req, res, next) => {
    try {
        const oldToken = req.cookies.refreshToken;
        if (!oldToken) {
            return res.status(401).json({ message: "Missing refresh token" });
        }
        const session = await prisma.session.findUnique({
            where: { refreshToken: oldToken },
            // include: { user: true },
        });
        if (!session) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        if (session.expiresAt < new Date()) {
            // expiresAt is less than new Date() means the refresh token is expired. if today, refresh token is created at 1st Jan 2024 and expires in 7 days, then expiresAt will be 8th Jan 2026. if today is 9th Jan 2026, then refresh token is expired because expiresAt (8th Jan 2026) is less than new Date() (9th Jan 2026)
            await prisma.session.delete({ where: { id: session.id } });
            return res.status(401).json({ message: "Refresh token expired" });
        }
        let decoded;
        try {
            decoded = jwt.verify(oldToken, process.env.REFRESH_SECRET);
        }
        catch (error) {
            await prisma.session.delete({ where: { id: session.id } });
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = jwt.sign({ userId: session.user.id, role: "user" }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
        const newRefreshToken = jwt.sign({ userId: session.user.id, role: "user" }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
        setCookie(res, "accessToken", newAccessToken);
        setCookie(res, "refreshToken", newRefreshToken);
        await prisma.session.update({
            where: { id: session.id },
            data: { refreshToken: newRefreshToken },
        });
        res.json({ success: true });
    }
    catch {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};
// This is a protected route, only accessible with valid access token and this function is used to get the details of currently logged in user. The userId is extracted from the access token and used to fetch the user details from database and return it in response. This function is just for testing purpose to verify that our authentication system is working fine and we can access protected routes with valid access token.
export const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
export const logout = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await prisma.session.deleteMany({
            where: { refreshToken },
        });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
};
// import cron from "node-cron";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
// // This runs every day at Midnight (00:00)
// cron.schedule("0 0 * * *", async () => {
//   console.log("--- Running Daily Session Cleanup ---");
//   try {
//     // 1. Calculate the "Cutoff" date (7 days ago)
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     // 2. Delete any session that hasn't been refreshed in 7 days
//     const deleted = await prisma.session.deleteMany({
//       where: {
//         updatedAt: {
//           lt: sevenDaysAgo, // "lt" means Less Than (older than)
//         },
//       },
//     });
//     console.log(`Success: Cleaned up ${deleted.count} expired sessions.`);
//   } catch (error) {
//     console.error("Cleanup Error:", error);
//   }
// });
