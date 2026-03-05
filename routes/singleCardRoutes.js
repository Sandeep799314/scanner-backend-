import express from "express";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import { uploadSingleCard } from "../controllers/singleCardController.js";

const router = express.Router();

router.post(
  "/upload",
  uploadMiddleware.fields([
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 }
  ]),
  uploadSingleCard
);

export default router;