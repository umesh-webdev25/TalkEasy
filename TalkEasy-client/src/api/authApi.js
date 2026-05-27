import api from "./client";

export const signup = async (data) => {
  const response = await api.post("/auth/signup", data);
  return response.data;
};

export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/auth/user/${userId}`);
  console.log(response.data);
  return response.data;
};