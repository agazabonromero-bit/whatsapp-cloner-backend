import express from "express";
import http from "http";
import dotenv from "dotenv";
import twilio from "twilio";
import cors from "cors";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

// 👌 Necesario para que Render maneje bien WebSockets detrás del proxy
app.set("trust proxy", 1);

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://whatsapp-clon-6f67.vercel.app"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

// ================== SUPABASE ==================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================== SOCKET.IO CONFIG ==================
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://whatsapp-clon-6f67.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,      // Evita que Render corte la conexión
  pingInterval: 25000,
  allowEIO3: true,         // Compatibilidad total
});

// Mapa para usuarios conectados
const usuariosConectados = new Map();

// ================== SOCKET.IO EVENTS ==================
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  // Usuario se une al chat
  socket.on("join", (username) => {
    socket.username = username;
    usuariosConectados.set(username, socket.id);
    console.log(`👤 ${username} se unió con ID ${socket.id}`);
  });

  // Enviar mensaje
  socket.on("sendMessage", async (data) => {
    const { from, to, texto, fecha } = data;

    console.log(`💬 Mensaje de ${from} a ${to}: ${texto}`);

    try {
      const { error } = await supabase.from("mensajes").insert([data]);
      if (error) console.error("❌ Error guardando mensaje:", error);
      else console.log("✅ Mensaje guardado en Supabase");
    } catch (err) {
      console.error("⚠️ Error de Supabase:", err.message);
    }

    const targetSocketId = usuariosConectados.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit("receiveMessage", data);
      console.log(`📨 Enviado mensaje de ${from} a ${to}`);
    } else {
      console.log(`⚠️ ${to} no está conectado`);
    }

    socket.emit("messageSentConfirmation", { success: true, data });
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log(`🔴 ${socket.username || "Usuario"} se desconectó`);
    if (socket.username) {
      usuariosConectados.delete(socket.username);
    }
  });
});

// ================== TWILIO ENDPOINT ==================
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post("/api/send-code", async (req, res) => {
  try {
    const { to, code } = req.body;

    const message = await client.messages.create({
      body: `Tu código es: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("SMS enviado:", message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("Error Twilio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== ROOT ==================
app.get("/", (req, res) => {
  res.send("Servidor WhatsApp-Clon Backend activo 🚀");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`)
);
