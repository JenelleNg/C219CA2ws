const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Database config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};
const pool = mysql.createPool(dbConfig);

// CORS
const allowedOrigins = ["http://localhost:3000"];
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Demo user
const DEMO_USER = { id: 1, username: "admin", password: "admin123" };

// Auth middleware
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Authorization missing" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return res.status(401).json({ error: "Invalid header" });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// LOGIN
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: DEMO_USER.id, username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// GET ALL POSTS
app.get("/allposts", async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM communityC219 ORDER BY id DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching posts" });
    }
});

// CREATE POST
app.post("/createpost", requireAuth, async (req, res) => {
    const { record_type, username, title, details, pic } = req.body;
    try {
        const [result] = await pool.execute(
            "INSERT INTO communityC219 (record_type, username, title, details, pic) VALUES (?, ?, ?, ?, ?)",
            [record_type, username, title, details, pic || null]
        );
        res.status(201).json({ id: result.insertId, record_type, username, title, details, pic });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error creating post" });
    }
});

// EDIT POST
app.put("/editpost/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { record_type, username, title, details, pic } = req.body;
    try {
        await pool.execute(
            "UPDATE communityC219 SET record_type=?, username=?, title=?, details=?, pic=? WHERE id=?",
            [record_type, username, title, details, pic || null, id]
        );
        res.json({ message: "Post updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error updating post" });
    }
});

// DELETE POST
app.delete("/deletepost/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute("DELETE FROM communityC219 WHERE id=?", [id]);
        res.json({ message: "Post deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error deleting post" });
    }
});

app.listen(port, () => console.log("Server running on port", port));
