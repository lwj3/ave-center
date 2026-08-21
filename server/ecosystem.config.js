module.exports = {
  apps: [{
    name: 'ave-center-api',
    script: 'src/app.js',
    instances: 'max',          // 根据 CPU 核数自动启动对应数量的进程
    exec_mode: 'cluster',      // 集群模式（负载均衡）
    max_memory_restart: '512M', // 内存超 512M 自动重启
    // 日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    // 重启策略
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 3000,       // 重启间隔 3 秒
    kill_timeout: 10000,       // 优雅关闭超时 10 秒
    listen_timeout: 8000,      // 启动超时 8 秒
  }],
};
