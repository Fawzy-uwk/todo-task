import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

// Interface for subtask data to ensure type safety
interface SubTaskData {
    title: string;
    description: string;
    completed?: boolean;
}

// Interface for component props
interface SubTaskFormProps {
    showForm: boolean; // Controls form visibility
    setShowForm: (value: boolean) => void; // Callback to toggle form visibility
    taskId: string; // ID of the parent task
    onAddSubTask: (taskId: string, subTask: SubTaskData) => Promise<void>; // Callback to add subtask
}

/**
 * SubTaskForm component for adding subtasks to a task.
 * Displays a modal form with title and description inputs, handles submission,
 * and closes on success or cancel.
 */
const SubTaskForm: React.FC<SubTaskFormProps> = ({
    showForm,
    setShowForm,
    taskId,
    onAddSubTask,
}) => {
    // State for form inputs
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Ref for focusing the title input when form opens
    const titleInputRef = useRef<HTMLInputElement>(null);

    /**
     * Focus the title input when the form becomes visible.
     */
    useEffect(() => {
        if (showForm && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [showForm]);

    /**
     * Handle form submission to add a new subtask.
     * Validates inputs, calls onAddSubTask, and resets form on success.
     */
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault(); // Prevent default form submission

            // Validate non-empty fields
            const trimmedTitle = title.trim();
            const trimmedDescription = description.trim();
            if (!trimmedTitle || !trimmedDescription) {
                toast.error("Title and description are required");
                return;
            }

            setIsLoading(true); // Show loading state

            try {
                // Call parent callback to add subtask
                await onAddSubTask(taskId, {
                    title: trimmedTitle,
                    description: trimmedDescription,
                    completed: false,
                });

                // Show success notification
                toast.success("Subtask added!");

                // Reset form fields
                setTitle("");
                setDescription("");
                // Close form
                setShowForm(false);
            } catch (err) {
                // Handle and display error
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to add subtask";
                toast.error(errorMessage);
            } finally {
                setIsLoading(false); // Reset loading state
            }
        },
        [title, description, taskId, onAddSubTask, setShowForm]
    );

    /**
     * Close the form and reset fields when cancelled.
     */
    const handleClose = useCallback(() => {
        if (isLoading) return; // Prevent closing during submission
        setTitle("");
        setDescription("");
        setShowForm(false);
    }, [isLoading, setShowForm]);

    // Render nothing if form is not visible
    if (!showForm) return null;

    return (
        // Modal container, centered with backdrop
        <div
            className="fixed inset-0 px-4 flex items-center justify-center z-50"
            role="dialog"
            aria-labelledby="subtask-form-title"
            aria-modal="true"
        >
            {/* Backdrop to dim background */}
            <div
                className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-10"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Subtask form */}
            <form
                onSubmit={handleSubmit}
                className="bg-light p-6 rounded-lg w-full max-w-md z-50 relative"
                noValidate
            >
                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="absolute top-3 right-3 text-primary cursor-pointer  disabled:opacity-50"
                    aria-label="Close subtask form"
                >
                    <FaTimes size={20} className="hover:text-primary/50" />
                </button>

                {/* Form title */}
                <h2
                    id="subtask-form-title"
                    className="text-primary font-semibold text-xl mb-4"
                >
                    Add Subtask
                </h2>

                {/* Form fields */}
                <div className="space-y-4">
                    {/* Title input */}
                    <div>
                        <label htmlFor="subtask-title" className="sr-only">
                            Subtask Title
                        </label>
                        <input
                            id="subtask-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-primary text-primary rounded-md focus:border-2 outline-none placeholder:text-primary/50"
                            placeholder="Title"
                            required
                            disabled={isLoading}
                            ref={titleInputRef}
                            aria-required="true"
                        />
                    </div>

                    {/* Description textarea */}
                    <div>
                        <label htmlFor="subtask-desc" className="sr-only">
                            Subtask Description
                        </label>
                        <textarea
                            id="subtask-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-primary rounded-md text-primary focus:border-2 outline-none placeholder:text-primary/50 min-h-[100px]"
                            placeholder="Description"
                            required
                            disabled={isLoading}
                            aria-required="true"
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading || !title.trim() || !description.trim()}
                        className="w-full py-2 bg-primary text-light rounded-md border border-primary transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Add subtask"
                    >
                        {isLoading ? "Adding..." : "Add Subtask"}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Export the component for use in TaskView
export default SubTaskForm;