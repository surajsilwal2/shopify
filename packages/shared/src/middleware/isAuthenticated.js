import jwt from "jsonwebtoken";
export const isAuthenticated = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
