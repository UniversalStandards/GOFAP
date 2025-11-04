/**
 * PM2 Ecosystem Configuration for GOFAPS
 * 
 * This configuration file defines how PM2 should manage the GOFAPS application
 * in production on Amazon Linux EC2.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 logs
 */

module.exports = {
  apps: [{
    // Application configuration
    name: 'gofaps',
    script: './dist/index.js',
    
    // Process management
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Enable cluster mode for load balancing
    
    // Auto-restart configuration
    autorestart: true,
    watch: false, // Don't watch files in production
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    
    // Logging
    error_file: '/var/log/gofaps/error.log',
    out_file: '/var/log/gofaps/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced features
    min_uptime: '10s', // Minimum uptime to be considered started
    max_restarts: 10, // Maximum number of restarts within listen_timeout
    listen_timeout: 3000, // Time in ms before forcing a reload if app not listening
    kill_timeout: 5000, // Time in ms before sending final SIGKILL
    
    // Graceful shutdown
    wait_ready: true, // Wait for process.send('ready')
    shutdown_with_message: true, // Shutdown on message
    
    // Source map support
    source_map_support: true,
    
    // Process metrics
    pmx: true,
    
    // Startup script
    post_update: ['npm install --legacy-peer-deps', 'npm run build'],
  }],
  
  // Deployment configuration for EC2
  deploy: {
    production: {
      user: 'ec2-user',
      host: 'YOUR_EC2_IP_OR_DOMAIN',
      ref: 'origin/main',
      repo: 'https://github.com/UniversalStandards/GOFAP.git',
      path: '/var/www/gofaps',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no',
    }
  }
};
