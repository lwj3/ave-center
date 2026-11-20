/**
 * 公开只读接口的缓存
 *
 * 两层：
 * 1. 进程内存缓存（方案 B）：TTL 内直接返回，不查数据库；
 *    同一时刻的并发请求只查一次数据库（single-flight），避免缓存过期瞬间的请求洪峰打到 MySQL
 * 2. HTTP 缓存头（方案 A）：让 Cloudflare 边缘节点缓存，大部分请求不回源
 *
 * pm2 cluster 下每个进程各有一份内存缓存；写操作只能清掉当前进程的，
 * 其他进程最多 MEMORY_TTL 后过期，所以 TTL 要短。
 */

const MEMORY_TTL_MS = parseInt(process.env.CACHE_MEMORY_TTL_MS) || 30 * 1000;

// Cloudflare 边缘缓存时间（秒）。过期后 stale-while-revalidate 期间先返回旧数据，后台回源更新
const EDGE_TTL = parseInt(process.env.CACHE_EDGE_TTL) || 60;
const EDGE_SWR = parseInt(process.env.CACHE_EDGE_SWR) || 300;

const store = new Map();    // key → { value, expires }
const inflight = new Map(); // key → Promise

/**
 * 取缓存；没有或已过期时调用 loader 加载，并发请求共享同一次加载
 */
async function cached(key, loader, ttlMs = MEMORY_TTL_MS) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/** 清空当前进程的缓存（内容变更后调用） */
function clearCache() {
  store.clear();
}

/**
 * 设置可被 CDN 缓存的响应头
 * - max-age：浏览器 / App 缓存时间（短一些，保证后台改完很快能看到）
 * - s-maxage：Cloudflare 等共享缓存的时间
 * - stale-while-revalidate：过期后先返回旧数据，后台更新
 */
function setPublicCacheHeaders(res, { browser = 30, edge = EDGE_TTL, swr = EDGE_SWR } = {}) {
  res.set('Cache-Control', `public, max-age=${browser}, s-maxage=${edge}, stale-while-revalidate=${swr}`);
}

/**
 * Express 中间件：/api 下任意写请求（POST/PUT/PATCH/DELETE）成功后清空缓存
 */
function clearCacheOnWrite(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  res.on('finish', () => {
    if (res.statusCode < 400) clearCache();
  });
  next();
}

module.exports = { cached, clearCache, setPublicCacheHeaders, clearCacheOnWrite };
