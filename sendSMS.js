// sendSMS.js
import express from "express";
import twilio from "twilio";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const accountSid = "TU_ACCOUNT_SID";
const authToken = "TU_AUTH_TOKEN";
const client = twilio(accountSid, authToken);

app.post("/api/send-code", async (req, res) => {
  const { phone, code } = req.body;

  try {
    await client.messages.create({
      body: `Tu código de verificación es: ${code}`,
      from: "+1TU_NUMERO_TWILIO", // 
      to: phone,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error enviando SMS" });
  }
});

app.listen(3001, () => console.log("Servidor SMS en http://localhost:3001"));