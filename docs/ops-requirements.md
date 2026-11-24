# 运维需求：API 安全加固与性能优化

| 项目 | 内容 |
|---|---|
| 涉及域名 | `api.ave-academy.org`（Cloudflare 代理 → 源站宝塔 Nginx → Node:3000，pm2 cluster） |
| 调用方 | Web（`https://ave-center.github.io`）、iOS App、Android App |
| 代码侧 | 已完成并提交（`360874c`）：限流只信任来自 Cloudflare 的 `CF-Connecting-IP`；登录按用户名锁定；登录日志 |
| 本文档 | **只包含需要运维在 Cloudflare 控制台和服务器上操作的部分** |

## 需求总览

| # | 需求 | 优先级 | 操作位置 |
|---|---|---|---|
| 1 | 处理本次暴力破解：封禁 IP、检查是否被试出密码 | 🔴 P0 立即 | 宝塔 / 服务器 |
| 2 | 修正 Nginx `server_name`，增加默认站点拒绝未知访问 | 🔴 P0 | 宝塔 Nginx |
| 3 | 防止绕过 Cloudflare：密钥请求头 | 🔴 P0 | Cloudflare + 宝塔 Nginx |
| 4 | 安全组只放行 Cloudflare IP | 🔴 P0 | 云服务器控制台 |
| 5 | Cloudflare 缓存 `/recommended`、`/home` | 🟠 P1 | Cloudflare |
| 6 | Cloudflare 接口限流（Rate Limiting） | 🟠 P1 | Cloudflare |

> ⚠️ **第 2～4 项必须按顺序执行**，每一步验证通过后再做下一步，否则可能误伤正常流量。

---

## 背景

### 暴力破解事件

2026-11-24 07:37，IP `87.249.134.33` 以**每秒约 300 次**的频率请求 `POST /api/auth/login`。请求没有 UA，是脚本在跑。

- 这个 IP **不在 Cloudflare 的 IP 段里**，说明攻击者**绕过 CF 直接连到了源站**。
- 攻击者伪造请求头 `CF-Connecting-IP` 绕过了登录限流，几百次请求全部返回 401，没有一次被 429 拦下。代码侧已修复。
- 每次登录请求会消耗约 70ms CPU，并查一次数据库。大量请求会拖慢所有接口，**其他用户的请求也会变慢或失败**。

### 接口慢

`/api/articles/recommended` 在浏览器里耗时约 1.9s。排查后确认后端处理几乎不耗时，慢在 **Cloudflare 没有缓存这个接口，每个请求都要回源**（`cf-cache-status: DYNAMIC`）。

目前源站 Nginx 已经加了 proxy_cache（`x-cache: HIT`），但它只省掉了 Nginx → Node 这一段，这一段本来就不慢。慢的是 **CF → 源站** 这一段，需要在 Cloudflare 上开启缓存。

---

## 1. 处理本次暴力破解 🔴

### 1.1 封禁攻击 IP

宝塔 → 安全 / Nginx 防火墙 → IP 黑名单，添加：

- `87.249.134.33`（11-24 07:17～07:37 暴力破解主力）
- `178.249.211.101`（11-24 06:46 直连源站请求登录接口）

> 黑名单只是临时止血：攻击者换个 IP 就能继续。根治靠第 2～4 项。

### 1.2 检查有没有登录成功

```bash
# 登录接口中，状态码不是 400/401/429 的请求（正常应该只有管理员自己的 200）
grep 'POST /api/auth/login' /www/wwwlogs/server.log | grep -v '" 40[01] \|" 429 ' | awk '{print $1, $4, $9}' | sort | uniq -c
```

如果有 **`87.249.134.33`（或其他陌生 IP）返回 `200`**，说明密码已被试出，需要立即：
1. 修改后台管理员密码：`cd server && npm run admin:password`（交互式输入新密码，默认修改 `admin` 用户；修改其他用户用 `npm run admin:password -- 用户名`）
2. 更换 `server/.env` 里的 `JWT_SECRET`（至少 32 位随机字符串），然后执行 `pm2 restart all`，让所有已签发的 token 失效。

