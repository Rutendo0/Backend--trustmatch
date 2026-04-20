const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

router.post('/register', userController.register);
router.get('/profile', userController.getProfile);
router.post('/upload-pic', upload.single('profilePic'), userController.uploadProfilePic);
router.post('/verify-face', (req, res, next) => {
  upload.fields([{ name: 'img1', maxCount: 1 }, { name: 'img2', maxCount: 1 }])(req, res, (err) => {
    if (err instanceof require('multer').MulterError) {
      return res.status(400).json({ error: `Multer Error: ${err.message}`, field: err.field });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, userController.verifyFace);

module.exports = router;
