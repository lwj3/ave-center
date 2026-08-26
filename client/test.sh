#!/usr/bin/env sh

# 当发生错误时中止脚本
set -e


#del发布文件
rm -rf dist

pnpm install
# 构建
pnpm build

# cd 到构建输出的目录下
cd dist
cp index.html 404.html 
touch .nojekyll


git init;
git checkout -b master
git add -A;
git commit -m 'deploy';
git remote add lefter git@github.com:ave-center/ave-center.github.io.git
git push -f lefter master:master;

cd -