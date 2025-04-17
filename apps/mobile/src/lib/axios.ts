import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { Platform } from 'react-native';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
      platform: Platform.OS,
    });

    // Handle network errors
    if (!error.response) {
      const networkError = {
        message: 'Network Error',
        details: 'Unable to connect to the server. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
      };
      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        // The auth store will handle the navigation
      } catch (storageError) {
        console.error('Error removing token:', storageError);
      }
    }

    // Return a more user-friendly error message
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api; 