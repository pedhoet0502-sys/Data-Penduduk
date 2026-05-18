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
import { format, parseISO } from 'date-fns';
import { Plus, Search, LogOut, LogIn, Database, Users, User, Fingerprint, RefreshCcw, CheckCircle2, Filter, SlidersHorizontal, ChevronDown, BarChart3, TrendingUp, Mars, Venus } from 'lucide-react';
import { db, auth } from './lib/firebase';
import { Resident, Gender, Mutation, MutationType, ResidentStatus } from './types';
import { RELIGIONS, EDUCATIONS, FAMILY_POSITIONS, RESIDENCE_STATUSES } from './lib/utils';
import { ResidentCard } from './components/ResidentCard';
import { ResidentForm } from './components/ResidentForm';
import { ResidentDetail } from './components/ResidentDetail';
import { MutationForm } from './components/MutationForm';
import { StatsDashboard } from './components/StatsDashboard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Toast, ToastType } from './components/Toast';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { History } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [activeTab, setActiveTab] = useState<'residents' | 'mutations'>('residents');
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('Semua');
  const [filterReligion, setFilterReligion] = useState<string>('Semua');
  const [filterEducation, setFilterEducation] = useState<string>('Semua');
  const [filterFamilyPosition, setFilterFamilyPosition] = useState<string>('Semua');
  const [filterResidenceStatus, setFilterResidenceStatus] = useState<string>('Semua');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMutationFormOpen, setIsMutationFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [viewingResident, setViewingResident] = useState<Resident | null>(null);
  const [mutationResident, setMutationResident] = useState<Resident | null>(null);
  const [residentIdToDelete, setResidentIdToDelete] = useState<string | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const isUserReadOnly = useMemo(() => {
    return user?.email?.toLowerCase() === 'pedhoet0502@gmail.com';
  }, [user]);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    // Splash screen duration
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

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

    let q;
    if (isUserReadOnly) {
      // System viewer fetching EVERYTHING
      q = query(
        collection(db, 'residents'),
        orderBy('kkNumber', 'asc')
      );
    } else {
      q = query(
        collection(db, 'residents'),
        where('ownerId', '==', user.uid),
        orderBy('kkNumber', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resident[];

      // Custom Sort: 1. KK Number (ASC), 2. Family Position Priority (Custom)
      const familyPriority: Record<string, number> = {
        'Kepala Keluarga': 1,
        'Istri': 2,
        'Anak': 3,
        'Mertua': 4,
        'Orang Tua': 5,
        'Cucu': 6,
        'Lainnya': 10
      };

      const sortedData = [...data].sort((a, b) => {
        // First compare by KK Number
        if (a.kkNumber !== b.kkNumber) {
          return a.kkNumber.localeCompare(b.kkNumber);
        }
        
        // If same KK, sort by family position priority
        const priorityA = familyPriority[a.familyPosition] || 99;
        const priorityB = familyPriority[b.familyPosition] || 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Sort by Birth Date (Oldest first)
        if (a.birthDate !== b.birthDate) {
          return a.birthDate.localeCompare(b.birthDate);
        }

        // Final tie-breaker: Name
        return a.fullName.localeCompare(b.fullName);
      });

      setResidents(sortedData);
      if (!snapshot.metadata.fromCache) {
        setLastSyncTime(new Date());
      }
    }, (error) => {
      console.error('Residents snapshot error:', error);
      showToast(`Gagal memuat data penduduk: ${error.message}`, 'error');
      handleFirestoreError(error, OperationType.LIST, 'residents');
    });

    return () => unsubscribe();
  }, [user, isUserReadOnly]);

  useEffect(() => {
    if (!user) {
      setMutations([]);
      return;
    }

    let q;
    if (isUserReadOnly) {
      q = query(
        collection(db, 'mutations'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'mutations'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mutation[];
      setMutations(data);
    }, (error) => {
      console.error('Mutations snapshot error:', error);
      showToast(`Gagal memuat riwayat mutasi: ${error.message}`, 'error');
      handleFirestoreError(error, OperationType.LIST, 'mutations');
    });

    return () => unsubscribe();
  }, [user, isUserReadOnly]);

  const handleSignIn = async () => {
    if (!isOnline) {
      showToast('Tidak ada koneksi internet. Silakan coba lagi nanti.', 'error');
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.code === 'auth/network-request-failed') {
        showToast('Gagal menghubungkan ke layanan autentikasi. Periksa koneksi internet atau pengaturan browser Anda.', 'error');
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Silent error as the user chose to close the popup
      } else {
        showToast('Gagal masuk. Silakan coba lagi.', 'error');
      }
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
      let q;
      if (isUserReadOnly) {
        q = query(
          collection(db, 'residents'),
          orderBy('kkNumber', 'asc')
        );
      } else {
        q = query(
          collection(db, 'residents'), 
          where('ownerId', '==', user.uid),
          orderBy('kkNumber', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Resident[];
      
      // Apply the same sort as the real-time listener
      const familyPriority: Record<string, number> = {
        'Kepala Keluarga': 1,
        'Istri': 2,
        'Anak': 3,
        'Mertua': 4,
        'Orang Tua': 5,
        'Cucu': 6,
        'Lainnya': 10
      };

      const sortedData = [...data].sort((a, b) => {
        if (a.kkNumber !== b.kkNumber) return a.kkNumber.localeCompare(b.kkNumber);
        const priorityA = familyPriority[a.familyPosition] || 99;
        const priorityB = familyPriority[b.familyPosition] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (a.birthDate !== b.birthDate) return a.birthDate.localeCompare(b.birthDate);
        return a.fullName.localeCompare(b.fullName);
      });

      setResidents(sortedData);
      // Simulate network delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast('Data berhasil disinkronkan');
    } catch (error: any) {
      console.error('Manual sync error:', error);
      showToast(`Sinkronisasi gagal: ${error.message || 'Error tidak diketahui'}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitResident = async (data: Partial<Resident>, mutationType?: MutationType) => {
    if (!user || isUserReadOnly) return;
    setSyncing(true);

    const residentId = editingResident?.id || (data as any).id;
    const isUpdate = !!residentId;

    // Filter out 'id' and ensure essential fields exist for legacy data consistency
    const { id, ...residentData } = data as any;
    
    // Add defaults for fields that might be missing in legacy records
    const payload = {
      ...residentData,
    };
    if (!payload.occupation) payload.occupation = 'Belum/Tidak Bekerja';
    if (!payload.bloodType) payload.bloodType = '-';
    if (!payload.phone) payload.phone = '';
    if (!payload.status) payload.status = ResidentStatus.ACTIVE;
    if (!payload.inactiveDate) payload.inactiveDate = '';

    try {
      if (isUpdate) {
        const docRef = doc(db, 'residents', residentId);
        await updateDoc(docRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'residents'), {
          ...payload,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 📝 Track Mutation if specified (Birth or Coming)
        if (mutationType) {
          await addDoc(collection(db, 'mutations'), {
            residentId: docRef.id,
            residentName: payload.fullName,
            type: mutationType,
            date: format(new Date(), 'yyyy-MM-dd'),
            description: mutationType === MutationType.BIRTH ? 'Lahir di wilayah ini' : 'Pindah datang baru',
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          });
        }
      }
      setIsFormOpen(false);
      setEditingResident(null);
      
      const successMessage = isUpdate 
        ? (isOnline ? 'Data berhasil diperbarui' : 'Perubahan disimpan di perangkat (Luring)')
        : (isOnline ? 'Data berhasil ditambahkan' : 'Data baru disimpan di perangkat (Luring)');
        
      showToast(successMessage);
    } catch (error) {
      showToast('Gagal menyimpan data', 'error');
      handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, isUpdate ? `residents/${residentId}` : 'residents');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteResident = async () => {
    if (!residentIdToDelete || isUserReadOnly) return;
    try {
      await deleteDoc(doc(db, 'residents', residentIdToDelete));
      if (viewingResident?.id === residentIdToDelete) {
        setIsDetailOpen(false);
      }
      setResidentIdToDelete(null);
      setIsConfirmOpen(false);
      showToast(isOnline ? 'Data berhasil dihapus' : 'Data dihapus dari antrian lokal (Luring)');
    } catch (error) {
      showToast('Gagal menghapus data', 'error');
      handleFirestoreError(error, OperationType.DELETE, 'residents');
    }
  };

  const handleMutationSubmit = async (mutationData: Partial<Mutation>, updatedStatus: ResidentStatus, inactiveDate: string) => {
    if (!user || isUserReadOnly) return;
    setSyncing(true);

    try {
      // 1. Add Mutation Record
      await addDoc(collection(db, 'mutations'), {
        ...mutationData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Update Resident Status
      if (mutationData.residentId) {
        const docRef = doc(db, 'residents', mutationData.residentId);
        await updateDoc(docRef, {
          status: updatedStatus,
          inactiveDate: inactiveDate,
          updatedAt: serverTimestamp(),
        });
      }

      showToast(isOnline ? 'Mutasi berhasil dicatat' : 'Mutasi disimpan di antrian lokal (Luring)');
      setIsDetailOpen(false);
    } catch (error) {
      showToast('Gagal mencatat mutasi', 'error');
      handleFirestoreError(error, OperationType.WRITE, 'mutations/create-with-resident-update');
    } finally {
      setSyncing(false);
    }
  };

  const confirmDelete = (id: string) => {
    setResidentIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const hasNewData = useMemo(() => {
    return residents.some(r => {
      const created = r.createdAt?.toDate();
      if (!created) return false;
      return (new Date().getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    });
  }, [residents]);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      // If on residents tab, only show ACTIVE residents unless searching or filtering specifically
      const isActuallySearchOrFilter = searchTerm || filterGender !== 'Semua' || filterReligion !== 'Semua' || filterEducation !== 'Semua' || filterFamilyPosition !== 'Semua' || filterResidenceStatus !== 'Semua';
      
      if (!isActuallySearchOrFilter && activeTab === 'residents') {
        if (r.status && r.status !== ResidentStatus.ACTIVE) return false;
      }

      const matchSearch = (r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nik?.includes(searchTerm) ||
        r.kkNumber?.includes(searchTerm));
      
      const matchGender = filterGender === 'Semua' || r.gender === filterGender;
      const matchReligion = filterReligion === 'Semua' || r.religion === filterReligion;
      const matchEducation = filterEducation === 'Semua' || r.education === filterEducation;
      const matchFamilyPosition = filterFamilyPosition === 'Semua' || r.familyPosition === filterFamilyPosition;
      const matchResidenceStatus = filterResidenceStatus === 'Semua' || r.residenceStatus === filterResidenceStatus;

      return matchSearch && matchGender && matchReligion && matchEducation && matchFamilyPosition && matchResidenceStatus;
    });
  }, [residents, searchTerm, filterGender, filterReligion, filterEducation, filterFamilyPosition, filterResidenceStatus, activeTab]);

  const filteredMutations = useMemo(() => {
    return mutations.filter(m => {
      const matchSearch = m.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [mutations, searchTerm]);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Logo Icon */}
          <div className="relative mb-8">
            <motion.div
              animate={{ 
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 blur-xl rounded-2xl"
            />
            <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <Fingerprint className="text-indigo-400" size={48} strokeWidth={1.5} />
              </motion.div>
              
              {/* Scanline effect */}
              <motion.div
                animate={{ top: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent pointer-events-none"
              />
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">
              SISTEM<span className="text-indigo-500">PENDUDUK</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-indigo-500/50" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Smart Identity Hub</p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-indigo-500/50" />
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Loading Bar */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48">
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full w-full bg-gradient-to-r from-indigo-600 to-emerald-500"
            />
          </div>
          <p className="text-[8px] font-black text-slate-600 text-center mt-3 uppercase tracking-widest">
            Inisialisasi Keamanan...
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight text-center">DATA WARGA</h1>
          <h2 className="text-xl font-bold text-indigo-400 mb-3 tracking-tight text-center">RT 05 RW 02</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">Sistem informasi manajemen warga terpadu. Kelola data dengan aman dan praktis.</p>
          
          <button
            onClick={handleSignIn}
            className="w-full bg-white border border-white/5 text-slate-800 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
            id="login-btn"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Masuk dengan Google
          </button>

          <button
            onClick={() => window.close()}
            className="w-full mt-4 bg-slate-900/50 border border-white/10 text-slate-400 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98]"
            id="exit-app-btn"
          >
            <LogOut size={18} />
            Keluar Aplikasi
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
          <h1 className="font-bold text-lg text-white tracking-tight uppercase">RT 05 RW 02 <span className="font-normal text-slate-400 text-sm hidden sm:inline">| Data Warga</span></h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all relative group"
            title="Liat Statistik"
          >
            <BarChart3 size={18} />
            <span className="text-xs font-bold hidden md:inline">Statistik</span>
            {hasNewData && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}
          </button>
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

      {/* Tab Switcher */}
      <div className="px-6 mt-6 max-w-2xl mx-auto">
        <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={() => setActiveTab('residents')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'residents' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Daftar Penduduk
          </button>
          <button
            onClick={() => setActiveTab('mutations')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'mutations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Riwayat Mutasi
          </button>
        </div>
      </div>

      <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
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
          <div className={`mb-4 flex items-center justify-between px-4 py-2 border rounded-2xl w-full ${isOnline ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500/80' : 'text-amber-500/80'}`}>
                {isOnline ? 'Cloud Terhubung' : 'Mode Luring'}
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-[9px] font-medium text-slate-500">
                Sinkronisasi: {format(lastSyncTime, 'HH:mm:ss')}
              </span>
            )}
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 cursor-pointer group" onClick={() => setIsStatsOpen(true)}>
          {/* Row 1: Total, KK, & New */}
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/10 shadow-sm group-hover:border-indigo-500/50 transition-all flex flex-col justify-between">
            <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] block leading-none mb-2">Total Warga</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white leading-none tracking-tighter">{residents.length}</span>
              <div className="w-8 h-8 bg-slate-950/30 rounded-lg flex items-center justify-center">
                <Users size={14} className="text-slate-600 group-hover:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/10 shadow-sm group-hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] block leading-none mb-2">Kepala Keluarga</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white leading-none tracking-tighter">
                {residents.filter(r => r.familyPosition === 'Kepala Keluarga' && (r.status === ResidentStatus.ACTIVE || !r.status)).length}
              </span>
              <div className="w-8 h-8 bg-slate-950/30 rounded-lg flex items-center justify-center">
                <Fingerprint size={14} className="text-slate-600 group-hover:text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-600/20 text-white group-hover:bg-indigo-500 transition-all flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <span className="text-[9px] uppercase font-black text-indigo-200 tracking-[0.2em] block leading-none mb-2">Data Baru</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black leading-none tracking-tighter">{residents.filter(r => {
                const created = r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt ? new Date(r.createdAt) : null);
                if (!created) return false;
                return (new Date().getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
              }).length}</span>
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-indigo-100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 col-span-1 sm:col-span-2 lg:col-span-3">
            {/* Row 2: Male & Female */}
            <div className="bg-slate-900/60 p-4 rounded-3xl border border-white/10 shadow-sm group-hover:border-indigo-500/50 transition-all flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/10 shrink-0">
                  <Mars size={16} className="text-indigo-400" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase text-indigo-400/60 tracking-widest leading-none mb-1 truncate">Laki-laki</p>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tighter">{residents.filter(r => r.gender === Gender.MALE).length}</span>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">{Math.round((residents.filter(r => r.gender === Gender.MALE).length / (residents.length || 1)) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-3xl border border-white/10 shadow-sm group-hover:border-pink-500/50 transition-all flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/10 shrink-0">
                  <Venus size={16} className="text-pink-400" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase text-pink-400/60 tracking-widest leading-none mb-1 truncate">Perempuan</p>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tighter">{residents.filter(r => r.gender === Gender.FEMALE).length}</span>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">{Math.round((residents.filter(r => r.gender === Gender.FEMALE).length / (residents.length || 1)) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
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
            {(filterGender !== 'Semua' || filterReligion !== 'Semua' || filterEducation !== 'Semua' || filterFamilyPosition !== 'Semua' || filterResidenceStatus !== 'Semua') && (
              <div className="absolute bottom-1.5 left-1.5">
                <motion.span 
                  animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-rose-500 blur-[2px]"
                />
                <motion.span 
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="relative block w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] ring-1 ring-rose-500/30"
                />
              </div>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Opsi Penyaringan</h3>
                  <button 
                    onClick={() => {
                      setFilterGender('Semua');
                      setFilterReligion('Semua');
                      setFilterEducation('Semua');
                      setFilterFamilyPosition('Semua');
                      setFilterResidenceStatus('Semua');
                    }}
                    className="text-[9px] font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    Atur Ulang Semua
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-2 px-1">
                      Jenis Kelamin
                    </label>
                    <select 
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white outline-none cursor-pointer font-medium"
                    >
                      <option value="Semua">Semua Gender</option>
                      <option value={Gender.MALE}>Laki-laki</option>
                      <option value={Gender.FEMALE}>Perempuan</option>
                    </select>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-2 px-1">
                      Status Keluarga
                    </label>
                    <select 
                      value={filterFamilyPosition}
                      onChange={(e) => setFilterFamilyPosition(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white outline-none cursor-pointer font-medium"
                    >
                      <option value="Semua">Semua Hubungan</option>
                      {FAMILY_POSITIONS.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-2 px-1">
                      Kepercayaan
                    </label>
                    <select 
                      value={filterReligion}
                      onChange={(e) => setFilterReligion(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white outline-none cursor-pointer font-medium"
                    >
                      <option value="Semua">Semua Agama</option>
                      {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-2 px-1">
                      Pedidikan Terakhir
                    </label>
                    <select 
                      value={filterEducation}
                      onChange={(e) => setFilterEducation(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white outline-none cursor-pointer font-medium"
                    >
                      <option value="Semua">Semua Jenjang</option>
                      {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter block mb-2 px-1">
                      Status Tinggal
                    </label>
                    <select 
                      value={filterResidenceStatus}
                      onChange={(e) => setFilterResidenceStatus(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-white outline-none cursor-pointer font-medium"
                    >
                      <option value="Semua">Semua Status</option>
                      {RESIDENCE_STATUSES.map(rs => <option key={rs} value={rs}>{rs}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Content */}
        <div className="space-y-4">
          {activeTab === 'residents' ? (
            <>
              <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Daftar Penduduk ({filteredResidents.length} Jiwa | {filteredResidents.filter(r => r.familyPosition === 'Kepala Keluarga').length} KK)
                </h2>
                {filteredResidents.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5">
                    Aktif & Valid
                  </span>
                )}
              </div>
              {filteredResidents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredResidents.map(resident => (
                      <ResidentCard
                        key={resident.id}
                        resident={resident}
                        isReadOnly={isUserReadOnly}
                        onEdit={(r) => {
                          setEditingResident(r);
                          setIsFormOpen(true);
                        }}
                        onViewDetail={(r) => {
                          setViewingResident(r);
                          setIsDetailOpen(true);
                        }}
                        onUpdate={handleSubmitResident}
                        onAddMutation={(r) => {
                          setMutationResident(r);
                          setIsMutationFormOpen(true);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mx-auto mb-4">
                    <Users size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">{searchTerm ? 'Data tidak ditemukan' : 'Belum ada data penduduk'}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2">Riwayat Mutasi ({filteredMutations.length})</h2>
              {filteredMutations.length > 0 ? (
                <AnimatePresence>
                  {filteredMutations.map(mutation => (
                    <motion.div
                      key={mutation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-900/80 border border-white/5 p-5 rounded-2xl shadow-sm hover:border-indigo-500/30 transition-all flex items-start gap-4"
                    >
                      <div className={`mt-1 p-3 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        mutation.type === MutationType.DEATH ? 'bg-rose-500/20 text-rose-400' :
                        mutation.type === MutationType.MOVING ? 'bg-amber-500/20 text-amber-400' :
                        mutation.type === MutationType.COMING ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <History size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-white tracking-tight truncate">{mutation.residentName}</h3>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">{format(parseISO(mutation.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            mutation.type === MutationType.DEATH ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            mutation.type === MutationType.MOVING ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            mutation.type === MutationType.COMING ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {mutation.type}
                          </span>
                        </div>
                        {mutation.description && (
                          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-white/5 pl-3 mt-2">{mutation.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mx-auto mb-4">
                    <History size={32} className="text-slate-700" />
                  </div>
                  <p className="text-slate-500 font-medium">{searchTerm ? 'Data mutasi tidak ditemukan' : 'Belum ada riwayat mutasi'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* FAB - Hidden if user is read-only */}
      {user && !isUserReadOnly && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
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
      )}

      {/* Form Dialog */}
      <ResidentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingResident(null);
        }}
        onSubmit={handleSubmitResident}
        initialData={editingResident}
        residents={residents}
      />

      {/* Detail Dialog */}
      <ResidentDetail
        isOpen={isDetailOpen}
        resident={viewingResident}
        mutations={mutations}
        isReadOnly={isUserReadOnly || (viewingResident && viewingResident.ownerId !== user?.uid)}
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
        onAddMutation={(r) => {
          setMutationResident(r);
          setIsMutationFormOpen(true);
        }}
      />

      {/* Mutation Form Dialog */}
      {mutationResident && (
        <MutationForm
          isOpen={isMutationFormOpen}
          resident={mutationResident}
          onClose={() => {
            setIsMutationFormOpen(false);
            setMutationResident(null);
          }}
          onSubmit={handleMutationSubmit}
        />
      )}

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

      {/* Stats Dashboard */}
      <StatsDashboard
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        residents={residents}
        mutations={mutations}
      />

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
