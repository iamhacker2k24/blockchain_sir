const pinata = require("./pinata.js");

const uploadToPinata = async (fileObj) => {
  if (!fileObj || !fileObj.buffer) {
    throw new Error("No file provided");
  }

  console.log("Starting Pinata upload for:", fileObj.originalname);

  // Convert Multer memory buffer to Web standard File object
  const file = new File([fileObj.buffer], fileObj.originalname, {
    type: fileObj.mimetype,
  });

  const upload = await pinata.upload.public.file(file);
  console.log("Pinata response:", upload);

  return upload;
};

const uploadTextToPinata = async (text, fileName = "story.txt") => {
  if (!text || typeof text !== "string") {
    throw new Error("No text content provided");
  }

  console.log("Starting Pinata text upload for:", fileName);

  const file = new File([text], fileName, {
    type: "text/plain",
  });

  const upload = await pinata.upload.public.file(file);
  console.log("Pinata text response:", upload);

  return upload;
};

module.exports = {
  uploadToPinata,
  uploadTextToPinata,
};