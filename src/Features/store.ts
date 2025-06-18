import { configureStore } from "@reduxjs/toolkit";
import taskReducer from "./TaskSlice";
import darkModeReducer from "./DarkModeSlice";
import authReducer from "./AuthSlice";

// Define the shape of the Redux store's state
interface RootState {
  tasks: {
    tasks: Array<{
      id: string;
      title: string;
      subTasks: Array<{
        id: string;
        title: string;
        description: string;
        completed: boolean;
      }>;
      percentage: number;
      date: string;
      time: string;
      icon?: string;
    }>;
    loading: boolean;
    error: string | null;
    searchQuery: string;
  };
  dark: {
    darkMode: boolean;
  };
  auth: {
    user: {
      id: string;
      email: string;
      name?: string;
      tasks: Array<{
        id: string;
        title: string;
        subTasks: Array<{
          id: string;
          title: string;
          description: string;
          completed: boolean;
        }>;
        percentage: number;
        date: string;
        time: string;
        icon?: string;
      }>;
    } | null;
    isLoading: boolean;
    error: string | null;
  };
}

/**
 * Configure the Redux store with reducers for tasks, dark mode, and authentication.
 * Provides centralized state management for the application.
 */
const store = configureStore({
  reducer: {
    tasks: taskReducer, // Manages task-related state (tasks, search, loading, errors)
    dark: darkModeReducer, // Manages dark mode preference
    auth: authReducer, // Manages user authentication state
  },
  // Optional: Add middleware or devTools configuration if needed
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  // devTools: process.env.NODE_ENV !== "production",
});

// Infer the `RootState` type from the store's state
export type AppRootState = RootState;

// Infer the `AppDispatch` type from the store's dispatch method
export type AppDispatch = typeof store.dispatch;

// Export the configured store for use in the Provider
export default store;
export type { RootState }; // Explicit export
