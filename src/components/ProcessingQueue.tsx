import React from 'react';
import { Cpu, CheckCircle2, Loader2, AlertCircle, FileCode, Clock, RefreshCw } from 'lucide-react';
import { ProcessingJob } from '../types';

interface ProcessingQueueProps {
  jobs: ProcessingJob[];
  onRefresh: () => void;
}

export default function ProcessingQueue({ jobs, onRefresh }: ProcessingQueueProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'uploaded': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'uploaded': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-slate-100">
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold tracking-wide">Digital Processing Pipeline Queue</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Examine background GPU-threads responsible for high-resolution splits, skew detection, PaddleOCR, and SQL indexing.
          </p>
        </div>

        <button
          id="queue-refresh-btn"
          onClick={onRefresh}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RELOAD QUEUES</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Jobs Listing */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-xs font-mono tracking-widest font-bold text-slate-500 uppercase">ACTIVE & PREVIOUS JOBS</h3>
          
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4"
              >
                {/* Job metadata header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg">
                      <FileCode className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white max-w-sm truncate">{job.fileName}</h4>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 mt-0.5">
                        <span>SIZE: {job.fileSize}</span>
                        <span>•</span>
                        <span>ID: {job.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span>{job.status}</span>
                  </div>
                </div>

                {/* Processing Steps indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  
                  {/* Step 1: Upload / Convert */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      job.status !== 'uploaded' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`} />
                    <div className="text-[10px]">
                      <span className="block text-slate-500 font-mono">STEP 1</span>
                      <span className="font-semibold text-slate-300">Convert Bitmaps</span>
                    </div>
                  </div>

                  {/* Step 2: Grayscale & Hough */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      job.status === 'completed' || job.status === 'ocr_qr' || job.status === 'indexing'
                        ? 'bg-emerald-500'
                        : job.status === 'aligning' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
                    }`} />
                    <div className="text-[10px]">
                      <span className="block text-slate-500 font-mono">STEP 2</span>
                      <span className="font-semibold text-slate-300">Hough Alignment</span>
                    </div>
                  </div>

                  {/* Step 3: OCR Neural Scan */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      job.status === 'completed' || job.status === 'indexing'
                        ? 'bg-emerald-500'
                        : job.status === 'ocr_qr' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
                    }`} />
                    <div className="text-[10px]">
                      <span className="block text-slate-500 font-mono">STEP 3</span>
                      <span className="font-semibold text-slate-300">PaddleOCR Scan</span>
                    </div>
                  </div>

                  {/* Step 4: Ledger Indexing */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      job.status === 'completed' ? 'bg-emerald-500' : job.status === 'indexing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
                    }`} />
                    <div className="text-[10px]">
                      <span className="block text-slate-500 font-mono">STEP 4</span>
                      <span className="font-semibold text-slate-300">SQL Database</span>
                    </div>
                  </div>

                </div>

                {/* Progress bar info */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>PROGRESS CHANNELS: {job.processedPages} / {job.totalPages} DRAWINGS COMPLETED</span>
                    <span>{job.status === 'completed' ? '100%' : 'PIPELINE ACTIVE'}</span>
                  </div>
                  <div className="bg-slate-950 h-1.5 rounded-full overflow-hidden w-full">
                    <div
                      className={`h-full rounded-full ${job.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${(job.processedPages / job.totalPages) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Console Output Logs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold">Live Microservice Console logs</span>
                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 h-32 overflow-y-auto space-y-1 select-text scrollbar-thin">
                    {job.logs.map((logLine, index) => (
                      <p key={index} className={logLine.startsWith('[FATAL') ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {logLine}
                      </p>
                    ))}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-sans">
              No active drawing processing logs found. Ingest a document file to track processing lifecycle steps here.
            </div>
          )}
        </div>

        {/* Core diagnostics info panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400">
              <Cpu className="w-4.5 h-4.5 animate-pulse" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Pipeline Health Diagnostics</h3>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>GPU Worker node</span>
                <span className="text-emerald-400 font-semibold">ONLINE (CUDA-12)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>OCR Success Ratio</span>
                <span className="text-white font-semibold">98.5%</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Average Slices Per Sec</span>
                <span className="text-white">12 sheets/min</span>
              </div>
              <div className="flex justify-between">
                <span>Redis Worker status</span>
                <span className="text-emerald-400 font-semibold">STANDBY</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs text-slate-400 leading-relaxed">
            <span className="text-[10px] uppercase font-mono text-slate-500 block font-bold">Failed page recovery rules</span>
            <p>
              When a document page scans below <span className="font-semibold text-amber-500 font-mono">85% OCR confidence</span>, the system generates a ticket in <span className="text-slate-200">Admin Audit & Overrides</span>, allowing the lead engineer to type a custom tag without losing drawing metadata.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
