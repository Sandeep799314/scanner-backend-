import visionService from "./visionService.js";

/* =========================================
   Utility Functions
========================================= */

const normalizeText = (text) =>
  text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const extractEmail = (text) =>
  text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";

const extractPhone = (text) => {
  const matches = text.match(/(\+?\d[\d\s-]{9,16})/g);
  if (!matches) return "";
  const phone = matches.sort((a, b) => b.length - a.length)[0];
  return phone.replace(/[^\d+]/g, "");
};

const extractWebsite = (text) =>
  text.match(/\b((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i)?.[0] || "";

/* =========================================
   Name Extractor
========================================= */

const extractName = (lines) => {
  const commonTitles = [
    "founder", "director", "manager", "ceo",
    "vp", "president", "managing", "associate",
    "specialist", "sales", "marketing"
  ];

  const blacklist = [
    "years", "anniversary", "since", "discover",
    "globally", "attention", "details",
    "turkey", "india", "mumbai", "road",
    "floor", "building", "office", "tel",
    "mob", "mobile", "email", "website",
    "address", "back", "side", "tour",
    "travel", "booking"
  ];

  for (let line of lines) {
    const cleanLine = line.trim();
    const lowerLine = cleanLine.toLowerCase();

    if (
      cleanLine.split(" ").length >= 2 &&
      cleanLine.split(" ").length <= 4 &&
      !commonTitles.some(title => lowerLine.includes(title)) &&
      !blacklist.some(word => lowerLine.includes(word)) &&
      !/\d/.test(cleanLine) &&
      /^[A-Za-z\s.]+$/.test(cleanLine)
    ) {
      return cleanLine;
    }
  }

  return "";
};

/* =========================================
   Company Extractor
========================================= */

const extractCompany = (lines, name, designation) => {
  const companySuffixes = ["ltd", "pvt", "llp", "inc", "solutions", "limited", "private", "corp"];
  const industryKeywords = ["tours", "travel", "booking", "moment", "technologies", "studio", "systems", "group", "global", "paints", "cement"];

  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      (companySuffixes.some(s => lowerLine.includes(s)) ||
       industryKeywords.some(k => lowerLine.includes(k))) &&
      line !== name &&
      line !== designation
    ) {
      return line.trim();
    }
  }

  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (
      line !== name &&
      line !== designation &&
      line.length > 3 &&
      !line.includes("@") &&
      !/\d/.test(line)
    ) {
      return line;
    }
  }

  return "";
};

/* =========================================
   Designation Extractor
========================================= */

const extractDesignation = (lines, name) => {
  const titles = [
    "founder", "director", "manager", "ceo",
    "vp", "president", "managing",
    "associate", "specialist", "executive"
  ];

  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    if (titles.some(t => lowerLine.includes(t)) && line !== name) {
      return line.trim();
    }
  }

  return "";
};

/* =========================================
   MAIN SINGLE OCR SERVICE
========================================= */

const singleOcrService = async (imagePath) => {
  const rawText = await visionService(imagePath);
  if (!rawText) return null;

  const lines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const cleanText = normalizeText(rawText);

  const name = extractName(lines);
  const designation = extractDesignation(lines, name);
  const company = extractCompany(lines, name, designation);

  return {
    name: name || "N/A",
    email: extractEmail(cleanText) || "N/A",
    phone: extractPhone(cleanText) || "N/A",
    website: extractWebsite(cleanText) || "N/A",
    company: company || "N/A",
    designation: designation || "N/A",
    rawText: cleanText
  };
};

export default singleOcrService;