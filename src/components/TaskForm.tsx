import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { v4 as uuid4 } from "uuid";
import axios from "axios";
import { toast } from "react-hot-toast";
import { addTask, setLoading, setError } from "../Features/TaskSlice";

// Interface for subtask data
interface SubTask {
  id: string;
  title: string;
  description: string;
  completed: boolean
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

// Interface for Redux state
interface RootState {
  tasks: {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    percentage: number
  };
}

// Maximum file size for icons (2MB)
const MAX_FILE_SIZE = (1024 * 1024) + (1024 * 1024);

/**
 * TaskForm component for adding new tasks.
 * Allows users to input a task title and optional icon, submits to the server,
 * and updates the Redux store.
 */
const TaskForm: React.FC = () => {
  // State for form inputs
  const [title, setTitle] = useState<string>("");
  const [icon, setIcon] = useState<string | undefined>(undefined);

  // Redux dispatch for task actions
  const dispatch = useDispatch();
  // Navigation hook for redirecting on error
  const navigate = useNavigate();
  // Select loading state from Redux store
  const { loading } = useSelector((state: RootState) => state.tasks);

  /**
   * Handle form submission to create a new task.
   * Validates inputs, sends task to server, and updates Redux store.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); // Prevent default form submission

      // Validate non-empty title
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error("Task title is required");
        return;
      }

      // Create new task object
      const newTask: Task = {
        id: uuid4(),
        title: trimmedTitle,
        subTasks: [],
        percentage: 0,
        date: new Date().toISOString().split("T")[0], // Current date (YYYY-MM-DD)
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }), // Current time (HH:mm)
        icon,
      };

      dispatch(setLoading(true)); // Set loading state

      try {
        // Send POST request to create task
        const response = await axios.post(
          "http://localhost:3001/api/tasks",
          newTask,
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        // Add task to Redux store
        dispatch(addTask(response.data.task));
        // Reset form fields
        setTitle("");
        setIcon(undefined);
        // Show success notification
        toast.success("Task added successfully!");
      } catch (err) {
        // Extract error message from Axios response or fallback
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to add task";

        // Update Redux store with error
        dispatch(setError(errorMessage));
        // Show error notification
        toast.error(errorMessage);

        // Redirect to login on unauthorized error
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        dispatch(setLoading(false)); // Reset loading state
      }
    },
    [title, icon, dispatch, navigate]
  );

  /**
   * Handle icon file input change.
   * Validates file size and converts to base64 for preview.
   */
  const handleIconChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return; // No file selected

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size must be less than 1MB");
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setIcon(reader.result as string);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read icon file");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  return (
    // Task form container
    <form
      className="w-full flex items-start gap-5 flex-col mb-5"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="task-form-title"
    >
      {/* Form title */}
      <h2
        id="task-form-title"
        className="text-xl font-semibold text-primary capitalize"
      >
        Add New Task
      </h2>

      {/* Title input */}
      <div className="w-full">
        <label htmlFor="task-title" className="sr-only">
          Task Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded-sm border-primary text-primary p-2 w-full focus:outline-none placeholder:text-primary/50"
          placeholder="Enter Task Name"
          required
          disabled={loading}
          aria-required="true"
        />
      </div>

      {/* Icon input and preview */}
      <div className="w-full border p-4 border-primary rounded-md">
        <label htmlFor="task-icon" className="text-primary block mb-1">
          Task Icon (optional):
        </label>
        <input
          id="task-icon"
          type="file"
          accept="image/*"
          onChange={handleIconChange}
          className="mt-1 w-full text-primary cursor-pointer font-semibold"
          disabled={loading}
        />
        {/* Icon preview */}
        {icon && (
          <img
            src={icon}
            alt="Task Icon Preview"
            className="mt-2 w-12 h-12 rounded object-cover"
            loading="lazy"
          />
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-2 bg-primary text-light rounded-md border cursor-pointer border-primary transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add new task"
      >
        {loading ? "Adding..." : "Add To-do List"}
      </button>
    </form>
  );
};

// Export the component for use in Home
export default TaskForm;