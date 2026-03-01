import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import twilio from "twilio";
import cors from "cors";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://whatsapp-clon-6f67.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log("Supabase conectado correctamente");


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
});


const usuariosConectados = new Map();


io.on("connection", (socket) => {
  console.log("🟢 Socket conectado:", socket.id);

  
  socket.on("join", (username) => {
    socket.username = username; 
    socket.join(username);      
    usuariosConectados.set(username, socket.id);

    console.log(`👤 ${username} conectado con socket ${socket.id}`);
  });

  
  socket.on("sendMessage", async (data) => {
    const { from, to, texto, fecha } = data;

    const mensaje = {
      from,
      to,
      texto,
      fecha,
      estado: "enviado"
    };

    console.log(`💬 ${from} → ${to}: ${texto}`);

    
    try {
      const { error } = await supabase
        .from("mensajes")
        .insert([mensaje]);

      if (error) {
        console.error("❌ Error guardando mensaje:", error.message);
      } else {
        console.log("✅ Mensaje guardado en Supabase");
      }
    } catch (err) {
      console.error("⚠️ Error inesperado Supabase:", err.message);
    }

    
    io.to(to).emit("receiveMessage", {
      ...mensaje,
      estado: "recibido"
    });

    
    socket.emit("messageSentConfirmation", {
      ...mensaje,
      estado: "enviado"
    });
  });

  
  socket.on("disconnect", () => {
    if (socket.username) {
      usuariosConectados.delete(socket.username);
      console.log(`🔴 ${socket.username} se desconectó`);
    } else {
      console.log("🔴 Socket desconectado:", socket.id);
    }
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

    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("Error Twilio:", error);
    res.status(500).json({ success: false });
  }
});


app.get("/", (req, res) => {
  res.send("Servidor WhatsApp-Clon Backend activo 🚀");
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`)
);


