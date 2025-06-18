import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setSearchQuery } from "../Features/TaskSlice";

// Interface for FilterTask props
interface FilterTaskProps {
    isLoading: boolean; // Indicates if tasks are loading
    searchQuery: string; // Current search query from TaskSlice
    status: "all" | "to do" | "done"; // Filter status for subtasks
    setStatus: (status: "all" | "to do" | "done") => void; // Callback to update status
}

/**
 * FilterTask component for searching and filtering subtasks.
 * Includes a search input and a status dropdown, updating TaskSlice's searchQuery.
 * Supports loading states and accessibility.
 */
const FilterTask: React.FC<FilterTaskProps> = ({
    isLoading,
    searchQuery,
    status,
    setStatus,
}) => {
    // Ref for search input focus
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();

    // Focus search input on mount
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setSearchQuery(e.target.value));
    };

    // Handle status filter change
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value as "all" | "to do" | "done");
    };

    return (
        <div
            className="w-full mb-4 flex flex-wrap lg:flex-nowrap gap-3 lg:gap-10"
            role="search"
            aria-label="Subtask filter and search"
        >
            {/* Search input */}
            <div className="w-full">
                <input
                    id="subtask-search"
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="p-2 w-full rounded-md border border-primary bg-light text-primary placeholder:text-primary/50 focus:outline-none focus:border-2 disabled:opacity-50"
                    placeholder="Search subtasks"
                    disabled={isLoading}
                    ref={searchInputRef}
                    aria-label="Search subtasks"
                />
            </div>

            {/* Status filter */}
            <div className="w-full flex items-center gap-2 flex-wrap lg:flex-nowrap text-primary">
                <select
                    id="status-filter"
                    value={status}
                    onChange={handleStatusChange}
                    className="w-full p-2 rounded-md border border-primary bg-light text-primary focus:outline-none  focus:border-2 disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Filter subtasks by status"
                >
                    <option value="all">All</option>
                    <option value="to do">To Do</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </div>
    );
};

// Export the component
export default FilterTask;