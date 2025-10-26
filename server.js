import express from "express";
import http from "http";
import dotenv from "dotenv";
import twilio from "twilio";
import cors from "cors";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Crear servidor HTTP
const server = http.createServer(app);

// 🔹 Configurar servidor Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // o coloca aquí tu dominio frontend
  },
});

// 🟢 Manejo de conexión de sockets
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  // 📩 Escuchar mensajes entrantes del cliente
  socket.on("sendMessage", (data) => {
    console.log("📩 Mensaje recibido del cliente:", data);

    // Reenviar a todos los demás clientes conectados
    socket.broadcast.emit("receiveMessage", data);
  });

  // 🔴 Usuario desconectado
  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

// 🔹 Configurar Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 📱 Endpoint para enviar código SMS
app.post("/api/send-code", async (req, res) => {
  try {
    const { to, code } = req.body;

    const message = await client.messages.create({
      body: `Tu código es: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("✅ SMS enviado:", message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("❌ Error Twilio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔹 Ruta base de prueba
app.get("/", (req, res) => {
  res.send("✅ Servidor WhatsApp-Clon Backend activo");
});

// 🚀 Iniciar servidor HTTP + Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));