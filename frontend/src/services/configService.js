import api from './api.js';export const getConfig=async()=> (await api.get('/config')).data.data;
