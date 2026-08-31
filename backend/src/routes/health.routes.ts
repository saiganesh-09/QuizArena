import { Router } from 'express';
import mongoose from 'mongoose';

/** Simple health-check router for uptime/db status. */
const router = Router();

router.get('/health', (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoStatus =
    mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      mongo: mongoStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
