/* =========================================
   1️⃣ HANDLE UNCAUGHT EXCEPTIONS FIRST
========================================= */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

/* =========================================
   2️⃣ LOAD ENV VARIABLES
========================================= */
import dotenv from "dotenv";
dotenv.config();

/* =========================================
   3️⃣ IMPORTS
========================================= */
import mongoose from "mongoose";
import app from "./app.js";

/* =========================================
   4️⃣ DEBUG ENV CHECK
========================================= */
console.log("✅ Environment Variables Loaded");
console.log("📌 GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "Found" : "❌ MISSING");
console.log("📌 CLOUDINARY_KEY:", process.env.CLOUDINARY_API_KEY ? "Found" : "❌ MISSING");
console.log("📌 MONGO_URI Exists:", !!process.env.MONGO_URI);

/* =========================================
   5️⃣ BASIC CONFIG
========================================= */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI not defined in .env file");
  process.exit(1);
}

/* =========================================
   6️⃣ MONGODB CONNECTION
========================================= */
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

/* =========================================
   7️⃣ START SERVER
========================================= */
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log("=======================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || "Not Set"}`);
      console.log("=======================================");
    });

    /* =========================================
       HANDLE UNHANDLED PROMISE REJECTIONS
    ========================================= */
    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);

      server.close(() => {
        process.exit(1);
      });
    });

    /* =========================================
       GRACEFUL SHUTDOWN (CTRL + C)
    ========================================= */
    process.on("SIGINT", async () => {
      console.log("🛑 SIGINT RECEIVED. Graceful Shutdown Initiated...");

      await mongoose.connection.close();

      server.close(() => {
        console.log("🔒 Server & Database connections closed.");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("❌ Server Startup Failed");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();