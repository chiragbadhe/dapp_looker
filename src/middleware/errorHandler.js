function errorHandler(err, _req, res, _next) {
  console.error("Unhandled error:", err.message);

  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
