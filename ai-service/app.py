from flask import Flask, request, jsonify
from deepface import DeepFace
import os
import uuid
import numpy as np

app = Flask(__name__)

# Temporary directory for processing images
TEMP_DIR = "temp_faces"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

@app.route('/', methods=['GET'])
def health_check():
    try:
        DeepFace.represent(np.zeros((224,224,3), dtype=np.uint8), model_name="VGG-Face", enforce_detection=False)
        return jsonify({"status": "AI Service ready", "service": "DeepFace Face Verification", "deepface": "ready"}), 200
    except:
        return jsonify({"status": "AI Service starting - DeepFace initializing...", "service": "DeepFace Face Verification"}), 503

@app.route('/verify', methods=['POST'])
def verify_faces():
    if 'img1' not in request.files or 'img2' not in request.files:
        return jsonify({"error": "Please provide two images (img1 and img2)"}), 400

    img1 = request.files['img1']
    img2 = request.files['img2']

    # Use unique filenames to avoid collisions between concurrent requests
    request_id = str(uuid.uuid4())
    path1 = os.path.join(TEMP_DIR, f"{request_id}_img1.jpg")
    path2 = os.path.join(TEMP_DIR, f"{request_id}_img2.jpg")

    img1.save(path1)
    img2.save(path2)

    try:
        result = DeepFace.verify(img1_path=path1, img2_path=path2, model_name="VGG-Face", enforce_detection=False)

        os.remove(path1)
        os.remove(path2)

        return jsonify(result)

    except Exception as e:
        if os.path.exists(path1): os.remove(path1)
        if os.path.exists(path2): os.remove(path2)

        import traceback
        error_msg = str(e)
        print("DeepFace error:", error_msg)
        print(traceback.format_exc())

        if "Face could not be detected" in error_msg or "Exception while processing" in error_msg:
            return jsonify({"error": "No face detected in one or both images. Please try again with clearer photos.", "details": error_msg}), 400

        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
