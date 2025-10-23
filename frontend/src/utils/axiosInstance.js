import axios from 'axios';

export const backendApi = axios.create({
    baseURL: "http://localhost:2015/api",
    // timeout: 1000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const backendGqlApi = axios.create({
    baseURL: "http://localhost:2015/graphql",
    // timeout: 1000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default backendApi;