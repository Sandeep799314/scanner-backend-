import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const geminiService = async (files) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const images = files.map(file => ({
    inlineData: {
      data: fs.readFileSync(file.path).toString("base64"),
      mimeType: file.mimetype
    }
  }));

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { text: "Extract business card details in JSON format." },
        ...images
      ]
    }]
  });

  const text = result.response.text();

  return JSON.parse(
    text.replace(/```json/g, "").replace(/```/g, "").trim()
  );
};

export default geminiService;