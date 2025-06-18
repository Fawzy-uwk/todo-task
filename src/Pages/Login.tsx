import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginStart, loginSuccess, loginFailure } from "../Features/AuthSlice";
import { setTasks } from "../Features/TaskSlice";
import { RootState } from "../Features/store";


// Interface for form data to ensure type safety
interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

/**
 * Login component for user authentication.
 * Handles email/password input, "Remember Me" functionality, password visibility toggle,
 * and submits credentials to the server.
 */
const Login: React.FC = () => {
    // Initialize form state with empty fields
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    });

    // State for toggling password visibility
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Redux dispatch for auth and task actions
    const dispatch = useDispatch();
    // Navigation hook for redirecting post-login
    const navigate = useNavigate();
    // Select auth loading state from Redux store
    const { isLoading } = useSelector((state: RootState) => state.auth);

    /**
     * Load saved email and "Remember Me" preference from localStorage on mount.
     * Clears saved email if "Remember Me" is false.
     */
    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        const savedRememberMe = localStorage.getItem("rememberMe") === "true";

        if (savedRememberMe && savedEmail) {
            setFormData((prev) => ({
                ...prev,
                email: savedEmail,
                rememberMe: true,
            }));
        } else {
            localStorage.removeItem("rememberedEmail"); // Clear stale email
            localStorage.setItem("rememberMe", "false"); // Set default
        }
    }, []);

    /**
     * Handle input changes for email, password, and rememberMe checkbox.
     * Updates formData state dynamically based on input name and type.
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type, checked } = e.target;
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        },
        []
    );

    /**
     * Toggle password visibility between text and password input types.
     */
    const toggleShowPassword = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    /**
     * Handle form submission to authenticate user.
     * Sends login request, updates Redux store, manages localStorage, and navigates to home.
     */
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault(); // Prevent default form submission

            // Validate non-empty fields (browser handles required, but explicit check for clarity)
            if (!formData.email.trim() || !formData.password.trim()) {
                toast.error("Email and password are required");
                return;
            }

            dispatch(loginStart()); // Set loading state

            try {
                // Send login request to server
                const response = await axios.post(
                    "http://localhost:3001/api/login",
                    {
                        email: formData.email.trim(),
                        password: formData.password.trim(),
                    },
                    {
                        withCredentials: true,
                        headers: { "Content-Type": "application/json" },
                    }
                );

                // Log response for debugging
                console.log("Login response:", response.data);
                console.log("Cookies after login:", document.cookie);

                // Update Redux store with user and tasks
                dispatch(loginSuccess(response.data.user));
                dispatch(setTasks(response.data.user.tasks || []));

                // Show success notification
                toast.success("Login successful!");

                // Manage "Remember Me" in localStorage
                if (formData.rememberMe) {
                    localStorage.setItem("rememberedEmail", formData.email.trim());
                    localStorage.setItem("rememberMe", "true");
                } else {
                    localStorage.removeItem("rememberedEmail");
                    localStorage.setItem("rememberMe", "false");
                }

                // Redirect to home page
                navigate("/home");
            } catch (err) {
                // Extract error message from Axios response or fallback
                const errorMessage = axios.isAxiosError(err)
                    ? err.response?.data?.error || err.message
                    : "Login failed. Please try again.";

                // Log detailed error for debugging
                console.error("Login error details:", axios.isAxiosError(err) ? err.response?.data : err);

                // Update Redux store with error
                dispatch(loginFailure(errorMessage));
                // Show error notification
                toast.error(errorMessage);
            }
        },
        [formData, dispatch, navigate]
    );

    return (
        // Center the login form on the page
        <div className="flex items-center justify-center lg:max-w-[50%]" role="main" aria-label="Login Page">
            {/* Login form container with responsive width and styling */}
            <div className="max-w-lg p-8 space-y-8 bg-light lg:mt-10 mt-25 rounded-lg shadow-md transition-colors">
                {/* Form title */}
                <div className="text-center">
                    <h2 className="text-3xl capitalize font-extrabold text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                </div>

                {/* Login form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="rounded-md space-y-4">
                        {/* Email input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-primary mb-1"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="appearance-none block w-full px-3 py-2 text-primary border border-primary rounded-md focus:outline-none focus:border-2 placeholder:text-primary/50"
                                placeholder="Email address"
                                disabled={isLoading}
                                aria-required="true"
                            />
                        </div>

                        {/* Password input with toggle */}
                        <div className="relative">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-primary mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="appearance-none block w-full px-3 py-2 text-primary border border-primary rounded-md focus:outline-none focus:border-2 placeholder:text-primary/50"
                                placeholder="Password"
                                disabled={isLoading}
                                aria-required="true"
                            />
                            {/* Password visibility toggle */}
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="absolute top-[55%] right-3 text-primary cursor-pointer transform translate-y-[-10%]"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={isLoading}
                            >
                                {showPassword ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me checkbox */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary border-primary rounded"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="remember-me"
                                className="ml-2 block text-sm text-primary"
                            >
                                Remember me
                            </label>
                        </div>
                    </div>

                    {/* Submit button with loading state */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border capitalize cursor-pointer text-sm font-medium rounded-md bg-primary text-light hover:bg-transparent hover:text-primary hover:border-primary disabled:opacity-50"
                            aria-label="Sign in"
                        >
                            {isLoading ? (
                                <ClipLoader size={20} className="text-light" />
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Export the component for use in the app
export default Login;