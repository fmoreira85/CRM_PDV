export const logger = (message, meta = {}) => {
  const payload = {
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(payload));
};
