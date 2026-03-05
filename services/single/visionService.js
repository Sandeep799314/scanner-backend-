import { GoogleAuth } from "google-auth-library";
import vision from "@google-cloud/vision";
import fs from "fs";

/* =========================================
   Google Vision Config Paths
========================================= */

const CREDENTIALS_PATH = "credentials.json";
const TOKEN_PATH = "token.json";

/* =========================================
   Vision Service (Default Export)
========================================= */

const visionService = async (imagePath) => {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_PATH)
    );

    const { client_id, client_secret } =
      credentials.installed;

    const tokens = JSON.parse(
      fs.readFileSync(TOKEN_PATH)
    );

    const auth = new GoogleAuth({
      credentials: {
        client_id,
        client_secret,
        refresh_token: tokens.refresh_token,
        type: "authorized_user"
      },
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform"
      ]
    });

    const client = new vision.ImageAnnotatorClient({
      auth
    });

    const [result] = await client.textDetection(imagePath);

    const detections = result.textAnnotations;

    return detections?.length
      ? detections[0].description
      : "";

  } catch (error) {
    console.error("❌ Vision Error:", error.message);
    throw error;
  }
};

export default visionService;