import { connect, disconnect } from "mongoose";
import { config } from 'dotenv';
import Category from "./models/category.js";
import { deleteMany, insertMany } from "./models/products.js";
import data from "./data.json" assert { type: 'json' };

config(); // Loads environment variables

async function restoreProducts() {
    await connect(process.env.DATABASE, {});

    await Category.deleteMany({});
    await deleteMany({});

    for (let category of data) {
        const { _id: categoryId } = await new Category({
            name: category.name,
            image: category.image,
        }).save();
        const products = category.products.map((product) => ({
            ...product,
            category: categoryId,
        }));
        await insertMany(products);
    }

    disconnect();

    console.info("Database Filled/Restored Successfully!!!");
}

restoreProducts();
