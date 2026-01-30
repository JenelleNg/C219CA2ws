// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// Use port 3001 for backend to avoid conflict with React dev server
const port = 3001;

// CORS setup
const allowedOrigins = ["http://localhost:3000"];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Demo user (hardcoded)
const DEMO_USER = {
    id: 1,
    username: "admin",
    password: "admin123",
};

// JWT secret (only on backend!)
const JWT_SECRET = "44c4cf6deb4d0bf6e1b857431aa53712";

// Middleware to protect routes
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Authorization header missing" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return res.status(401).json({ error: "Invalid header" });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// Test route
app.get("/", (req, res) => res.send("Backend is running!"));

// Login route
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { userId: DEMO_USER.id, username: DEMO_USER.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
});

// Example protected route
app.get("/posts", requireAuth, (req, res) => {
    res.json({
        message: `Hello ${req.user.username}, welcome to your posts page!`,
    });
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
