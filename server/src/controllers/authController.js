const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

// 管理员登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw { status: 400, message: '用户名和密码不能为空' };
    }

    const admin = await Admin.findOne({ where: { username, status: 1 } });
    if (!admin) {
      throw { status: 401, message: '用户名或密码错误' };
    }

    const isValid = await admin.verifyPassword(password);
    if (!isValid) {
      throw { status: 401, message: '用户名或密码错误' };
    }

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
