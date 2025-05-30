
import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Clock, Brain, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
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

  const detectImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsDetecting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8002/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data: DetectionResult = await response.json();
      setResult(data);
      toast.success('Detection completed!');
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to detect image. Make sure your backend is running on localhost:8002');
    } finally {
      setIsDetecting(false);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'AI-generated':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'Real':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getResultColor = (result: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            AI Image Detector
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Advanced detection system using multiple AI models to identify artificially generated images
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Upload Image
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-400/10'
                    : 'border-white/30 hover:border-white/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <p className="text-slate-300">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="w-16 h-16 mx-auto text-slate-400" />
                    <div>
                      <p className="text-white text-lg mb-2">Drop your image here</p>
                      <p className="text-slate-400">or click to browse</p>
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

              <Button
                onClick={detectImage}
                disabled={!selectedFile || isDetecting}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                {isDetecting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Detect Image
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Detection Results
              </h2>

              {result ? (
                <div className="space-y-6">
                  {/* Main Result */}
                  <div className={`p-6 rounded-lg bg-gradient-to-r ${getResultColor(result.result)} bg-opacity-20 border border-white/20`}>
                    <div className="flex items-center gap-3 mb-4">
                      {getResultIcon(result.result)}
                      <span className="text-2xl font-bold text-white">{result.result}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-white">
                        <span>Confidence</span>
                        <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.confidence * 100} className="h-2" />
                    </div>
                  </div>

                  {/* Processing Time */}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>Processed in {result.processing_time.toFixed(2)}s</span>
                  </div>

                  {/* Individual Model Results */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Model Breakdown</h3>
                    <div className="space-y-2">
                      {result.individual_results.map((modelResult, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-slate-300 text-sm">{modelResult.model}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Weight: {modelResult.weight}
                            </Badge>
                            <span className="text-white font-medium">
                              {(modelResult.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search Indication */}
                  {result.search_indication && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-200">
                        <strong>Web Search:</strong> {result.search_indication}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-400">Upload an image to see detection results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 max-w-4xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6 text-slate-300">
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <h4 className="font-semibold mb-2">Upload</h4>
                  <p className="text-sm">Upload any image you want to analyze</p>
                </div>
                <div>
                  <Brain className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <h4 className="font-semibold mb-2">Analyze</h4>
                  <p className="text-sm">Multiple AI models analyze the image</p>
                </div>
                <div>
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <h4 className="font-semibold mb-2">Results</h4>
                  <p className="text-sm">Get detailed detection results with confidence scores</p>
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
