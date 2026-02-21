import express from 'express';
import { v1Router } from './v1/routes.js';
import { errorMiddleware } from './errorMiddleware.js';
import { NotFoundError } from './errors.js';

const app = express();
app.use(express.json());

app.use('/api/v1', v1Router);

// Catch-all for unknown routes
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`))
})

app.use(errorMiddleware);

export { app };
