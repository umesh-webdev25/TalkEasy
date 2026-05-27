import api from "./client";

export const getUsers = async () => {
  const response = await api.get(
    "/auth/users"
  );

  return response.data;
};

export const getUserById = async (
  userId
) => {
  const response = await api.get(
    `/auth/user/${userId}`
  );

  return response.data;
};