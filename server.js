import express from "express";
import http from "http";
import dotenv from "dotenv";
import twilio from "twilio";
import cors from "cors";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://whatsapp-clon-6f67.vercel.app", 
    "https://whatsapp-cloner-backend.onrender.com"

  ],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));


app.use(express.json());


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://whatsapp-clon-vfs7-git-main-alfredo-gazabons-projects.vercel.app"
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  socket.on("sendMessage", (data) => {
    console.log("📩 Mensaje recibido del cliente:", data);
    socket.broadcast.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);
  });
});


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

    console.log("✅ SMS enviado:", message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("❌ Error Twilio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get("/", (req, res) => {
  res.send("✅ Servidor WhatsApp-Clon Backend activo");
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});