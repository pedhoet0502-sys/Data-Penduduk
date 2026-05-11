import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, User, Mail, Plus, Trash2, Shield, UserPlus, Info, CheckCircle2, AlertCircle, RefreshCcw, ArrowRightLeft, LayoutGrid, List } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface Share {
  id: string;
  ownerId: string;
  ownerEmail: string;
  collaboratorEmail: string;
  createdAt: any;
}

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({ isOpen, onClose, user }) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<Share[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my_shares' | 'shared_with_me'>('my_shares');

  useEffect(() => {
    if (!isOpen || !user) return;

    // Shares I created
    const q1 = query(
      collection(db, 'shares'),
      where('ownerId', '==', user.uid)
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Share[];
      setShares(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shares');
    });

    // Shares shared with me
    const q2 = query(
      collection(db, 'shares'),
      where('collaboratorEmail', '==', user.email?.toLowerCase())
    );

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Share[];
      setSharedWithMe(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shares');
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [isOpen, user]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;
    
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      setError('Anda tidak bisa berbagi dengan diri sendiri');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use a predictable ID: collaboratorEmail_ownerId
      const targetEmail = email.toLowerCase().trim();
      const shareId = `${targetEmail}_${user.uid}`;
      const docRef = doc(db, 'shares', shareId);
      
      await setDoc(docRef, {
        ownerId: user.uid,
        ownerEmail: user.email,
        collaboratorEmail: targetEmail,
        createdAt: serverTimestamp(),
      });

      setEmail('');
      setSuccess(`Akses berhasil dibagikan ke ${targetEmail}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Gagal membagikan akses. Pastikan email valid.');
      const shareId = `${email.toLowerCase().trim()}_${user.uid}`;
      handleFirestoreError(err, OperationType.WRITE, `shares/${shareId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteDoc(doc(db, 'shares', shareId));
      setSuccess('Akses dicabut');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `shares/${shareId}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-slate-900 w-full max-w-xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-b-3xl"
          >
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/95 backdrop-blur-xl sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Kolaborasi Data</h2>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none mt-1 font-bold">Manajemen Akses & Berbagi</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 active:scale-90">
                <X size={22} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-950/80 border-b border-white/10 sticky top-[72px] z-20">
              <button
                onClick={() => setActiveTab('my_shares')}
                className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'my_shares' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Data Saya
              </button>
              <button
                onClick={() => setActiveTab('shared_with_me')}
                className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'shared_with_me' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Akses Diterima {sharedWithMe.length > 0 && `(${sharedWithMe.length})`}
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 pb-24 sm:pb-6">
              {/* User Email Indicator */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5 transition-transform group-hover:scale-110">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Email Utama (Anda)</span>
                    <span className="text-xs sm:text-sm text-white font-bold tracking-tight">{user.email}</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">
                  Online
                </div>
              </div>

              {activeTab === 'my_shares' ? (
                <>
                  {/* Add Form */}
                  <form onSubmit={handleShare} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Undang Pengamat Baru</label>
                      <div className="group relative">
                        <Info size={14} className="text-slate-600 cursor-help transition-colors hover:text-indigo-400" />
                        <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-slate-800 border border-white/10 rounded-2xl text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 shadow-2xl leading-relaxed translate-y-2 group-hover:translate-y-0">
                          <p className="font-bold text-white mb-1">💡 Cara Kerja:</p>
                          Pengguna yang Anda undang dapat melihat database warga Anda secara real-time. Mereka hanya memiliki akses BACA-SAJA.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          placeholder="Masukkan email Gmail kolaborator..."
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                      <button
                        disabled={loading}
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.95] disabled:opacity-50 shrink-0 font-bold text-sm"
                      >
                        {loading ? <RefreshCcw size={18} className="animate-spin" /> : 'Undang'}
                      </button>
                    </div>
                  </form>

                  {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-2xl flex items-center gap-3 text-[11px] text-rose-400">
                      <AlertCircle size={14} />
                      <span className="font-medium">{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3 text-[11px] text-emerald-400 letter-spacing-tight">
                      <CheckCircle2 size={14} />
                      <span className="font-medium">{success}</span>
                    </motion.div>
                  )}

                  {/* List */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Daftar Kolaborator</h3>
                      <span className="text-[10px] font-bold text-slate-700">{shares.length} Aktif</span>
                    </div>
                    {shares.length > 0 ? (
                      <div className="space-y-2.5">
                        {shares.map((share) => (
                          <div key={share.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-300 hover:bg-white/[0.08]">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-black border border-indigo-500/10">
                                {share.collaboratorEmail[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-black text-slate-200 block truncate">{share.collaboratorEmail}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Shield size={10} className="text-slate-600" />
                                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Kolaborator • Read Only</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteShare(share.id)}
                              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100"
                              title="Hapus Akses"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-white/5 rounded-[32px] bg-slate-950/20">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 text-slate-700">
                          <Mail size={32} />
                        </div>
                        <p className="text-xs text-slate-600 font-medium px-8">Anda belum membagikan akses kepada siapapun.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Data Milik Orang Lain</h3>
                    <span className="text-[10px] font-bold text-slate-700">{sharedWithMe.length} Tersedia</span>
                  </div>
                  {sharedWithMe.length > 0 ? (
                    <div className="space-y-3">
                       {sharedWithMe.map((share) => (
                        <div key={share.id} className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all group">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 transition-transform group-hover:scale-105">
                             <Mail size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-white block truncate tracking-tight">{share.ownerEmail}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-black uppercase tracking-widest shadow-sm">Email Pemilik</span>
                              <span className="text-[10px] text-slate-600 font-bold">• View Access</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteShare(share.id)}
                            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Keluar dari Kolaborasi"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-white/5 rounded-[32px] bg-slate-950/20">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 text-slate-700 opacity-50">
                        <ArrowRightLeft size={32} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium px-10">Belum ada warga atau admin lain yang membagikan data mereka kepada Anda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 bg-slate-950/80 border-t border-white/10 flex flex-col gap-3 sticky bottom-0 z-20">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-2xl transition-all border border-indigo-500/50 shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                KONFIRMASI & TUTUP
              </button>
              <div className="flex items-center justify-center gap-2.5 opacity-60">
                <Shield size={12} className="text-emerald-400" />
                <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] font-black">
                  Proteksi Data Cloud RT 05 RW 02
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
