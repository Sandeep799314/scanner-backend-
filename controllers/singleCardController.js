import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

import Card from "../models/Card.js";
import singleOcrService from "../services/single/singleOcrService.js";
import generateWhatsappLink from "../utils/generateWhatsappLink.js";
import appendToSheet from "../services/googleSheetService.js";

/* =========================================
   Upload & Process Single Card
========================================= */
export const uploadSingleCard = async (req, res, next) => {
  try {
    /* ===============================
       Cloudinary Config
    =============================== */
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const frontFile = req.files?.front_image?.[0];
    const backFile = req.files?.back_image?.[0];

    if (!frontFile) {
      return res.status(400).json({
        message: "Front image is required"
      });
    }

    /* ===============================
       1️⃣ OCR PROCESSING
    =============================== */
    const frontData = await singleOcrService(frontFile.path);

    if (!frontData || !frontData.rawText) {
      throw new Error("OCR failed for front image");
    }

    let combinedData = { ...frontData };

    if (backFile) {
      const backData = await singleOcrService(backFile.path);

      if (backData && backData.rawText) {
        combinedData.rawText =
          frontData.rawText + "\n" + backData.rawText;
      }
    }

    /* ===============================
       2️⃣ UPLOAD TO CLOUDINARY
    =============================== */
    const frontUpload = await cloudinary.uploader.upload(frontFile.path, {
      folder: "card_scanner_uploads",
    });

    let backImageUrl = null;

    if (backFile) {
      const backUpload = await cloudinary.uploader.upload(backFile.path, {
        folder: "card_scanner_uploads",
      });
      backImageUrl = backUpload.secure_url;
    }

    /* ===============================
       3️⃣ DUPLICATE CHECK
    =============================== */
    let existing = null;

    if (combinedData.email || combinedData.phone) {
      existing = await Card.findOne({
        $or: [
          combinedData.email ? { email: combinedData.email } : null,
          combinedData.phone ? { phone: combinedData.phone } : null,
        ].filter(Boolean),
      });
    }

    let savedCard;

    if (existing) {
      savedCard = existing;
      savedCard.imageUrl = frontUpload.secure_url;
      savedCard.backImageUrl = backImageUrl;
      Object.assign(savedCard, combinedData);
      await savedCard.save();
    } else {
      savedCard = await Card.create({
        ...combinedData,
        imageUrl: frontUpload.secure_url,
        backImageUrl
      });
    }

    /* ===============================
       4️⃣ WHATSAPP LINK & SHEET SYNC
    =============================== */
    const whatsappLink = generateWhatsappLink(savedCard);

    try {
      await appendToSheet({
        ...savedCard.toObject(),
        whatsappLink,
        imageUrl: frontUpload.secure_url,
        backImageUrl
      });
    } catch (sheetError) {
      console.error("Sheet Error:", sheetError.message);
    }

    /* ===============================
       5️⃣ DELETE LOCAL FILES
    =============================== */
    if (fs.existsSync(frontFile.path)) fs.unlinkSync(frontFile.path);
    if (backFile && fs.existsSync(backFile.path))
      fs.unlinkSync(backFile.path);

    /* ===============================
       ✅ FINAL RESPONSE (UPDATED)
    =============================== */
console.log("FINAL RESPONSE DATA:", {
  ...savedCard.toObject(),
  whatsappLink
});
    return res.status(201).json({
      ...savedCard.toObject(),
      whatsappLink
    });

  } catch (error) {
    console.error("Single Card Upload Error:", error.message);
    next(error);
  }
};