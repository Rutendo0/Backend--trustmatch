#!/bin/bash
# startup.sh - Bootstrap script for the AI face verification service
# This script ensures the DeepFace model is downloaded and working
# before the Flask server starts accepting requests.
# Critical for production environments (Railway, Docker, etc.)

set -e

echo "=============================================="
echo "AI Face Verification Service - Startup Script"
echo "=============================================="

# Ensure temp directory exists
mkdir -p temp_faces

# Set defaults
PORT=${PORT:-5001}
MODEL_NAME=${MODEL_NAME:-VGG-Face}
MAX_RETRIES=5
RETRY_DELAY=10

echo "[1/3] Checking Python environment..."
python3 --version
pip list | grep -iE "deepface|tensorflow|opencv|flask|numpy" || {
    echo "ERROR: Required Python packages missing. Run: pip install -r requirements.txt"
    exit 1
}
echo "Python environment OK."

echo "[2/3] Downloading and verifying ${MODEL_NAME} model..."

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES to load model..."

    python3 -c "
import numpy as np
from deepface import DeepFace

# Download model if not present, and verify it loads correctly
try:
    result = DeepFace.represent(
        np.zeros((224, 224, 3), dtype=np.uint8),
        model_name='${MODEL_NAME}',
        enforce_detection=False
    )
    print(f'Model ${MODEL_NAME} loaded successfully. Embedding shape: {np.array(result).shape}')
    exit(0)
except Exception as e:
    print(f'Model load failed: {e}')
    exit(1)
" && break

    if [ $i -lt $MAX_RETRIES ]; then
        echo "Model load failed. Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        RETRY_DELAY=$((RETRY_DELAY * 2))
    else
        echo "FATAL: Failed to load ${MODEL_NAME} after $MAX_RETRIES attempts."
        echo "Check your network connection and storage permissions."
        echo "You may also try manually downloading the model:"
        echo "  mkdir -p ~/.deepface/weights"
        echo "  curl -L -o ~/.deepface/weights/vgg_face_weights.h5 <URL>"
        exit 1
    fi
done

echo "[3/3] Starting Flask server on port ${PORT}..."
exec python3 -u app.py 2>&1