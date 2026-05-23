import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  AlertTriangle,
  QrCode,
  Tag,
  Eye,
  Sliders,
  Compass,
  Layers,
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Spool, CADSymbol } from '../types';
import { mockBlueprints, generateDynamicBlueprint } from '../data/mockBlueprints';

interface CADViewerProps {
  spools: Spool[];
  initialSelectedSpool: Spool | null;
  user: any;
}

export default function CADViewer({ spools, initialSelectedSpool, user }: CADViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpool, setSelectedSpool] = useState<Spool | null>(null);
  
  // Viewer coordinates pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Custom Alignment/Rotation tweaks
  const [skewTweak, setSkewTweak] = useState(0);
  const [rotationTweak, setRotationTweak] = useState(0); // 0, 90, 180, 270

  // Symbols list inspected state
  const [inspectedSymbols, setInspectedSymbols] = useState<Record<string, boolean>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<CADSymbol | null>(null);

  // CAD Revision Comparison mode state
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareSlider, setCompareSlider] = useState<number>(50); // slider percent

  // Download processing notifier
  const [downloading, setDownloading] = useState<string | null>(null);

  // Focus bounding state
  const [highlightOcrArea, setHighlightOcrArea] = useState(true);

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Sync selection
  useEffect(() => {
    if (initialSelectedSpool) {
      setSelectedSpool(initialSelectedSpool);
      setSearchQuery(initialSelectedSpool.spoolNumber);
      
      // Auto-populate tweak state
      setSkewTweak(initialSelectedSpool.skewAngle);
      setRotationTweak(initialSelectedSpool.orientation);
    } else if (spools.length > 0) {
      setSelectedSpool(spools[0]);
      setSearchQuery(spools[0].spoolNumber);
      setSkewTweak(spools[0].skewAngle);
      setRotationTweak(spools[0].orientation);
    }
  }, [initialSelectedSpool, spools]);

  // Load blueprint details
  const getBlueprintDetails = () => {
    if (!selectedSpool) return null;
    const blueprint = mockBlueprints[selectedSpool.id];
    if (blueprint) return blueprint;
    
    // Auto-generate if query is an unindexed database entry
    return generateDynamicBlueprint(selectedSpool.spoolNumber, selectedSpool.pdfName, selectedSpool.id);
  };

  const currentBlueprint = getBlueprintDetails();

  // Search filter
  const matchingSpools = spools.filter(s =>
    s.spoolNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pdfName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const lowercaseVal = val.trim().toLowerCase();
    if (lowercaseVal) {
      const exactMatch = spools.find(s => 
        s.spoolNumber.toLowerCase() === lowercaseVal || 
        s.spoolNumber.toLowerCase().replace(/[-\s]/g, '') === lowercaseVal.replace(/[-\s]/g, '')
      );
      if (exactMatch) {
        setSelectedSpool(exactMatch);
        setSkewTweak(exactMatch.skewAngle);
        setRotationTweak(exactMatch.orientation);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSelectedSymbol(null);
      }
    }
  };

  const handleSelectSpool = (spool: Spool) => {
    setSelectedSpool(spool);
    setSearchQuery(spool.spoolNumber);
    setSkewTweak(spool.skewAngle);
    setRotationTweak(spool.orientation);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedSymbol(null);
  };

  // Drag Pan events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.min(Math.max(prev + factor, 0.5), 3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSkewTweak(selectedSpool?.skewAngle || 0);
    setRotationTweak(selectedSpool?.orientation || 0);
  };

  const toggleSymbolInspection = (symId: string) => {
    setInspectedSymbols(prev => ({
      ...prev,
      [symId]: !prev[symId]
    }));
  };

  const handleDownloadPage = (format: 'pdf' | 'png') => {
    if (!selectedSpool) return;
    const filename = `${selectedSpool.spoolNumber}.${format}`;
    setDownloading(filename);

    // Cryptographic signature delay simulation
    setTimeout(() => {
      setDownloading(null);
      // Generate actual download blob of current SVG CAD structure
      const svgElement = document.getElementById('cad-svg-element');
      if (svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 1500);
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* List Sidebar for quick lookup */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col flex-shrink-0 select-none">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">Spool Registrar index</span>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="cad-search-input"
              type="text"
              placeholder="Search Spool index number..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2 pl-9 pr-3 text-xs text-white font-mono placeholder-slate-600 transition-all outline-none"
            />
          </div>
        </div>

        {/* Results grid */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
          {matchingSpools.length > 0 ? (
            matchingSpools.map((spool) => {
              const isActive = selectedSpool?.id === spool.id;
              return (
                <button
                  key={spool.id}
                  id={`cad-item-select-${spool.id}`}
                  onClick={() => handleSelectSpool(spool)}
                  className={`w-full text-left p-3 rounded-lg flex items-start justify-between font-mono text-xs transition-all ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="space-y-1 truncate max-w-[190px]">
                    <div className="flex items-center space-x-2">
                      <Tag className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className={`font-semibold ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
                        {spool.spoolNumber}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-500 truncate" title={spool.pdfName}>
                      {spool.pdfName}
                    </span>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <span className="text-emerald-400 font-bold block">{spool.ocrConfidence}%</span>
                    <span className="text-[9px] text-slate-500">P.{spool.pageNumber}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs font-sans">
              No matching spools found in SQLite database index.
            </div>
          )}
        </div>
      </div>

      {/* Main Vector Drawing Stage Viewport */}
      {selectedSpool && currentBlueprint ? (
        <div className="flex-1 flex flex-col relative h-full">
          
          {/* Controls Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between select-none">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white tracking-wide">{selectedSpool.spoolNumber}</h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold">
                  VECTOR BLUEPRINT
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate max-w-lg">
                Specs: {selectedSpool.pipelineSpecs || 'NOT_DECLARED'} | Line Class: SCH-80S
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center space-x-2.5">
              {/* Highlight OCR Toggle */}
              <button
                id="cad-toggle-ocr-highlight"
                onClick={() => setHighlightOcrArea(!highlightOcrArea)}
                className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
                  highlightOcrArea
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Spool Bounding Highlighters"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>INDEX OVERLAYS</span>
              </button>

              {/* Revision Comparison slide Toggle */}
              <button
                id="cad-toggle-compare-mode"
                onClick={() => setCompareMode(!compareMode)}
                className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
                  compareMode
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Trigger Revision Comparisons"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>REVISION COMPARATOR</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-800" />

              {/* Downloads */}
              <button
                id="cad-download-pdf-btn"
                onClick={() => handleDownloadPage('pdf')}
                disabled={!!downloading}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title={`Download SVG/PDF document as ${selectedSpool.spoolNumber}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'GENERATING...' : `DL Drawing (${selectedSpool.spoolNumber})`}</span>
              </button>
            </div>
          </div>

          {/* Canvas Stage Viewport container */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col md:flex-row">
            
            {/* The SVG element canvas render */}
            <div
              ref={viewerContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`flex-1 h-full select-none outline-none relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ backgroundColor: '#040d1a' }} // Cadet classic isometric blueprints background tint
            >
              <svg
                id="cad-svg-element"
                className="w-full h-full transition-transform duration-75 origin-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotationTweak}deg) skewX(${skewTweak}deg)`
                }}
                viewBox="0 0 800 500"
              >
                {/* Tech Blueprint Grid mesh */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#102a45" strokeWidth="0.5" strokeOpacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Revision comparator visual slider overlay */}
                {compareMode && (
                  <g opacity="0.35">
                    {/* Secondary pipeline to represent dynamic updates */}
                    <path
                      d="M 120 150 L 320 150 L 320 370 L 580 370"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                    <text x="325" y="365" fill="#ef4444" fontSize="9" fontFamily="monospace">REV.A4 PROPOSED REDIRECTION</text>
                  </g>
                )}

                {/* Primary Pipe Line Vector rendering */}
                <path
                  id="cyan-pipe-contour"
                  d={currentBlueprint.pipePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Pipe center line representing high precision CAD layout */}
                <path
                  d={currentBlueprint.pipePath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeDasharray="4,6"
                />

                {/* Piping Welding nodes, valves, and fittings SVG mapping */}
                {currentBlueprint.symbols.map((sym) => {
                  const isSInspected = inspectedSymbols[sym.id] ?? sym.isInspected;
                  const isSelected = selectedSymbol?.id === sym.id;
                  
                  return (
                    <g
                      key={sym.id}
                      transform={`translate(${sym.x}, ${sym.y})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSymbol(sym);
                      }}
                    >
                      {/* Interactive click trigger */}
                      <circle r="15" fill="transparent" />

                      {sym.type === 'valve' && (
                        <g>
                          <path
                            d="M -10 -8 L 10 8 L 10 -8 L -10 8 Z"
                            fill={isSelected ? '#f59e0b' : '#38bdf8'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <circle r="3.5" fill="#ffffff" />
                        </g>
                      )}

                      {sym.type === 'flange' && (
                        <g>
                          <rect x="-3" y="-10" width="6" height="20" fill={isSelected ? '#f59e0b' : '#94a3b8'} stroke="#ffffff" strokeWidth="1" />
                        </g>
                      )}

                      {sym.type === 'weld' && (
                        <g>
                          <circle r="5.5" fill={isSInspected ? '#10b981' : '#f59e0b'} stroke="#ffffff" strokeWidth="1" />
                          <text y="-8" fontSize="8" fill="#ffffff" textAnchor="middle" fontFamily="monospace">W</text>
                        </g>
                      )}

                      {sym.type === 'pump' && (
                        <g>
                          <circle r="10" fill={isSelected ? '#f59e0b' : '#38bdf8'} stroke="#ffffff" strokeWidth="1.5" />
                          <polygon points="-4,-4 6,0 -4,4" fill="#040d1a" />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* OCR & Spool Number Highlights Bounding Anchor overlay */}
                {highlightOcrArea && (
                  <>
                    {/* Default single bounding box fallback for standard spools */}
                    {!currentBlueprint.spoolLocations && (
                      <g transform={`translate(${selectedSpool.boundingBox.x}, ${selectedSpool.boundingBox.y})`}>
                        <rect
                          x="0"
                          y="0"
                          width={selectedSpool.boundingBox.width}
                          height={selectedSpool.boundingBox.height}
                          fill="rgba(245, 158, 11, 0.12)"
                          stroke="#f59e0b"
                          strokeWidth="1.8"
                          strokeDasharray="4,2"
                          className="animate-pulse"
                        />
                        <text x="4" y="-5" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          OCR DETECTED: {selectedSpool.spoolNumber} ({selectedSpool.ocrConfidence}% CONF)
                        </text>
                        <path d="M 0 0 L 0 -12" stroke="#f59e0b" strokeWidth="1" />
                      </g>
                    )}

                    {/* Glowing highlight markers targeting the 3 locations for spool-04 */}
                    {currentBlueprint.spoolLocations && currentBlueprint.spoolLocations.map((loc) => (
                      <g key={loc.id} className="transition-all duration-300">
                        {/* Pulse glow background */}
                        <rect
                          x={loc.x - 3}
                          y={loc.y - 3}
                          width={loc.width + 6}
                          height={loc.height + 6}
                          fill="rgba(239, 68, 68, 0.08)"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeDasharray="4,3"
                          className="animate-pulse"
                        />
                        {/* Label flag overlay */}
                        <g transform={`translate(${loc.x}, ${loc.y - 14})`}>
                          <rect
                            width="98"
                            height="11"
                            fill="#ef4444"
                            rx="2"
                          />
                          <text x="5" y="8" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">
                            LOCATED: SPOOL REF
                          </text>
                        </g>
                        {/* Tiny target crosshair circle */}
                        <circle cx={loc.x} cy={loc.y} r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                      </g>
                    ))}
                  </>
                )}

                {/* Custom Isometric Annotations & Red Stamps targeting sample drawing spool-04 */}
                {selectedSpool.id === 'spool-04' && (
                  <>
                    {/* Dimension annotation: 2838 handwritten with crossed-out 2500 */}
                    <g transform="translate(230, 240)">
                      <text x="0" y="22" fill="#ef4444" fontSize="11" fontFamily="monospace" textAnchor="middle" opacity="0.8">
                        2500
                      </text>
                      <line x1="-16" y1="18" x2="16" y2="18" stroke="#ef4444" strokeWidth="2.2" />

                      <text x="-6" y="5" fill="#ef4444" fontSize="18" fontFamily="cursive" fontWeight="bold" transform="rotate(-15)" textAnchor="middle">
                        2838
                      </text>
                      
                      <text x="140" y="-85" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        6" NS
                      </text>
                    </g>

                    {/* Stamp location 1: RED MARKUP approval stamp */}
                    <g transform="translate(360, 255)">
                      <rect x="0" y="0" width="130" height="52" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="3,1" rx="4" />
                      <rect x="2" y="2" width="126" height="48" fill="rgba(239, 68, 68, 0.05)" stroke="#ef4444" strokeWidth="1.2" rx="3" />
                      <text x="65" y="15" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="extrabold" textAnchor="middle" letterSpacing="0.05em">
                        RED MARKUP
                      </text>
                      <text x="65" y="26" fill="#ef4444" fontSize="7" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                        EMARAT ALOULA IND.
                      </text>
                      <text x="65" y="42" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        APPROVED QC - 25/02
                      </text>
                      {/* Stylized realistic handwritten signature ink line pattern */}
                      <path
                        d="M 12 30 C 22 18, 38 48, 55 12 T 96 35 T 120 28"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </g>

                    {/* Stamp location 2: CONTROLLED COPY margin banner */}
                    <g transform="translate(775, 230) rotate(-90)">
                      <rect x="-10" y="-10" width="150" height="24" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" strokeWidth="2" />
                      <text x="65" y="6" fill="#ef4444" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" letterSpacing="0.08em">
                        CONTROLLED COPY
                      </text>
                    </g>
                  </>
                )}

                {/* QR Code / Spool Locations Rendering Section */}
                {selectedSpool.id !== 'spool-04' ? (
                  <g transform="translate(680, 50)">
                    <rect x="0" y="0" width="70" height="70" fill="#040d1a" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Mock barcode structure vectors */}
                    <rect x="8" y="8" width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="12" y="12" width="8" height="8" fill="#38bdf8" />
                    <rect x="46" y="8" width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="50" y="12" width="8" height="8" fill="#38bdf8" />
                    <rect x="8" y="46" width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="12" y="50" width="8" height="8" fill="#38bdf8" />
                    
                    {/* barcode pixels */}
                    <rect x="30" y="22" width="6" height="6" fill="#38bdf8" />
                    <rect x="38" y="30" width="6" height="6" fill="#38bdf8" />
                    <rect x="46" y="46" width="10" height="10" fill="#38bdf8" />

                    <text x="35" y="85" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">QR MATRIX</text>
                  </g>
                ) : (
                  <>
                    {/* Location 1: EAI SPOOL No Table Header rendering on top-right */}
                    <g transform="translate(605, 125)">
                      <rect width="145" height="24" fill="#030c17" stroke="#102b4c" strokeWidth="1" />
                      <text x="6" y="10" fill="#a1a1aa" fontSize="7" fontFamily="monospace">EAI SPOOL No.</text>
                      <text x="6" y="20" fill="#f59e0b" fontSize="8.5" fontFamily="monospace" fontWeight="bold">260015-60-010990</text>
                    </g>
                    
                    {/* Location 2: Bottom-right QR code and printed text (at x=671, y=311) */}
                    <g transform="translate(671, 311)">
                      <rect width="92" height="85" fill="#030c17" stroke="#ef4444" strokeWidth="1.5" />
                      {/* Barcode details in Red matching the image */}
                      <g transform="translate(18, 12)" stroke="#ef4444" strokeWidth="1" strokeLinecap="square">
                        <line x1="0" y1="0" x2="0" y2="35" strokeWidth="3" />
                        <line x1="6" y1="0" x2="6" y2="35" strokeWidth="1" />
                        <line x1="12" y1="0" x2="12" y2="35" strokeWidth="4" />
                        <line x1="20" y1="0" x2="20" y2="35" strokeWidth="1.5" />
                        <line x1="26" y1="0" x2="26" y2="35" strokeWidth="3" />
                        <line x1="32" y1="0" x2="32" y2="35" strokeWidth="1" />
                        <line x1="42" y1="0" x2="42" y2="35" strokeWidth="4.5" />
                        <line x1="52" y1="0" x2="52" y2="35" strokeWidth="2" />
                      </g>
                      {/* Spool number matching Location 2 */}
                      <text x="46" y="74" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                        260015-60-010990
                      </text>
                    </g>

                    {/* Location 3: Bottom-right Title Reference above the frame */}
                    <g transform="translate(540, 442)">
                      <rect width="220" height="16" fill="#030c17" stroke="#102b4c" strokeWidth="1" />
                      <text x="8" y="11" fill="#fecaca" fontSize="7" fontFamily="monospace" fontWeight="semibold">
                        SPOOLED ISO No. Ref: 260015-60-010990
                      </text>
                    </g>
                  </>
                )}

                {/* Classic Title Block of standard engineering formats bottom right orientation */}
                <g id="title-block-drawing-frame" transform="translate(460, 360)">
                  <rect x="0" y="0" width="310" height="110" fill="#030c17" stroke="#102b4c" strokeWidth="2" />
                  
                  {/* Dividing lines */}
                  <line x1="0" y1="30" x2="310" y2="30" stroke="#102b4c" strokeWidth="1" />
                  <line x1="0" y1="65" x2="310" y2="65" stroke="#102b4c" strokeWidth="1" />
                  <line x1="160" y1="30" x2="160" y2="110" stroke="#102b4c" strokeWidth="1" />

                  {/* Title Block contents */}
                  <text x="12" y="18" fill="#526f91" fontSize="8" fontFamily="monospace" fontWeight="bold">CLIENT:</text>
                  <text x="60" y="19" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.05em" className="uppercase">
                    {currentBlueprint.titleBlock.client}
                  </text>

                  <text x="12" y="44" fill="#526f91" fontSize="8" fontFamily="monospace">PROJECT SYSTEM DESIGN:</text>
                  <text x="12" y="56" fill="#ffffff" fontSize="9" fontFamily="sans-serif" fontWeight="semibold" className="uppercase">
                    {currentBlueprint.titleBlock.project}
                  </text>

                  <text x="12" y="78" fill="#526f91" fontSize="8" fontFamily="monospace">DRAWING NO:</text>
                  <text x="12" y="94" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {currentBlueprint.titleBlock.drawingNo}
                  </text>

                  <text x="172" y="42" fill="#526f91" fontSize="8" fontFamily="monospace">REVISION NO:</text>
                  <text x="172" y="56" fill="#f59e0b" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {currentBlueprint.titleBlock.revision}
                  </text>

                  <text x="172" y="78" fill="#526f91" fontSize="8" fontFamily="monospace">ALIGNMENT DATE:</text>
                  <text x="172" y="93" fill="#ffffff" fontSize="9" fontFamily="monospace">
                    {currentBlueprint.titleBlock.date}
                  </text>
                  
                  <text x="260" y="78" fill="#526f91" fontSize="8" fontFamily="monospace">REV BY:</text>
                  <text x="260" y="93" fill="#ffffff" fontSize="9" fontFamily="monospace">
                    AI REG
                  </text>
                </g>

                {/* Orientation Compass widget layout */}
                <g transform="translate(60, 440)" opacity="0.65">
                  <circle r="25" fill="#030c17" stroke="#102b4c" strokeWidth="1.5" />
                  <line x1="0" y1="-22" x2="0" y2="22" stroke="#102b4c" strokeWidth="1" />
                  <line x1="-22" y1="0" x2="22" y2="0" stroke="#102b4c" strokeWidth="1" />
                  <polygon points="0,-22 -4,-8 4,-8" fill="#38bdf8" />
                  <text x="0" y="-26" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">N</text>
                </g>
              </svg>

              {/* Float view tools floating widget overlay absolute to container */}
              <div className="absolute bottom-5 left-5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center space-x-2 shadow-2xl z-20">
                <button
                  id="cad-zoom-in-btn"
                  onClick={() => handleZoom(0.12)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  id="cad-zoom-out-btn"
                  onClick={() => handleZoom(-0.12)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-800" />
                <button
                  id="cad-zoom-reset-btn"
                  onClick={handleReset}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                  title="Reset Stage coordinates"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-[10px] font-mono leading-none">RESET</span>
                </button>
              </div>

              {/* Float skew/alignment fine tuning sliders absolute right */}
              <div className="absolute right-5 bottom-5 bg-slate-900/95 border border-slate-800 p-4 rounded-xl shadow-2xl max-w-xs w-64 space-y-4 select-none z-20">
                <div className="flex items-center space-x-2 text-amber-500 font-mono text-xs font-semibold uppercase">
                  <Compass className="w-4 h-4" />
                  <span>Manual Alignment Fine Tweak</span>
                </div>
                
                {/* 90-deg step togglers represent auto rotations orientation */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Step Auto Rotation orientation</span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold font-bold">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        id={`cad-rotation-deg-${deg}`}
                        onClick={() => setRotationTweak(deg)}
                        className={`py-1 rounded border cursor-pointer ${
                          rotationTweak === deg
                            ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine skew slider mapping */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span>FINE SKEW ANGLE TILT</span>
                    <span className="text-amber-500 font-semibold">{skewTweak.toFixed(1)}°</span>
                  </div>
                  <input
                    id="cad-skew-slider"
                    type="range"
                    min="-8"
                    max="8"
                    step="0.1"
                    value={skewTweak}
                    onChange={(e) => setSkewTweak(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Symbols checking Inspector Side Panel */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between select-none">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 font-mono text-[10px] font-bold text-slate-500 uppercase">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Piping Symbol Inspector</span>
                </div>

                {selectedSymbol ? (
                  <div className="bg-slate-950/80 rounded-lg p-3.5 border border-slate-800/80 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {selectedSymbol.type} Fitting
                      </span>
                      <button
                        id="cad-ins-panel-close"
                        onClick={() => setSelectedSymbol(null)}
                        className="text-slate-500 hover:text-white font-mono text-[10px]"
                      >
                        [ESC]
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="font-semibold text-white">{selectedSymbol.spec || 'Standard ISO fitting'}</p>
                      
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/60">
                        <span>COORDINATES x/y</span>
                        <span>{selectedSymbol.x}, {selectedSymbol.y} CAD</span>
                      </div>
                    </div>

                    <label className="flex items-center space-x-2.5 pt-2 cursor-pointer text-xs select-none">
                      <input
                        id="cad-ins-panel-val-inspected"
                        type="checkbox"
                        checked={inspectedSymbols[selectedSymbol.id] ?? selectedSymbol.isInspected}
                        onChange={() => toggleSymbolInspection(selectedSymbol.id)}
                        className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-300">Marked as QA Inspected</span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 rounded-lg p-4 text-center border border-dashed border-slate-800 text-xs text-slate-500 leading-relaxed">
                    Click any drawing fitting (valves, welds, flanges) on the left canvas schema to inspect component metadata and toggle QA inspection checklist status.
                  </div>
                )}

                {/* Spool Number Occurrences Locator Portal (3 places) */}
                {currentBlueprint.spoolLocations && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1.5" />
                      OCR Spool Identifiers ({currentBlueprint.spoolLocations.length} Locations)
                    </span>
                    
                    <div className="space-y-2">
                      {currentBlueprint.spoolLocations.map((loc) => (
                        <div
                          key={loc.id}
                          onClick={() => {
                            // High precision viewport alignment formula:
                            setZoom(1.35);
                            setPan({
                              x: Math.round(400 - loc.x * 1.35),
                              y: Math.round(250 - loc.y * 1.35)
                            });
                          }}
                          className="bg-slate-950/70 hover:bg-slate-950 text-left border border-slate-800 hover:border-amber-500/40 rounded-lg p-2.5 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-slate-200 font-bold group-hover:text-amber-400 transition-colors uppercase">{loc.label}</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">99.9% Match</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">
                            {loc.description}
                          </p>
                          <div className="text-[9px] text-slate-500 mt-1.5 flex justify-between items-center font-mono">
                            <span>GRID: X:{loc.x} / Y:{loc.y}</span>
                            <span className="text-amber-500/75 opacity-0 group-hover:opacity-100 transition-all duration-200">Auto Focus &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CAD statistics metrics */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">SHEET CONTENTS REPORT</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60 font-mono">
                      <span className="text-xl text-white font-semibold block">{currentBlueprint.symbols.filter(s => s.type === 'valve').length}</span>
                      <span className="text-[9px] text-slate-500 uppercase">VALVES FOUND</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60 font-mono">
                      <span className="text-xl text-white font-semibold block">{currentBlueprint.symbols.filter(s => s.type === 'weld').length}</span>
                      <span className="text-[9px] text-slate-500 uppercase">WELDS IDENTIFIED</span>
                    </div>
                  </div>
                </div>
              </div>

              {compareMode && (
                <div className="p-3 bg-emerald-950/20 border-l-2 border-emerald-500 rounded-r text-xs text-slate-300 leading-relaxed font-sans space-y-1 mt-4">
                  <span className="font-bold text-emerald-400 font-mono block uppercase text-[10px]">REVISION COMPARATOR PORTAL</span>
                  <p>Comparing baseline <span className="font-semibold text-white">Rev A3</span> vs proposed network <span className="font-semibold text-white">Rev A4</span> overlay logic. Pipeline rerouting discrepancies are flagged red in viewer.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-sans">
          Select or search an extracted spool drawing spool element from the left registrar index checklist.
        </div>
      )}

    </div>
  );
}
