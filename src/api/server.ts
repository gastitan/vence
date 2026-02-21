import express from 'express';
import { v1Router } from './v1/routes.js';

const app = express();
app.use(express.json());

app.use('/api/v1', v1Router);

export { app };
