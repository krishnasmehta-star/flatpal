import axios from "axios";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });
