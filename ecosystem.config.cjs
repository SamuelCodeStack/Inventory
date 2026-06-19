module.exports = {
  apps: [
    {
      name: "backend",
      script: "server.js",
      cwd: "C:/Users/Samuel/Desktop/Inventory/inventory",
      watch: ["server.js"],
      ignore_watch: ["node_modules", "src", "public"],
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "frontend",
      script: "node_modules/vite/bin/vite.js",
      args: "--host 0.0.0.0 --port 5173",
      cwd: "C:/Users/Samuel/Desktop/Inventory/inventory",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
