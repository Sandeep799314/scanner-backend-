import express from "express";
import rateLimit from "express-rate-limit";

import {
  getAllCards,
  getCardById,
  updateCard,
  deleteCard,
  restoreCard
} from "../controllers/cardController.js";

const router = express.Router();

/* =========================================
   Basic Rate Limiter (Optional)
========================================= */
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

/* =========================================
   Routes
========================================= */

/**
 * @route   GET /api/cards
 * @desc    Get all cards (pagination + search supported)
 */
router.get("/", apiLimiter, getAllCards);

/**
 * @route   GET /api/cards/:id
 * @desc    Get single card by ID
 */
router.get("/:id", apiLimiter, getCardById);

/**
 * @route   PUT /api/cards/:id
 * @desc    Update card
 */
router.put("/:id", apiLimiter, updateCard);

/**
 * @route   DELETE /api/cards/:id
 * @desc    Soft delete card
 */
router.delete("/:id", apiLimiter, deleteCard);

/**
 * @route   PATCH /api/cards/restore/:id
 * @desc    Restore deleted card
 */
router.patch("/restore/:id", apiLimiter, restoreCard);

export default router;