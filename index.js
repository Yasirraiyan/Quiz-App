const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String
});
const User = mongoose.model("User", UserSchema);

// Question Schema
const QuestionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    answer: String
});
const Question = mongoose.model("Question", QuestionSchema);

// Comment Schema
const CommentSchema = new mongoose.Schema({
    text: String,
    user: String,
    replies: [{ text: String, user: String }]
});
const Comment = mongoose.model("Comment", CommentSchema);

// Authentication: Register
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered successfully!" });
});

// Authentication: Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// Get Questions
app.get("/questions", async (req, res) => {
    const questions = await Question.find();
    res.json(questions);
});

// Submit Quiz
app.post("/submit-quiz", async (req, res) => {
    const { answers } = req.body;
    let score = 0;
    const questions = await Question.find();
    questions.forEach((q, index) => {
        if (answers[index] === q.answer) {
            score++;
        }
    });
    res.json({ score, total: questions.length });
});

// Comments
app.post("/comment", async (req, res) => {
    const { text, user } = req.body;
    const comment = new Comment({ text, user, replies: [] });
    await comment.save();
    res.json(comment);
});

app.post("/comment/reply", async (req, res) => {
    const { commentId, text, user } = req.body;
    const comment = await Comment.findById(commentId);
    comment.replies.push({ text, user });
    await comment.save();
    res.json(comment);
});

// Report Generation
app.get("/generate-report", async (req, res) => {
    const comments = await Comment.find();
    const questions = await Question.find();
    res.json({ questions, comments });
});

// File Upload (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ filePath: req.file.path });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
