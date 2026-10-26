/**
 * 重置管理员密码
 * 用法：npm run admin:password            （交互输入，默认用户 admin）
 *       npm run admin:password -- 用户名
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { sequelize, Admin } = require('../models');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function resetPassword() {
  const username = process.argv[2] || 'admin';
  try {
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) throw new Error(`管理员 ${username} 不存在`);

    const password = await askHidden(`请输入 ${username} 的新密码: `);
    if (password.length < 12) throw new Error('密码长度至少 12 位');
    const confirm = await askHidden('再次输入新密码: ');
    if (password !== confirm) throw new Error('两次输入不一致');

    // beforeCreate 钩子只在创建时加密，这里需要手动加密
    await admin.update({ password: await bcrypt.hash(password, 10) });
    console.log(`✅ ${username} 密码已修改`);
  } catch (err) {
    console.error('❌', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

resetPassword();
