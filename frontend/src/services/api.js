import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Function to fetch autocomplete results for riders
export const autocompleteRiders = async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/riders/autocomplete`, {
        params: { query }
      });
      return response.data;  // This should be the list of riders
    } catch (error) {
      console.error("Error fetching riders:", error);
      return [];
    }
  };