import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dns from "node:dns/promises";
import "dotenv/config"; // ✅ Add this line (ES Module way)

import { connectToSocket } from "./controllers/socketManager.js";
import { Server } from "socket.io";
import { createServer } from "node:http";
import userRoutes from "./routes/user.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

dns.setServers(["1.1.1.1"]);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // ✅ No more hardcoded URI
    console.log("Connected to MongoDB");
    server.listen(app.get("port"), () => {
      console.log("Server running on PORT 8000");
    });
  } catch (error) {
    console.log("Database connection error:", error);
  }
};

start();