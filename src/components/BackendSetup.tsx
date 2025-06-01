
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const BackendSetup = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const pythonCode = `import os
import asyncio
import aiohttp
from fastapi import FastAPI, File, UploadFile, Request, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import requests
import base64
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
import logging
import time
from dotenv import load_dotenv
import uvicorn
import hashlib
from cachetools import TTLCache

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Hugging Face API token with default fallback
API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "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")

# ImgBB and SerpAPI keys (multiple keys for rotation)
IMGBB_API_KEYS = [
    "FbV8wZA0jkwWH1h7ZCz_bR0ULRx-m8vqhlNLO0rPs-k",
    "skLVcAegrf6TZzWFra-OjCwrtSu3PlhfHHpOAPGeaJE",
    "RLUg1t-RDnG4-f4jW-l_Kn4j7vvwfWFa6Zqy4QyMd9E"
]
SERPAPI_KEYS = ["7eef3245c3e696b1d1202409aac509b219110253"]

# Cache for reverse image search results (TTL: 1 hour)
search_cache = TTLCache(maxsize=100, ttl=3600)

# Models with reliable deepfake detectors
MODELS = [
    {"id": "prithivMLmods/Deep-Fake-Detector-Model", "name": "Deep-Fake-Detector", "ai_label": "Fake"},
    {"id": "Wvolf/ViT_Deepfake_Detection", "name": "ViT-Deepfake", "ai_label": "Fake"},
    {"id": "dima806/deepfake_vs_real_image_detection", "name": "Deepfake-vs-Real", "ai_label": "Fake"},
    {"id": "MaanVad3r/DeepFake-Detector", "name": "MaanVad3r-DeepFake-Detector", "ai_label": "Fake"},
    {"id": "ashish-001/deepfake-detection-using-ViT", "name": "Ashish-ViT-Deepfake", "ai_label": "Fake"},
    {"id": "umm-maybe/AI-image-detector", "name": "AI-Image-Detector", "ai_label": "artificial"},
]

# Adjusted weights based on assumed performance
WEIGHTS = [0.25, 0.25, 0.2, 0.1, 0.1, 0.1]

def preprocess_image(image: Image.Image) -> Image.Image:
    """Apply preprocessing to enhance detection of AI-generated features."""
    image = image.filter(ImageFilter.SHARPEN)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.5)
    return image

async def upload_to_imgbb(image_bytes: bytes) -> str:
    """Upload image to ImgBB using rotated API keys and return the URL."""
    for key in IMGBB_API_KEYS:
        url = "https://api.imgbb.com/1/upload"
        payload = {
            "key": key,
            "image": base64.b64encode(image_bytes).decode('utf-8')
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, data=payload, timeout=10) as response:
                    response.raise_for_status()
                    data = await response.json()
                    return data['data']['url']
            except aiohttp.ClientError as e:
                logger.warning(f"Failed to upload image with ImgBB key {key}: {str(e)}")
                continue
    logger.error("All ImgBB keys exhausted.")
    return None

async def reverse_image_search(image_url: str) -> dict:
    """Perform reverse image search using rotated SerpAPI keys."""
    for key in SERPAPI_KEYS:
        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_reverse_image",
            "image_url": image_url,
            "api_key": key
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, params=params, timeout=15) as response:
                    response.raise_for_status()
                    return await response.json()
            except aiohttp.ClientError as e:
                logger.warning(f"Failed to perform reverse image search with SerpAPI key {key}: {str(e)}")
                continue
    logger.error("All SerpAPI keys exhausted.")
    return None

def analyze_search_results(search_results: dict) -> str:
    """Analyze search results for AI-generation indicators."""
    keywords = ["deepfake", "ai-generated", "fake", "synthetic", "generated", "artificial"]
    if search_results and 'inline_images' in search_results:
        for item in search_results['inline_images'][:5]:
            title = item.get('title', '').lower()
            if any(keyword in title for keyword in keywords):
                return "Possible AI-generation"
    return "No indication"

async def query_model(image_bytes: bytes, model: dict) -> float:
    """Query a Hugging Face model with the image."""
    api_url = f"https://api-inference.huggingface.co/models/{model['id']}"
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    async with aiohttp.ClientSession() as session:
        try:
            async with session.head(api_url, headers=headers, timeout=5) as head_response:
                head_response.raise_for_status()
            async with session.post(api_url, headers=headers, data=image_bytes, timeout=15) as response:
                response.raise_for_status()
                result = await response.json()
                if isinstance(result, list):
                    for pred in result:
                        if pred.get("label") == model["ai_label"]:
                            logger.info(f"Model {model['name']} probability: {pred.get('score', 0.5)}")
                            return float(pred.get("score", 0.5))
                elif isinstance(result, dict) and "labels" in result and "scores" in result:
                    for i, label in enumerate(result["labels"]):
                        if label.lower() == model["ai_label"].lower():
                            logger.info(f"Model {model['name']} probability: {result['scores'][i]}")
                            return float(result["scores"][i])
                logger.warning(f"Unexpected response or error from {model['name']}: {result}")
                return 0.5
        except aiohttp.ClientError as e:
            logger.warning(f"Failed to query {model['name']}: {str(e)}")
            return 0.5

async def detect_single_image(file: UploadFile):
    """Process a single image and return detection result."""
    start_time = time.time()
    logger.info(f"Processing image: {file.filename}")
    
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        image_bytes = await file.read()
        image_hash = hashlib.md5(image_bytes).hexdigest()
        
        # Check cache for reverse image search results
        search_indication = search_cache.get(image_hash)
        
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        image = preprocess_image(image)
        image = image.resize((224, 224))
        output = BytesIO()
        image.save(output, format="JPEG", quality=95)
        image_bytes = output.getvalue()
        
        # Query models concurrently
        tasks = [query_model(image_bytes, model) for model in MODELS]
        model_probs = await asyncio.gather(*tasks)
        probabilities = [
            {"model": model["name"], "probability": prob, "weight": weight}
            for model, prob, weight in zip(MODELS, model_probs, WEIGHTS)
        ]
        
        # Calculate weighted probability
        weighted_prob = sum(p["probability"] * p["weight"] for p in probabilities) / sum(WEIGHTS)
        confidence = weighted_prob if weighted_prob > 0.5 else 1 - weighted_prob
        result = "AI-generated" if weighted_prob > 0.5 else "Real"
        
        # Raise threshold to 0.8
        threshold = 0.8
        if confidence < threshold:
            result = "Needs review"
            if not search_indication:
                image_url = await upload_to_imgbb(image_bytes)
                if image_url:
                    search_results = await reverse_image_search(image_url)
                    if search_results:
                        search_indication = analyze_search_results(search_results)
                        search_cache[image_hash] = search_indication
        
        processing_time = time.time() - start_time
        logger.info(f"Result: {result} (Confidence: {confidence:.2f})")
        
        return {
            "filename": file.filename,
            "result": result,
            "confidence": float(confidence),
            "individual_results": probabilities,
            "processing_time": float(processing_time),
            "search_indication": search_indication
        }
    except Exception as e:
        logger.error(f"Error processing image {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "time": time.strftime('%Y-%m-%d %H:%M:%S')}

@app.post("/detect")
@limiter.limit("100/minute")
async def detect(request: Request, files: list[UploadFile] = File(...)):
    """Process up to 10 images and return detection results."""
    start_time = time.time()
    logger.info(f"Received request from {request.client.host} with {len(files)} files")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
    
    tasks = [detect_single_image(file) for file in files]
    results = await asyncio.gather(*tasks)
    
    processing_time = time.time() - start_time
    logger.info(f"Processed {len(files)} images in {processing_time:.2f}s")
    
    return {"results": results, "total_processing_time": float(processing_time)}

@app.post("/feedback")
async def feedback(request: Request, feedback: str = Form(...)):
    """Receive user feedback."""
    logger.info(f"Feedback: {feedback}")
    return {"message": "Feedback submitted"}

if __name__ == "__main__":
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8002)`;

  const requirements = `fastapi>=0.104.1
uvicorn[standard]>=0.24.0
slowapi>=0.1.9
requests>=2.31.0
pillow>=10.1.0
python-dotenv>=1.0.0
python-multipart>=0.0.6
aiohttp>=3.9.0
cachetools>=5.3.0`;

  const envContent = `HUGGINGFACE_API_TOKEN=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`;

  const installCommands = `# Install Python dependencies
pip install fastapi uvicorn slowapi requests pillow python-dotenv python-multipart aiohttp cachetools

# Or use requirements.txt
pip install -r requirements.txt

# Run the server
python main.py`;

  const systemdService = `# Create systemd service for auto-start
sudo nano /etc/systemd/system/ai-detector.service

# Add this content:
[Unit]
Description=AI Image Detector Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start the service
sudo systemctl enable ai-detector.service
sudo systemctl start ai-detector.service`;

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Backend Setup Instructions
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">1. Install Dependencies</h4>
              <div className="bg-black/20 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">{installCommands}</pre>
                <Button
                  onClick={() => copyToClipboard(installCommands, 'Install commands')}
                  size="sm"
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                >
                  {copied === 'Install commands' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">2. Create requirements.txt</h4>
              <div className="bg-black/20 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">{requirements}</pre>
                <Button
                  onClick={() => copyToClipboard(requirements, 'Requirements')}
                  size="sm"
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                >
                  {copied === 'Requirements' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">3. Create main.py</h4>
              <div className="bg-black/20 rounded-lg p-4 relative max-h-96 overflow-y-auto">
                <pre className="text-green-400 text-sm">{pythonCode}</pre>
                <Button
                  onClick={() => copyToClipboard(pythonCode, 'Python code')}
                  size="sm"
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                >
                  {copied === 'Python code' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">4. Create .env file</h4>
              <div className="bg-black/20 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">{envContent}</pre>
                <Button
                  onClick={() => copyToClipboard(envContent, 'Environment variables')}
                  size="sm"
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                >
                  {copied === 'Environment variables' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">5. Auto-start with systemd (Optional)</h4>
              <div className="bg-black/20 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">{systemdService}</pre>
                <Button
                  onClick={() => copyToClipboard(systemdService, 'Systemd service')}
                  size="sm"
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20"
                >
                  {copied === 'Systemd service' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-200 font-medium">Key Features</span>
              </div>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• Async processing with concurrent API calls for faster results</li>
                <li>• Supports up to 10 images per request</li>
                <li>• Caching system for reverse image search results</li>
                <li>• Multiple API key rotation for reliability</li>
                <li>• The backend runs on http://localhost:8002</li>
                <li>• Auto-detection starts immediately after upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