---

## 2. Nginx：修正 server_name，拒绝未知访问 🔴

### 现状问题

[server/ng.config](../server/ng.config) 里的 `server_name` **只写了 `ave-center-end.luweijun.com`，没有写 `api.ave-academy.org`**。

线上能访问，是因为这个站点被当成了默认站点。后果是：**任何域名、直接用 IP 访问，都会落到这个 API 站点上**。

Nginx 的 `error.log` 已经证实了这一点：大量请求的 `host` 是源站 IP 本身，`server` 却是这个 API 站点。来源是 Censys（`66.132.x.x`）、Shodan（`66.240.192.138`）等全网扫描器，它们会定期访问 `/.well-known/security.txt`。说明**源站 IP 已经被这些平台收录**，任何人都能查到。

### 2.1 补全 server_name（先做）

宝塔 → 网站 → 该站点 → 配置文件：

```nginx
server_name ave-center-end.luweijun.com api.ave-academy.org;
```

保存，然后验证：

```bash
nginx -t && nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" https://api.ave-academy.org/api/health   # 期望 200
```

### 2.2 增加默认站点，拒绝 IP 直连和未知域名

在宝塔的默认站点配置（一般是 `/www/server/panel/vhost/nginx/0.default.conf`；如果没有，就新建一个 `0.default.conf`）中写入：

```nginx
server {
    listen 80  default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;   # 不返回证书，避免扫描器通过证书反查出域名
    return 444;                # 直接断开连接，不返回任何内容
}
```

> 如果其他站点已经声明了 `default_server`，要先去掉那边的声明，否则 `nginx -t` 会报错。

验证：

```bash
nginx -t && nginx -s reload
# 在服务器上执行：用 IP 直接访问，期望连接被断开（curl 报错 52 或 35）
curl -sk -m 5 https://127.0.0.1/api/health; echo "exit=$?"
curl -s  -m 5 http://127.0.0.1/api/health;  echo "exit=$?"
# 经过 CF 正常访问，期望 200
curl -s -o /dev/null -w "%{http_code}\n" https://api.ave-academy.org/api/health
```

---

## 3. 防止绕过 Cloudflare：密钥请求头 🔴

### 为什么只做安全组（第 4 项）不够

攻击者可以在**自己的** Cloudflare 账号里，把一个域名指向我们的源站 IP。这样请求同样来自 CF 的 IP，安全组拦不住。

解决办法是：在**我们的** CF 账号里给回源请求加一个密钥请求头，源站只接受带这个密钥的请求。

### 3.1 生成密钥

```bash
openssl rand -hex 32
```

记下生成的字符串（下文用 `<ORIGIN_SECRET>` 表示），并保存到团队的密码管理工具里。

### 3.2 在 Cloudflare 添加请求头（先做）

Cloudflare 控制台 → `ave-academy.org` → **Rules → Transform Rules → Modify Request Header → Create rule**

| 配置项 | 值 |
|---|---|
| Rule name | `origin-auth-header` |
| 匹配条件 | `Hostname` equals `api.ave-academy.org` |
| 操作 | **Set static**：Header name 填 `X-Origin-Auth`，Value 填 `<ORIGIN_SECRET>` |

### 3.3 在 Nginx 校验请求头（后做）

在该站点配置的 `location / {` 里，**放在第一行**：

```nginx
location / {
    if ($http_x_origin_auth != "<ORIGIN_SECRET>") { return 444; }
    # ……原有配置不变
```

> 只加在 `location /` 里，不影响 `/.well-known/` 的 SSL 证书续期验证。

验证：

```bash
nginx -t && nginx -s reload
# 经过 CF，期望 200
curl -s -o /dev/null -w "%{http_code}\n" https://api.ave-academy.org/api/health
# 在服务器上模拟直连（带正确 Host 但没有密钥），期望连接被断开（exit=52）
curl -sk -m 5 --resolve api.ave-academy.org:443:127.0.0.1 https://api.ave-academy.org/api/health; echo "exit=$?"
```

