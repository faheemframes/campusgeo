'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Lock,
  ArrowRight,
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  Flag,
  Check
} from 'lucide-react';

interface LocationItem {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  panoId: string;
  difficulty: string;
  active: boolean;
  createdAt: string;
  roundsPlayedCount: number;
  isUserContributed: boolean;
}

interface Metrics {
  total: number;
  activeCount: number;
  inactiveCount: number;
  userContributedCount: number;
  seededCount: number;
  zoneCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
}

interface LocationReportItem {
  id: string;
  locationId: string;
  locationName: string;
  actualLatitude: number;
  actualLongitude: number;
  guessLatitude?: number | null;
  guessLongitude?: number | null;
  reason: string;
  note?: string | null;
  status: string;
  createdAt: string;
  location?: {
    id: string;
    name: string;
    imageUrl?: string | null;
    latitude: number;
    longitude: number;
    area: string;
  };
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Error Reports Tab
  const [currentTab, setCurrentTab] = useState<'spots' | 'reports'>('spots');
  const [reports, setReports] = useState<LocationReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);


  // Filters
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'seeded'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Edit Spot Modal
  const [editingSpot, setEditingSpot] = useState<LocationItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Delete Confirmation Modal
  const [deletingSpot, setDeletingSpot] = useState<LocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const keyFromUrl = searchParams.get('key');
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('campusgeo_admin_key') : null;

    const keyToUse = keyFromUrl || storedKey || '';
    if (keyToUse) {
      setAdminKey(keyToUse);
      verifyAndFetch(keyToUse);
    }
  }, [searchParams]);

  const verifyAndFetch = async (key: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/locations?key=' + encodeURIComponent(key), {
        headers: { 'x-admin-key': key },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid admin passkey. Please try again.');
        }
        throw new Error('Failed to connect to admin API.');
      }

      const data = await res.json();
      setLocations(data.locations);
      setMetrics(data.metrics);
      setIsAuthenticated(true);
      setAdminKey(key);
      localStorage.setItem('campusgeo_admin_key', key);
      fetchReports(key);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchReports = async (key: string) => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/report-location?key=' + encodeURIComponent(key), {
        headers: { 'x-admin-key': key },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleApplyReport = async (rep: LocationReportItem) => {
    if (!rep.guessLatitude || !rep.guessLongitude) {
      alert('This report does not contain suggested coordinates to apply.');
      return;
    }
    if (
      !confirm(
        
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/report-location?key=' + encodeURIComponent(adminKey), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          reportId: rep.id,
          action: 'apply',
        }),
      });

      if (!res.ok) throw new Error('Failed to apply report');
      alert('Location updated successfully!');
      verifyAndFetch(adminKey);
    } catch (err: any) {
      alert(err.message || 'Error applying report');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/report-location?key=' + encodeURIComponent(adminKey), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          reportId,
          action: 'dismiss',
        }),
      });

      if (!res.ok) throw new Error('Failed to dismiss report');
      fetchReports(adminKey);
    } catch (err: any) {
      alert(err.message || 'Error dismissing report');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    verifyAndFetch(keyInput.trim());
  };

  const handleToggleActive = async (loc: LocationItem) => {
    const updatedStatus = !loc.active;

    setLocations((prev) =>
      prev.map((item) => (item.id === loc.id ? { ...item, active: updatedStatus } : item))
    );

    try {
      const res = await fetch('/api/admin/locations/' + loc.id + '?key=' + encodeURIComponent(adminKey), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ active: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              activeCount: updatedStatus ? prev.activeCount + 1 : prev.activeCount - 1,
              inactiveCount: updatedStatus ? prev.inactiveCount - 1 : prev.inactiveCount + 1,
            }
          : null
      );
    } catch (err: any) {
      alert(err.message || 'Error updating spot');
      setLocations((prev) =>
        prev.map((item) => (item.id === loc.id ? { ...item, active: loc.active } : item))
      );
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/admin/locations/' + editingSpot.id + '?key=' + encodeURIComponent(adminKey), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          name: editingSpot.name,
          area: editingSpot.area,
          difficulty: editingSpot.difficulty,
          latitude: editingSpot.latitude,
          longitude: editingSpot.longitude,
        }),
      });

      if (!res.ok) throw new Error('Failed to save changes');

      setLocations((prev) =>
        prev.map((item) => (item.id === editingSpot.id ? editingSpot : item))
      );
      setEditingSpot(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSpot) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/locations/' + deletingSpot.id + '?key=' + encodeURIComponent(adminKey), {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });

      if (!res.ok) throw new Error('Failed to delete spot');

      setLocations((prev) => prev.filter((item) => item.id !== deletingSpot.id));
      if (metrics) {
        setMetrics({
          ...metrics,
          total: metrics.total - 1,
          activeCount: deletingSpot.active ? metrics.activeCount - 1 : metrics.activeCount,
          inactiveCount: !deletingSpot.active ? metrics.inactiveCount - 1 : metrics.inactiveCount,
          userContributedCount: deletingSpot.isUserContributed
            ? metrics.userContributedCount - 1
            : metrics.userContributedCount,
        });
      }
      setDeletingSpot(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting spot');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      sourceFilter === 'all'
        ? true
        : sourceFilter === 'user'
        ? loc.isUserContributed
        : !loc.isUserContributed;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? loc.active
        : !loc.active;

    const matchesZone = zoneFilter === 'all' ? true : loc.area === zoneFilter;
    const matchesDifficulty = difficultyFilter === 'all' ? true : loc.difficulty === difficultyFilter;

    return matchesSearch && matchesSource && matchesStatus && matchesZone && matchesDifficulty;
  });

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full bg-[#080b11] text-white flex flex-col items-center justify-center p-6 select-none relative">
        <div className="w-full max-w-sm bg-slate-900/90 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-amber-400 stroke-[1.75]" />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Admin Portal
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Review SRM KTR campus locations & user submissions
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs w-full flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="w-full mt-6 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passkey</span>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter admin key (e.g. srmktr)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-black text-sm uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="mt-5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
          >
            ← Back to Game
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#080b11] text-white flex flex-col p-4 sm:p-8 select-none">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                Campus Geo Admin
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400">
                SRM KTR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage spots, verify community submissions, and ensure game quality.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => verifyAndFetch(adminKey)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 flex items-center gap-2 transition"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (isLoading ? 'animate-spin' : '')} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => router.push('/contribute')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Add Spot</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:brightness-110 transition"
          >
            <span>Play Game</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      {metrics && (
        <section className="w-full max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4 flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Total Spots
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              {metrics.total}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              {metrics.seededCount} core • {metrics.userContributedCount} community
            </span>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4 flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active In Game
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
              {metrics.activeCount}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Playable in 5-round pool
            </span>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4 flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-amber-400" /> Community Spots
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
              {metrics.userContributedCount}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Uploaded by students
            </span>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4 flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Zones Covered
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-400 mt-1">
              {Object.keys(metrics.zoneCounts).length}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Tech Park, Java, TP Ganesan...
            </span>
          </div>
        </section>
      )}


      {/* Tab Switcher */}
      <div className="w-full max-w-7xl mx-auto flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentTab('spots')}
          className={
            currentTab === 'spots'
              ? 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 bg-amber-500 text-slate-950 shadow-md'
              : 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 bg-slate-900/80 border border-white/[0.08] text-slate-400 hover:text-white'
          }
        >
          <MapPin className="w-4 h-4" />
          <span>Campus Spots ({locations.length})</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('reports');
            fetchReports(adminKey);
          }}
          className={
            currentTab === 'reports'
              ? 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 bg-amber-500 text-slate-950 shadow-md'
              : 'py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 bg-slate-900/80 border border-white/[0.08] text-slate-400 hover:text-white'
          }
        >
          <Flag className="w-4 h-4 text-amber-400" />
          <span>Location Reports</span>
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {currentTab === 'spots' ? (
        <>
      {/* Filter and Search Bar */}
      <section className="w-full max-w-7xl mx-auto bg-slate-900/60 border border-white/[0.06] rounded-2xl p-3 sm:p-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search spot name, zone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSourceFilter('all')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ' + (
                sourceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white'
              )}
            >
              All Spots ({locations.length})
            </button>
            <button
              onClick={() => setSourceFilter('user')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ' + (
                sourceFilter === 'user'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white'
              )}
            >
              User Uploads ({locations.filter((l) => l.isUserContributed).length})
            </button>
            <button
              onClick={() => setSourceFilter('seeded')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ' + (
                sourceFilter === 'seeded'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white'
              )}
            >
              Core Seeded ({locations.filter((l) => !l.isUserContributed).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Disabled Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400 truncate max-w-[140px]"
            >
              <option value="all">All Zones</option>
              <option value="Central Campus">Central Campus</option>
              <option value="North Campus">North Campus</option>
              <option value="South Campus">South Campus</option>
              <option value="Potheri / West">Potheri / West</option>
              <option value="East Academic">East Academic</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-mono">
            Showing {filteredLocations.length} of {locations.length}
          </div>
        </div>
      </section>

      {/* Locations List / Cards */}
      <section className="w-full max-w-7xl mx-auto flex flex-col gap-3 pb-12">
        {filteredLocations.length === 0 ? (
          <div className="w-full bg-slate-900/40 border border-white/[0.06] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Search className="w-10 h-10 text-slate-600 mb-3" />
            <span className="text-base font-bold text-slate-300">No spots match your filters</span>
            <span className="text-xs text-slate-500 mt-1">Try adjusting your search query or reset filters.</span>
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className={'w-full bg-slate-900/80 border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ' + (
                loc.active ? 'border-white/[0.08] hover:border-white/[0.15]' : 'border-rose-900/40 bg-rose-950/10'
              )}
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
                <div
                  onClick={() => loc.imageUrl && setPreviewImage({ url: loc.imageUrl, name: loc.name })}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 border border-slate-800 shrink-0 overflow-hidden relative cursor-pointer group shadow-sm"
                >
                  {loc.imageUrl ? (
                    <>
                      <img
                        src={loc.imageUrl}
                        alt={loc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <MapPin className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px]">Pano</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-white line-clamp-1">
                      {loc.name}
                    </span>
                    {loc.isUserContributed ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                        Community Upload
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-400">
                        Core Landmark
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                    <span className="font-medium text-slate-300">{loc.area}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={'font-mono font-bold capitalize text-[11px] ' + (
                        loc.difficulty === 'hard'
                          ? 'text-rose-400'
                          : loc.difficulty === 'medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      )}
                    >
                      {loc.difficulty}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Played {loc.roundsPlayedCount} times
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                    <span>
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </span>
                    <a
                      href={'https://www.google.com/maps/search/?api=1&query=' + loc.latitude + ',' + loc.longitude}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <span>Map</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Actions Toolbar */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                <button
                  onClick={() => handleToggleActive(loc)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ' + (
                    loc.active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  )}
                >
                  {loc.active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setEditingSpot({ ...loc })}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition"
                  title="Edit Spot"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeletingSpot(loc)}
                  className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                  title="Delete Spot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
        </>
      ) : (
        /* Reports Section */
        <section className="w-full max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-white/[0.06] rounded-2xl p-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Player Location Reports & Coordinate Fix Suggestions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review reports submitted by players when they think a marker was off. You can apply their suggested coordinates in 1 click!
              </p>
            </div>
            <button
              onClick={() => fetchReports(adminKey)}
              disabled={isLoadingReports}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={'w-3.5 h-3.5 ' + (isLoadingReports ? 'animate-spin' : '')} />
              <span>Refresh Reports</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="w-full py-16 bg-slate-900/40 border border-white/[0.06] rounded-3xl flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Reports Yet!</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                All locations are currently verified. Any future coordinate corrections reported by players will show up here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/[0.12] transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {rep.location?.imageUrl ? (
                      <img
                        src={rep.location.imageUrl}
                        alt={rep.locationName}
                        onClick={() =>
                          setPreviewImage({
                            url: rep.location?.imageUrl || '',
                            name: rep.locationName,
                          })
                        }
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-slate-500" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {rep.locationName}
                        </span>
                        <span
                          className={
                            rep.status === 'applied'
                              ? 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : rep.status === 'dismissed'
                              ? 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700'
                              : 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          }
                        >
                          {rep.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-300">
                        <span className="text-slate-500">Issue:</span>{' '}
                        <span className="font-semibold text-amber-300 capitalize">
                          {rep.reason.replace('_', ' ')}
                        </span>
                        {rep.note && (
                          <p className="mt-1 p-2 rounded-lg bg-slate-950/70 border border-white/[0.04] text-slate-300 text-xs italic">
                            "{rep.note}"
                          </p>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">
                            Current Game Pin:
                          </span>
                          <span className="text-slate-300">
                            {rep.actualLatitude.toFixed(6)}, {rep.actualLongitude.toFixed(6)}
                          </span>
                        </div>
                        {rep.guessLatitude && rep.guessLongitude && (
                          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <span className="text-amber-400 block text-[9px] uppercase font-bold">
                              Player's Suggested Pin:
                            </span>
                            <span className="text-amber-200 font-bold">
                              {rep.guessLatitude.toFixed(6)}, {rep.guessLongitude.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {rep.guessLatitude && rep.guessLongitude && (
                        <button
                          onClick={() => handleApplyReport(rep)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply Fix</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissReport(rep.id)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{previewImage.name}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <div className="w-full max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Spot Modal */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Spot Details</h3>
              <button
                onClick={() => setEditingSpot(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-xs text-slate-400 font-semibold">Spot Name</span>
                <input
                  type="text"
                  required
                  value={editingSpot.name}
                  onChange={(e) => setEditingSpot({ ...editingSpot, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-xs text-slate-400 font-semibold">Campus Zone</span>
                <select
                  value={editingSpot.area}
                  onChange={(e) => setEditingSpot({ ...editingSpot, area: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="Central Campus">Central Campus</option>
                  <option value="North Campus">North Campus</option>
                  <option value="South Campus">South Campus</option>
                  <option value="Potheri / West">Potheri / West</option>
                  <option value="East Academic">East Academic</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-xs text-slate-400 font-semibold">Difficulty</span>
                <select
                  value={editingSpot.difficulty}
                  onChange={(e) => setEditingSpot({ ...editingSpot, difficulty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-semibold">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={editingSpot.latitude}
                    onChange={(e) => setEditingSpot({ ...editingSpot, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-semibold">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={editingSpot.longitude}
                    onChange={(e) => setEditingSpot({ ...editingSpot, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSpot(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Spot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSpot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">Delete Spot?</h3>
            <p className="mt-1 text-xs text-slate-400">
              Are you sure you want to remove <span className="text-white font-semibold">{deletingSpot.name}</span>? This will remove it from the playable game pool.
            </p>

            <div className="flex items-center gap-2 w-full mt-6">
              <button
                type="button"
                onClick={() => setDeletingSpot(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080b11] text-white flex items-center justify-center font-mono text-xs">Loading Admin...</div>}>
      <AdminContent />
    </Suspense>
  );
}
