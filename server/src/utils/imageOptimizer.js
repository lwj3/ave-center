const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 图片最大宽度（文章正文/封面在桌面端最宽约 800px，按 2 倍屏取 1600）
const MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH) || 1600;
// WebP 质量（80 肉眼基本无损，体积约为 PNG 的 1/5 ~ 1/10）
const WEBP_QUALITY = parseInt(process.env.IMAGE_WEBP_QUALITY) || 80;

// 可转换的格式；GIF 可能是动图，不处理
const CONVERTIBLE = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 将图片压缩并转为 WebP
 * - 宽度超过 MAX_WIDTH 时等比缩小（不放大）
 * - 按 EXIF 自动旋转
 * - 转换后比原图还大时保留原图
 *
 * @param {string} inputPath 原图绝对路径
 * @param {string} mimetype  原图 MIME
 * @param {object} [opts]
 * @param {boolean} [opts.keepOriginal=false] 是否保留原文件（批量迁移旧图时保留，旧链接仍可访问）
 * @returns {Promise<{converted: boolean, path: string, filename: string, mimetype: string, size: number, originalSize: number}>}
 */
async function optimizeImage(inputPath, mimetype, { keepOriginal = false } = {}) {
  const originalSize = fs.statSync(inputPath).size;
  const unchanged = {
    converted: false,
    path: inputPath,
    filename: path.basename(inputPath),
    mimetype,
    size: originalSize,
    originalSize,
  };

  if (!CONVERTIBLE.includes(mimetype)) return unchanged;

  const { dir, name } = path.parse(inputPath);
  const outPath = path.join(dir, `${name}.webp`);
  // 原图本身就是 .webp 时，先写临时文件再覆盖
  const tmpPath = outPath === inputPath ? `${outPath}.tmp` : outPath;

  try {
    await sharp(inputPath, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(tmpPath);
  } catch (err) {
    // 图片损坏或格式异常：保留原图，不影响上传
    console.error('[imageOptimizer] 转换失败，保留原图:', inputPath, err.message);
    if (fs.existsSync(tmpPath) && tmpPath !== inputPath) fs.unlinkSync(tmpPath);
    return unchanged;
  }

  const newSize = fs.statSync(tmpPath).size;

  // 转换后反而更大（原图已经高度压缩）：保留原图
  if (newSize >= originalSize) {
    fs.unlinkSync(tmpPath);
    return unchanged;
  }

  if (tmpPath !== outPath) {
    fs.renameSync(tmpPath, outPath); // .webp → .webp 覆盖
  } else if (!keepOriginal) {
    fs.unlinkSync(inputPath);
  }

  return {
    converted: true,
    path: outPath,
    filename: path.basename(outPath),
    mimetype: 'image/webp',
    size: newSize,
    originalSize,
  };
}

module.exports = { optimizeImage };
