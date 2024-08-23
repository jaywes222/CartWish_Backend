import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "body-parser";
import { config } from 'dotenv';
import "./db/connectDB.js";

config(); // Loads environment variables

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { json, urlencoded } = pkg; // Destructure the required functions

// CORS Configurations
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
};

// Middleware to log CORS usage
app.use((req, res, next) => {
    console.log('CORS middleware is running');
    next();
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware for JSON and URL-encoded data
app.use(json());
app.use(urlencoded({ extended: true }));

// Static file serving
app.use('/api/category', express.static(path.join(__dirname, 'upload/category')));
app.use('/api/profiles', express.static(path.join(__dirname, 'upload/profiles')));
app.use('/api/products', express.static(path.join(__dirname, 'upload/products')));

// Import and use routes
import userRoutes from "./routes/users.js";
import categoryRoutes from "./routes/category.js";
import productsRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";

app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});
