/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ChevronRight,
  AlertCircle,
  Terminal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { DrawingWithBom } from '../types';

interface UploadViewProps {
  onUploadSuccess: (drawings: DrawingWithBom[]) => void;
}

export default function UploadView({ onUploadSuccess }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [extractedResult, setExtractedResult] = useState<DrawingWithBom[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      addLog(`Validation failed: ${file.name} is not a valid PDF file.`);
      return false;
    }
    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      addLog(`Validation failed: ${file.name} exceeds 500MB storage limit.`);
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = Array.from(e.dataTransfer.files);
      const validFiles = selected.filter(validateFile);
      if (validFiles.length > 0) {
        setFiles(validFiles);
        addLog(`Added ${validFiles.length} file(s) to processing queue.`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = Array.from(e.target.files);
      const validFiles = selected.filter(validateFile);
      if (validFiles.length > 0) {
        setFiles(validFiles);
        addLog(`Added ${validFiles.length} file(s) to processing queue.`);
      }
    }
  };

  const clearQueue = () => {
    setFiles([]);
    setUploadState('idle');
    setLogs([]);
    setProgress(0);
    setErrorMessage('');
    setExtractedResult([]);
  };

  const startExtraction = async () => {
    if (files.length === 0) return;

    setUploadState('uploading');
    setProgress(15);
    setLogs([]);
    addLog(`Initiating raw packet transfer for ${files[0].name} (${(files[0].size / (1024 * 1024)).toFixed(2)} MB)...`);

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      // Step 1: Upload and trigger parsing
      addLog(`Sending engineering PDF to multi-page REST upload handler...`);
      setProgress(35);
      
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `HTTP error ${response.status}`);
      }

      setUploadState('processing');
      setProgress(60);
      addLog(`Server file received. Page-by-page tabular parsing text extracts loaded.`);
      addLog(`Feeding unstructured visual nodes to Gemini-3.5-Flash OCR engine...`);

      const resData = await response.json();
      
      setProgress(85);
      const drawings: DrawingWithBom[] = resData.drawings || [];

      // Log the structured page outputs
      drawings.forEach((dwg) => {
        addLog(`Page ${dwg.pageNo} compiled! Identified: [${dwg.drawingType}] Title: "${dwg.drawingTitle || 'N/A'}" | Drawing No: "${dwg.companyDrawingNo || 'N/A'}"`);
        addLog(`-> Page ${dwg.pageNo} BOM: Loaded ${dwg.billOfMaterial?.length || 0} tabular physical component entries with ${(dwg.confidenceScore)}% accuracy score.`);
      });

      setProgress(100);
      setUploadState('success');
      setExtractedResult(drawings);
      addLog(`Successful completion of multi-page engineering drawing processing loop.`);
      
      // Notify parent to fetch new stats/drawings lists
      onUploadSuccess(drawings);

    } catch (error: any) {
      console.error(error);
      setUploadState('error');
      setErrorMessage(error.message || 'System error while uploading / analyzing.');
      addLog(`Pipeline Aborted: ${error.message || 'Verification / parsing error.'}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Title */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
          PDF Document Injection
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload multi-page CAD blueprints or shop drawings in PDF. The system will slice pages, extract formal titleblock keys, and build a digital material log automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Drag And Drop Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-4 shadow-inner">
              <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
            </div>

            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
              Drag & Drop PDF Drawing File
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5 leading-normal">
              Only standard schema drawings in PDF are supported (Max size <span className="font-semibold text-slate-500">500MB</span>).
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Select drawing file
            </button>
          </div>

          {/* Queue Listing */}
          {files.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 border border-slate-100 bg-blue-50/30 text-blue-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 tracking-tight max-w-[250px] md:max-w-md truncate">
                    {files[0].name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Size: {(files[0].size / (1024 * 1024)).toFixed(2)} MB • Ready
                  </p>
                </div>
              </div>

              {uploadState === 'idle' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearQueue}
                    className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 font-semibold transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                  <button
                    onClick={startExtraction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Start Extraction</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress / Status Block */}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-700 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <span>
                    {uploadState === 'uploading' ? 'Sending files to parser...' : 'Analyzing drawings with Gemini OCR...'}
                  </span>
                </span>
                <span className="font-mono text-blue-600 font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Summary block */}
          {uploadState === 'success' && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    Extraction Completed
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    The document has been successfully processed! Metadata was identified, and BOM rows were parsed. Review the catalog below or open the dashboard.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700 pt-1">
                <div className="bg-white px-2.5 py-1 border border-emerald-100 rounded-md">
                  Pages processed: <span className="font-mono font-bold text-emerald-600">{extractedResult.length}</span>
                </div>
                <div className="bg-white px-2.5 py-1 border border-emerald-100 rounded-md">
                  Total BOM items added: <span className="font-mono font-bold text-emerald-600">
                    {extractedResult.reduce((sum, d) => sum + d.billOfMaterial.length, 0)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearQueue}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Upload Another PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Error card */}
          {uploadState === 'error' && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    Extraction Pipeline Halted
                  </h4>
                  <p className="text-xs text-red-700 mt-1 leading-normal">
                    {errorMessage || 'Verification and OCR parsing failed. Please verify that the file is not corrupted and is an engineering drawing PDF.'}
                  </p>
                </div>
              </div>
              <button
                onClick={clearQueue}
                className="bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                Reset upload session
              </button>
            </div>
          )}
        </div>

        {/* Right Processing Logs Terminal Block */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[400px]">
          {/* Terminal Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-blue-400" />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">
                Pipeline Logs Terminal
              </span>
            </div>
            <div className="flex space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500/80" />
              <span className="h-2 w-2 rounded-full bg-amber-500/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-400 overflow-y-auto space-y-2 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center space-y-2">
                <Terminal className="h-8 w-8 text-slate-800" />
                <span>Upload a PDF drawing to begin pipeline extraction logs tracking.</span>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-800/40 pb-1.5 last:border-0">
                  <span className={`${
                    log.includes('compiled') || log.includes('successful') 
                      ? 'text-emerald-400' 
                      : log.includes('Aborted') || log.includes('failed')
                      ? 'text-red-400'
                      : log.includes('Gemini')
                      ? 'text-blue-400'
                      : 'text-slate-300'
                  }`}>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
