import React from "react";
import TaskForm from "../components/TaskForm";
import TasksList from "../components/TasksList";

// Define the Home component as a functional component
const Home: React.FC = () => {
  return (
    // Main container for the Home page, centered with responsive width
    <div
      className="xl:w-[50%] w-full flex items-center px-4 py-6 gap-3 flex-col bg-light rounded-md shadow relative"
      role="main"
      aria-label="Task Manager Home"
    >
      {/* Page title, styled prominently */}
      <h1
        className="mb-3 text-2xl font-bold text-primary"
        aria-label="Task Manager Title"
      >
        Task Manager 📁
      </h1>

      {/* Form for adding new tasks */}
      <TaskForm />

      {/* List of tasks with search and filtering */}
      <TasksList />
    </div>
  );
};

// Export the component for use in the app
export default Home;