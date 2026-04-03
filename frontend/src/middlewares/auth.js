export const requireAuth = (token) => {
  if (!token) {
    return {
      ok: false,
      message: "Missing auth token",
    };
  }

  return { ok: true };
};
