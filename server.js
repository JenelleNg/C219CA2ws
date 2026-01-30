const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:3000", "https://c219ca2-chi.vercel.app"];
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

const DEMO_USER = {
    id: 1,
    username: "admin",
    password: "admin123",
};

const JWT_SECRET = "44c4cf6deb4d0bf6e1b857431aa53712";

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
app.get("/", (req, res) => res.send("Backend is running!"));

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

app.get("/protected", requireAuth, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, you are authorized!` });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
