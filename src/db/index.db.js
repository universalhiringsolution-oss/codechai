import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';


const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
        const connectionInstance = await mongoose.connect(`${uri}/${DB_NAME}`);
        console.log(`\nMONGODB connected — host: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error('MONGODB connection error:', error.message || error);
        throw error;
    }
}




export default connectDB



