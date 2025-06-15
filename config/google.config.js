import { google } from "googleapis";
import dotenv from "dotenv"

dotenv.config()

// Initialize OAuth2 Client
const auth = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth });
const sheets = google.sheets({ version: "v4", auth });

export { gmail, sheets } ;



