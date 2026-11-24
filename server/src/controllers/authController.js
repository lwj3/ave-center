const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');
const loginGuard = require('../utils/loginGuard');

// 用户名不存在时也做一次同样耗时的比对，避免通过响应时间判断用户名是否存在
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

// 管理员登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 只接受字符串，并限制长度（防止传对象做 SQL 条件注入、超长字符串消耗 CPU）
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      throw { status: 400, message: '用户名和密码不能为空' };
    }
    if (username.length > 50 || password.length > 128) {
      throw { status: 400, message: '用户名或密码错误' };
    }

    // 该用户名失败次数过多，临时锁定（锁定期间密码正确也拒绝）
    const lockLeft = loginGuard.lockRemaining(username);
    if (lockLeft > 0) {
      const minutes = Math.ceil(lockLeft / 60000);
      throw { status: 429, message: `登录失败次数过多，请 ${minutes} 分钟后再试` };
    }

    const admin = await Admin.findOne({ where: { username, status: 1 } });
    const isValid = await bcrypt.compare(password, admin ? admin.password : DUMMY_HASH);

    if (!admin || !isValid) {
      loginGuard.recordFailure(username);
      console.warn(`[Login] 登录失败 username=${JSON.stringify(username)} ip=${req.clientIp || req.ip}`);
      throw { status: 401, message: '用户名或密码错误' };
    }

    loginGuard.recordSuccess(username);
    console.log(`[Login] 登录成功 username=${admin.username} ip=${req.clientIp || req.ip}`);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, nickname: admin.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// 获取当前管理员信息
exports.profile = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ['id', 'username', 'nickname'],
    });
    res.json({ code: 0, message: 'ok', data: admin });
  } catch (err) {
    next(err);
  }
};
