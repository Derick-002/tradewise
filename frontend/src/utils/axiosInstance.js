import axios from 'axios';

const backendApi = axios.create({
    baseURL: "http://localhost:2015/api",
    // timeout: 1000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default backendApi;