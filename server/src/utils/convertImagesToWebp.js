/**
 * 批量把已上传的 PNG / JPG 转为 WebP，并更新数据库里的引用
 *
 * 用法：
 *   npm run images:webp            预览（不写文件、不改数据库）
 *   npm run images:webp -- --apply 执行
 *
 * 说明：
 * - 原图保留不删，已缓存或外部引用的旧链接仍然可用
 * - 转换后比原图大的图片跳过
 * - 更新的字段：Articles.content / cover_image / featured_image、Carousels.image、
 *   Categories.icon、Files.url / filename / mimetype / size
 * - 更新文章时不修改 updated_at（不影响列表排序）
 * - 可重复执行：已有同名 .webp 的直接复用
 * - 执行前请先备份数据库
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { optimizeImage } = require('./imageOptimizer');
const { sequelize, Article, Carousel, Category, File } = require('../models');

const APPLY = process.argv.includes('--apply');
const IMAGE_DIR = path.join(__dirname, '../../uploads/images');
const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const fmt = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';

async function convertFiles() {
  const files = fs.readdirSync(IMAGE_DIR).filter((f) => MIME_BY_EXT[path.extname(f).toLowerCase()]);
  const mapping = {}; // 旧文件名 → 新文件名
  let before = 0;
  let after = 0;

  for (const file of files) {
    const input = path.join(IMAGE_DIR, file);
    const mimetype = MIME_BY_EXT[path.extname(file).toLowerCase()];
    const webpName = path.parse(file).name + '.webp';
    const webpPath = path.join(IMAGE_DIR, webpName);
    const originalSize = fs.statSync(input).size;

    let newSize;
    if (fs.existsSync(webpPath)) {
      newSize = fs.statSync(webpPath).size; // 之前执行过
    } else if (APPLY) {
      const r = await optimizeImage(input, mimetype, { keepOriginal: true });
      if (!r.converted) {
        console.log(`跳过（转换后不更小或失败）  ${file}`);
        continue;
      }
      newSize = r.size;
    } else {
      // 预览：在内存里转换，只统计大小
      try {
        const buf = await sharp(input, { failOn: 'none' })
          .rotate()
          .resize({ width: parseInt(process.env.IMAGE_MAX_WIDTH) || 1600, withoutEnlargement: true })
          .webp({ quality: parseInt(process.env.IMAGE_WEBP_QUALITY) || 80, effort: 4 })
          .toBuffer();
        newSize = buf.length;
      } catch (err) {
        console.log(`跳过（读取失败：${err.message}）  ${file}`);
        continue;
      }
      if (newSize >= originalSize) {
        console.log(`跳过（转换后不更小）  ${file}`);
        continue;
      }
    }

    mapping[file] = webpName;
    before += originalSize;
    after += newSize;
    console.log(`${fmt(originalSize)} → ${fmt(newSize)}  ${file}`);
  }

  console.log(`\n共 ${Object.keys(mapping).length} 张：${fmt(before)} → ${fmt(after)}` +
    (before ? `（减少 ${(100 - (after / before) * 100).toFixed(0)}%）` : ''));
  return mapping;
}

function replaceAll(str, mapping) {
  if (!str) return str;
  let out = str;
  for (const [oldName, newName] of Object.entries(mapping)) {
    // 文件名带时间戳 + 随机串，全局唯一，可以直接按 /uploads/images/<文件名> 替换
    out = out.split(`/uploads/images/${oldName}`).join(`/uploads/images/${newName}`);
  }
  return out;
}

async function updateDatabase(mapping) {
  const counts = {};
  const bump = (k) => { counts[k] = (counts[k] || 0) + 1; };

  await sequelize.transaction(async (transaction) => {
    const articles = await Article.findAll({ transaction });
    for (const a of articles) {
      let changed = false;
      for (const field of ['content', 'cover_image', 'featured_image']) {
        const next = replaceAll(a[field], mapping);
        if (next !== a[field]) { a[field] = next; changed = true; bump(`Articles.${field}`); }
      }
      // silent：不更新 updated_at，避免影响排序
      if (changed && APPLY) await a.save({ transaction, silent: true });
    }

    for (const [Model, field, label] of [[Carousel, 'image', 'Carousels.image'], [Category, 'icon', 'Categories.icon']]) {
      const rows = await Model.findAll({ transaction });
      for (const row of rows) {
        const next = replaceAll(row[field], mapping);
        if (next !== row[field]) {
          row[field] = next;
          bump(label);
          if (APPLY) await row.save({ transaction, silent: true });
        }
      }
    }

    const fileRows = await File.findAll({ transaction });
    for (const f of fileRows) {
      const newName = mapping[f.filename];
      if (!newName) continue;
      bump('Files');
      if (APPLY) {
        f.filename = newName;
        f.url = replaceAll(f.url, mapping);
        f.mimetype = 'image/webp';
        f.size = fs.statSync(path.join(IMAGE_DIR, newName)).size;
        await f.save({ transaction, silent: true });
      }
    }
  });

  console.log('\n数据库引用：');
  if (!Object.keys(counts).length) console.log('  （无）');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v} 处`);
}

(async () => {
  console.log(APPLY ? '=== 执行模式 ===\n' : '=== 预览模式（加 --apply 执行）===\n');
  try {
    const mapping = await convertFiles();
    if (Object.keys(mapping).length) await updateDatabase(mapping);
    console.log(APPLY ? '\n完成。原图已保留。' : '\n预览结束，未做任何修改。');
  } catch (err) {
    console.error('失败：', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
