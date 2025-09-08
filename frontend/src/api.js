import axios from 'axios';

const API = axios.create({
  baseURL: 'https://task4-2m1g.onrender.com',
});

export default API;
