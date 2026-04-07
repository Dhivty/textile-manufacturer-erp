module.exports = (allowedRoles) => {
    return (req, res, next) => {
        const role = req.user && req.user.role;

        if (!role) {
            return res.status(401).json({
                message: "No role in session"
            });
        }

        const r = String(role).toLowerCase();
        const ok = allowedRoles.some((a) => String(a).toLowerCase() === r);
        if (!ok) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};
