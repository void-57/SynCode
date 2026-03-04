import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Self-hosted Piston API
const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000/api/v2/execute";

const LANG_MAP = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  cpp: "c++",
  c: "c",
  rb: "ruby",
};

const EXT_MAP = {
  js: "js",
  ts: "ts",
  py: "py",
  go: "go",
  rs: "rs",
  java: "java",
  cpp: "cpp",
  c: "c",
  rb: "rb",
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// roomsData: Map<roomId, { users: Map<socketId, { id, name, status }>, code: string, lang: string }>
const roomsData = new Map();

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  let currentRoom = null;

  // When a client joins a room
  socket.on("join_room", ({ roomId, userName }) => {
    currentRoom = roomId;

    // Create room entry if it doesn't exist
    if (!roomsData.has(roomId)) {
      roomsData.set(roomId, {
        users: new Map(),
        code: "",
        lang: "js",
      });
    }

    const roomState = roomsData.get(roomId);

    // Add user to the room's Map by socket.id
    roomState.users.set(socket.id, {
      id: socket.id,
      name: userName,
      status: "online",
    });

    socket.join(roomId);

    // Send initial state only to this newly joined client
    socket.emit("initialState", {
      users: Array.from(roomState.users.values()),
      code: roomState.code,
      lang: roomState.lang,
    });

    // Broadcast updated users list to everyone in the room
    io.to(roomId).emit("userJoined", Array.from(roomState.users.values()));
  });

  // Client sends updated code
  socket.on("codeChange", ({ roomId, code }) => {
    const roomState = roomsData.get(roomId);
    if (!roomState) return;

    // Update server state and broadcast to others
    roomState.code = code;
    socket.to(roomId).emit("codeUpdate", code);
  });

  // Client sends updated language
  socket.on("langChange", ({ roomId, language }) => {
    const roomState = roomsData.get(roomId);
    if (!roomState) return;

    roomState.lang = language;
    socket.to(roomId).emit("langUpdate", { language });
  });

  socket.on("startTyping", ({ roomId, userName }) => {
    socket.to(roomId).emit("userStartedTyping", { userName });
  });

  socket.on("stopTyping", ({ roomId, userName }) => {
    socket.to(roomId).emit("userStoppedTyping", { userName });
  });

  socket.on("compileCode", async ({ roomId, lang, code, stdin }) => {
    const room = roomsData.get(roomId);
    const language = LANG_MAP[lang];

    if (!language) {
      io.to(roomId).emit(
        "codeResponse",
        `Language "${lang}" is not executable.`,
      );
      return;
    }

    try {
      const response = await axios.post(PISTON_URL, {
        language,
        version: "*",
        files: [{ name: `main.${EXT_MAP[lang] || "txt"}`, content: code }],
        stdin: stdin || "",
      });

      const { run, compile } = response.data;
      const output =
        run?.output || compile?.output || compile?.stderr || "(no output)";

      if (room) room.output = output;
      io.to(roomId).emit("codeResponse", output);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Execution failed.";
      io.to(roomId).emit("codeResponse", `Error: ${msg}`);
    }
  });

  // When a client disconnects
  socket.on("disconnect", () => {
    if (currentRoom && roomsData.has(currentRoom)) {
      const roomState = roomsData.get(currentRoom);

      // Remove user
      roomState.users.delete(socket.id);

      // Broadcast updated list
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(roomState.users.values()),
      );

      // Optionally, clean up empty rooms
      if (roomState.users.size === 0) {
        roomsData.delete(currentRoom);
      }
    }

    console.log("user disconnected:", socket.id);
  });
});
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "frontend", "dist")));
app.get((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
