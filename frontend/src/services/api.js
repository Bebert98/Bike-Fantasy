import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getTeams = async () => {
    const response = await axios.get(`${API_BASE_URL}/teams`);
    return response.data;
};