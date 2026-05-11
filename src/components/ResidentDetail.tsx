import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, CreditCard, MapPin, Calendar, Scroll, Heart, Users, Briefcase, RefreshCcw, CheckCircle2, GraduationCap, Droplets, Phone, Home, History, Copy, Check } from 'lucide-react';
import { Resident, ResidentStatus, Mutation } from '../types';
import { calculateAge, getInitials, getColorFromName } from '../lib/utils';
import { format } from 'date-fns';

interface ResidentDetailProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onEdit: (resident: Resident) => void;
  onAddMutation?: (resident: Resident) => void;
  mutations?: Mutation[]; // Added mutations
  isReadOnly?: boolean;
  ownerEmail?: string;
}

export const ResidentDetail: React.FC<ResidentDetailProps> = ({ isOpen, onClose, resident, onEdit, onAddMutation, mutations = [], isReadOnly = false, ownerEmail }) => {
  if (!resident || !isOpen) return null;

  const residentMutations = mutations.filter(m => m.residentId === resident.id);

  const statusColors = {
    [ResidentStatus.ACTIVE]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [ResidentStatus.DECEASED]: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    [ResidentStatus.MOVED_OUT]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [ResidentStatus.INACTIVE]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const DetailItem = ({ icon: Icon, label, value, color = "text-indigo-400", truncate = false, canCopy = false }: any) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex gap-4 p-4 rounded-xl bg-slate-950/30 border border-white/5 min-w-0 relative group">
        <div className={`w-10 h-10 ${color.replace('text', 'bg')}/10 rounded-lg flex items-center justify-center ${color} shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold text-white ${truncate ? 'truncate' : ''}`} title={value || '-'}>{value || '-'}</p>
            {canCopy && value && (
              <button 
                onClick={handleCopy}
                className="p-1 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-indigo-400"
                title="Salin"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          id="resident-detail-container"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/30">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white/20 shadow-xl ${resident.photoUrl ? 'bg-slate-800' : getColorFromName(resident.fullName)}`}>
                {resident.photoUrl ? (
                  <img src={resident.photoUrl} alt={resident.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-black tracking-tight">{getInitials(resident.fullName)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white leading-tight">{resident.fullName}</h2>
                  {isReadOnly && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm" title={`Milik: ${ownerEmail || 'Akun Lain'}`}>
                      <Users size={8} /> {ownerEmail || 'Akses Berbagi'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-indigo-400 font-mono tracking-tighter">NIK: {resident.nik}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(resident.nik);
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-500 hover:text-white"
                    title="Salin NIK"
                  >
                    <Copy size={10} />
                  </button>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${statusColors[resident.status || ResidentStatus.ACTIVE]}`}>
                    {resident.status || ResidentStatus.ACTIVE}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={CreditCard} label="Nomor KK" value={resident.kkNumber} canCopy={true} />
              <DetailItem icon={Users} label="Status Keluarga" value={resident.familyPosition} />
              {resident.familyPosition === 'Kepala Keluarga' && resident.residenceStatus && (
                <DetailItem icon={Home} label="Status Tempat Tinggal" value={resident.residenceStatus} color="text-violet-400" />
              )}
              <DetailItem icon={MapPin} label="Tempat Lahir" value={resident.birthPlace} color="text-amber-400" />
              <DetailItem icon={Calendar} label="Tanggal Lahir" value={`${format(new Date(resident.birthDate), 'dd/MM/yyyy')} (${calculateAge(resident.birthDate)} Thn)`} color="text-emerald-400" />
              <DetailItem icon={User} label="Jenis Kelamin" value={resident.gender} color="text-blue-400" />
              <DetailItem icon={Scroll} label="Agama" value={resident.religion} color="text-indigo-300" />
              <DetailItem icon={GraduationCap} label="Pendidikan" value={resident.education} color="text-rose-400" />
              <DetailItem icon={Briefcase} label="Pekerjaan" value={resident.occupation} color="text-cyan-400" truncate={true} />
              <DetailItem icon={Heart} label="Status Perkawinan" value={resident.maritalStatus} color="text-pink-400" />
              <DetailItem icon={Droplets} label="Gol. Darah" value={resident.bloodType} color="text-rose-600" />
              <DetailItem icon={Phone} label="Nomor Telepon" value={resident.phone} color="text-emerald-500" />
              {resident.status !== ResidentStatus.ACTIVE && resident.inactiveDate && (
                <DetailItem icon={Calendar} label="Tanggal Menonaktifkan" value={format(new Date(resident.inactiveDate), 'dd/MM/yyyy')} color="text-rose-500" />
              )}
              <DetailItem icon={User} label="Nama Ayah" value={resident.fatherName} color="text-slate-400" />
              <DetailItem icon={User} label="Nama Ibu" value={resident.motherName} color="text-slate-400" />
            </div>

            {residentMutations.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Riwayat Peristiwa (Mutasi)</h3>
                <div className="space-y-3">
                  {residentMutations.map((m) => (
                    <div key={m.id} className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <History size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{m.type}</span>
                          <span className="text-[9px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-500 font-mono">{format(new Date(m.date), 'dd MMM yyyy')}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`mt-8 overflow-hidden rounded-2xl border transition-all duration-500 ${resident.updatedAt ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5 pulse-amber'}`}>
              <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                   {resident.updatedAt ? <CheckCircle2 size={12} className="text-emerald-500" /> : <RefreshCcw size={12} className="text-amber-500 animate-spin-slow" />}
                   Integritas Data
                </p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${resident.updatedAt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                  {resident.updatedAt ? 'Cloud Verified' : 'Local Draft'}
                </span>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-1">
                  {resident.updatedAt ? (
                    <>
                      <p className="text-xs font-bold text-white">Data Tersinkronisasi</p>
                      <p className="text-[11px] text-slate-400">
                        Pembaruan terakhir terekam pada: <span className="text-emerald-400 font-mono">{resident.updatedAt.toDate ? format(resident.updatedAt.toDate(), 'dd MMM yyyy, HH:mm') : format(new Date(resident.updatedAt), 'dd MMM yyyy, HH:mm')}</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white">Tersimpan Lokal</p>
                      <p className="text-[11px] text-slate-400">
                        Data menunggu koneksi stabil untuk sinkronisasi ke server pusat.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-slate-950/30 flex flex-wrap justify-end gap-3">
             {!isReadOnly && (resident.status || ResidentStatus.ACTIVE) === ResidentStatus.ACTIVE && onAddMutation && (
                <button
                  onClick={() => onAddMutation(resident)}
                  className="px-6 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 font-bold rounded-xl transition-all flex items-center gap-2 mr-auto"
                >
                  <History size={16} />
                  Mutasi Data
                </button>
             )}
             {!isReadOnly && (
               <button 
                onClick={() => onEdit(resident)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                Ubah Data
              </button>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
