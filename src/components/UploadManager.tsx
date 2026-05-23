import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';
import { User, ProcessingJob } from '../types';

interface UploadManagerProps {
  user: User | null;
  onUploadSuccess: (jobId: string, spoolId: string, fileName: string) => void;
  existingJobs: ProcessingJob[];
  isLicensed?: boolean;
}

export default function UploadManager({ user, onUploadSuccess, existingJobs, isLicensed = false }: UploadManagerProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);

  useEffect(() => {
    if (!activeJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const jobs: ProcessingJob[] = await res.json();
          const job = jobs.find(j => j.id === activeJobId);
          if (job) {
            setProcessingJob(job);
            
            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setTimeout(() => {
                onUploadSuccess(job.id, '', job.fileName);
                setActiveJobId(null);
                setProcessingJob(null);
              }, 2000);
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              const lastLog = job.logs[job.logs.length - 1] || 'Extraction failed.';
              setErrorMsg(`Extraction Failed: ${lastLog}`);
              setActiveJobId(null);
              setProcessingJob(null);
            }
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 800);

    return () => clearInterval(pollInterval);
  }, [activeJobId, onUploadSuccess]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);

    // Enforce license verification check
    if (!isLicensed) {
      setErrorMsg('Licensing Error: Sentinel hardware key validation has failed. Ingestion and data extraction are locked. Please register a valid device seat key in the "HW Fingerprint License" tab.');
      return;
    }

    // Module validation rules
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Validation Error: Security gateway only accepts standard vector PDF format drawings.');
      return;
    }

    if (file.size > 80 * 1024 * 1024) { // 80MB Limit
      setErrorMsg('Validation Error: File size exceeds the enterprise limit of 80MB.');
      return;
    }

    // Check duplicates
    const isDuplicate = existingJobs.some(j => j.fileName === file.name);
    if (isDuplicate) {
      if (!window.confirm(`Warning: A document with the name "${file.name}" is already indexed. Do you wish to override and re-run OCR?`)) {
        return;
      }
    }

    setUploadingFile(file);
    setUploadProgress(10);

    // Read file as base64 to allow Gemini OCR scanning if selected
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      
      // Simulate network upload progression
      let currentProgress = 10;
      const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressInterval);
        }
        setUploadProgress(Math.min(currentProgress, 99));
      }, 150);

      try {
        const response = await fetch('/api/drawings/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            base64Image: base64Data, // Expose binary stream for Gemini 3.5-flash
            userId: user?.id || 'guest-user'
          })
        });

        clearInterval(progressInterval);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setUploadProgress(100);
          setTimeout(() => {
            setUploadingFile(null);
            setUploadProgress(null);
            setActiveJobId(data.jobId);
          }, 600);
        } else {
          setErrorMsg(data.error || 'Server rejected drawing processing job.');
          setUploadingFile(null);
          setUploadProgress(null);
        }
      } catch (err) {
        clearInterval(progressInterval);
        setErrorMsg('Network anomaly: drawing transmission failed.');
        setUploadingFile(null);
        setUploadProgress(null);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Could not decode file locally prior to transmission.');
      setUploadingFile(null);
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-slate-100">
      
      <div>
        <h2 className="text-xl font-bold tracking-wide">Document Ingest Station</h2>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Upload bulk, large-format engineering drawings for multithread split segments & Hough transform skew alignment.
        </p>
      </div>

      <div className="w-full">
        
        {/* Module Drag Drop Portal */}
        <div className="space-y-4">
          {activeJobId ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 max-w-2xl mx-auto shadow-xl relative overflow-hidden">
              {/* Scanning laser glow header */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/50 animate-pulse" />
              
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {/* Blueprint icon with laser animation */}
                <div className="relative p-6 bg-slate-950 border border-slate-850 rounded-2xl text-slate-400 mb-2 shadow-inner overflow-hidden w-24 h-24 flex items-center justify-center">
                  <FileText className={`w-12 h-12 ${processingJob?.status === 'completed' ? 'text-green-500' : 'text-amber-500 animate-pulse'}`} />
                  
                  {/* Laser scan line overlay */}
                  {processingJob?.status !== 'completed' && (
                    <div className="absolute left-0 right-0 h-1 bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    {processingJob?.status === 'completed' ? (
                      <span className="text-green-400 flex items-center justify-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Spool Extraction Complete!</span>
                      </span>
                    ) : (
                      <span>Dynamic AI Page Analysis & OCR Extraction</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {processingJob ? `Processing: ${processingJob.fileName}` : 'Initializing pipeline...'}
                  </p>
                </div>
              </div>

              {/* Progress bar and metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Ingested Blueprint Pages</span>
                  <span>
                    {processingJob 
                      ? `${processingJob.processedPages} of ${processingJob.totalPages} pages aligned`
                      : 'Pending...'}
                  </span>
                </div>
                
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850/40 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      processingJob?.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${
                        processingJob && processingJob.totalPages > 0
                          ? Math.round((processingJob.processedPages / processingJob.totalPages) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Real-time console logs screen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Live AI Output Terminal</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-950 text-amber-500 font-mono animate-pulse">
                    • RUNNING
                  </span>
                </div>
                
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 h-44 overflow-y-auto font-mono text-[10px] text-slate-350 space-y-1.5 shadow-inner select-text scrollbar-thin">
                  {processingJob?.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-500/60 flex-shrink-0">➜</span>
                      <span className="leading-relaxed">{log}</span>
                    </div>
                  ))}
                  {/* Dummy auto-scroll anchor */}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                id="upload-drag-zone"
                onDragEnter={!isLicensed ? undefined : handleDrag}
                onDragOver={!isLicensed ? undefined : handleDrag}
                onDragLeave={!isLicensed ? undefined : handleDrag}
                onDrop={!isLicensed ? undefined : handleDrop}
                className={`relative min-h-[340px] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  !isLicensed
                    ? 'border-slate-805 bg-slate-900/10 cursor-not-allowed'
                    : isDragActive
                    ? 'border-amber-500 bg-amber-500/5 cursor-pointer'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer'
                }`}
                onClick={!isLicensed ? undefined : onButtonClick}
              >
                {!isLicensed ? (
                  <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                    <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-red-500 shadow-inner">
                      <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-red-400 tracking-wide uppercase">
                      Extraction Pipeline Locked
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      A cryptographically validated workstation license signature is required to run the PDF document analysis and automated spool extraction algorithms.
                    </p>
                    <div className="pt-2 text-xs font-mono text-slate-500">
                      Hardware Signature: <span className="text-slate-400 font-bold">HWID-C01AA-99827-DBFAC</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleChange}
                    />

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 mb-4 shadow-inner group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-10 h-10 text-amber-500" />
                    </div>

                    <h3 className="text-sm font-semibold text-white tracking-wide">
                      Drag & Drop Engineering PDF File
                    </h3>
                    
                    <p className="text-xs text-slate-400 max-w-sm mt-3 leading-relaxed">
                      Accepts single or multi-page drawings up to <span className="text-slate-300 font-semibold font-mono">80MB</span>. Supports vector-based structural, isometric pipelines, and client schematic sets.
                    </p>

                    <button
                      id="upload-browse-btn"
                      type="button"
                      className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-705 text-slate-200 text-xs font-semibold rounded-lg shadow transition-all cursor-pointer"
                    >
                      Browse Local Ledger
                    </button>
                  </>
                )}
              </div>

              {/* Upload loading/status indicator */}
              {uploadingFile && uploadProgress !== null && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-xs">
                      Transmitting: {uploadingFile.name}
                    </span>
                    <span className="text-xs font-bold text-amber-500 font-mono">
                      {uploadProgress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850/40">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                      <span>Transfering packets to processing ledger...</span>
                    </span>
                    <span>ASYNCHRONOUS SECURE CONNECTION</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
}
