
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

# Your existing backend code continues here...`;

  const requirements = `fastapi>=0.104.1
uvicorn[standard]>=0.24.0
slowapi>=0.1.9
requests>=2.31.0
pillow>=10.1.0
python-dotenv>=1.0.0
python-multipart>=0.0.6`;

  const envContent = `HUGGINGFACE_API_TOKEN=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`;

  const installCommands = `# Install Python dependencies
pip install fastapi uvicorn slowapi requests pillow python-dotenv python-multipart

# Or use requirements.txt
pip install -r requirements.txt

# Run the server
python main.py`;

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
              <h4 className="text-white font-medium mb-2">3. Create .env file</h4>
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

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-200 font-medium">Important Notes</span>
              </div>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• Make sure Python 3.8+ is installed</li>
                <li>• The backend will run on http://localhost:8002</li>
                <li>• HuggingFace API token is included with fallback</li>
                <li>• Auto-detection starts immediately after upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
