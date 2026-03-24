import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
});

export const checkHealth = async (service) => {
    try {
        const response = await api.get(`/${service}/health`);
        return { service, status: 'UP', message: response.data };
    } catch (error) {
        return { service, status: 'DOWN', message: error.message };
    }
};

export default api;
