import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedMasterAdmin } from "./seed-master-admin";
import session from "express-session";
import MemoryStore from "memorystore";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Basic HTTP routes for web service detection (production mode)
app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CoReg application running', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a simple root route for production deployment detection
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.json({
      name: 'CoReg Marketing Platform',
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        status: '/status',
        api: '/api'
      }
    });
  });
}

// Session configuration for authentication
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'coreg-dev-secret-key-123',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize master admin account with error handling
  try {
    await seedMasterAdmin();
  } catch (error) {
    console.warn("⚠️ Admin seeding failed, but server will continue:", error);
    // Continue server startup even if seeding fails
  }
  
  // Create HTTP server first
  const server = createServer(app);
  
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files from public directory in both dev and production
  app.use(express.static('public'));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add catch-all for undefined routes (after all other routes)
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
  });

  // Use environment PORT for deployment flexibility
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || '0.0.0.0';
  
  // Bind HTTP server to ensure proper port detection by hosting platforms
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Use callback-style listen for better compatibility with hosting platforms
  server.listen(port, () => {
    const address = server.address();
    const actualPort = address && typeof address === 'object' ? address.port : port;
    const actualHost = address && typeof address === 'object' ? address.address : host;
    
    console.log(`CoReg Server running on ${actualHost}:${actualPort}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health endpoint: /health`);
    console.log(`Status endpoint: /status`);
    
    if (process.env.RENDER) {
      console.log(`RENDER: Port ${actualPort} is bound and accessible`);
    }
  });
})();
