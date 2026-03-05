import { google } from "googleapis";
import fs from "fs";

/**
 * Google Sheet में डेटा भेजने का फंक्शन
 * @param {Object} cardData
 */
const appendToSheet = async (cardData) => {
  try {
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

    if (!GOOGLE_SHEET_ID) {
      console.log("❌ No Sheet ID found in .env");
      return;
    }

    if (!fs.existsSync("credentials.json")) {
      console.log("❌ credentials.json missing");
      return;
    }

    if (!fs.existsSync("token.json")) {
      console.log("❌ token.json missing");
      return;
    }

    // Load credentials & token
    const credentials = JSON.parse(fs.readFileSync("credentials.json"));
    const token = JSON.parse(fs.readFileSync("token.json"));

    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({
      version: "v4",
      auth: oAuth2Client,
    });

    /* =========================================
       COLUMN STRUCTURE
       A: Name
       B: Email
       C: Phone
       D: Company
       E: Designation
       F: Website
       G: WhatsApp Link
       H: Image
       I: Timestamp
    ========================================= */

    // 🔥 Bigger Image (120x120)
    const imageFormula = cardData.imageUrl
      ? `=IMAGE("${cardData.imageUrl}",4,120,120)`
      : "No Image";

    const rowValues = [
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      cardData.name || "N/A",
      cardData.email || "N/A",
      cardData.phone || "N/A",
      cardData.company || "N/A",
      cardData.designation || "N/A",
      cardData.website || "N/A",
      cardData.whatsappLink || "N/A",
      imageFormula,
    ];

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A2:I2", // stable append
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    console.log("✅ GOOGLE SHEET UPDATED:", result.data.updates.updatedRange);

  } catch (error) {
    console.error("❌ GOOGLE SHEET ERROR:", error.message);
  }
};

export default appendToSheet;