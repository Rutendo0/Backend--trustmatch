from flask import Flask, request, jsonify
from deepface import DeepFace
import os
import cv2
import numpy as np

app = Flask(__name__)

# Temporary directory for processing images
TEMP_DIR = "temp_faces"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service is running", "service": "DeepFace Face Verification"}), 200

@app.route('/verify', methods=['POST'])
def verify_faces():
    if 'img1' not in request.files or 'img2' not in request.files:
        return jsonify({"error": "Please provide two images (img1 and img2)"}), 400

    img1 = request.files['img1']
    img2 = request.files['img2']

    path1 = os.path.join(TEMP_DIR, img1.filename)
    path2 = os.path.join(TEMP_DIR, img2.filename)

    img1.save(path1)
    img2.save(path2)

    try:
        # Run DeepFace verification
        result = DeepFace.verify(img1_path=path1, img2_path=path2, model_name="VGG-Face")
        
        # Clean up temporary files
        os.remove(path1)
        os.remove(path2)

        return jsonify(result)

    except Exception as e:
        # Clean up in case of error
        if os.path.exists(path1): os.remove(path1)
        if os.path.exists(path2): os.remove(path2)
        
        # Check if it's a 'no face detected' error
        error_msg = str(e)
        if "Face could not be detected" in error_msg:
            return jsonify({"error": "No face detected in one or both images. Please try again with clearer photos."}), 400
        
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
