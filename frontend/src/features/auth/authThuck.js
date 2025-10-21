import { createAsyncThunk } from "@reduxjs/toolkit";
import backendApi from "../../utils/axiosInstance";

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await backendApi.post("/auth/register", userData);
      return res.data.newUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Signup failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await backendApi.post("/auth/login", userData);

      return res.data.loginUser;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await backendApi.post("/auth/logout");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await backendApi.get("/auth", {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Fetching user failed");
    }
  }
);
