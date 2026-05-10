import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, LogOut, LogIn, Database, Users, Fingerprint, RefreshCcw, CheckCircle2, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { db, auth } from './lib/firebase';
import { Resident, Gender } from './types';
import { RELIGIONS, EDUCATIONS } from './lib/utils';
import { ResidentCard } from './components/ResidentCard';
import { ResidentForm } from './components/ResidentForm';
import { ResidentDetail } from './components/ResidentDetail';
import { ConfirmationModal } from './components/ConfirmationModal';
import { handleFirestoreError, OperationType } from './lib/error-handler';

const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('Semua');
  const [filterReligion, setFilterReligion] = useState<string>('Semua');
  const [filterEducation, setFilterEducation] = useState<string>('Semua');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [viewingResident, setViewingResident] = useState<Resident | null>(null);
  const [residentIdToDelete, setResidentIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setResidents([]);
      return;
    }

    const q = query(
      collection(db, 'residents'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resident[];
      setResidents(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'residents');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const q = query(collection(db, 'residents'), where('ownerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resident[];
      setResidents(data);
      // Simulate network delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'residents');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitResident = async (data: Partial<Resident>) => {
    if (!user) return;

    // Filter out 'id' and other client-side fields to satisfy security rules
    const { id, ...residentData } = data as any;

    try {
      if (editingResident) {
        const docRef = doc(db, 'residents', editingResident.id);
        await updateDoc(docRef, {
          ...residentData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'residents'), {
          ...residentData,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsFormOpen(false);
      setEditingResident(null);
    } catch (error) {
      handleFirestoreError(error, editingResident ? OperationType.UPDATE : OperationType.CREATE, 'residents');
    }
  };

  const handleDeleteResident = async () => {
    if (!residentIdToDelete) return;
    try {
      await deleteDoc(doc(db, 'residents', residentIdToDelete));
      if (viewingResident?.id === residentIdToDelete) {
        setIsDetailOpen(false);
      }
      setResidentIdToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'residents');
    }
  };

  const confirmDelete = (id: string) => {
    setResidentIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchSearch = (r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nik?.includes(searchTerm) ||
        r.kkNumber?.includes(searchTerm));
      
      const matchGender = filterGender === 'Semua' || r.gender === filterGender;
      const matchReligion = filterReligion === 'Semua' || r.religion === filterReligion;
      const matchEducation = filterEducation === 'Semua' || r.education === filterEducation;

      return matchSearch && matchGender && matchReligion && matchEducation;
    });
  }, [residents, searchTerm, filterGender, filterReligion, filterEducation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-sm"
        >
          <div className="mb-8 flex justify-center">
             <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
               <Fingerprint size={40} />
             </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">SIDAK RI</h1>
          <p className="text-slate-400 mb-10 leading-relaxed">Sistem Data Kependudukan Terpadu. Kelola data penduduk dengan aman dan praktis.</p>
          
          <button
            onClick={handleSignIn}
            className="w-full bg-white border border-white/5 text-slate-800 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
            id="login-btn"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Masuk dengan Google
          </button>
          
          <div className="mt-12 flex items-center justify-center gap-6 opacity-20">
            <Users size={20} className="text-white" />
            <Database size={20} className="text-white" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-24">
      {/* Header */}
      <header className="h-16 border-b border-white/10 sticky top-0 z-30 px-6 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Fingerprint size={18} />
          </div>
          <h1 className="font-bold text-lg text-white tracking-tight">SIDAK <span className="font-normal text-slate-400 text-sm hidden sm:inline">| Sistem Data Kependudukan</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className={`p-2 rounded-lg transition-all ${syncing ? 'text-indigo-400 animate-spin' : (!isOnline ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white')}`}
            title={isOnline ? "Sinkronisasi Manual" : "Tidak ada koneksi internet"}
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            id="logout-btn"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto">
        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-3">
                <RefreshCcw size={16} className="text-amber-500 animate-spin-slow" />
                <div>
                  <p className="text-xs font-bold text-amber-500">Mode Luring (Offline)</p>
                  <p className="text-[10px] text-amber-500/70">Perubahan akan disinkronkan saat kembali online.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Status Overlay (Mobile friendly feedback) */}
        {!syncing && residents.length > 0 && (
          <div className={`mb-4 flex items-center gap-2 px-3 py-1 border rounded-full w-fit ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
            {isOnline ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : (
              <Database size={12} className="text-slate-400" />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isOnline ? 'Terhubung dengan Cloud' : 'Data Disimpan Lokal'}
            </span>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/10 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 block">Total Warga</span>
            <span className="text-3xl font-black text-white">{residents.length}</span>
          </div>
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-600/20 text-white">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest mb-1 block">Data Baru</span>
            <span className="text-3xl font-black">{residents.filter(r => {
              const created = r.createdAt?.toDate();
              if (!created) return false;
              return (new Date().getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
            }).length}</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari Nama, NIK, atau No. KK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-600"
              id="search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 relative ${showFilters ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'}`}
            title="Filter Data"
          >
            <SlidersHorizontal size={20} />
            {(filterGender !== 'Semua' || filterReligion !== 'Semua' || filterEducation !== 'Semua') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-3 right-3 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Jenis Kelamin
                  </label>
                  <select 
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="Semua">Semua Gender</option>
                    <option value={Gender.MALE}>Laki-laki</option>
                    <option value={Gender.FEMALE}>Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Agama
                  </label>
                  <select 
                    value={filterReligion}
                    onChange={(e) => setFilterReligion(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="Semua">Semua Agama</option>
                    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Pendidikan
                  </label>
                  <select 
                    value={filterEducation}
                    onChange={(e) => setFilterEducation(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="Semua">Pendidikan</option>
                    {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end mt-2">
                  <button 
                    onClick={() => {
                      setFilterGender('Semua');
                      setFilterReligion('Semua');
                      setFilterEducation('Semua');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Content */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2">Daftar Penduduk ({filteredResidents.length})</h2>
          {filteredResidents.length > 0 ? (
            <AnimatePresence>
              {filteredResidents.map(resident => (
                <ResidentCard
                  key={resident.id}
                  resident={resident}
                  onEdit={(r) => {
                    setEditingResident(r);
                    setIsFormOpen(true);
                  }}
                  onDelete={confirmDelete}
                  onViewDetail={(r) => {
                    setViewingResident(r);
                    setIsDetailOpen(true);
                  }}
                  onUpdate={handleSubmitResident}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mx-auto mb-4">
                <Users size={32} />
              </div>
              <p className="text-slate-500 font-medium">{searchTerm ? 'Data tidak ditemukan' : 'Belum ada data penduduk'}</p>
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditingResident(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 z-40"
        id="add-resident-fab"
      >
        <Plus size={32} />
      </motion.button>

      {/* Form Dialog */}
      <ResidentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingResident(null);
        }}
        onSubmit={handleSubmitResident}
        initialData={editingResident}
      />

      {/* Detail Dialog */}
      <ResidentDetail
        isOpen={isDetailOpen}
        resident={viewingResident}
        onClose={() => {
          setIsDetailOpen(false);
          setViewingResident(null);
        }}
        onEdit={(r) => {
          setIsDetailOpen(false);
          setViewingResident(null);
          setEditingResident(r);
          setIsFormOpen(true);
        }}
        onDelete={confirmDelete}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setResidentIdToDelete(null);
        }}
        onConfirm={handleDeleteResident}
        title="Hapus Data Penduduk?"
        message="Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
