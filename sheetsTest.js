import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const credentials = JSON.parse(
    fs.readFileSync(path.join(__dirname, "credentials.json"))
  );

  const token = JSON.parse(
    fs.readFileSync(path.join(__dirname, "token.json"))
  );

  const { client_secret, client_id, redirect_uris } =
    credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: "v4", auth: oAuth2Client });

  async function addRow() {
    console.log("🚀 Trying to add row...");

    const response = await sheets.spreadsheets.values.append({
    spreadsheetId: "1w4LGyct53WDFX1CzufYfbyWjykBij-35R2l96I8Y280",
      range: "Sheet1!A:C",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Sandeep", "9999999999", "Delhi"]],
      },
    });

    console.log("✅ Row Added Successfully!");
    console.log("Response:", response.status);
  }

  addRow().catch(console.error);

} catch (err) {
  console.error("❌ ERROR:", err);
}