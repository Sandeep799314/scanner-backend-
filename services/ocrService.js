import visionService from "./visionOAuthService.js";

const normalizeText = (text) =>
  text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

// --- ईमेल एक्सट्रैक्टर ---
const extractEmail = (text) =>
  text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";

// --- फोन एक्सट्रैक्टर (बेहतर क्लीनिंग के साथ) ---
const extractPhone = (text) => {
  const matches = text.match(/(\+?\d[\d\s-]{9,16})/g);
  if (!matches) return "";
  // सबसे लंबा नंबर चुनें जो फोन होने की संभावना ज्यादा रखता है
  const phone = matches.sort((a, b) => b.length - a.length)[0];
  return phone.replace(/[^\d+]/g, ""); // सिर्फ डिजिट और + रखें
};

const extractWebsite = (text) =>
  text.match(/\b((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i)?.[0] || "";

// --- एडवांस्ड नाम एक्सट्रैक्टर (Smart Blacklist के साथ) ---
const extractName = (lines) => {
  const commonTitles = ["founder", "director", "manager", "ceo", "vp", "president", "managing", "associate", "specialist", "sales", "marketing"];
  
  // 🔥 इन शब्दों को कभी भी "नाम" नहीं माना जाएगा
  const blacklist = [
    "years", "anniversary", "since", "discover", "globally", "attention", "details", 
    "turkey", "india", "mumbai", "road", "floor", "building", "office", "tel", "mob", 
    "mobile", "email", "website", "address", "back", "side", "tour", "travel", "booking"
  ];

  for (let line of lines) {
    const cleanLine = line.trim();
    const lowerLine = cleanLine.toLowerCase();

    // नाम की शर्तें:
    if (
      cleanLine.split(" ").length >= 2 && // कम से कम 2 शब्द (जैसे Rakhi Malik)
      cleanLine.split(" ").length <= 4 && // बहुत लंबी लाइन न हो
      !commonTitles.some(title => lowerLine.includes(title)) && // पद न हो
      !blacklist.some(word => lowerLine.includes(word)) && // ब्लैकलिस्ट शब्द न हों
      !/\d/.test(cleanLine) && // लाइन में नंबर न हों (नंबर अक्सर एड्रेस या फोन होते हैं)
      /^[A-Za-z\s.]+$/.test(cleanLine) // सिर्फ अक्षर और स्पेस हों
    ) {
      return cleanLine;
    }
  }
  return "";
};

// --- एडवांस्ड कंपनी एक्सट्रैक्टर ---
const extractCompany = (lines, name, designation) => {
  const companySuffixes = ["ltd", "pvt", "llp", "inc", "solutions", "limited", "private", "corp"];
  const industryKeywords = ["tours", "travel", "booking", "moment", "technologies", "studio", "systems", "group", "global", "paints", "cement"];
  
  // 1. कीवर्ड्स के आधार पर ढूँढें
  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      (companySuffixes.some(s => lowerLine.includes(s)) || 
       industryKeywords.some(k => lowerLine.includes(k))) &&
      line !== name && line !== designation
    ) {
      return line.trim();
    }
  }

  // 2. बैकअप: पहली 3 लाइनों में जो नाम या पद नहीं है, वह अक्सर कंपनी होती है
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (line !== name && line !== designation && line.length > 3 && !line.includes("@") && !/\d/.test(line)) {
      return line;
    }
  }

  return "";
};

const extractDesignation = (lines, name) => {
  const titles = ["founder", "director", "manager", "ceo", "vp", "president", "managing", "associate", "specialist", "executive"];
  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    if (titles.some(t => lowerLine.includes(t)) && line !== name) {
      return line.trim();
    }
  }
  return "";
};

const ocrService = async (imagePath) => {
  const rawText = await visionService(imagePath);
  if (!rawText) return null;

  // टेक्स्ट को साफ़ सुथरी लाइनों में बदलें
  const lines = rawText.split("\n")
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

export default ocrService;