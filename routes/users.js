import { Router } from "express";
const router = Router();
import multer, { diskStorage } from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 
import _ from "lodash"; 

import User from "../models/users.js"; 
import auth from "../middleware/auth.js";

// Extract functions from imported modules
const { sign } = jwt;
const { genSalt, hash, compare } = bcrypt;
const { unlinkSync } = fs;

// LoggedIN user profile
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.send(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Setting up multer
const storage = diskStorage({
    destination: (req, file, cb) => {
        cb(null, "upload/profiles");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Using path.extname
        const filename = file.fieldname + "-" + Date.now() + ext;
        cb(null, filename);
        req.filename = filename;
    },
});
const upload = multer({ storage });

// Create user and return JWT token
router.post("/signup", upload.single("profilePic"), async (req, res) => {
    const { name, email, password, deliveryAddress } = req.body;

    try {
        // Check if the email is already registered
        let user = await User.findOne({ email }); 
        if (user) {
            // Delete the uploaded file since the API was not successful
            if (req.file) {
                const filePath = path.join("upload", "profiles", req.filename); // Using path.join
                unlinkSync(filePath);
            }

            return res
                .status(400)
                .json({ message: "Email is already registered" });
        }

        // Create the new user
        user = new User({
            name,
            email,
            password,
            deliveryAddress,
            profilePic: req.file ? req.filename : "default.jpg",
        });

        // Hash the password
        const salt = await genSalt(10);
        user.password = await hash(password, salt);

        // Save the user
        await user.save();

        // Create and return JWT token
        let newUser = _.pick(user, [
            "_id",
            "name",
            "email",
            "profilePic",
            "isAdmin",
        ]);

        sign(
            newUser,
            process.env.JWTSECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                return res.status(201).json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// User login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email is registered
        const user = await User.findOne({ email }); // Use User.findOne
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check the password
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create and return JWT token
        let newUser = _.pick(user, [
            "_id",
            "name",
            "email",
            "profilePic",
            "isAdmin",
        ]);

        sign(
            newUser,
            process.env.JWTSECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
