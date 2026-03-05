import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import credentials from "./credentials.json" assert { type: "json" };

const { client_secret, client_id, redirect_uris } =
  credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-platform"
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("Authorize this app by visiting this url:", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code here: ", (code) => {
  rl.close();
  oAuth2Client.getToken(code).then(({ tokens }) => {
    fs.writeFileSync("token.json", JSON.stringify(tokens));
    console.log("✅ Token stored to token.json");
  }).catch(console.error);
});