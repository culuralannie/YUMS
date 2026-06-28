import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

import youtubeRoutes from './routes/youtube';
import uploadRoutes from './routes/upload';

app.use(cors());
app.use(express.json());

app.use('/api/youtube', youtubeRoutes);
app.use('/api/auth', youtubeRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
    console.log(`🌐 Frontend should be running at ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`=================================================\n`);
  });
}

export default app;
