export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("access_token", token);
  }
};

export const getToken = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }

  return token;
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

