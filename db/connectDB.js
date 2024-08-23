import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbURI = process.env.DATABASE;

if (!dbURI) {
    console.error('DATABASE environment variable is not set');
    process.exit(1);
}

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("DB Connected..."))
.catch((err) => console.error(`DB Connection Error: ${err}`));
