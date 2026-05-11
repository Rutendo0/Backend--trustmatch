from flask import Flask, request, jsonify
from deepface import DeepFace
import os
import uuid
import numpy as np
import traceback

app = Flask(__name__)

# Temporary directory for processing images
TEMP_DIR = "temp_faces"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# Model configuration
MODEL_NAME = "VGG-Face"
DETECTOR_BACKEND = "opencv"

# Pre-load model at startup to catch initialization errors early
_model_loaded = False

def load_model():
    """Pre-load the face recognition model into memory."""
    global _model_loaded
    try:
        print(f"Loading {MODEL_NAME} model...")
        DeepFace.represent(
            np.zeros((224, 224, 3), dtype=np.uint8),
            model_name=MODEL_NAME,
            enforce_detection=False,
            detector_backend=DETECTOR_BACKEND
        )
        _model_loaded = True
        print(f"{MODEL_NAME} model loaded successfully.")
    except Exception as e:
        print(f"ERROR: Failed to load {MODEL_NAME} model: {e}")
        _model_loaded = False

# Load model at module import (called during container startup)
load_model()


@app.route('/', methods=['GET'])
def health_check():
    try:
        if not _model_loaded:
            return jsonify({
                "status": "AI Service initializing - model not yet loaded",
                "service": "DeepFace Face Verification",
                "model": MODEL_NAME,
                "ready": False
            }), 503

        # Verify model actually works by running a dummy inference
        result = DeepFace.represent(
            np.zeros((224, 224, 3), dtype=np.uint8),
            model_name=MODEL_NAME,
            enforce_detection=False,
            detector_backend=DETECTOR_BACKEND
        )
        return jsonify({
            "status": "AI Service ready",
            "service": "DeepFace Face Verification",
            "deepface": "ready",
            "model": MODEL_NAME,
            "ready": True
        }), 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return jsonify({
            "status": "AI Service unavailable",
            "service": "DeepFace Face Verification",
            "error": str(e),
            "ready": False
        }), 500


@app.route('/verify', methods=['POST'])
def verify_faces():
    if 'img1' not in request.files or 'img2' not in request.files:
        return jsonify({"error": "Please provide two images (img1 and img2)"}), 400

    img1 = request.files['img1']
    img2 = request.files['img2']

    # Validate files are non-empty
    img1.seek(0, 2)
    img1_size = img1.tell()
    img1.seek(0)
    img2.seek(0, 2)
    img2_size = img2.tell()
    img2.seek(0)

    if img1_size == 0 or img2_size == 0:
        return jsonify({"error": "One or both images are empty"}), 400

    # Use unique filenames to avoid collisions between concurrent requests
    request_id = str(uuid.uuid4())
    path1 = os.path.join(TEMP_DIR, f"{request_id}_img1.jpg")
    path2 = os.path.join(TEMP_DIR, f"{request_id}_img2.jpg")

    img1.save(path1)
    img2.save(path2)

    try:
        result = DeepFace.verify(
            img1_path=path1,
            img2_path=path2,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend=DETECTOR_BACKEND
        )

        # Enrich result with additional fields
        result["model"] = MODEL_NAME
        result["match"] = result.get("verified", False)
        result["similarity"] = round((1 - result.get("distance", 1.0)) * 100, 2) if result.get("distance") is not None else 0

        os.remove(path1)
        os.remove(path2)

        return jsonify(result)

    except Exception as e:
        if os.path.exists(path1):
            os.remove(path1)
        if os.path.exists(path2):
            os.remove(path2)

        error_msg = str(e)
        print(f"DeepFace error: {error_msg}")
        print(traceback.format_exc())

        if "Face could not be detected" in error_msg or "Exception while processing" in error_msg:
            return jsonify({
                "error": "No face detected in one or both images. Please try again with clearer photos.",
                "details": error_msg
            }), 400

        return jsonify({"error": error_msg, "model_loaded": _model_loaded}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
