import React, { useState, useEffect } from 'react';
import { initialSpools } from './data/mockBlueprints';
import { Spool, ProcessingJob, License, User, UserLog } from './types';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UploadManager from './components/UploadManager';
import ProcessingQueue from './components/ProcessingQueue';
import CADViewer from './components/CADViewer';
import AdminPanel from './components/AdminPanel';
import LicenseManager from './components/LicenseManager';

export default function App() {
  // Session details State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Layout Tab control
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Unified Enterprise databases references
  const [spools, setSpools] = useState<Spool[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Selected Spool target context for CAD drawing viewer navigation
  const [selectedSpoolContext, setSelectedSpoolContext] = useState<Spool | null>(null);

  // Licensing Hardware signatures simulation
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const activeHwid = 'HWID-C01AA-99827-DBFAC'; // Simulated physical CPU MAC signature

  // Load state and trigger polling loop on boot
  useEffect(() => {
    // Attempt local storage token recover for rapid operator workflows
    const storedUser = localStorage.getItem('sentinel_user');
    const storedToken = localStorage.getItem('sentinel_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        localStorage.removeItem('sentinel_user');
        localStorage.removeItem('sentinel_token');
      }
    }

    // Recover or initialize HW lock signature
    const isL = localStorage.getItem('sentinel_hardware_unlocked');
    if (isL === 'true') {
      setIsLicensed(true);
    }

    // Trigger base telemetry fetch
    fetchDatabaseState();

    // Standard background job queues interval pool (ticks every 3000ms for active telemetry logs)
    const activePoll = setInterval(() => {
      fetchJobsDatabase();
      fetchSpoolsDatabase();
    }, 3000);

    return () => clearInterval(activePoll);
  }, []);

  const fetchDatabaseState = async () => {
    await Promise.all([
      fetchSpoolsDatabase(),
      fetchJobsDatabase(),
      fetchLicensesDatabase(),
      fetchLogsDatabase(),
      fetchUsersDatabase()
    ]);
  };

  const fetchSpoolsDatabase = async () => {
    try {
      const res = await fetch('/api/spools');
      if (res.ok) {
        const data = await res.json();
        setSpools(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        console.warn('Core registrar communication connection offline/reconnecting...');
      } else {
        console.error('Core registrar communication anomaly.', err);
      }
    }
  };

  const fetchJobsDatabase = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        console.warn('Queue ledger sync connection offline/reconnecting...');
      } else {
        console.error('Queue ledger sync anomaly.', err);
      }
    }
  };

  const fetchLicensesDatabase = async () => {
    try {
      const res = await fetch('/api/licenses');
      if (res.ok) {
        const data = await res.json();
        setLicenses(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        console.warn('Sentinel license registrar offline/reconnecting...');
      } else {
        console.error('Sentinel license registrar offline.', err);
      }
    }
  };

  const fetchLogsDatabase = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        console.warn('Audit ledger database communication issue (reconnecting)...');
      } else {
        console.error('Audit ledger database communication failed.', err);
      }
    }
  };

  const fetchUsersDatabase = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        console.warn('Operator registry communication offline/reconnecting...');
      } else {
        console.error('Operator registry communication failed.', err);
      }
    }
  };

  // Auth logins handler
  const handleLoginSuccess = (usr: User, securedToken: string) => {
    setUser(usr);
    setToken(securedToken);
    localStorage.setItem('sentinel_user', JSON.stringify(usr));
    localStorage.setItem('sentinel_token', securedToken);
    
    // Auto sync state immediately after authenticate pass
    fetchDatabaseState();
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('sentinel_token');
  };

  // Upload trigger integrations
  const handleDrawingIngestTriggered = (jobId: string, spoolId: string, fileName: string) => {
    fetchDatabaseState();
    // Redirect operator directly to the dashboard to view the uploaded drawing!
    setCurrentTab('dashboard');
  };

  // Direct selection on dashboard sends to viewer page
  const handleSelectSpoolForViewer = (spool: Spool) => {
    setSelectedSpoolContext(spool);
    setCurrentTab('search-viewer');
  };

  // License validations and activation locks operations
  const handleActivateLicense = async (key: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, hwid: activeHwid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLicensed(true);
        localStorage.setItem('sentinel_hardware_unlocked', 'true');
        fetchLicensesDatabase();
        fetchLogsDatabase();
        return true;
      }
    } catch (err) {
      console.error('Sentinel key audit failed.', err);
    }
    return false;
  };

  const handleGenerateLicenseKey = async (customer: string, deviceLimit: number, expiryDate: string) => {
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customer, deviceLimit, expiryDate })
      });
      if (res.ok) {
        fetchLicensesDatabase();
        fetchLogsDatabase();
      }
    } catch (err) {
      console.error('Failed to register brand license.', err);
    }
  };

  const handleToggleLicenseLock = async (key: string) => {
    try {
      const res = await fetch('/api/licenses/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      if (res.ok) {
        // If current workstation key gets suspended, instantly re-lock!
        const data = await res.json();
        if (data.success && data.license.key === 'LIC-79A2B-X1099-FF921' && data.license.status !== 'active') {
          setIsLicensed(false);
          localStorage.removeItem('sentinel_hardware_unlocked');
        }
        fetchLicensesDatabase();
        fetchLogsDatabase();
      }
    } catch (err) {
      console.error('Registry lock transition failed.', err);
    }
  };

  // Compute active processing queues length
  const activeJobsCount = jobs.filter(j => j.status !== 'completed' && j.status !== 'failed').length;

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      
      {/* Structural Sidebar navigation column */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        isLicensed={isLicensed}
        activeJobsCount={activeJobsCount}
      />

      {/* Primary Context View panes */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {currentTab === 'dashboard' && (
          <Dashboard
            spools={spools}
            user={user}
            onRefresh={fetchDatabaseState}
            onNavigateToTab={setCurrentTab}
            onSelectSpoolForViewer={handleSelectSpoolForViewer}
            isLicensed={isLicensed}
          />
        )}

        {currentTab === 'upload' && (
          <UploadManager
            user={user}
            existingJobs={jobs}
            onUploadSuccess={handleDrawingIngestTriggered}
            isLicensed={isLicensed}
          />
        )}

        {currentTab === 'processing' && (
          <ProcessingQueue
            jobs={jobs}
            onRefresh={fetchJobsDatabase}
          />
        )}

        {currentTab === 'search-viewer' && (
          <CADViewer
            spools={spools}
            initialSelectedSpool={selectedSpoolContext}
            user={user}
          />
        )}

        {currentTab === 'admin' && user.role === 'Admin' && (
          <AdminPanel
            onRefresh={fetchDatabaseState}
            users={users}
            logs={logs}
            spools={spools}
          />
        )}

        {currentTab === 'licenses' && (
          <LicenseManager
            licenses={licenses}
            isLicensed={isLicensed}
            activeHwid={activeHwid}
            onActivateLicense={handleActivateLicense}
            onGenerateLicense={handleGenerateLicenseKey}
            onToggleLicense={handleToggleLicenseLock}
            user={user}
          />
        )}
      </main>

    </div>
  );
}
export { App };
