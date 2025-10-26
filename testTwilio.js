import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function test() {
  try {
    const msg = await client.messages.create({
      body: "Prueba de autenticación Twilio ✅",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+573105333704" 
    });
    console.log("✅ Mensaje enviado:", msg.sid);
  } catch (err) {
    console.error("❌ Error Twilio:", err.message);
  }
}

test();