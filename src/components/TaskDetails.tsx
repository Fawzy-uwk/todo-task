import React, { useState } from "react";
import { Link } from "react-router-dom";
import CircularProgress from "./CircularProgress";
import EditTask from "./EditTask";


// Interface for a task, aligned with TaskSlice and other components
interface Task {
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
}



// Interface for TasksList props
interface TasksListProps {
    filteredTasks: Task[]; // Array of tasks to display
    handleDelete: (taskId: string) => void; // Callback to delete a task
}

/**
 * TasksList component to display a list of tasks with edit and delete actions.
 * Renders tasks with progress, date, time, and optional icons.
 * Supports dark mode styling and edit modal.
 */
const TasksList: React.FC<TasksListProps> = ({ filteredTasks, handleDelete }) => {
    // State to track which task is being edited
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);



    return (
        <ul className="w-full space-y-4" role="list" aria-label="Task list">
            {filteredTasks.length > 0 ? (
                filteredTasks.slice(0, 10).map((task) => (
                    <li
                        key={task.id}
                        className={`p-4 rounded-md relative  shadow-sm flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-primary/15`}
                        aria-label={`Task: ${task.title}`}
                    >
                        {/* Task details */}
                        <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                            <Link
                                to={`/task/${task.id}`}
                                className="font-semibold capitalize text-primary flex flex-wrap items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label={`View details for ${task.title}`}
                            >
                                {task.icon && (
                                    <img
                                        src={task.icon}
                                        className="h-10 w-10 rounded-full object-cover"
                                        alt={`${task.title} icon`}
                                        loading="lazy"
                                    />
                                )}
                                <span>{task.title}</span>
                            </Link>
                            <p className="text-primary/50 text-sm font-normal w-full">
                                {task.date} | {task.time}
                            </p>
                        </div>

                        {/* Task actions */}
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-end w-full md:w-auto">
                            <CircularProgress percentage={task.percentage} />
                            <button
                                onClick={() => setEditingTaskId(task.id)}
                                className="rounded-sm bg-primary text-light px-3 py-1 w-24 capitalize hover:bg-transparent hover:border hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50"
                                aria-label={`Edit ${task.title}`}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(task.id)}
                                className="rounded-sm bg-red-500 text-white px-3 py-1 w-24 capitalize hover:bg-transparent hover:border hover:border-red-500 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                aria-label={`Delete ${task.title}`}
                            >
                                Delete
                            </button>
                            {editingTaskId === task.id && (
                                <EditTask taskList={task} onClose={() => setEditingTaskId(null)} />
                            )}
                        </div>
                    </li>
                ))
            ) : (
                <li
                    className="text-primary text-center mt-4 capitalize"
                    role="status"
                    aria-live="polite"
                >
                    No tasks to show
                </li>
            )}
        </ul>
    );
};

// Export the component
export default TasksList;