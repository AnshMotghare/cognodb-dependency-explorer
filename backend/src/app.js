import express from 'express';
import cors from 'cors';
import packagesRouter from './routes/packages.js';
import queriesRouter from './routes/queries.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/packages', packagesRouter);
app.use('/api/queries', queriesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
