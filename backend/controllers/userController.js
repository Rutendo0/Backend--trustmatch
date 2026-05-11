const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const pool = require('../db');

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO "User" (id, "firstName", "lastName", email, "passwordHash", phone, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "firstName", "lastName", email`,
      [firstName, lastName, email, password, phone || null]
    );
    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Failed to register user" });
  }
};

exports.getProfile = async (req, res) => {
  const { id } = req.query;
  try {
    const result = await pool.query(
      `SELECT u.id, u."firstName", u."lastName", u.email, u.bio, u.city, u.country,
              u."dateOfBirth", u.gender, u.occupation, u.education, u.interests,
              v."isVerified", v."selfieVerified", v."liveVerified", v."faceMatchScore"
       FROM "User" u
       LEFT JOIN "Verification" v ON v."userId" = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.uploadProfilePic = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ message: "Profile picture uploaded successfully", imageUrl: `/uploads/${req.file.filename}` });
};

exports.verifyFace = async (req, res) => {
  try {
    if (!req.files || !req.files.img1 || !req.files.img2) {
      return res.status(400).json({ error: "Two images (img1 and img2) are required" });
    }

    const img1 = req.files.img1[0];
    const img2 = req.files.img2[0];

    // Validate image files are non-empty
    const fsSize1 = fs.statSync(img1.path).size;
    const fsSize2 = fs.statSync(img2.path).size;
    if (fsSize1 === 0 || fsSize2 === 0) {
      try { fs.unlinkSync(img1.path); } catch {}
      try { fs.unlinkSync(img2.path); } catch {}
      return res.status(400).json({ error: "One or both images are empty" });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai:5000/verify';
    console.log(`[verify-face] img1: ${img1.originalname} (${img1.size} bytes, ${img1.mimetype})`);
    console.log(`[verify-face] img2: ${img2.originalname} (${img2.size} bytes, ${img2.mimetype})`);
    console.log(`[verify-face] AI service URL: ${aiServiceUrl}`);

    // Retry logic — rebuild FormData each attempt since streams can't be reused
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const formData = new FormData();
        formData.append('img1', fs.createReadStream(img1.path), {
          filename: img1.originalname || 'img1.jpg',
          contentType: img1.mimetype || 'image/jpeg',
        });
        formData.append('img2', fs.createReadStream(img2.path), {
          filename: img2.originalname || 'img2.jpg',
          contentType: img2.mimetype || 'image/jpeg',
        });

        const response = await axios.post(aiServiceUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Connection': 'keep-alive',
          },
          timeout: 60000,
        });

        const data = response.data;

        // Log verification result for debugging
        console.log("Face verification result:", JSON.stringify({
          verified: data.verified,
          distance: data.distance,
          threshold: data.threshold,
          similarity: data.similarity,
          model: data.model,
          match: data.match,
          modelLoaded: data.model_loaded,
        }));

        // Clean up uploaded files
        try { fs.unlinkSync(img1.path); } catch {}
        try { fs.unlinkSync(img2.path); } catch {}

        return res.json(data);
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const errorDetail = error.response?.data || error.message;
        console.error(`AI service attempt ${attempt} failed:`, { status, error: errorDetail });
        if (status !== 404 && status !== 503 && status !== 502) {
          throw error; // Non-retryable error
        }
        console.log(`AI service attempt ${attempt} failed (${status}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    // Clean up on final failure
    try { fs.unlinkSync(img1.path); } catch {}
    try { fs.unlinkSync(img2.path); } catch {}

    const errorMessage = lastError.response?.data?.error || lastError.message;
    console.error("AI Service Error after retries:", errorMessage);
    res.status(lastError.response?.status || 502).json({
      error: "AI Service unavailable (retries exhausted)",
      details: errorMessage,
      code: lastError.response?.status,
    });

  } catch (error) {
    try { if (req.files?.img1?.[0]?.path) fs.unlinkSync(req.files.img1[0].path); } catch {}
    try { if (req.files?.img2?.[0]?.path) fs.unlinkSync(req.files.img2[0].path); } catch {}

    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message;

    console.error("AI Service Error:", errorMessage);
    res.status(status).json({ error: "AI Service Error", details: errorMessage });
  }
};
