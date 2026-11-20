#!/usr/bin/env sh

# 当发生错误时中止脚本
set -e

REPO_PATH="ave-center/ave-center.github.io.git"
# Pages 仓库的发布分支（ave-center.github.io 只有 master）
BRANCH="master"
# 自定义域名；留空则不生成 CNAME，使用 ave-center.github.io
DOMAIN=""
# 网络（代理）不稳定时，每个 Host 的重试次数
RETRIES=3


# 免交互的 ssh：key 不可用时直接失败，不卡在密码 / 指纹确认上
export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"

# 列出本机所有指向 GitHub 的 ssh Host（github.com 本身 + ~/.ssh/config 里的别名）
list_github_hosts() {
  {
    echo github.com
    if [ -f "$HOME/.ssh/config" ]; then
      awk 'tolower($1)=="host" { for (i = 2; i <= NF; i++) print $i }' "$HOME/.ssh/config"
    fi
  } | grep -v '[*?!]' | awk '!seen[$0]++' | while read -r host; do
    real=$(ssh -G "$host" 2>/dev/null | awk '$1=="hostname" { print $2 }')
    case "$real" in
      github.com|ssh.github.com) echo "$host" ;;
    esac
  done
}

pnpm i
# 构建
pnpm run build

# cd 到构建输出的目录下
cd dist
cp index.html 404.html
if [ -n "$DOMAIN" ]; then
  echo "$DOMAIN" > CNAME
fi

# 在构建产物里新建仓库
rm -rf .git
git init -q
git add -A
git commit -q -m 'deploy'

# 逐个 ssh Host 试推（dry-run 会校验写权限），用第一个有权限的真正推送
REPO=""
for host in $(list_github_hosts); do
  url="git@${host}:${REPO_PATH}"
  i=1
  while [ "$i" -le "$RETRIES" ]; do
    if err=$(git push --dry-run -f "$url" "HEAD:${BRANCH}" 2>&1); then
      REPO="$url"
      break
    fi
    echo "ssh Host「${host}」第 ${i} 次检测失败：$(echo "$err" | head -1)"
    i=$((i + 1))
    [ "$i" -le "$RETRIES" ] && sleep 2
  done
  if [ -n "$REPO" ]; then
    echo "使用 ssh Host「${host}」推送"
    break
  fi
  echo "ssh Host「${host}」不可用（无权限或网络不通），跳过"
done

if [ -z "$REPO" ]; then
  echo "无法推送到 ${REPO_PATH}（检查 ssh key 权限或代理/网络），发布中止" >&2
  exit 1
fi

# 正式推送也可能被代理断开，失败时重试
i=1
until git push -f "$REPO" "HEAD:${BRANCH}"; do
  if [ "$i" -ge "$RETRIES" ]; then
    echo "推送失败，发布中止" >&2
    exit 1
  fi
  i=$((i + 1))
  echo "推送失败，2 秒后重试（第 ${i} 次）"
  sleep 2
done

cd -