同时打开 Web 首页和 iOS、Android App，确认数据正常加载。

### 回滚

删除 Nginx 中的那一行 `if`，执行 `nginx -s reload`。Cloudflare 的转换规则留着也没有影响。

---

## 4. 安全组只放行 Cloudflare IP 🔴

### 4.1 操作前先检查旧域名

[client/src/utils/uploadUrl.js](../client/src/utils/uploadUrl.js) 里还引用了旧域名 `ave-center-api.luweijun.com` 和 `ave-center-end.luweijun.com`。

在 Cloudflare（或这两个域名所在的 DNS 服务商）检查它们的解析记录：

| 状态 | 处理方式 |
|---|---|
| 已开启 CF 代理（🟠 橙色云） | 没问题 |
| 灰色云，直接解析到源站 IP | **这很可能就是源站 IP 暴露的原因**。改成橙色云；或者确认已经没有客户端在用这个域名后，删除这条解析 |
| 不在 Cloudflare 上 | 确认没有客户端在用后，删除这条解析 |

如果灰色云的域名还有旧版 App 在用，直接改安全组会让这些请求全部失败。

### 4.2 修改安全组

云服务器控制台 → 安全组 → 入站规则：

| 端口 | 来源 | 说明 |
|---|---|---|
| 80、443 | 删除 `0.0.0.0/0` 和 `::/0`；添加下面的 Cloudflare IP 段 | 只有 CF 能访问网站 |
| 22（SSH）、宝塔面板端口 | 只放行办公室或运维的固定 IP | 不要对公网开放 |

Cloudflare IP 段（以 https://www.cloudflare.com/ips/ 上的最新列表为准）：

```
IPv4:
173.245.48.0/20   103.21.244.0/22   103.22.200.0/22   103.31.4.0/22
141.101.64.0/18   108.162.192.0/18  190.93.240.0/20   188.114.96.0/20
197.234.240.0/22  198.41.128.0/17   162.158.0.0/15    104.16.0.0/13
104.24.0.0/14     172.64.0.0/13     131.0.72.0/22

IPv6:
2400:cb00::/32  2606:4700::/32  2803:f800::/32  2405:b500::/32
2405:8100::/32  2a06:98c0::/29  2c0f:f248::/32
```

> 后端代码里也内置了这份列表（[server/src/app.js](../server/src/app.js) 中的 `CLOUDFLARE_IPV4` / `CLOUDFLARE_IPV6`）。如果 CF 以后调整了 IP 段，两边要一起更新。

### 4.3 验证

```bash
# 从办公室网络（不经过 CF）直接访问源站 IP，期望连接超时
curl -sk -m 5 https://<源站IP>/; echo "exit=$?"   # 期望 exit=28
# 经过 CF，期望 200
curl -s -o /dev/null -w "%{http_code}\n" https://api.ave-academy.org/api/health
```

再打开 Web 首页和两个 App，确认数据正常。

### 4.4 后续（可选）

源站 IP 已经暴露过，历史 DNS 记录查询网站上仍然能查到。第 2～4 项都完成后，可以考虑**更换服务器公网 IP**，然后只在 Cloudflare 里更新源站地址，新 IP 不要出现在任何灰色云的解析记录里。

---

## 5. Cloudflare 缓存 `/recommended` 和 `/home` 🟠

### 现状

源站已经返回允许 CDN 缓存的响应头 `cache-control: public, max-age=30, s-maxage=60, stale-while-revalidate=300`，但 CF 默认不缓存 JSON，所以每次都是 `cf-cache-status: DYNAMIC`。

以下几项已经确认过，**开启缓存不会有问题**：

| 检查项 | 结果 |
|---|---|
| 响应是否带 `Set-Cookie`（会阻止 CF 缓存） | 不带 ✅ |
| 内容是否因用户不同而不同 | 不会 ✅ |
| CORS | Nginx 对这两个路径固定返回 `Access-Control-Allow-Origin: *`，缓存后网页和 App 共用同一份响应 ✅ |

