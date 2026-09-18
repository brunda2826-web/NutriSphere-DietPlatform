import api from "./api";

export const getMyNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data.data;
};

export const clearNotification = async (id) => {
  await api.delete(`/notifications/${id}`);
};

export const clearAllNotifications = async () => {
  await api.delete("/notifications");
};

export default {
  getMyNotifications,
  markNotificationRead,
  clearNotification,
  clearAllNotifications,
};
