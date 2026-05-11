FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for OpenCV, image processing, and startup script
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    unzip \
    bash \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace model weights at build time
# This ensures the VGG-Face model is baked into the image
# and doesn't need to be downloaded at runtime
RUN python -c "\
import numpy as np; \
from deepface import DeepFace; \
DeepFace.represent(np.zeros((224,224,3), dtype=np.uint8), model_name='VGG-Face', enforce_detection=False); \
print('VGG-Face model pre-downloaded successfully'); \
"

# Copy application code after model download to leverage Docker layer caching
# (model won't be re-downloaded if only app code changes)
COPY . .

# Make startup script executable
RUN chmod +x startup.sh

EXPOSE 5001

# Use startup script for production - ensures model is verified before serving
CMD ["./startup.sh"]
