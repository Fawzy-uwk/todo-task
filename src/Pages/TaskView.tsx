import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuid4 } from "uuid";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import axios from "axios";
import toast from "react-hot-toast";
import { updateTask, clearSearchQuery } from "../Features/TaskSlice";
import SubTaskForm from "../components/SubTaskForm";
import CircularProgress from "../components/CircularProgress";
import Loader from "../components/Loader";
import FilterTask from "../components/FilterTask";

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

// Interface for Redux state
interface RootState {
    tasks: {
        tasks: Task[];
        loading: boolean;
        error: string | null;
        searchQuery: string;
    };
}

/**
 * TaskView component for displaying and managing a single task's subtasks.
 * Supports adding, editing, deleting, reordering, filtering, and searching subtasks.
 */
const TaskView: React.FC = () => {
    // Get task ID from URL params
    const { id } = useParams<{ id: string }>();
    // Navigation hook for redirecting
    const navigate = useNavigate();
    // Redux dispatch for task actions
    const dispatch = useDispatch();
    // Select tasks, loading, and searchQuery from Redux store
    const { tasks, loading, searchQuery } = useSelector((state: RootState) => state.tasks);
    // Find the task matching the ID
    const chosenTask = tasks.find((task) => task.id === id);

    // State for subtask status filter
    const [status, setStatus] = useState<"all" | "to do" | "done">("all");
    // State for showing the subtask form
    const [showForm, setShowForm] = useState<boolean>(false);
    // State for editing a subtask
    const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
    // State for edit form inputs
    const [editTitle, setEditTitle] = useState<string>("");
    const [editDescription, setEditDescription] = useState<string>("");
    // State for selected subtask (keyboard navigation)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    // State for local loading (API calls)
    const [isLoading, setIsLoading] = useState<boolean>(false);


    /**
     * Fetch tasks from server if Redux store is empty.
     * Clear search query on component unmount.
     */
    useEffect(() => {
        const fetchTasks = async () => {
            if (tasks.length === 0 && !loading && id) {
                setIsLoading(true);
                try {
                    // Log cookie for debugging session issues
                    console.log("Fetching tasks, cookie:", document.cookie);
                    // Fetch tasks from server
                    const response = await axios.get("http://localhost:3001/api/tasks", {
                        withCredentials: true,
                    });
                    console.log("Fetched tasks:", response.data.tasks);
                    // Update Redux store with fetched tasks
                    response.data.tasks.forEach((task: Task) => dispatch(updateTask(task)));
                } catch (err) {
                    // Log error without redirecting
                    console.error("Fetch tasks error:", {
                        message: err instanceof Error ? err.message : "Unknown error",
                        status: axios.isAxiosError(err) ? err.response?.status : undefined,
                        data: axios.isAxiosError(err) ? err.response?.data : undefined,
                    });
                    toast.error("Failed to fetch tasks");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchTasks();



        // Cleanup: clear search query on unmount
        return () => {
            dispatch(clearSearchQuery());
        };
    }, [tasks, loading, dispatch, id]);

    /**
     * Handle keyboard shortcuts for subtask actions.
     * Supports Ctrl+Q (add), ArrowUp/Down (navigate), Space (toggle), Enter/E (edit), Delete.
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === "q") {
                e.preventDefault();
                setShowForm(true);
            }
            if (chosenTask && selectedIndex >= 0 && filteredSubTasks.length > 0) {
                const currentSubTask = filteredSubTasks[selectedIndex];
                if (e.key === "ArrowUp" && selectedIndex > 0) {
                    e.preventDefault();
                    setSelectedIndex(selectedIndex - 1);
                }
                if (e.key === "ArrowDown" && selectedIndex < filteredSubTasks.length - 1) {
                    e.preventDefault();
                    setSelectedIndex(selectedIndex + 1);
                }
                if (e.key === " ") {
                    e.preventDefault();
                    toggleComplete(currentSubTask.id);
                }
                if (e.key === "Enter" || e.key.toLowerCase() === "e") {
                    e.preventDefault();
                    startEditing(currentSubTask);
                }
                if (e.key === "Delete") {
                    e.preventDefault();
                    deleteSubTask(currentSubTask.id);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [chosenTask, selectedIndex]);

    /**
     * Calculate task completion percentage based on subtasks.
     */
    const calculatePercentage = useCallback((subTasks: SubTask[]): number => {
        if (subTasks.length === 0) return 0;
        const completedCount = subTasks.filter((st) => st.completed).length;
        return Math.round((completedCount / subTasks.length) * 100);
    }, []);

    /**
     * Save task changes to server and update Redux store.
     */
    const saveTask = useCallback(
        async (updatedSubTasks: SubTask[], newIcon?: string): Promise<void> => {
            if (!chosenTask || !id) {
                toast.error("Task not found. Cannot save changes.");
                return;
            }
            // Create updated task object
            const updatedTask: Task = {
                ...chosenTask,
                subTasks: [...updatedSubTasks],
                percentage: calculatePercentage(updatedSubTasks),
                icon: newIcon ?? chosenTask.icon,
                date: chosenTask.date,
                time: chosenTask.time,
            };

            setIsLoading(true);
            try {
                // Log cookie for debugging
                console.log("Saving task, cookie:", document.cookie);
                // Send PUT request to update task
                const response = await axios.put(
                    `http://localhost:3001/api/tasks/${id}`,
                    updatedTask,
                    { withCredentials: true }
                );
                console.log("Save task response:", response.data);
                // Update Redux store
                dispatch(updateTask(updatedTask));
            } catch (err) {
                // Log detailed error
                console.error("Save task error:", {
                    message: err instanceof Error ? err.message : "Unknown error",
                    status: axios.isAxiosError(err) ? err.response?.status : undefined,
                    data: axios.isAxiosError(err) ? err.response?.data : undefined,
                });
                // Extract error message
                const errorMessage =
                    axios.isAxiosError(err) && err.response?.data?.error
                        ? err.response.data.error
                        : "Failed to save task";
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [chosenTask, id, dispatch, calculatePercentage]
    );

    /**
     * Add a new subtask to the task.
     */
    const handleAddSubTask = useCallback(
        async (
            taskId: string,
            subTask: { title: string; description: string }
        ): Promise<void> => {
            if (!chosenTask) {
                toast.error("Task not found. Cannot add subtask");
                console.log(taskId)
                return;
            }
            // Create new subtask
            const newSubTask: SubTask = {
                id: uuid4(),
                title: subTask.title,
                description: subTask.description,
                completed: false,
            };
            // Update subtasks list
            const updatedSubTasks = [...chosenTask.subTasks, newSubTask];
            await saveTask(updatedSubTasks);
            toast.success("Subtask added");
        },
        [chosenTask, saveTask]
    );

    /**
     * Start editing a subtask by populating form fields.
     */
    const startEditing = useCallback((subTask: SubTask): void => {
        setEditingSubTaskId(subTask.id);
        setEditTitle(subTask.title);
        setEditDescription(subTask.description);
    }, []);

    /**
     * Save edited subtask changes.
     */
    const saveEdit = useCallback(
        async (subTaskId: string): Promise<void> => {
            if (!chosenTask) {
                toast.error("Task not found. Cannot save edit.");
                return;
            }
            // Validate non-empty fields
            if (!editTitle.trim() || !editDescription.trim()) {
                toast.error("Title and description are required");
                return;
            }
            // Update subtask
            const updatedSubTasks = chosenTask.subTasks.map((st) =>
                st.id === subTaskId
                    ? { ...st, title: editTitle.trim(), description: editDescription.trim() }
                    : st
            );
            await saveTask(updatedSubTasks);
            setEditingSubTaskId(null);
            setEditTitle("");
            setEditDescription("");
            toast.success("Subtask updated");
        },
        [chosenTask, editTitle, editDescription, saveTask]
    );

    /**
     * Toggle subtask completion status.
     */
    const toggleComplete = useCallback(
        async (subTaskId: string): Promise<void> => {
            if (!chosenTask) {
                toast.error("Task not found. Cannot toggle status.");
                return;
            }
            // Toggle completed status
            const updatedSubTasks = chosenTask.subTasks.map((st) =>
                st.id === subTaskId ? { ...st, completed: !st.completed } : st
            );
            await saveTask(updatedSubTasks);
            toast.success("Subtask status updated");
        },
        [chosenTask, saveTask]
    );

    /**
     * Delete a subtask from the task.
     */
    const deleteSubTask = useCallback(
        async (subTaskId: string): Promise<void> => {
            if (!chosenTask) {
                toast.error("Task not found. Cannot delete subtask.");
                return;
            }
            // Remove subtask
            const updatedSubTasks = chosenTask.subTasks.filter((st) => st.id !== subTaskId);
            await saveTask(updatedSubTasks);
            // Adjust selected index
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            toast.success("Subtask deleted");
        },
        [chosenTask, saveTask]
    );

    /**
     * Handle drag-and-drop reordering of subtasks.
     */
    const onDragEnd = useCallback(
        async (result: DropResult): Promise<void> => {
            if (!result.destination || !chosenTask) {
                if (!chosenTask) toast.error("Task not found. Cannot reorder.");
                return;
            }
            // Reorder subtasks
            const reordered = [...chosenTask.subTasks];
            const [moved] = reordered.splice(result.source.index, 1);
            reordered.splice(result.destination.index, 0, moved);
            await saveTask(reordered);
            toast.success("Subtasks reordered");
        },
        [chosenTask, saveTask]
    );

    /**
     * Filter subtasks based on search query and status.
     */
    const filteredSubTasks = chosenTask?.subTasks.filter((subTask) => {
        const searchMatch =
            searchQuery === ""
                ? true
                : subTask.title.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch =
            status === "all" ||
            (status === "to do" && !subTask.completed) ||
            (status === "done" && subTask.completed);
        return searchMatch && statusMatch;
    }) || [];

    // Show loading state
    if (loading || isLoading) {
        return <div className="text-center text-primary"><Loader /></div>;
    }

    // Show error if task not found
    if (!chosenTask) {
        return (
            <div className="text-center text-primary">
                Task not found. Please select a valid task.
            </div>
        );
    }

    return (
        // Task view container
        <div
            className="p-4 max-w-2xl mx-auto w-full bg-light rounded-md shadow"
            role="main"
            aria-label="Task Details"
        >
            {/* Back to home button */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate("/home")}
                    className="text-primary hover:underline disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Back to Home"
                >
                    Back to Home
                </button>
            </div>

            {/* Task header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {chosenTask.icon && (
                        <img
                            src={chosenTask.icon}
                            alt={`${chosenTask.title} Icon`}
                            className="w-8 h-8 rounded"
                            loading="lazy"
                        />
                    )}
                    <h2 className="text-2xl font-semibold text-primary capitalize">
                        {chosenTask.title}
                    </h2>
                </div>
                <CircularProgress percentage={chosenTask.percentage || 0} />
            </div>

            {/* Search and filter controls */}
            <FilterTask isLoading={isLoading} status={status} setStatus={setStatus} searchQuery={searchQuery} />

            {/* Subtask list with drag-and-drop */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="subTasks">
                    {(provided) => (
                        <ul
                            className="space-y-2 mb-4"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            role="list"
                            aria-label="Subtasks"
                        >
                            {filteredSubTasks.map((subTask, index) => (
                                <Draggable key={subTask.id} draggableId={subTask.id} index={index}>
                                    {(provided) => (
                                        <li
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`p-2 border rounded-md flex justify-between items-center w-full ${index === selectedIndex ? "bg-primary/20" : ""
                                                } max-h-48 overflow-y-auto`}
                                            onClick={() => setSelectedIndex(index)}
                                            role="listitem"
                                            aria-selected={index === selectedIndex}
                                            aria-label={`Subtask: ${subTask.title}`}
                                        >
                                            {editingSubTaskId === subTask.id ? (
                                                // Edit mode
                                                <div className="flex flex-col w-full gap-2">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="w-full h-10 text-primary bg-light rounded-md px-4 py-2 outline-none border border-primary focus:border-2"
                                                        disabled={isLoading}
                                                        aria-label="Edit subtask title"
                                                    />
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        className="w-full h-16 text-primary bg-light rounded-md px-4 py-2 outline-none border border-primary focus:border-2"
                                                        disabled={isLoading}
                                                        aria-label="Edit subtask description"
                                                    />
                                                    <button
                                                        onClick={() => saveEdit(subTask.id)}
                                                        className="bg-primary text-light p-2 rounded-md hover:bg-transparent hover:border hover:border-primary hover:text-primary disabled:opacity-50"
                                                        disabled={isLoading || !editTitle.trim() || !editDescription.trim()}
                                                        aria-label="Save subtask changes"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            ) : (
                                                // View mode
                                                <div className="flex items-center gap-2 flex-1 w-full overflow-y-auto">
                                                    <input
                                                        type="checkbox"
                                                        checked={subTask.completed}
                                                        onChange={() => toggleComplete(subTask.id)}
                                                        className="text-primary border-primary rounded outline-none"
                                                        disabled={isLoading}
                                                        aria-label={`Mark ${subTask.title} as ${subTask.completed ? "not completed" : "completed"}`}
                                                    />
                                                    <div className="flex flex-col flex-1">
                                                        <h3
                                                            className={`font-medium ${subTask.completed ? "line-through" : ""
                                                                } text-primary capitalize max-w-[80%]`}
                                                        >
                                                            {subTask.title}
                                                        </h3>
                                                        <p
                                                            className={`text-sm ${subTask.completed ? "line-through" : ""
                                                                } text-primary/50 max-w-[80%]`}
                                                        >
                                                            {subTask.description}
                                                        </p>
                                                        <span
                                                            className={`text-sm capitalize ${subTask.completed ? "text-green-500" : "text-red-600"
                                                                }`}
                                                        >
                                                            <span className="text-primary font-semibold">Status: </span>
                                                            {subTask.completed ? "Done" : "To Do"}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2 ml-auto">
                                                        <button
                                                            onClick={() => startEditing(subTask)}
                                                            className="text-sm text-primary hover:underline cursor-pointer disabled:opacity-50"
                                                            disabled={isLoading}
                                                            aria-label={`Edit ${subTask.title}`}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSubTask(subTask.id)}
                                                            className="text-sm text-red-500 hover:underline cursor-pointer disabled:opacity-50"
                                                            disabled={isLoading}
                                                            aria-label={`Delete ${subTask.title}`}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {filteredSubTasks.length === 0 && (
                                <li className="text-center text-primary" role="">
                                    {searchQuery || status !== "all"
                                        ? "No subtasks match your filters"
                                        : "No subtasks yet"}
                                </li>
                            )}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Add subtask button */}
            <button
                onClick={() => setShowForm(true)}
                className="w-full py-2 bg-primary text-light rounded-md border border-primary transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                aria-label="Add new subtask"
            >
                Add New Subtask (Ctrl+Q)
            </button>

            {/* Subtask form modal */}
            <SubTaskForm
                showForm={showForm}
                setShowForm={setShowForm}
                taskId={id || ""}
                onAddSubTask={handleAddSubTask}
            />
        </div>
    );
};

// Export the component for use in the app
export default TaskView;