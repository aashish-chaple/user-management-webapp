import express from 'express';
import cors from 'cors';
import { checkDatabaseConnection } from './config/db.js';
import initializeRoutes from './routes/index.js';

const configureApp = () => {
    const app = express(); // Create an instance of the Express app
    app.use(cors({ preflightContinue: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(async (req, res, next) => {
        const isDbConnected = await checkDatabaseConnection();
        if(!isDbConnected){
            res.status(503).send();
        } else {
            next();
        }
    });
    initializeRoutes(app);
    return app; 
}

export default configureApp;