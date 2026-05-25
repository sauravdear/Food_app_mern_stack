export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

// Ensure store-level users can only access their assigned store
export const storeAccess = (req, res, next) => {
  const { role, assignedStoreId } = req.user;
  if (role === 'admin' || role === 'regional_manager') return next();

  const requestedStoreId = req.params.storeId || req.body.storeId || req.query.storeId;
  if (requestedStoreId && assignedStoreId?.toString() !== requestedStoreId) {
    return res.status(403).json({ success: false, message: 'Access denied to this store' });
  }
  next();
};
