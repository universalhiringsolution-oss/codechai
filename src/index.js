import dotenv from 'dotenv'
import connectDB from './db/index.db.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

// Validate critical environment variables
const validateEnvironment = () => {
    const required = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.warn('⚠️  Missing environment variables:', missing.join(', '));
    }
};

const startServer = () => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`✅ Server is running at port: ${port}`)
    })
}

(async () => {
    try {
        validateEnvironment();
        await connectDB();
        startServer();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message || error);
        if (process.env.FORCE_START_WITHOUT_DB === 'true') {
            console.warn('⚠️  FORCE_START_WITHOUT_DB=true — starting server without DB.');
            startServer();
        } else {
            console.error('❌ Exiting process due to DB connection failure.');
            process.exit(1);
        }
    }
})();








































/*
first approach 

import express from 'express';
import connectDB from './db/index.db';
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', (error) => {
            console.error("ERROR:", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);

        })

    } catch (error) {
        console.error("ERROR :", error)
        throw error;
    }
})()

*/

