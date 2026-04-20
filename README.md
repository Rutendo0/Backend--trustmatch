# Dating App AI Backend

A dual-service backend architecture featuring a Node.js/Express API and a Python-based AI microservice for facial recognition and verification.

## 🚀 Architecture Overview

This project consists of two main components:
1.  **Main Backend (Node.js/Express)**: Handles user registration, profile management, and acts as a gateway for AI requests. Runs on port `5000`.
2.  **AI Microservice (Python/Flask)**: A specialized service using `DeepFace` to perform face verification between two images. Runs on port `5001`.

---

## 🛠️ Technology Stack
*   **Backend**: Node.js, Express, Multer (File Uploads), Axios
*   **AI Service**: Python 3.12, Flask, DeepFace, TensorFlow, OpenCV
*   **Database**: (Placeholder for MongoDB/PostgreSQL)

---

## 📂 Project Structure
```text
dating-app-backend/
├── ai-service/             # Python AI Microservice
│   ├── app.py              # Flask server logic
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # AI Service container config
│   └── venv/               # Virtual environment
├── backend/                # Node.js Express Backend
│   ├── controllers/        # Business logic
│   ├── middleware/         # Multer upload & auth
│   ├── routes/             # API Endpoints
│   ├── uploads/            # Temporary image storage
│   └── server.js           # Entry point
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── backend.Dockerfile      # Node.js Backend container config
├── docker-compose.yml      # Multi-container orchestration
├── package.json            # Node dependencies
└── README.md               # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python 3.12](https://www.python.org/) (TensorFlow requires version <= 3.12)

### 2. Main Backend Setup (Node.js)
```bash
# Install dependencies
npm install

# Create/Update .env file
# AI_SERVICE_URL=http://localhost:5001/verify
```

### 3. AI Service Setup (Python)
```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate venv (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 📥 Manual Model Download (Recommended)
If the AI service fails to download models automatically, run this in PowerShell:
```powershell
mkdir -Force "C:\Users\$env:USERNAME\.deepface\weights"
curl.exe --ssl-no-revoke -L -o "C:\Users\$env:USERNAME\.deepface\weights\vgg_face_weights.h5" "https://github.com/serengil/deepface_models/releases/download/v1.0/vgg_face_weights.h5"
```

---

## 🚦 How to Run

1.  **Start AI Service**:
    ```bash
    cd ai-service
    .\venv\Scripts\activate
    python app.py
    ```
2.  **Start Node Backend**:
    ```bash
    # Open a new terminal
    npm run dev
    ```

---

## 📡 API Endpoints

### Face Verification
**`POST /api/users/verify-face`**
*   **Type**: Multipart Form-Data
*   **Fields**:
    *   `img1`: File (Image)
    *   `img2`: File (Image)
*   **Response**:
    ```json
    {
        "confidence": 85.46,
        "detector_backend": "opencv",
        "distance": 0.359952,
        "facial_areas": {
            "img1": {
                "h": 654,
                "left_eye": [
                    2397,
                    843
                ],
                "right_eye": [
                    2140,
                    833
                ],
                "w": 654,
                "x": 1926,
                "y": 578
            },
            "img2": {
                "h": 758,
                "left_eye": [
                    2712,
                    770
                ],
                "right_eye": [
                    2404,
                    782
                ],
                "w": 758,
                "x": 2176,
                "y": 500
            }
        },
        "model": "VGG-Face",
        "similarity_metric": "cosine",
        "threshold": 0.68,
        "time": 33.15,
        "verified": true
    }
    ```
---

## 🧪 Testing with Postman
1.  Set method to **POST**.
2.  Enter URL: `http://localhost:5000/api/users/verify-face`.
3.  Go to **Body** -> **form-data**.
4.  Add keys `img1` and `img2`, change their type to **File**, and upload two photos.
5.  Click **Send**.

---

## 🚀 Deployment

This project uses a dual-service architecture. The most reliable way to deploy it is using **Docker**, which ensures the Python and Node.js environments are configured correctly.

### 📦 Pro Deployment: Docker Compose
The project includes a `docker-compose.yml` that handles both services and their networking.

1.  **Prerequisites**: Install [Docker](https://docs.docker.com/get-docker/) on your server.
2.  **Environment**: Create a `.env` file on your server with:
    ```env
    AI_SERVICE_URL=http://ai:5001/verify
    ```
3.  **Run**:
    ```bash
    docker-compose up --build -d
    ```

### ☁️ Recommended Platforms
*   **DigitalOcean / VPS (Recommended)**: Use a VPS with at least **4GB RAM**. DeepFace/TensorFlow requires significant memory.
*   **Render**: You can deploy each folder as a separate service. Use the **Dockerfile** option in Render settings. (Requires paid plan for sufficient RAM).

### ⚖️ Scaling Considerations
Facial recognition is CPU/RAM intensive. If you expect high traffic:
1.  Increase the number of `ai` service replicas in Docker.
2.  Use a message queue (like RabbitMQ) to handle verification requests asynchronously.
