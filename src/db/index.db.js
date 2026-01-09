import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
        console.log('Attempting to connect to MongoDB with URI:', uri);
        const connectionInstance = await mongoose.connect(`${uri}${DB_NAME}`);
        console.log(`\nMONGODB connected successfully! Host: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error('MONGODB connection failed:', error.message || error);
        process.exit(1);
    }
}




export default connectDB



