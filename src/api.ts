import axios from "axios";
import { TimelineEvent, Question } from "./types";

const API_URL = "http://localhost:3005";

export const fetchTimelineEvents = async (): Promise<TimelineEvent[]> => {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
};

export const fetchCharacters = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/characters`);
  return response.data;
};

export const login = async (username: string, password: string): Promise<any> => {
  const response = await axios.get(`${API_URL}/users`);
  const users = response.data;

  // Find exact username match (ignoring case for robustness, but exact string)
  const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (user) {
    // Simple password check (in real app, hash check)
    if (user.role === 'admin') {
      // Strict check for admin
      if (user.username === 'ADMIN123' && password === '123456789') {
        return user;
      } else {
        throw new Error("Tên đăng nhập hoặc mật khẩu quản trị viên không đúng");
      }
    } else {
      if (user.password === password) return user;
    }
  }
  throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
};

export const register = async (username: string, password: string, name: string): Promise<any> => {
  // Check existence with exact match
  const response = await axios.get(`${API_URL}/users`);
  const users = response.data;
  const exists = users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (exists) {
    throw new Error("Tên đăng nhập đã tồn tại");
  }

  const newUser = {
    username,
    password,
    name,
    role: "user",
    profile: {
      tokens: 0,
      badges: []
    }
  };

  const regResponse = await axios.post(`${API_URL}/users`, newUser);
  return regResponse.data;
};

export const updateUser = async (user: any): Promise<any> => {
  const response = await axios.put(`${API_URL}/users/${user.id}`, user);
  return response.data;
};

export const createTimelineEvent = async (event: Omit<TimelineEvent, "id">): Promise<TimelineEvent> => {
  const response = await axios.post(`${API_URL}/events`, event);
  return response.data;
};

export const updateTimelineEvent = async (event: TimelineEvent): Promise<TimelineEvent> => {
  const response = await axios.put(`${API_URL}/events/${event.id}`, event);
  return response.data;
};

export const deleteTimelineEvent = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/events/${id}`);
};

export const fetchSettings = async (): Promise<any> => {
  const response = await axios.get(`${API_URL}/settings`);
  return response.data;
};

export const updateSettings = async (settings: any): Promise<any> => {
  const response = await axios.put(`${API_URL}/settings`, settings);
  return response.data;
};

export const updateCharacter = async (character: any): Promise<any> => {
  const response = await axios.put(`${API_URL}/characters/${character.id}`, character);
  return response.data;
};

export const createCharacter = async (character: any): Promise<any> => {
  const response = await axios.post(`${API_URL}/characters`, character);
  return response.data;
};

export const deleteCharacter = async (id: string | number): Promise<void> => {
  await axios.delete(`${API_URL}/characters/${id}`);
};
