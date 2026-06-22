module.exports = {
  apps: [
    {
      name: 'snt-courier',
      cwd: '/var/www/snt-app/server',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SNT_DB_PATH: '/var/data/snt.db',
        N8N_TRACKING_WEBHOOK: 'https://snt-sales.app.n8n.cloud/webhook/tracking-update',
        N8N_EMAIL_WEBHOOK: 'https://snt-sales.app.n8n.cloud/webhook/email-report',
      },
    },
  ],
};
