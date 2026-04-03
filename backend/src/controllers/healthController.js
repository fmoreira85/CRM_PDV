export const healthCheck = (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
};
