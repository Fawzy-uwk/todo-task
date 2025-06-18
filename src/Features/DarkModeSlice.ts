import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interface for dark mode state
interface DarkModeState {
  darkMode: boolean;
}

/**
 * Check if localStorage is available and functional.
 * @returns {boolean} True if localStorage is accessible, false otherwise.
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("localStorage is not available:", error);
    return false;
  }
};

/**
 * Sync dark mode preference with DOM by toggling the 'dark' class.
 * @param {boolean} isDarkMode - Whether dark mode is enabled.
 */
const syncDarkModeWithDOM = (isDarkMode: boolean): void => {
  document.documentElement.classList.toggle("dark", isDarkMode);
};

/**
 * Load dark mode preference from localStorage.
 * @returns {boolean} The saved dark mode preference, or false if unavailable.
 */
const loadDarkModePreference = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === null) {
    return false;
  }

  try {
    const parsed = JSON.parse(savedDarkMode);
    return typeof parsed === "boolean" ? parsed : false;
  } catch (error) {
    console.error("Failed to parse darkMode from localStorage:", error);
    return false;
  }
};

// Initial state for dark mode slice
const initialState: DarkModeState = {
  darkMode: (() => {
    const preference = loadDarkModePreference();
    syncDarkModeWithDOM(preference); // Apply preference on initialization
    return preference;
  })(),
};

/**
 * Redux slice for managing dark mode state.
 * Handles toggling dark mode, persisting to localStorage, and syncing with DOM.
 */
const darkModeSlice = createSlice({
  name: "darkMode",
  initialState,
  reducers: {
    /**
     * Toggle dark mode state, persist to localStorage, and update DOM.
     */
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      if (isLocalStorageAvailable()) {
        try {
          localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
        } catch (error) {
          console.error("Failed to save darkMode to localStorage:", error);
        }
      }
      syncDarkModeWithDOM(state.darkMode);
    },
    /**
     * Set dark mode to a specific value, persist to localStorage, and update DOM.
     * @param {PayloadAction<boolean>} action - The desired dark mode state.
     */
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload;
      if (isLocalStorageAvailable()) {
        try {
          localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
        } catch (error) {
          console.error("Failed to save darkMode to localStorage:", error);
        }
      }
      syncDarkModeWithDOM(state.darkMode);
    },
  },
});

// Export actions for use in components
export const { toggleDarkMode, setDarkMode } = darkModeSlice.actions;

// Export reducer for store configuration
export default darkModeSlice.reducer;
