import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const DEFAULT_RETRIES = Number(process.env.DB_CONNECT_RETRIES || 5);
const BASE_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 2000);

const connectDB = async (retries = DEFAULT_RETRIES) => {
    const envUri = process.env.MONGODB_URI;
    const uri = envUri || `mongodb://127.0.0.1:27017/${DB_NAME}`;

    const options = {
        // do not set removed/deprecated options like useNewUrlParser/useUnifiedTopology
        serverSelectionTimeoutMS: 5000, // fail fast while trying
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to connect to MongoDB: ${uri}`);
            const connectionInstance = await mongoose.connect(uri, options);
            console.log(`\nMONGODB connected successfully! Host: ${connectionInstance.connection.host}`);
            // keep default buffering behavior but make timeouts explicit
            mongoose.set('bufferTimeoutMS', 10000);
            return connectionInstance;
        } catch (error) {
            console.error(`MongoDB connect attempt ${attempt} failed:`, error.message || error);
            if (attempt < retries) {
                const delay = BASE_RETRY_DELAY_MS * attempt;
                console.log(`Retrying MongoDB connection in ${delay} ms...`);
                await new Promise((res) => setTimeout(res, delay));
            } else {
                console.error('All MongoDB connection attempts failed.');
                // throw so the caller can decide to exit or start without DB
                throw error;
            }
        }
    }
}

export default connectDB;



