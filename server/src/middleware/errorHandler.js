// 全局错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
    data: null,
  });
}

// 404处理
function notFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  });
}

module.exports = { errorHandler, notFoundHandler };
