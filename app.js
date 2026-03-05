import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"

import cardRoutes from "./routes/cardRoutes.js"
import singleCardRoutes from "./routes/singleCardRoutes.js"   // ✅ NEW
import errorHandler from "./middleware/errorHandler.js"

dotenv.config()

const app = express()

/* =========================================
   Security Middleware
========================================= */
app.use(helmet())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://scanner-frontend-klw7231q3-sandeeps-projects-f9c1d65d.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  })
)
/* =========================================
   Logging
========================================= */
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

/* =========================================
   Rate Limiting (Global)
========================================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
})

app.use(globalLimiter)

/* =========================================
   Body Parsers
========================================= */
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

/* =========================================
   Static Upload Folder
========================================= */
app.use("/uploads", express.static("uploads"))

/* =========================================
   Health Check Route
========================================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Server is healthy"
  })
})

/* =========================================
   API Routes
========================================= */

// ✅ Single Card Upload Route
app.use("/api/single-cards", singleCardRoutes)

// ✅ CRUD Card Routes
app.use("/api/cards", cardRoutes)

/* =========================================
   404 Handler
========================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  })
})

/* =========================================
   Central Error Handler
========================================= */
app.use(errorHandler)

export default app