import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  try {
    const response = await axiosInstance.post("/auth/signup", signupData);
    return response.data;
  } catch (error) {
    console.log("Error in signup:", error);
    throw error;
  }
};

export const login = async (loginData) => {
  try {
    const response = await axiosInstance.post("/auth/login", loginData);
    return response.data;
  } catch (error) {
    console.log("Error in login:", error);
    throw error;
  }
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export const getUserFriends = async () => {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
};

export const getRecommendedUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
};

export const getOutgoingFriendReqs = async () => {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
};

export const sendFriendRequest = async (userId) => {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
};

export const getFriendRequests = async () => {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
};

export const acceptFriendRequest = async (requestId) => {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
};

export const rejectFriendRequest = async (requestId) => {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/reject`);
  return response.data;
};

export const getStreamToken = async () => {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await axiosInstance.put("/users/profile", userData);
  return response.data;
};

export const uploadProfilePic = async (formData) => {
  const response = await axiosInstance.post("/users/upload-profile-pic", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
};

export const createCallRecord = async (callData) => {
  const response = await axiosInstance.post("/api/calls", callData);
  return response.data;
};

export const updateCallStatus = async (callId, statusData) => {
  const response = await axiosInstance.put(`/api/calls/${callId}`, statusData);
  return response.data;
};

export const getCallHistory = async (limit = 20, skip = 0) => {
  const response = await axiosInstance.get(`/api/calls/history?limit=${limit}&skip=${skip}`);
  return response.data;
};

export const getCallDetails = async (callId) => {
  const response = await axiosInstance.get(`/api/calls/${callId}`);
  return response.data;
};
