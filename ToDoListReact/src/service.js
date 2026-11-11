import axios from 'axios';

const apiUrl = "http://localhost:5101/"
axios.defaults.baseURL = apiUrl

// add the JWT token (if exists) to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response?.status, error.message);
    // token missing / expired -> back to login page
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/login")) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default {
  register: async (username, password) => {
    const result = await axios.post("/register", { username, password });
    localStorage.setItem("token", result.data.token);
  },

  login: async (username, password) => {
    const result = await axios.post("/login", { username, password });
    localStorage.setItem("token", result.data.token);
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  isLoggedIn: () => !!localStorage.getItem("token"),

  getTasks: async () => {
    const result = await axios.get("/items")    
    return result.data;
  },

  addTask: async(name)=>{
    const result = await axios.post("/items", 
      {
        Name: name,
        IsComplete: false
      })
  },

  setTask: async (item) => {
    const result = await axios.put(`/items/${item.id}`, item)
    return result.data
  },

  setCompleted: async(id)=>{
    const result = await axios.put(`/items/${id}/status`)
  },

  deleteTask:async(id)=>{
      await axios.delete(`/items/${id}`)
  }
};