module.exports = {
  apps: [
    {
      name: 'espol-scraper-computacion',
      script: 'node',
      args: 'dist/index.js --carrera CI013 --delay 1000 --headless true',
      cwd: './',
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'espol-scraper-diseno-industrial',
      script: 'node',
      args: 'dist/index.js --carrera LI004 --delay 1000 --headless true',
      cwd: './',
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
