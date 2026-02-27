export const createRoute = (contract, handler) => async (req, res, next) => {
    try {
        const result = contract.body.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json(result.error);
        }
        return handler(req, res, next);
    }
    catch (err) {
        next(err);
    }
};
