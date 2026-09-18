import api from "./api";

export const getMyReviews = async () => {
  const res = await api.get("/reviews/mine");
  return res.data.data;
};

export const createReview = async (data) => {
  const res = await api.post("/reviews", data);
  return res.data.data;
};

export const getOwnerReviews = async () => {
  const res = await api.get("/reviews/owner/all");
  return res.data.data;
};

export default {
  getMyReviews,
  createReview,
  getOwnerReviews,
};
