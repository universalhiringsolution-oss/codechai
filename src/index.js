// require('dotenv').config({path: './env'})

import dotenv from 'dotenv'
import express from 'express'
import connectDB from './db/index.db.js';

dotenv.config()

const startServer = async () => {
    try {
        await connectDB();

        const app = express();
        app.use(express.json());

        app.get('/', (req, res) => res.json({ status: 'ok' }));

        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Server listening on port ${port}`));
    } catch (err) {
        console.error('Failed to start server:', err.message || err);
        process.exit(1);
    }
};

startServer();









































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

