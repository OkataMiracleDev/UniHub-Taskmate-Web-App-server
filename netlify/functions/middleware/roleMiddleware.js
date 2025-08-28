// /server/middleware/roleMiddleware.js
const authorize = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ msg: 'Access denied: Insufficient privileges' });
  }
  next();
};
module.exports = authorize;