export function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireAuth(req, res, next) {
  const role = req.headers['x-user-role'];
  if (!role || !['admin', 'staff'].includes(role)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userRole = role;
  next();
}
