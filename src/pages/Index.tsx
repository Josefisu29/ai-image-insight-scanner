
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, Clock, Brain, TrendingUp, AlertCircle, CheckCircle, XCircle, Zap, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    
    // Auto-detect after file selection
    setTimeout(() => {
      detectImage(file);
    }, 500);
  }, []);

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

    setIsDetecting(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append('file', fileToDetect);

    try {
      setUploadProgress(30);
      const response = await fetch('http://localhost:8002/detect', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data: DetectionResult = await response.json();
      setUploadProgress(100);
      setResult(data);
      
      if (data.result === 'AI-generated') {
        toast.error('⚠️ AI-generated image detected!');
      } else if (data.result === 'Real') {
        toast.success('✅ Real image detected!');
      } else {
        toast('🔍 Needs manual review');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to detect image. Make sure your backend is running on localhost:8002');
    } finally {
      setIsDetecting(false);
      setUploadProgress(0);
    }
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
        return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      case 'Real':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default:
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    }
  };

  const getResultGradient = (result: string) => {
    switch (result) {
      case 'AI-generated':
        return 'from-red-500 to-pink-500';
      case 'Real':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-yellow-500 to-orange-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Detector
            </h1>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Advanced multi-model detection system powered by cutting-edge AI to identify artificially generated images with unprecedented accuracy
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-green-400">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Auto-Detection</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">6 AI Models</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Real-time Analysis</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Enhanced Upload Section */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/10">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-white mb-8 flex items-center gap-3">
                <Upload className="w-8 h-8 text-blue-400" />
                Upload & Analyze
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 transform hover:scale-[1.02] ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-400/20 scale-105'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {previewUrl ? (
                  <div className="space-y-6 animate-scale-in">
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-80 mx-auto rounded-xl shadow-2xl group-hover:shadow-3xl transition-all duration-300"
                      />
                      {isDetecting && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                            <div className="flex items-center gap-3 text-white">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="font-medium">Analyzing...</span>
                            </div>
                            {uploadProgress > 0 && (
                              <Progress value={uploadProgress} className="mt-3 h-2" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 font-medium text-lg">{selectedFile?.name}</p>
                    {!isDetecting && (
                      <Button
                        onClick={() => detectImage()}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Brain className="w-5 h-5 mr-2" />
                        Re-analyze Image
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="relative">
                      <ImageIcon className="w-20 h-20 mx-auto text-slate-400 animate-pulse" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white text-2xl mb-3 font-semibold">Drop your image here</p>
                      <p className="text-slate-400 text-lg">or click to browse • Auto-detection enabled</p>
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

          {/* Enhanced Results Section */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-white mb-8 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                Detection Results
              </h2>

              {result ? (
                <div className="space-y-8 animate-fade-in">
                  {/* Enhanced Main Result */}
                  <div className={`p-8 rounded-2xl bg-gradient-to-r ${getResultColor(result.result)} border backdrop-blur-lg`}>
                    <div className="flex items-center gap-4 mb-6">
                      {getResultIcon(result.result)}
                      <div>
                        <span className="text-3xl font-bold text-white block">{result.result}</span>
                        <span className="text-lg text-white/80">Detection Complete</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-white items-center">
                        <span className="text-lg font-medium">Confidence Level</span>
                        <span className="text-2xl font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={result.confidence * 100} className="h-4 bg-white/20" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${getResultGradient(result.result)} opacity-80 rounded-full`} 
                             style={{ width: `${result.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Time */}
                  <div className="flex items-center gap-3 text-slate-300 bg-white/5 p-4 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Processed in {result.processing_time.toFixed(2)}s</span>
                  </div>

                  {/* Enhanced Model Breakdown */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-purple-400" />
                      AI Model Analysis
                    </h3>
                    <div className="space-y-3">
                      {result.individual_results.map((modelResult, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                            <span className="text-slate-300 font-medium">{modelResult.model}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs bg-white/10 border-white/20">
                              Weight: {modelResult.weight}
                            </Badge>
                            <span className="text-white font-bold text-lg">
                              {(modelResult.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search Indication */}
                  {result.search_indication && (
                    <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="font-semibold text-yellow-200">Web Search Analysis</span>
                      </div>
                      <p className="text-yellow-100">{result.search_indication}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 animate-pulse">
                  <Brain className="w-20 h-20 mx-auto text-slate-400 mb-6" />
                  <p className="text-slate-400 text-xl">Upload an image to see detection results</p>
                  <p className="text-slate-500 mt-2">Automatic analysis will begin immediately</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Info Section */}
        <div className="mt-16">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 max-w-6xl mx-auto shadow-2xl">
            <CardContent className="p-10">
              <h3 className="text-3xl font-semibold text-white mb-8 text-center">How Our AI Detection Works</h3>
              <div className="grid md:grid-cols-3 gap-8 text-slate-300">
                <div className="text-center group hover:scale-105 transition-all duration-300">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/50">
                    <Upload className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="font-semibold mb-3 text-xl text-white">Instant Upload</h4>
                  <p className="text-base leading-relaxed">Drag & drop any image for immediate automatic analysis with real-time progress tracking</p>
                </div>
                <div className="text-center group hover:scale-105 transition-all duration-300">
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/50">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="font-semibold mb-3 text-xl text-white">Multi-Model AI</h4>
                  <p className="text-base leading-relaxed">6 specialized AI models analyze your image simultaneously for maximum accuracy</p>
                </div>
                <div className="text-center group hover:scale-105 transition-all duration-300">
                  <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-20 h-20 mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-green-500/50">
                    <TrendingUp className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="font-semibold mb-3 text-xl text-white">Detailed Results</h4>
                  <p className="text-base leading-relaxed">Get comprehensive analysis with confidence scores and model-by-model breakdown</p>
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
