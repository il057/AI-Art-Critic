import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON payloads (base64 images can be big)
  app.use(express.json({ limit: "10mb" }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==================================================`);
    console.log(`Meowdows 95 Server started successfully!`);
    console.log(`  - Local:   http://localhost:${PORT}`);
    
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      const iface = interfaces[name];
      if (iface) {
        for (const net of iface) {
          // Skip internal loopback and non-IPv4 addresses
          if (net.family === "IPv4" && !net.internal) {
            console.log(`  - Network: http://${net.address}:${PORT}`);
          }
        }
      }
    }
    console.log(`==================================================\n`);
  });
}

startServer();
