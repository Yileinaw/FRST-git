import axios from 'axios';

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create an Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
    (config) => {
        // Get token from local storage (or your preferred storage)
        const token = localStorage.getItem('authToken'); // Ensure key matches where you store it
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors (e.g., 401)
apiClient.interceptors.response.use(
    (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        if (error.response && error.response.status === 401) {
            // Handle 401 Unauthorized (e.g., token expired or invalid)
            console.error('Unauthorized, logging out or redirecting to login.');
            // Optionally clear token and redirect
            localStorage.removeItem('authToken');
            // Redirect to login page - adapt based on your router setup
            if (window.location.pathname !== '/auth/login') { // Avoid redirect loop
                // window.location.href = '/auth/login'; 
                // Or use router push: router.push('/auth/login');
            }
        }
        // You can add more error handling here (e.g., for 403, 500)
        return Promise.reject(error);
    }
);

export default apiClient; 