const jwt = require('jsonwebtoken');

// 必须通过环境变量配置，禁止使用默认值（仓库公开，默认值可被用来伪造 token）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ 未配置 JWT_SECRET 或长度不足 32 位，拒绝启动');
  process.exit(1);
}

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
