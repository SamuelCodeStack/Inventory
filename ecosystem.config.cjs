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
  ],
};
