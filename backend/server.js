import { createServer } from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { setSocketServer } from "./services/socketService.js";
import { initializeSeats } from "./utils/seatInitializer.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Socket connected." });
});

setSocketServer(io);

const startServer = async () => {
  try {
    await connectDatabase();
    await initializeSeats();

    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
