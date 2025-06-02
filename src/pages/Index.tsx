import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, Clock, Brain, TrendingUp, AlertCircle, CheckCircle, XCircle, Zap, Shield, Sparkles, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BackendSetup } from '@/components/BackendSetup';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/contexts/ThemeContext';

interface DetectionResult {
  result: string;
  confidence: number;
  individual_results: Array<{
    model: string;
    probability: number;
    weight: number;
  }>;
  processing_time: number;
  search_indication?: string;
}

const funFacts = [
  "🤖 AI can now generate images so realistic that even experts struggle to tell the difference!",
  "🔍 Our system analyzes millions of pixels in seconds to detect AI patterns invisible to the human eye.",
  "🧠 Deep learning models can identify subtle compression artifacts left by AI generators.",
  "⚡ The first deepfake was created in 1997, but modern AI can generate faces in milliseconds!",
  "🎨 AI image generators like DALL-E and Midjourney process billions of parameters per image.",
  "🔬 Advanced detection looks for inconsistencies in lighting, shadows, and facial geometry.",
  "🌐 Over 90% of AI-generated content online goes undetected by casual observers.",
  "🎭 Deepfake technology was originally developed for legitimate film and entertainment purposes.",
  "📊 Our multi-model approach combines 6 different AI detectors for maximum accuracy.",
  "🚀 Modern AI can generate a photorealistic face that has never existed in just 3 seconds!",
  "🔎 Reverse image searches help us track the origin and distribution of suspicious images.",
  "💡 AI-generated images often have telltale signs in the background and edge details.",
];

