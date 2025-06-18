import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { updateTask } from "../Features/TaskSlice";

// Define interfaces for type safety
interface SubTask {
  id: string;
  title: string;
  description: string;
  completed: boolean
}

interface Task {
  id: string;
  title: string;
  subTasks: SubTask[];
  percentage: number;
  date: string;
  time: string;
  icon?: string;
}

interface EditTaskProps {
  taskList: Task; // Task to edit
  onClose: () => void; // Callback to close the form
}

// Maximum file size for icons (e.g., 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * EditTask component for updating a task's title and icon.
 * Displays a form with inputs for title and icon, handles submission, and shows loading state.
 */
const EditTask: React.FC<EditTaskProps> = ({ taskList, onClose }) => {
  // Initialize state with task's current values
  const [title, setTitle] = useState<string>(taskList.title);
  const [icon, setIcon] = useState<string | undefined>(taskList.icon);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Redux dispatch for updating task state
  const dispatch = useDispatch();
  // Navigation hook for redirecting on error
  const navigate = useNavigate();

  /**
   * Handles form submission to update the task.
   * Sends updated task data to the server and dispatches to Redux store.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); // Prevent default form submission
      if (title.trim() === "") return; // Validate non-empty title

      setIsLoading(true); // Show loading state

      try {
        // Prepare updated task object
        const updatedTask: Task = {
          ...taskList,
          title: title.trim(),
          icon,
        };




        // Send PUT request to update task
        const response = await axios.put(
          `http://localhost:3001/api/tasks/${taskList.id}`,
          updatedTask,
          { withCredentials: true }
        );




        // Update Redux store
        dispatch(updateTask(updatedTask));
        toast.success("Task updated successfully!");
        onClose(); // Close the form
        toast.success(response.statusText)
      } catch (err) {
        // Log detailed error information
        console.error("Update task error:", {
          message: err instanceof Error ? err.message : "Unknown error",
          status: axios.isAxiosError(err) ? err.response?.status : undefined,
          data: axios.isAxiosError(err) ? err.response?.data : undefined,
        });

        // Extract error message from response or use fallback
        const errorMessage =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to update task";

        toast.error(errorMessage);

        // Redirect to login on unauthorized error
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false); // Reset loading state

      }
    },
    [title, icon, taskList, dispatch, navigate, onClose]
  );

  /**
   * Handles icon file input change.
   * Validates file size and converts to base64 for preview.
   */
  const handleIconChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return; // No file selected

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 5MB limit");
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
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0 right-0 p-3 bg-light shadow flex items-start gap-5 flex-col rounded-md xl:w-96 sm:w-72 w-52 "
      aria-label="Edit task form"
    >
      {/* Form title */}
      <h2 className="text-xl font-semibold text-primary capitalize">
        Edit Task
      </h2>

      {/* Task title input */}
      <div className="w-full">
        <label htmlFor="task-title" className="text-primary">
          Task Title:
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter Task Name"
          className="border rounded-sm border-primary text-primary p-2 w-full focus:outline-none placeholder:text-primary"
          required
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      {/* Icon file input */}
      <div className="w-full">
        <label htmlFor="task-icon" className="text-primary">
          Task Icon (optional):
        </label>
        <input
          id="task-icon"
          type="file"
          accept="image/*"
          onChange={handleIconChange}
          className="mt-1 w-full text-primary cursor-pointer"
          disabled={isLoading}
        />
        {/* Icon preview */}
        {icon && (
          <img
            src={icon}
            alt="Icon Preview"
            className="mt-2 h-12 rounded"
            loading="lazy"
          />
        )}
      </div>

      {/* Form buttons */}
      <div className="flex items-center justify-between w-full gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary cursor-pointer capitalize hover:bg-transparent hover:border border-primary hover:text-primary text-light p-2 rounded-md flex-1 disabled:opacity-50"
          aria-label="Save task changes"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="bg-gray-800 cursor-pointer hover:bg-transparent hover:border border-primary hover:text-primary text-white p-2 rounded-md flex-1 disabled:opacity-50"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditTask;