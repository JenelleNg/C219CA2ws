const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

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

const allowedOrigins = [
    "http://localhost:3000",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

const DEMO_USER = {
    id: 1,
    username: "admin",
    password: "admin123",
};

const JWT_SECRET = process.env.JWT_SECRET;


app.post("/login", async (req, res) => {
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

function requireAuth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Invalid authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

app.get("/allposts", async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT * FROM communityC219"
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error for allposts" });
    } finally {
        if (connection) connection.end();
    }
});

app.post("/createpost", requireAuth, async (req, res) => {
    const { record_type, title, details, pic } = req.body;
    const username = req.user.username;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            "INSERT INTO communityC219 (record_type, username, title, details, pic) VALUES (?, ?, ?, ?, ?)",
            [record_type, username, title, details, pic]
        );
        res.status(201).json({id: result.insertId, record_type, username, title, details, pic, likes: 0});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error - could not add post" });
    } finally {
        if (connection) connection.end();
    }
});

app.put("/editpost/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { record_type, title, details, pic, likes } = req.body;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        aawait connection.execute(
            `UPDATE communityC219
       SET record_type=?, title=?, details=?, pic=?, likes=?
       WHERE id=?`,
            [record_type, title, details, pic, likes, id]
        );

        res.json({ message: `Post ${id} updated successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error - could not update post" });
    } finally {
        if (connection) connection.end();
    }
});

app.delete("/deletepost/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            "DELETE FROM communityC219 WHERE id=?",
            [id]
        );
        res.json({ message: `Post ${id} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error - could not delete post" });
    } finally {
        if (connection) connection.end();
    }
});

app.listen(port, () => {
    console.log("Server running on port", port);
});
