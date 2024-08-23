import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const ProductSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
    },
    category: {
        type: _Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    reviews: {
        rate: Number,
        counts: Number,
    },
});

const Product = model("Product", ProductSchema);

export const deleteMany = async (query) => {
    return await Product.deleteMany(query);
};

export const insertMany = async (products) => {
    return await Product.insertMany(products);
};

export default Product;
