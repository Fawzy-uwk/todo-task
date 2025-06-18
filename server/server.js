import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// Constants for file paths and server config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3001;
const USERS_FILE = path.join(__dirname, "users.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// Initialize Express app
const app = express();

/**
 * Initialize users.json if it doesn't exist.
 * @returns {Promise<void>}
 */
const initializeUsersFile = async () => {
  try {
    await fs.access(USERS_FILE);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    } else {
      throw err;
    }
  }
};

/**
 * Read users from users.json.
 * @returns {Promise<Array>} Array of user objects
 */
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users:", err);
    return [];
  }
};

/**
 * Write users to users.json.
 * @param {Array} users - Array of user objects
 * @returns {Promise<void>}
 */
const writeUsers = async (users) => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing users:", err);
    throw err;
  }
};

/**
 * Generate a secure session token.
 * @param {string} userId - User ID
 * @returns {string} Base64-encoded session token
 */
const generateSessionToken = (userId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString("base64");
};

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:5173", // Allow client origin
    credentials: true,
    exposedHeaders: ["set-cookie"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

/**
 * Middleware to authenticate requests using session cookie.
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
const authenticate = async (req, res, next) => {
  const sessionToken = req.cookies?.session;

  if (!sessionToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString();
    const [userId] = decoded.split(":");

    if (!userId) {
      res.clearCookie("session", { path: "/", domain: "localhost" });
      return res.status(401).json({ error: "Invalid session token" });
    }

    const users = await readUsers();
    const user = users.find((u) => String(u.id) === userId);

    if (!user) {
      res.clearCookie("session", { path: "/", domain: "localhost" });
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Session validation error:", err);
    res.clearCookie("session", { path: "/", domain: "localhost" });
    return res.status(401).json({ error: "Session validation failed" });
  }
};

// Routes

/**
 * POST /api/login - Authenticate user and set session cookie.
 */
app.post("/api/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const users = await readUsers();
    const user = users.find(
      (u) => u.email === email.trim() && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionToken = generateSessionToken(user.id);

    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 1 * 24 * 60 * 60 * 1000 : undefined, // 30 days if rememberMe
      sameSite: "lax",
      path: "/",
      domain: "localhost",
    });

    const { password: _, ...userData } = user;
    res.json({
      message: "Login successful",
      user: { ...userData, tasks: userData.tasks || [] },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * GET /api/check-session - Verify active session and return user data.
 */
app.get("/api/check-session", async (req, res) => {
  const sessionToken = req.cookies?.session;

  if (!sessionToken) {
    return res.status(200).json({ user: null });
  }

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString();
    const [userId] = decoded.split(":");

    const users = await readUsers();
    const user = users.find((u) => String(u.id) === userId);

    if (!user) {
      res.clearCookie("session", { path: "/", domain: "localhost" });
      return res.status(200).json({ user: null });
    }

    const { password, ...userData } = user;
    res.json({ user: { ...userData, tasks: userData.tasks || [] } });
  } catch (err) {
    console.error("Check session error:", err);
    res.status(200).json({ user: null });
  }
});

// Protected task routes
app.use("/api/tasks", authenticate);

/**
 * GET /api/tasks - Retrieve authenticated user's tasks.
 */
app.get("/api/tasks", (req, res) => {
  res.json({ tasks: req.user.tasks || [] });
});

/**
 * POST /api/tasks - Create a new task for the authenticated user.
 */
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, date, time, icon } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(
      (u) => String(u.id) === String(req.user.id)
    );

    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      subTasks: [],
      percentage: 0,
      date: date || new Date().toISOString().split("T")[0],
      time:
        time ||
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      icon: icon || undefined,
    };

    users[userIndex].tasks = [...(users[userIndex].tasks || []), newTask];
    await writeUsers(users);

    res.status(201).json({ message: "Task created", task: newTask });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

/**
 * PUT /api/tasks/:id - Update an existing task.
 */
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const updates = req.body;

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Invalid update payload" });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(
      (u) => String(u.id) === String(req.user.id)
    );
    const taskIndex = users[userIndex].tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const originalTask = users[userIndex].tasks[taskIndex];
    let updatedTask = {
      ...originalTask,
      ...updates,
      id: originalTask.id, // Prevent ID overwrite
      subTasks: updates.subTasks || originalTask.subTasks,
    };

    // Normalize subTasks
    if (Array.isArray(updatedTask.subTasks)) {
      updatedTask.subTasks = updatedTask.subTasks.map((st) => ({
        id: st.id || crypto.randomUUID(),
        title: st.title?.trim() || "",
        description: st.description?.trim() || "",
        completed: !!st.completed,
      }));
    } else {
      updatedTask.subTasks = [];
    }

    // Calculate percentage
    if (updatedTask.subTasks.length > 0) {
      const completedCount = updatedTask.subTasks.filter(
        (st) => st.completed
      ).length;
      updatedTask.percentage = Math.round(
        (completedCount / updatedTask.subTasks.length) * 100
      );
    } else {
      updatedTask.percentage = 0;
    }

    users[userIndex].tasks[taskIndex] = updatedTask;
    await writeUsers(users);

    res.json({ message: "Task updated", task: updatedTask });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * DELETE /api/tasks/:id - Delete a task.
 */
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const users = await readUsers();
    const userIndex = users.findIndex(
      (u) => String(u.id) === String(req.user.id)
    );

    const taskIndex = users[userIndex].tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    users[userIndex].tasks.splice(taskIndex, 1);
    await writeUsers(users);

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

/**
 * POST /api/logout - Clear session cookie.
 */
app.post("/api/logout", (req, res) => {
  res.clearCookie("session", { path: "/", domain: "localhost" });
  res.json({ message: "Logged out successfully" });
});

// Static file serving for SPA
app.use(express.static(PUBLIC_DIR));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/") && !req.path.includes(".")) {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Start server
initializeUsersFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize server:", err);
    process.exit(1);
  });
