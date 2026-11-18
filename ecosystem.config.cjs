module.exports = {
  apps: [
    {
      name: "adwa-backend",
      script: "./app.js",
      env: {
        PORT: 8080,
        NODE_ENV: "production"
      },
      cwd: "/var/www/adwa/backend", // working directory
      watch: false
    }
  ]
};
