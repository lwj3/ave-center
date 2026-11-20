module.exports = {
  apps: [{
    name: 'ave-center-api',
    script: 'src/app.js',
    // 进程数：默认等于 CPU 核数；可用环境变量 PM2_INSTANCES 指定（数据库连接池大小也会据此计算）
    instances: parseInt(process.env.PM2_INSTANCES) || 'max',
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
    // 生产模式：关闭 SQL 日志、启用生产限流参数和连接池配置
    env: {
      NODE_ENV: 'production',
    },
  }],
};
