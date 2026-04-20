const axios = require('axios');
const fs = require('fs');
const path = require('path');
const users = []; // Temporary in-memory storage

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  const newUser = { id: users.length + 1, name, email, password };
  users.push(newUser);
  res.status(201).json({ message: "User registered successfully", user: { name, email } });
};

exports.getProfile = (req, res) => {
  res.json({ message: "User profile data" });
};

exports.uploadProfilePic = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ 
    message: "Profile picture uploaded successfully", 
    imageUrl: `/uploads/${req.file.filename}` 
  });
};

exports.verifyFace = async (req, res) => {
  try {
    if (!req.files || !req.files.img1 || !req.files.img2) {
      return res.status(400).json({ error: "Two images (img1 and img2) are required" });
    }

    const img1 = req.files.img1[0];
    const img2 = req.files.img2[0];

    const formData = new FormData();
    
    // Read files and append to FormData
    const file1Buffer = fs.readFileSync(img1.path);
    const file2Buffer = fs.readFileSync(img2.path);
    
    formData.append('img1', new Blob([file1Buffer]), img1.originalname);
    formData.append('img2', new Blob([file2Buffer]), img2.originalname);

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001/verify';
    
    const response = await axios.post(aiServiceUrl, formData);

    // Optional: Clean up uploaded files from Node backend
    fs.unlinkSync(img1.path);
    fs.unlinkSync(img2.path);

    res.json(response.data);
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error("AI Service Error:", errorMessage);
    res.status(error.response?.status || 500).json({ 
      error: "AI Service Error", 
      details: errorMessage 
    });
  }
};
