import api from './api.js';export const getRecommendations=async()=> (await api.get('/recommendations')).data.data;
