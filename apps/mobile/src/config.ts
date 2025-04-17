// API Configuration
export const API_URL =  'http://localhost:3000/api'; // 10.0.2.2 for Android emulator

// App Configuration
export const APP_NAME = 'Vorex Driver';
export const APP_VERSION = '1.0.0';

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
};

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000,
  LOCATION_UPDATE: 5000,
  SOCKET_RECONNECT: 3000,
}; 