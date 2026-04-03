const DEFAULT_API_BASE_URL = "http://localhost:3000";

export const getApiBaseUrl = () => {
  try {
    return localStorage.getItem("api_base_url") || DEFAULT_API_BASE_URL;
  } catch (error) {
    return DEFAULT_API_BASE_URL;
  }
};

export const setApiBaseUrl = (value) => {
  if (!value) return;
  try {
    localStorage.setItem("api_base_url", value);
  } catch (error) {
    // ignore storage errors
  }
};
