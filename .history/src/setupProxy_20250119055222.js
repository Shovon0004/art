const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://shreyas2-0.apps.astra.datastax.com",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    })
  );
};
