import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma, redis } from "database";
import { sendEmail, ValidationError } from "@repo/shared";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const validateRegister = async (data, userType) => {
    const { name, email, password, phone_number, country } = data;
    if (!name || !email || !password || (userType === 'seller' && (!phone_number || !country))) {
        throw new ValidationError('Missing required fields for registration');
    }
    if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
    }
};
export const checkOtpRestriction = async (email) => {
    const base = `otp:${email}`;
    const attempts = Number(await redis.get(`${base}:attempts`)) || 0;
    if (attempts >= 3) {
        throw new ValidationError("Too many incorrect codes. Try again in 30 minutes.");
    }
    const sendCounts = Number(await redis.get(`${base}:sendCounts`)) || 0;
    if (sendCounts >= 5) {
        throw new ValidationError("Too many OTP requests. Try again in 1 hour.");
    }
};
export const trackOtpRequests = async (email) => {
    const base = `otp:${email}`;
    const coolDown = await redis.get(`${base}:cooldown`);
    if (coolDown) {
        throw new ValidationError("OTP recently sent. Please wait 1 min before requesting again.");
    }
    let sendCounts = Number(await redis.get(`${base}:sendCounts`)) || 0;
    if (sendCounts >= 5) {
        throw new ValidationError("Too many OTP requests. Try again in 1 hour.");
    }
    sendCounts++;
    if (sendCounts === 1) {
        await redis.set(`${base}:sendCounts`, '1', 'EX', 3600); // 1 hour expiry
    }
    else {
        await redis.incr(`${base}:sendCounts`); // No need to reset expiry on each increment, it will auto-expire after 1 hour from the first request
    }
    await redis.set(`${base}:cooldown`, '1', 'EX', 60); // 1 min cooldown
};
export const sendOtp = async (name, email) => {
    const base = `otp:${email}`;
    const otp = crypto.randomInt(100000, 999999).toString();
    await sendEmail(name, email, otp);
    await redis.set(`${base}:otp`, otp, 'EX', 300); // 5 min expiry
};
export const verifyOtp = async (email, otp) => {
    const base = `otp:${email}`;
    const storedOtp = await redis.get(`${base}:otp`);
    if (!storedOtp) {
        throw new ValidationError("OTP expired or not found. Please request a new one.");
    }
    //check if attempts exceeded before validating OTP
    let attempts = Number(await redis.get(`${base}:attempts`)) || 0;
    if (attempts >= 3) {
        throw new ValidationError("Too many incorrect codes. Try again in 30 minutes.");
    }
    // compare OTP
    if (storedOtp !== otp) {
        attempts++;
        if (attempts === 1) {
            await redis.set(`${base}:attempts`, "1", "EX", 1800);
        }
        else {
            await redis.incr(`${base}:attempts`);
        }
        throw new ValidationError("Invalid OTP. Please try again.");
    }
    // success case
    await redis.del(`${base}:otp`); // delete OTP after successful verification
    await redis.del(`${base}:attempts`); // delete attempts count after successful verification
    await redis.del(`${base}:cooldown`); // delete cooldown after successful verification
    await redis.del(`${base}:sendCounts`); // delete send counts after successful verification
};
export const handleForgetPassword = async (req, res, next, userType) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ValidationError("Email is required for password reset");
        }
        const user = userType === 'user' && await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new ValidationError("User not found");
        }
        await checkOtpRestriction(email);
        await trackOtpRequests(email);
        await sendOtp(user.name, email);
        return res.status(200).json({
            message: "OTP is sent to your email. Please verify to reset your password",
        });
    }
    catch (error) {
        next(error);
    }
};
export const handleVerifyForgetPasswordOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(new ValidationError("Email and OTP are required"));
        }
        await verifyOtp(email, otp);
        await redis.set(`reset:${email}`, "verified", "EX", 600); // 10 min expiry for resetting password after OTP verification
        return res.status(200).json({
            message: "OTP verified. You can now reset your password.",
        });
    }
    catch (error) {
        next(error);
    }
};
export const handleResetPassword = async (req, res, next) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return next(new ValidationError("Email and new password are required"));
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return next(new ValidationError("User not found"));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const verified = await redis.get(`reset:${email}`); // Check if OTP verification was done for password reset
    if (!verified) {
        return next(new ValidationError("OTP verification required"));
    }
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });
    await redis.del(`reset:${email}`); // Delete the reset verification key after successful password reset
    return res.status(200).json({
        message: "Password reset successfully",
    });
};
