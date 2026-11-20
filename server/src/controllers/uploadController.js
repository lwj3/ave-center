const { File } = require('../models');
const { optimizeImage } = require('../utils/imageOptimizer');

// 上传文件（图片/视频）
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) throw { status: 400, message: '请选择要上传的文件' };

    // 图片：压缩并转为 WebP（GIF 和视频不处理）
    if (req.file.mimetype.startsWith('image/')) {
      const result = await optimizeImage(req.file.path, req.file.mimetype);
      if (result.converted) {
        req.file.path = result.path;
        req.file.filename = result.filename;
        req.file.mimetype = result.mimetype;
        req.file.size = result.size;
      }
    }

    const fileUrl = `/uploads/${req.file.mimetype.startsWith('video/') ? 'videos' : 'images'}/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // 保存文件记录到数据库
    const fileRecord = await File.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
      type: fileType,
      used_by: [],
    });

    res.json({
      code: 0,
      message: '上传成功',
      data: {
        id: fileRecord.id,
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err) { next(err); }
};
