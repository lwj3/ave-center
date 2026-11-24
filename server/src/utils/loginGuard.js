/**
 * 登录防暴力破解：按用户名统计失败次数并临时锁定
 *
 * 按 IP 限流（app.js 的 authLimiter）挡不住「大量 IP 轮流试同一个账号」，
 * 所以这里再按用户名计数：同一用户名连续失败 MAX_FAILS 次，锁定 LOCK_MS。
 *
 * 说明：
 * - 内存存储，pm2 cluster 下每个进程各自计数，实际上限约为 MAX_FAILS × 进程数；
 *   需要精确的全局计数时可改用 Redis。
 * - 锁定期间即使密码正确也拒绝登录（否则攻击者能通过返回结果判断密码是否正确）。
 * - 紧急解锁：pm2 restart（内存清空）。
 */

const MAX_FAILS = parseInt(process.env.LOGIN_MAX_FAILS) || 5;
const LOCK_MS = (parseInt(process.env.LOGIN_LOCK_MINUTES) || 15) * 60 * 1000;

const failures = new Map(); // username → { count, lockedUntil, lastAt }

const keyOf = (username) => String(username).trim().toLowerCase();

/** 剩余锁定毫秒数，未锁定返回 0 */
function lockRemaining(username) {
  const rec = failures.get(keyOf(username));
  if (!rec || !rec.lockedUntil) return 0;
  const left = rec.lockedUntil - Date.now();
  if (left <= 0) {
    failures.delete(keyOf(username));
    return 0;
  }
  return left;
}

/** 记一次失败，达到上限时锁定 */
function recordFailure(username) {
  const key = keyOf(username);
  const now = Date.now();
  let rec = failures.get(key);
  // 距上次失败超过锁定时长，重新计数
  if (!rec || now - rec.lastAt > LOCK_MS) rec = { count: 0, lockedUntil: 0, lastAt: now };
  rec.count += 1;
  rec.lastAt = now;
  if (rec.count >= MAX_FAILS) rec.lockedUntil = now + LOCK_MS;
  failures.set(key, rec);
}

function recordSuccess(username) {
  failures.delete(keyOf(username));
}

// 定期清理过期记录，防止大量随机用户名把内存撑大
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of failures) {
    if ((rec.lockedUntil && rec.lockedUntil < now) || (!rec.lockedUntil && now - rec.lastAt > LOCK_MS)) {
      failures.delete(key);
    }
  }
}, 60 * 1000).unref();

module.exports = { lockRemaining, recordFailure, recordSuccess, MAX_FAILS };
