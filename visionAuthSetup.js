import { google } from "googleapis"
import fs from "fs"
import readline from "readline"

const SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/spreadsheets"
]

const TOKEN_PATH = "token.json"
const CREDENTIALS_PATH = "credentials.json"

const authorize = async () => {
  const content = fs.readFileSync(CREDENTIALS_PATH)
  const credentials = JSON.parse(content)

  const { client_secret, client_id, redirect_uris } =
    credentials.installed

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  })

  console.log("Authorize this app by visiting:", authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const code = await new Promise(resolve =>
    rl.question("Enter the code here: ", resolve)
  )

  rl.close()

  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
  console.log("New token stored to token.json")
}

authorize()