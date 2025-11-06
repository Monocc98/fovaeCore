import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const fovaeCoreApi = axios.create({
    baseURL: `${ BASE_URL }`
});

fovaeCoreApi.interceptors.request.use( (config) => {

    const token = localStorage.getItem('token');
    if ( token ) {
        config.headers.Authorization = `Bearer ${ token }`;
    }

    return config;
} )