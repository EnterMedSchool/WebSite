import axios from 'axios';
import http from 'http';
import { BASE_URL } from './utils';

const request = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  httpAgent: new http.Agent({ keepAlive: true }),
});
export default request;
