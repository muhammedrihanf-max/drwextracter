import React, { useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Cpu,
  Monitor,
  CheckCircle2,
  Lock,
  PlusCircle,
  HelpCircle,
  RefreshCw,
  Ban,
  Fingerprint
} from 'lucide-react';
import { License, User } from '../types';

interface LicenseManagerProps {
  licenses: License[];
  isLicensed: boolean;
  activeHwid: string;
  onActivateLicense: (key: string) => Promise<boolean>;
  onGenerateLicense: (customer: string, seats: number, expiry: string) => void;
  onToggleLicense: (key: string) => void;
  user: User | null;
}

export default function LicenseManager({
  licenses,
  isLicensed,
  activeHwid,
  onActivateLicense,
  onGenerateLicense,
  onToggleLicense,
  user
}: LicenseManagerProps) {
  // Key Input activation
  const [activationKey, setActivationKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Key creation inputs
  const [customerName, setCustomerName] = useState('');
  const [deviceLimit, setDeviceLimit] = useState(3);
  const [expiryDate, setExpiryDate] = useState('2028-12-31');

  // Simulated Hardware info
  const hwParameters = {
    cpuId: 'Intel(R) Xeon(R) Gold 6154 CPU @ 3.00GHz (Cores: 8)',
    diskSerial: 'NVME_SAMSUNG_SSD_980_PRO_2TB_SK99281A',
    motherboardSerial: 'ASUSTEK_WS_C621_SAGE_REVA1_0882199',
    macAddress: 'BC:24:11:AA:FF:CC'
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey) return;
    setActivating(true);
    setActivationMsg(null);

    const success = await onActivateLicense(activationKey.trim());
    setActivating(false);
    
    if (success) {
      setActivationMsg({
        text: 'Security Key Verified! This workstation has been locked and activated.',
        success: true
      });
      setActivationKey('');
    } else {
      setActivationMsg({
        text: 'Verification Error: Invalid license signature, seat limit exceeded, or key disabled.',
        success: false
      });
    }
  };

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;
    onGenerateLicense(customerName, deviceLimit, expiryDate);
    setCustomerName('');
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-slate-100">
      
      <div>
        <h2 className="text-xl font-bold tracking-wide">Workstation Sentinel & Cryptography</h2>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Generate corporate drawing keys, query local hardware motherboard characteristics, or secure device seats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Area A: Device Hardware Signature sensor reader */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-500">
              <Fingerprint className="w-5 h-5 animate-pulse" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Local Hardware Fingerprint</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              To prevent software piracy and industrial leaks, drawing extraction models lock to physical CPU matrices. Security credentials will decrypt if motherboard variables align.
            </p>

            <div className="space-y-3 pt-2 font-mono text-[11px] text-slate-400">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-600 block">CPU IDENTIFIER</span>
                <span className="text-slate-300 font-semibold">{hwParameters.cpuId}</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-600 block">DISK STORAGE SERIAL</span>
                <span className="text-slate-300 font-semibold">{hwParameters.diskSerial}</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-600 block">MOTHERBOARD SERIAL BUS</span>
                <span className="text-slate-200 font-semibold">{hwParameters.motherboardSerial}</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-600 block">HOST MAC ADDRESS</span>
                <span className="text-emerald-400 font-bold">{hwParameters.macAddress}</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-600 block">GENERATED HARDWARE HWID SIGNATURE</span>
                <span className="text-amber-500 font-bold">{activeHwid}</span>
              </div>
            </div>
          </div>

          {/* Support / Contact Us Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
            <div className="flex items-center space-x-2.5 text-amber-500">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Support & Licensing</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              For system inquiries, customized enterprise deployment seats, or key regeneration support, please reach out to the publisher:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Publisher:</span>
                <span className="text-slate-350 font-bold">Muhammed Rihan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Hotline:</span>
                <a href="tel:+971566202782" className="text-amber-500 hover:underline font-bold">
                  +971 56 620 2782
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Module Area B: Workstation key activation */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-500">
              <Lock className="w-4.5 h-4.5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Lock Workstation License</h3>
            </div>

            {isLicensed ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-lg flex items-start space-x-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold font-mono uppercase tracking-wider block text-emerald-400">Sentinel verified online</span>
                  This workstation hardware is checked and cryptographically verified. Isometric PDF and spool indexing actions are fully unlocked.
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-lg flex items-start space-x-3 text-xs text-red-300">
                <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold font-mono uppercase tracking-wider block text-red-400">Workstation secure locked</span>
                  No validated license found matching this CPU matrix. Access is restricted. Please register matching activation credentials.
                </div>
              </div>
            )}

            <form onSubmit={handleActivate} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="lic-key-activation-input"
                  type="text"
                  required
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  placeholder="LIC-XXXXX-XXXXX-XXXXX (Enter key)"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-sm text-white font-mono placeholder-slate-700 outline-none"
                />
                
                <button
                  id="lic-btn-activate-submit"
                  type="submit"
                  disabled={activating}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2 text-xs rounded-lg transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center"
                >
                  {activating ? 'COMPUTING RSA...' : 'VALIDATE & ENROLL'}
                </button>
              </div>

              {activationMsg && (
                <div className={`p-2.5 rounded text-xs font-mono font-medium ${
                  activationMsg.success ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'
                }`}>
                  {activationMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* Module Area C: Admin generate block */}
          {user?.role === 'Admin' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2.5 text-amber-500">
                <PlusCircle className="w-4.5 h-4.5" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Generate sentinel credentials (Admin Only)</h3>
              </div>

              <form onSubmit={handleCreateLicense} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Corporate Client</label>
                  <input
                    id="lic-gen-client-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="SINOPEC CORP"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Device Seats Limit</label>
                  <select
                    id="lic-gen-seats"
                    value={deviceLimit}
                    onChange={(e) => setDeviceLimit(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2 text-xs text-white outline-none font-mono"
                  >
                    <option value={1}>1 Seat (Single User)</option>
                    <option value={3}>3 Seats (Local Crew)</option>
                    <option value={10}>10 Seats (Enterprise Office)</option>
                    <option value={100}>100 Seats (Global Fabricator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Expiry Date</label>
                  <div className="flex space-x-2">
                    <input
                      id="lic-gen-expiry"
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg p-2 text-xs text-white outline-none font-mono"
                    />
                    <button
                      id="lic-gen-btn-submit"
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg p-2 text-slate-300 cursor-pointer"
                      title="Generate cryptographic license"
                    >
                      +
                    </button>
                  </div>
                </div>
              </form>

              {/* List registered license segments */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 block uppercase mb-2.5">GENERATED LICENSING REGISTRY</span>
                
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="py-2 px-3">Enrolled Code</th>
                        <th className="py-2 px-3">Holder Client</th>
                        <th className="py-2 px-3 text-center">Allocated Seats</th>
                        <th className="py-2 px-3">Expiry Date</th>
                        <th className="py-2 px-3 text-right">Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {licenses.map((lic) => (
                        <tr key={lic.key} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 font-semibold text-amber-500 tracking-tight">{lic.key}</td>
                          <td className="py-2.5 px-3 uppercase tracking-wider font-sans font-bold text-[10px]">{lic.customerName}</td>
                          <td className="py-2.5 px-3 text-center">{lic.activatedDevices.length} / {lic.deviceLimit}</td>
                          <td className="py-2.5 px-3 text-slate-400">{lic.expiryDate}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              id={`lic-toggle-${lic.key}`}
                              onClick={() => onToggleLicense(lic.key)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold cursor-pointer ${
                                lic.status === 'active'
                                  ? 'bg-emerald-500/10 hover:bg-red-500/20 text-emerald-400 hover:text-red-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 hover:bg-emerald-500/20 text-red-400 hover:text-emerald-400 border border-red-500/20'
                              }`}
                            >
                              {lic.status === 'active' ? 'SUSPEND' : 'RESTORE'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
