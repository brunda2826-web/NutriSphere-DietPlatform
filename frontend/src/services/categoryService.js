import api from './api.js';export const getCategories=async()=> (await api.get('/categories')).data.data;