### 配置

Cloudflare → **Caching → Cache Rules → Create rule**

| 配置项 | 值 |
|---|---|
| Rule name | `cache-public-api` |
| 表达式 | 见下方 |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Use cache-control header if present** |
| Browser TTL | **Respect origin** |
| Cache key | 保持默认（**包含查询参数**，这样 `?lang=en` 和中文版会分开缓存；**不要**把 `Origin` 加进缓存键） |
| Serve stale content while revalidating | 开启 |

```
(http.host eq "api.ave-academy.org" and http.request.method eq "GET" and http.request.uri.path in {"/api/articles/recommended" "/api/articles/home"})
```

> 如果已经有规则对 `/api/*` 设置了 Bypass cache，新规则要排在它后面。

### 验证

```bash
for i in 1 2 3; do
  curl -s -o /dev/null -D - https://api.ave-academy.org/api/articles/recommended \
    -w "ttfb=%{time_starttransfer}\n" | grep -iE "cf-cache-status|^age:|ttfb"
done
```

| 验收项 | 期望 |
|---|---|
| 第 2 次及以后的 `cf-cache-status` | **`HIT`**，并且出现 `age:` 头（只看到 `x-cache: HIT` 不算，那是源站 Nginx 的缓存） |
| TTFB | 不再出现 0.5～1.5s 的回源耗时 |

### 影响

- 后台修改推荐文章后，用户最多约 60s 后才能看到更新。如果源站 Nginx 的 proxy_cache 也开着，**延迟还要加上它的缓存时间**，请告知开发那边设置的时长。
- 需要立即生效时：CF → Caching → Configuration → Custom Purge，按 URL 清除缓存。

---

## 6. Cloudflare 接口限流 🟠

在 CF 边缘节点就拦截刷接口的请求，不让它们到达源站。

Cloudflare → **Security → WAF → Rate limiting rules → Create rule**（免费版可以建 1 条）

| 配置项 | 值 |
|---|---|
| Rule name | `api-rate-limit` |
| 匹配条件 | `Hostname` equals `api.ave-academy.org` **AND** `URI Path` starts with `/api/` |
| 统计维度 | IP |
| 阈值 | 同一 IP **10 秒内超过 50 次** |
| 处理方式 | **Block**，持续 10 秒（免费版的固定值） |

> 阈值说明：App 首页一次会并发几个接口，正常用户 10 秒内远远到不了 50 次。上线后观察 Security → Events 一两天，如果有正常用户被拦，再调高阈值。

### 可选：登录接口加质询

后台是在浏览器里登录的，可以单独给登录接口加一条 WAF 自定义规则：

| 匹配条件 | 处理方式 |
|---|---|
| `URI Path` equals `/api/auth/login` **AND** `Request Method` equals `POST` | **Managed Challenge** |

脚本过不了质询，正常管理员在浏览器里通常无感知。⚠️ **这条规则只能用于登录接口，不能用于 App 调用的接口**，因为 App 无法完成质询，会直接拿不到数据。

---

## 验收清单

| # | 验收项 | 结果 |
|---|---|---|
| 1 | 攻击 IP 已封禁；日志里没有陌生 IP 登录成功的记录 | ☐ |
| 2 | 用 IP 直接访问源站，连接被断开或超时 | ☐ |
| 3 | 不带密钥请求头直连源站，连接被断开 | ☐ |
| 4 | 安全组 80/443 端口只放行 Cloudflare IP；SSH 和宝塔面板只放行固定 IP | ☐ |
| 5 | `/recommended` 第二次请求返回 `cf-cache-status: HIT` | ☐ |
| 6 | Rate Limiting 规则已生效（Security → Events 里能看到） | ☐ |
| 7 | Web（`ave-center.github.io`）、iOS、Android 首页数据都正常 | ☐ |
