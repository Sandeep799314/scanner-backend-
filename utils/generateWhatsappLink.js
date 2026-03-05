/* =========================================
   Clean Phone Number (International Safe)
========================================= */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  let cleaned = phone.replace(/[^\d+]/g, "");
  cleaned = cleaned.replace(/\++/g, "+");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

/* =========================================
   Build WhatsApp Message (All Details Clean)
========================================= */
const buildMessage = (data = {}) => {
  const {
    name,
    email,
    phone,
    company,
    designation,
    website,
    address,
  } = data;

  const details = [
    name?.trim() ? `Name: ${name.trim()}` : null,
    designation?.trim() ? `Designation: ${designation.trim()}` : null,
    company?.trim() ? `Company: ${company.trim()}` : null,
    phone?.trim() ? `Phone: ${phone.trim()}` : null,
    email?.trim() ? `Email: ${email.trim()}` : null,
    website?.trim() ? `Website: ${website.trim()}` : null,
    address?.trim() ? `Address: ${address.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Hello ${name?.trim() || ""},

I just scanned your business card using CardAI.

Here are the details I received:

${details}

Looking forward to connecting with you!`;
};

/* =========================================
   Generate WhatsApp Link
========================================= */
const generateWhatsappLink = (data) => {
  if (!data?.phone) return null;

  const formattedPhone = formatPhoneNumber(data.phone);

  if (!formattedPhone || formattedPhone.length < 8) {
    return null;
  }

  const message = buildMessage(data);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export default generateWhatsappLink;