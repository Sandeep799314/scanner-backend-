import Card from "../models/Card.js";
import generateWhatsappLink from "../utils/generateWhatsappLink.js";

/* =========================================
   Get All Cards (With Pagination + Search)
========================================= */
export const getAllCards = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const query = {
      isDeleted: { $ne: true },
      ...(search && { $text: { $search: search } })
    };

    const [cards, total] = await Promise.all([
      Card.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Card.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      data: cards
    });

  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Single Card By ID
========================================= */
export const getCardById = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found"
      });
    }

    res.status(200).json({
      success: true,
      data: card,
      whatsappLink: generateWhatsappLink(card)
    });

  } catch (error) {
    next(error);
  }
};

/* =========================================
   Update Card
========================================= */
export const updateCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found"
      });
    }

    Object.assign(card, req.body);

    const updatedCard = await card.save();

    res.status(200).json({
      success: true,
      message: "Card updated successfully",
      data: updatedCard,
      whatsappLink: generateWhatsappLink(updatedCard)
    });

  } catch (error) {
    next(error);
  }
};

/* =========================================
   Soft Delete Card
========================================= */
export const deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found"
      });
    }

    card.isDeleted = true;
    await card.save();

    res.status(200).json({
      success: true,
      message: "Card deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

/* =========================================
   Restore Deleted Card (Optional Feature)
========================================= */
export const restoreCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found"
      });
    }

    card.isDeleted = false;
    await card.save();

    res.status(200).json({
      success: true,
      message: "Card restored successfully"
    });

  } catch (error) {
    next(error);
  }
};