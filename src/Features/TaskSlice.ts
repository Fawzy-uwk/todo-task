import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interface for subtask data, aligned with components
interface SubTask {
  id: string;
  title: string;
  description: string; // Required, per TaskView/SubTaskForm
  completed: boolean;
}

// Interface for task data, aligned with components
interface Task {
  id: string;
  title: string;
  subTasks: SubTask[]; // Required, defaults to []
  percentage: number; // Required, defaults to 0
  date: string;
  time: string;
  icon?: string;
}

// Interface for task state
interface TaskState {
  tasks: Task[];
  isLoading: boolean; // Renamed for consistency
  error: string | null; // Aligned with AuthSlice, TaskView
  searchQuery: string;
}

// Initial state for task slice
const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  searchQuery: "",
};

/**
 * Redux slice for managing task-related state.
 * Handles task CRUD operations, loading, errors, and search functionality.
 */
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    /**
     * Set the list of tasks, clear loading and error states.
     * @param state - Current task state
     * @param action - Payload containing the array of tasks
     */
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    /**
     * Add a new task to the list.
     * @param state - Current task state
     * @param action - Payload containing the new task
     */
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.push(action.payload);
    },
    /**
     * Update an existing task by ID.
     * @param state - Current task state
     * @param action - Payload containing the updated task
     */
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.tasks.findIndex(
        (task) => task.id === action.payload.id
      );
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    /**
     * Delete a task by ID.
     * @param state - Current task state
     * @param action - Payload containing the task ID
     */
    deleteTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },
    /**
     * Set the loading state for task operations.
     * @param state - Current task state
     * @param action - Payload containing the loading boolean
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    /**
     * Set the error state for task operations.
     * @param state - Current task state
     * @param action - Payload containing the error message or null
     */
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    /**
     * Set the search query for filtering tasks/subtasks.
     * @param state - Current task state
     * @param action - Payload containing the search query string
     */
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload.trim();
    },
    /**
     * Clear the search query.
     * @param state - Current task state
     */
    clearSearchQuery(state) {
      state.searchQuery = "";
    },
  },
});

// Export actions for use in components
export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setLoading,
  setError,
  setSearchQuery,
  clearSearchQuery,
} = taskSlice.actions;

// Export reducer for store configuration
export default taskSlice.reducer;
