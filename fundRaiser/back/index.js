const express = require("express");
const multer = require("multer");
const cors = require("cors");

require('dotenv').config()
const pinata = require("./pinata/pinata.js");
const { uploadToPinata, uploadTextToPinata } = require("./pinata/pinataupload.js");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
});

app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const hasPhoto = Boolean(req.file);
    const hasStory = Boolean(req.body && req.body.story && req.body.story.trim());

    if (!hasPhoto && !hasStory) {
      return res.status(400).json({
        message: "No photo or story received",
        msg: "No photo or story received",
      });
    }

    let imageCid = null;
    let storyCid = null;

    if (hasPhoto) {
      console.log("Received photo:", req.file.originalname, "Size:", req.file.size);
      const imageResult = await uploadToPinata(req.file);
      imageCid = imageResult.cid;
    }

    if (hasStory) {
      console.log("Received story text length:", req.body.story.length);
      const storyResult = await uploadTextToPinata(req.body.story.trim(), "story.txt");
      storyCid = storyResult.cid;
    }

    return res.status(200).json({
      message: "Upload successful",
      msg: "Upload successful",
      imageCid: imageCid,
      storyCid: storyCid,
      cid: imageCid || storyCid,
    });

  } catch (error) {
    console.error(
      "Pinata upload error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Pinata upload failed",
      msg: "Pinata upload failed",
      error: error.response?.data || error.message,
    });
  }
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});