import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import axios from "axios";
import toast from "react-hot-toast";
import { deleteTask, setSearchQuery } from "../Features/TaskSlice";

import Loader from "./Loader";

import TaskDetails from "./TaskDetails";

// Interface for task data, aligned with TaskView and server
interface SubTask {
  id: string;
  title: string;
  description: string;
  completed: boolean; // Aligned with TaskView (not status)
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

// Interface for Redux state
interface RootState {
  tasks: {
    tasks: Task[];
    loading: boolean;
    error: string | null; // Align with TaskSlice (string, not Error)
    searchQuery: string;
  };
  dark: {
    darkMode: boolean;
  };
}

/**
 * TasksList component for displaying a list of tasks.
 * Supports searching, editing, deleting tasks, and navigating to task details.
 */
const TasksList: React.FC = () => {
  // Redux dispatch for task actions
  const dispatch = useDispatch();
  // Select tasks, loading, error, and searchQuery from Redux store
  const { tasks, loading, error, searchQuery } = useSelector(
    (state: RootState) => state.tasks
  );




  /**
   * Handle task deletion by sending a DELETE request and updating Redux store.
   */
  const handleDelete = useCallback(
    async (id: string) => {
      try {


        // Send DELETE request to server
        await axios.delete(`http://localhost:3001/api/tasks/${id}`, {
          withCredentials: true,
        });

        // Remove task from Redux store
        dispatch(deleteTask(id));
        // Show success notification
        toast.success("Task deleted successfully");
      } catch (err) {
        // Extract error message from Axios response or fallback
        const errorMessage =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to delete task";

        // Show error notification
        toast.error(errorMessage);
      }
    },
    [dispatch]
  );

  /**
   * Filter tasks based on search query.
   * Matches task titles (case-insensitive).
   */
  const filteredTasks = tasks.filter((task) =>
    searchQuery === ""
      ? true
      : task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loader during data fetching
  if (loading) return <Loader />;

  // Show error message if fetching fails
  if (error) return <div className="text-primary text-center">Error fetching tasks: {error}</div>;

  return (
    // Container for task list
    <div className="flex items-center flex-col w-full gap-4" role="region" aria-label="Task List">
      {/* Header with title and search input */}
      <div className="w-full flex items-center justify-between lg:flex-nowrap flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-primary">Task List</h2>
        <div className="w-full lg:w-auto">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="task-search"
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="p-2 w-full rounded-md border border-primary outline-none text-primary placeholder:text-primary/50"
            placeholder="Search for task"
            aria-label="Search tasks"
          />
        </div>
      </div>

      {/* Task list */}

      <TaskDetails filteredTasks={filteredTasks} handleDelete={handleDelete} />

    </div>
  );
};

// Export the component for use in Home
export default TasksList;