const Index = () => {
  const { currentTheme } = useTheme();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showSetup, setShowSetup] = useState(false);
  const [currentFunFact, setCurrentFunFact] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Welcome animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8002/health', {
        method: 'GET',
        mode: 'cors',
      });
      if (response.ok) {
        setBackendStatus('connected');
        toast.success('✅ Backend connected successfully!');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
      toast.error('❌ Backend not connected. Please start your Python backend.');
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    
    // Auto-detect after file selection only if backend is connected
    if (backendStatus === 'connected') {
      setTimeout(() => {
        detectImage(file);
      }, 500);
    } else {
      toast.warning('Backend not connected. Please start your Python backend first.');
    }
  }, [backendStatus]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const detectImage = async (file?: File) => {
    const fileToDetect = file || selectedFile;
    if (!fileToDetect) {
      toast.error('Please select an image first');
      return;
    }

    if (backendStatus !== 'connected') {
      toast.error('Backend not connected. Please start your Python backend on localhost:8002');
      return;
    }

    setIsDetecting(true);
    setUploadProgress(10);
    
    // Start fun facts rotation
    const factInterval = setInterval(() => {
      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      setCurrentFunFact(randomFact);
    }, 2000);
    
    const formData = new FormData();
    formData.append('files', fileToDetect);

    try {
      setUploadProgress(30);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('http://localhost:8002/detect', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setUploadProgress(70);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Detection failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setUploadProgress(100);
      
      // Handle multiple results (new backend returns results array)
      const resultData = data.results ? data.results[0] : data;
      setResult(resultData);
      
      if (resultData.result === 'AI-generated') {
        toast.error('⚠️ AI-generated image detected!');
      } else if (resultData.result === 'Real') {
        toast.success('✅ Real image detected!');
      } else {
        toast('🔍 Needs manual review');
      }
    } catch (error) {
      console.error('Detection error:', error);
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to detect image. Make sure your backend is running on localhost:8002');
        setBackendStatus('disconnected');
      }
    } finally {
      setIsDetecting(false);
      setUploadProgress(0);
      setCurrentFunFact('');
      clearInterval(factInterval);
    }
  };

  const getHighestConfidenceModel = (results: Array<{model: string; probability: number; weight: number}>) => {
    if (!results || results.length === 0) return null;
    return results.reduce((highest, current) => 
      current.probability > highest.probability ? current : highest
    );
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'AI-generated':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'Real':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      default:
        return <AlertCircle className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'AI-generated':
        return `${currentTheme.colors.gradientFrom} ${currentTheme.colors.gradientTo.replace('to-purple-500/20', 'to-red-500/20')} border-red-500/30`;
      case 'Real':
        return `${currentTheme.colors.gradientFrom.replace('from-blue-500/20', 'from-green-500/20')} ${currentTheme.colors.gradientTo.replace('to-purple-500/20', 'to-emerald-500/20')} border-green-500/30`;
      default:
        return `${currentTheme.colors.gradientFrom.replace('from-blue-500/20', 'from-yellow-500/20')} ${currentTheme.colors.gradientTo.replace('to-purple-500/20', 'to-orange-500/20')} border-yellow-500/30`;
    }
  };

  const getResultGradient = (result: string) => {
    switch (result) {
      case 'AI-generated':
        return currentTheme.colors.error;
      case 'Real':
        return currentTheme.colors.success;
      default:
        return currentTheme.colors.warning;
    }
  };

  if (showSetup) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors.background} relative overflow-hidden`}>
        <div className="container-responsive section-spacing relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 welcome-fade-in gap-4">
            <Button
              onClick={() => setShowSetup(false)}
              className={`bg-gradient-to-r ${currentTheme.colors.primary} hover:opacity-90 ${currentTheme.colors.foreground} transition-all-smooth hover-scale-sm order-2 sm:order-1`}
            >
              ← Back to App
            </Button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 order-1 sm:order-2">
              <ThemeSwitcher />
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-all-smooth ${
                  backendStatus === 'connected' ? 'bg-green-400 animate-pulse-glow' : 
                  backendStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                }`}></div>
                <span className={`text-responsive-sm ${currentTheme.colors.foreground}`}>
                  Backend: {backendStatus === 'connected' ? 'Connected' : 
                           backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
          <div className="welcome-slide-up animate-delay-200">
            <BackendSetup />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.colors.background} relative overflow-hidden`}>
      {/* Enhanced Animated background elements */}
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-r ${currentTheme.colors.primary} opacity-30 rounded-full blur-xl animate-float ${isLoaded ? 'welcome-scale-in animate-delay-300' : 'opacity-0'}`}></div>
        <div className={`absolute top-3/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-gradient-to-r ${currentTheme.colors.secondary} opacity-25 rounded-full blur-xl animate-float animation-delay-1000 ${isLoaded ? 'welcome-scale-in animate-delay-400' : 'opacity-0'}`}></div>
        <div className={`absolute top-1/2 left-1/2 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-r ${currentTheme.colors.accent} opacity-35 rounded-full blur-xl animate-gentle-bounce animation-delay-2000 ${isLoaded ? 'welcome-scale-in animate-delay-500' : 'opacity-0'}`}></div>
        <div className={`absolute top-10 right-10 w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-r ${currentTheme.colors.primary} opacity-20 rounded-full blur-lg animate-float animate-delay-800 ${isLoaded ? 'welcome-elastic animate-delay-600' : 'opacity-0'}`}></div>
      </div>

      <div className="container-responsive section-spacing relative z-10">
        {/* Enhanced Responsive Header with Welcome Animation */}
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 ${isLoaded ? 'welcome-fade-in' : 'opacity-0'}`}>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 ${isLoaded ? 'welcome-bounce-in animate-delay-200' : 'opacity-0'}`}>
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${currentTheme.colors.primary} rounded-full transition-all-smooth hover-scale animate-pulse-glow`}>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className={`text-responsive-3xl font-bold bg-gradient-to-r ${currentTheme.colors.accent} bg-clip-text text-transparent gradient-text-animated text-center sm:text-left`}>
              AI Detector
            </h1>
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${currentTheme.colors.secondary} rounded-full transition-all-smooth hover-scale animate-pulse-glow`}>
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          
          {/* Enhanced Responsive Backend Status Indicator */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 ${isLoaded ? 'welcome-slide-up animate-delay-300' : 'opacity-0'}`}>
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full ${currentTheme.colors.card} transition-all-smooth hover-scale-sm glass`}>
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all-smooth ${
                backendStatus === 'connected' ? 'bg-green-400 animate-pulse-glow' : 
                backendStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
              }`}></div>
              <span className={`text-responsive-xs font-medium ${currentTheme.colors.foreground}`}>
                Backend: {backendStatus === 'connected' ? 'Connected' : 
                         backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
            </div>
            <ThemeSwitcher />
            <Button
              onClick={() => setShowSetup(true)}
              size="sm"
              className={`bg-gradient-to-r ${currentTheme.colors.primary} hover:opacity-90 text-white transition-all-smooth hover-scale-sm btn-responsive`}
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-responsive-xs">Setup</span>
            </Button>
            {backendStatus === 'disconnected' && (
              <Button
                onClick={checkBackendConnection}
                size="sm"
                className={`bg-gradient-to-r ${currentTheme.colors.secondary} hover:opacity-90 text-white transition-all-smooth hover-scale-sm btn-responsive`}
              >
                <span className="text-responsive-xs">Retry Connection</span>
              </Button>
            )}
          </div>

          <p className={`text-responsive-lg max-w-3xl mx-auto leading-relaxed ${currentTheme.colors.foreground} opacity-80 px-4 sm:px-0 ${isLoaded ? 'welcome-slide-up animate-delay-400' : 'opacity-0'}`}>
            Advanced multi-model detection system powered by cutting-edge AI to identify artificially generated images with unprecedented accuracy
          </p>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 ${isLoaded ? 'welcome-scale-in animate-delay-500' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 text-green-400 transition-all-smooth hover-scale-sm">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-gentle-bounce" />
              <span className="text-responsive-sm font-medium">Auto-Detection</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400 transition-all-smooth hover-scale-sm">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 animate-gentle-bounce animate-delay-200" />
              <span className="text-responsive-sm font-medium">6 AI Models</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400 transition-all-smooth hover-scale-sm">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 animate-gentle-bounce animate-delay-400" />
              <span className="text-responsive-sm font-medium">Real-time Analysis</span>
            </div>
          </div>
        </div>

        <div className={`responsive-grid max-w-7xl mx-auto ${isLoaded ? 'welcome-slide-up animate-delay-700' : 'opacity-0'}`}>
          {/* Enhanced Responsive Upload Section */}
          <Card className={`${currentTheme.colors.card} card-responsive shadow-2xl hover:shadow-3xl transition-all-smooth hover-lift glass`}>
            <CardContent className="padding-responsive-md">
              <h2 className={`text-responsive-2xl font-semibold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 ${currentTheme.colors.foreground}`}>
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 animate-gentle-bounce" />
                Upload & Analyze
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center transition-all-smooth hover-scale-sm ${
                  isDragOver
                    ? `border-blue-400 bg-blue-400/20 scale-105 glass`
                    : `${currentTheme.colors.border} hover:border-white/40 hover:bg-white/5 glass`
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {previewUrl ? (
                  <div className="spacing-responsive-md animate-scale-in">
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-60 sm:max-h-80 mx-auto rounded-lg sm:rounded-xl shadow-2xl group-hover:shadow-3xl transition-all-smooth hover-scale-sm"
                      />
                      {isDetecting && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg sm:rounded-xl flex items-center justify-center p-4">
                          <div className="glass-dark rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md">
                            <div className="flex items-center gap-3 text-white mb-4">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="font-medium text-responsive-base">Analyzing...</span>
                            </div>
                            {uploadProgress > 0 && (
                              <Progress value={uploadProgress} className="mb-4 h-2 progress-glow" />
                            )}
                            {currentFunFact && (
                              <div className="text-blue-200 text-responsive-sm leading-relaxed animate-fade-in">
                                {currentFunFact}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 font-medium text-responsive-lg">{selectedFile?.name}</p>
                    {!isDetecting && (
                      <Button
                        onClick={() => detectImage()}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all-smooth hover-scale btn-responsive"
                      >
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Re-analyze Image
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="spacing-responsive-md animate-fade-in">
                    <div className="relative">
                      <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-slate-400 animate-pulse" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse-glow">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white text-responsive-xl mb-2 sm:mb-3 font-semibold">Drop your image here</p>
                      <p className="text-slate-400 text-responsive-lg">or click to browse • Auto-detection enabled</p>
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Responsive Results Section */}
          <Card className={`${currentTheme.colors.card} card-responsive shadow-2xl hover:shadow-3xl transition-all-smooth hover-lift glass`}>
            <CardContent className="padding-responsive-md">
              <h2 className={`text-responsive-2xl font-semibold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 ${currentTheme.colors.foreground}`}>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 animate-gentle-bounce" />
                Detection Results
              </h2>

              {result ? (
                <div className="spacing-responsive-lg animate-fade-in">
                  {/* Highest Confidence Model Result */}
                  {result.individual_results && result.individual_results.length > 0 && (
                    <div className={`padding-responsive-sm bg-gradient-to-r ${currentTheme.colors.gradientFrom} ${currentTheme.colors.gradientTo} ${currentTheme.colors.border} card-responsive glass transition-all-smooth hover-scale-sm`}>
                      <h3 className={`text-responsive-lg font-semibold mb-3 flex items-center gap-2 ${currentTheme.colors.foreground}`}>
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                        Highest Confidence Model
                      </h3>
                      {(() => {
                        const highestModel = getHighestConfidenceModel(result.individual_results);
                        const prediction = highestModel.probability > 0.5 ? 'AI-generated' : 'Real';
                        return (
                          <p className={`text-responsive-base leading-relaxed ${currentTheme.colors.foreground}`}>
                            <span className="font-medium text-indigo-200">{highestModel.model}</span> says this image is{' '}
                            <span className={`font-bold ${prediction === 'AI-generated' ? 'text-red-300' : 'text-green-300'}`}>
                              {prediction}
                            </span>{' '}
                            with {(highestModel.probability * 100).toFixed(1)}% confidence
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* Enhanced Responsive Main Result */}
                  <div className={`padding-responsive-md card-responsive bg-gradient-to-r ${getResultColor(result.result)} border glass transition-all-smooth hover-scale-sm`}>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 sm:mb-6">
                      {getResultIcon(result.result)}
                      <div className="text-center sm:text-left">
                        <span className="text-responsive-2xl font-bold text-white block">{result.result}</span>
                        <span className="text-responsive-lg text-white/80">Detection Complete</span>
                      </div>
                    </div>
                    <div className="spacing-responsive-sm">
                      <div className="flex flex-col sm:flex-row justify-between text-white items-center gap-2">
                        <span className="text-responsive-lg font-medium">Confidence Level</span>
                        <span className="text-responsive-2xl font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={result.confidence * 100} className="h-3 sm:h-4 bg-white/20" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${getResultGradient(result.result)} opacity-80 rounded-full transition-all-smooth progress-glow`} 
                             style={{ width: `${result.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Time */}
                  <div className="flex items-center gap-3 text-slate-300 glass padding-responsive-sm card-responsive transition-all-smooth hover-scale-sm">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="font-medium text-responsive-base">Processed in {result.processing_time.toFixed(2)}s</span>
                  </div>

                  {/* Enhanced Responsive Model Breakdown */}
                  <div>
                    <h3 className="text-responsive-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      AI Model Analysis
                    </h3>
                    <div className="spacing-responsive-sm">
                      {result.individual_results.map((modelResult, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between padding-responsive-sm glass card-responsive hover:bg-white/10 transition-all-smooth border border-white/10 hover-scale-sm gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                            <span className="text-slate-300 font-medium text-responsive-base">{modelResult.model}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-responsive-xs glass border-white/20">
                              Weight: {modelResult.weight}
                            </Badge>
                            <span className="text-white font-bold text-responsive-lg">
                              {(modelResult.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search Indication */}
                  {result.search_indication && (
                    <div className="padding-responsive-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 card-responsive glass transition-all-smooth hover-scale-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className="font-semibold text-yellow-200 text-responsive-base">Web Search Analysis</span>
                      </div>
                      <p className="text-yellow-100 text-responsive-base">{result.search_indication}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center section-spacing-sm animate-pulse">
                  <Brain className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-slate-400 mb-4 sm:mb-6 animate-gentle-bounce" />
                  <p className={`text-responsive-xl ${currentTheme.colors.foreground} opacity-60`}>Upload an image to see detection results</p>
                  <p className={`mt-2 text-responsive-base ${currentTheme.colors.foreground} opacity-40`}>Automatic analysis will begin immediately</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Responsive Info Section */}
        <div className={`section-spacing ${isLoaded ? 'welcome-slide-up animate-delay-700' : 'opacity-0'}`}>
          <Card className={`${currentTheme.colors.card} max-w-6xl mx-auto card-responsive shadow-2xl transition-all-smooth hover-lift glass`}>
            <CardContent className="padding-responsive-lg">
              <h3 className={`text-responsive-2xl font-semibold mb-6 sm:mb-8 text-center ${currentTheme.colors.foreground}`}>How Our AI Detection Works</h3>
              <div className={`responsive-grid-3 ${currentTheme.colors.foreground} opacity-80`}>
                <div className="text-center group hover-scale transition-all-smooth">
                  <div className={`p-3 sm:p-4 bg-gradient-to-r ${currentTheme.colors.primary} rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 group-hover:shadow-lg transition-all-smooth animate-pulse-glow`}>
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-responsive-xl ${currentTheme.colors.foreground}`}>Instant Upload</h4>
                  <p className="text-responsive-base leading-relaxed">Drag & drop any image for immediate automatic analysis with real-time progress tracking</p>
                </div>
                <div className="text-center group hover-scale transition-all-smooth">
                  <div className={`p-3 sm:p-4 bg-gradient-to-r ${currentTheme.colors.secondary} rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 group-hover:shadow-lg transition-all-smooth animate-pulse-glow animate-delay-300`}>
                    <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-responsive-xl ${currentTheme.colors.foreground}`}>Multi-Model AI</h4>
                  <p className="text-responsive-base leading-relaxed">6 specialized AI models analyze your image simultaneously for maximum accuracy</p>
                </div>
                <div className="text-center group hover-scale transition-all-smooth">
                  <div className={`p-3 sm:p-4 bg-gradient-to-r ${currentTheme.colors.success} rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 group-hover:shadow-lg transition-all-smooth animate-pulse-glow animate-delay-600`}>
                    <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-responsive-xl ${currentTheme.colors.foreground}`}>Detailed Results</h4>
                  <p className="text-responsive-base leading-relaxed">Get comprehensive analysis with confidence scores and model-by-model breakdown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
