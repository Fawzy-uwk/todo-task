import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interface for task data, aligned with TaskSlice and components
interface Task {
  id: string;
  title: string;
  subTasks: SubTask[];
  percentage: number;
  date: string;
  time: string;
  icon?: string;
}

// Interface for subtask data
interface SubTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Interface for user data
interface User {
  id: string;
  email: string;
  name?: string;
  tasks: Task[]; // Aligned with Task type
}

// Interface for auth state
interface AuthState {
  user: User | null;
  isLoading: boolean; // Renamed for consistency
  error: string | null;
}

// Initial state for auth slice
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

/**
 * Redux slice for managing authentication state.
 * Handles user login, logout, and error states.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Start login process, set loading state.
     */
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    /**
     * Handle successful login, store user data.
     */
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    /**
     * Handle login failure, store error message.
     */
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    /**
     * Log out user, reset state.
     */
    logout(state) {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export actions for use in components
export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;

// Export reducer for store configuration
export default authSlice.reducer;
