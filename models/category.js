import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
});

export default model("Category", CategorySchema);
