const { File } = require('../models');

// 上传文件（图片/视频）
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) throw { status: 400, message: '请选择要上传的文件' };

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
