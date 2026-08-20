const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ave-center-secret-key-2026';

// 验证 token 中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未登录或 token 已过期',
      data: null,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: 'token 无效或已过期',
      data: null,
    });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
