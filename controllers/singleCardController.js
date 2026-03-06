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
  const frontFile = req.files?.front_image?.[0];
  const backFile = req.files?.back_image?.[0];

  try {
    /* ===============================
       Cloudinary Config
    =============================== */
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!frontFile) {
      return res.status(400).json({ message: "Front image is required" });
    }

    /* ===============================
       1️⃣ OCR — Parallel ⚡
    =============================== */
    const ocrPromises = [singleOcrService(frontFile.path)];
    if (backFile) ocrPromises.push(singleOcrService(backFile.path));

    const [frontData, backData] = await Promise.all(ocrPromises);

    if (!frontData || !frontData.rawText) {
      throw new Error("OCR failed for front image");
    }

    let combinedData = { ...frontData };
    if (backFile && backData?.rawText) {
      combinedData.rawText = frontData.rawText + "\n" + backData.rawText;
    }

    /* ===============================
       2️⃣ Cloudinary + Duplicate Check — Parallel ⚡
    =============================== */
    const uploadPromises = [
      cloudinary.uploader.upload(frontFile.path, {
        folder: "card_scanner_uploads",
      }),
    ];
    if (backFile) {
      uploadPromises.push(
        cloudinary.uploader.upload(backFile.path, {
          folder: "card_scanner_uploads",
        })
      );
    }

    const duplicatePromise =
      combinedData.email || combinedData.phone
        ? Card.findOne({
            $or: [
              combinedData.email ? { email: combinedData.email } : null,
              combinedData.phone ? { phone: combinedData.phone } : null,
            ].filter(Boolean),
          })
        : Promise.resolve(null);

    const [uploadResults, existing] = await Promise.all([
      Promise.all(uploadPromises),
      duplicatePromise,
    ]);

    const frontImageUrl = uploadResults[0].secure_url;
    const backImageUrl = backFile ? uploadResults[1].secure_url : null;

    /* ===============================
       3️⃣ DB Save / Update
    =============================== */
    let savedCard;

    if (existing) {
      existing.imageUrl = frontImageUrl;
      existing.backImageUrl = backImageUrl;
      Object.assign(existing, combinedData);
      savedCard = await existing.save();
    } else {
      savedCard = await Card.create({
        ...combinedData,
        imageUrl: frontImageUrl,
        backImageUrl,
      });
    }

    /* ===============================
       4️⃣ WhatsApp Link
    =============================== */
    const whatsappLink = generateWhatsappLink(savedCard);

    /* ===============================
       5️⃣ Local Files Delete
    =============================== */
    if (fs.existsSync(frontFile.path)) fs.unlinkSync(frontFile.path);
    if (backFile && fs.existsSync(backFile.path))
      fs.unlinkSync(backFile.path);

    /* ===============================
       ✅ RESPONSE — Full Data
    =============================== */
    console.log("FINAL RESPONSE DATA:", {
      ...savedCard.toObject(),
      whatsappLink,
    });

    res.status(201).json({
      ...savedCard.toObject(),
      whatsappLink,
    });

    /* ===============================
       6️⃣ BACKGROUND — Sheet Only ⚡
    =============================== */
    appendToSheet({
      ...savedCard.toObject(),
      whatsappLink,
      imageUrl: frontImageUrl,
      backImageUrl,
    }).catch((err) => console.error("Sheet Error:", err.message));

  } catch (error) {
    console.error("Single Card Upload Error:", error.message);
    next(error);
  }
};