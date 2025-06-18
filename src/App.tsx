import { useEffect, useState, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import { FaSun, FaMoon } from "react-icons/fa";
import axios from "axios";
import Home from "./Pages/Home";
import TaskView from "./Pages/TaskView";
import Login from "./Pages/Login";
import { toggleDarkMode } from "./Features/DarkModeSlice";
import { loginStart, loginSuccess, logout } from "./Features/AuthSlice";
import { setTasks } from "./Features/TaskSlice";
import Loader from "./components/Loader";

// Interface for subtask data
interface SubTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Interface for task data
interface Task {
  id: string;
  title: string;
  subTasks: SubTask[];
  percentage: number;
  date: string;
  time: string;
  icon?: string;
}

// Interface for user data
interface User {
  id: string;
  email: string;
  name?: string;
  tasks: Task[];
}

// Interface for Redux state
interface RootState {
  dark: {
    darkMode: boolean;
  };
  auth: {
    user: User | null;
    isLoading: boolean;
    error: string | null;
  };
  tasks: {
    tasks: Task[];
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
  };
}

// Axios instance for API calls
const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

/**
 * ProtectedRoute component to guard authenticated routes.
 * Shows loading state while checking session, renders element otherwise.
 */
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  // Show loading spinner during session check
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary">
        <Loader />
      </div>
    );
  }

  // Render element if user is authenticated, otherwise redirect to login
  return user ? element : <Login />;
};

/**
 * Main App component handling routing, session management, and dark mode.
 */
const App: React.FC = () => {
  // Redux state and dispatch
  const { darkMode } = useSelector((state: RootState) => state.dark);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for user dropdown visibility
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  /**
   * Toggle dark mode and persist to localStorage.
   */
  const toggleMode = useCallback(() => {
    dispatch(toggleDarkMode());
  }, [dispatch]);

  /**
   * Handle user sign-out, clear state, and navigate to login.
   */
  const handleSignOut = useCallback(async () => {
    try {
      // Send logout request
      await api.post("/api/logout");
      // Clear auth and tasks state
      dispatch(logout());
      dispatch(setTasks([]));

      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", {
        message: err instanceof Error ? err.message : "Unknown error",
        status: axios.isAxiosError(err) ? err.response?.status : undefined,
      });
      // Clear state even on error
      dispatch(logout());
      dispatch(setTasks([]));
      toast.error("Failed to log out properly");
    } finally {
      setShowDropdown(false);
      navigate("/login");
    }
  }, [dispatch, navigate]);

  /**
   * Check session on mount to verify user authentication.
   */
  const checkSession = useCallback(async () => {

    dispatch(loginStart());
    try {
      // Fetch session data
      const response = await api.get("/api/check-session");

      if (response.data.user) {
        // Update auth and tasks state
        dispatch(loginSuccess(response.data.user));
        dispatch(setTasks(response.data.user.tasks || []));
      } else {
        // Clear state if no user
        dispatch(logout());
        dispatch(setTasks([]));
        toast.error("Please log in to sync tasks");
      }
    } catch (err) {
      console.error("Session check error:", {
        message: err instanceof Error ? err.message : "Unknown error",
        status: axios.isAxiosError(err) ? err.response?.status : undefined,
      });
      // Clear state on error
      dispatch(logout());
      dispatch(setTasks([]));
      toast.error("Failed to verify session. Please log in.");
    }
  }, [dispatch]);

  // Run session check on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDropdown &&
        e.target instanceof Element &&
        !e.target.closest(".dropdown-container")
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  // Show loading state during initial session check
  if (isLoading && !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    // Main app container
    <div
      className="w-full flex flex-col items-center px-4 py-16 relative min-h-screen"
      role="application"
      aria-label="Task Management App"
    >
      {/* Dark mode toggle button */}
      <button
        onClick={toggleMode}
        className="absolute top-4 right-4 p-2 rounded-md hover:bg-primary/15 cursor-pointer transition-colors focus:outline-none "
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <FaSun size={22} className="text-yellow-300" />
        ) : (
          <FaMoon size={22} className="text-blue-700" />
        )}
      </button>

      {/* User dropdown for authenticated users */}
      {user && (
        <div className="absolute top-4 left-4 dropdown-container z-50">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-primary text-light px-4 py-2 rounded-md border border-primary hover:bg-transparent hover:text-primary focus:outline-none  transition-colors text-sm font-medium"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            aria-label="User menu"
          >
            {user.name || user.email}
          </button>
          {showDropdown && (
            <div className="absolute mt-2 w-48 bg-light rounded-md shadow-lg border border-primary divide-y divide-primary/20">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-primary truncate" title={user.email}>
                  {user.email}
                </p>
                {user.name && (
                  <p className="text-sm text-primary/55 truncate">{user.name}</p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/10 focus:outline-none focus:bg-primary/10 transition-colors rounded-b-md"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: "",
          style: {
            background: "var(--color-light)",
            color: "var(--color-primary)",
            padding: "12px 24px",
            borderRadius: "8px",
            border: "1px solid var(--color-primary)",
          },
          duration: 3000,
        }}
      />

      {/* App routes */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/task/:id" element={<ProtectedRoute element={<TaskView />} />} />
        <Route
          path="*"
          element={
            <div className="text-center py-20 text-primary">
              404 - Page not found
            </div>
          }
        />
      </Routes>
    </div>
  );
};

// Export the main App component
export default App;