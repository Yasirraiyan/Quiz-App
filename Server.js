require("dotenv").config();  // Ensure this is at the top

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const OAuth2Strategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration for Passport
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// User schema and model
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});
const User = mongoose.model("User", UserSchema);

// Passport Local Strategy for login
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? done(null, user) : done(null, false);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Passport Google OAuth Strategy for Google login
passport.use(new OAuth2Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
        user = new User({ username: profile.displayName, googleId: profile.id });
        await user.save();
    }
    done(null, user);
}));

// Multer setup for file uploads
const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

// Register route
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered" });
});

// Login route using Passport local strategy
app.post("/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in successfully" });
});

// Google OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("/");
});

// File upload route
app.post("/upload", upload, (req, res) => {
    res.json({ message: "File uploaded", file: req.file });
});

// Item schema and model
const ItemSchema = new mongoose.Schema({
    name: String,
    description: String
});
const Item = mongoose.model("Item", ItemSchema);

// Item routes (CRUD operations)
app.post("/items", async (req, res) => {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
});

app.get("/items", async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

app.get("/items/:id", async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
});

app.put("/items/:id", async (req, res) => {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ message: "Item not found" });
    res.json(updatedItem);
});

app.delete("/items/:id", async (req, res) => {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item deleted" });
});

// Route to handle user registration (in-memory for this example)
const users = {};
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and Password are required' });
    }
    users[username] = password;
    return res.json({ message: 'Registered successfully!' });
});

// Route to handle user login (in-memory for this example)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] === password) {
        return res.json({ message: 'Login successful!' });
    } else {
        return res.status(400).json({ message: 'Invalid username or password' });
    }
});

// Route to generate a quiz report
app.post('/generate-report', (req, res) => {
    const { quizResults } = req.body;
    if (!quizResults || !Array.isArray(quizResults)) {
        return res.status(400).json({ message: 'Invalid quiz results' });
    }
    let totalScore = 0;
    quizResults.forEach((result) => {
        if (result.isCorrect) {
            totalScore++;
        }
    });
    const passingScore = quizResults.length / 2;
    const status = totalScore >= passingScore ? 'Passed' : 'Failed';
    return res.json({
        message: 'Quiz Report Generated',
        report: { totalScore, status, quizResults }
    });
});

// Static file serving (if needed)
app.use(express.static('public'));

// 404 and error handling
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
