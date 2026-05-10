import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, CreditCard, MapPin, Calendar, BookOpen, Heart, Users, Briefcase } from 'lucide-react';
import { Resident } from '../types';
import { calculateAge } from '../lib/utils';

interface ResidentDetailProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onEdit: (resident: Resident) => void;
}

export const ResidentDetail: React.FC<ResidentDetailProps> = ({ isOpen, onClose, resident, onEdit }) => {
  if (!resident || !isOpen) return null;

  const DetailItem = ({ icon: Icon, label, value, color = "text-indigo-400" }: any) => (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-950/30 border border-white/5">
      <div className={`w-10 h-10 ${color.replace('text', 'bg')}/10 rounded-lg flex items-center justify-center ${color} shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white">{value || '-'}</p>
      </div>
    </div>
  );

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
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{resident.fullName}</h2>
                <p className="text-xs text-indigo-400 font-mono tracking-tighter">NIK: {resident.nik}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={CreditCard} label="Nomor KK" value={resident.kkNumber} />
              <DetailItem icon={Users} label="Status Keluarga" value={resident.familyPosition} />
              <DetailItem icon={MapPin} label="Tempat Lahir" value={resident.birthPlace} color="text-amber-400" />
              <DetailItem icon={Calendar} label="Tanggal Lahir" value={`${new Date(resident.birthDate).toLocaleDateString()} (${calculateAge(resident.birthDate)} Thn)`} color="text-emerald-400" />
              <DetailItem icon={User} label="Jenis Kelamin" value={resident.gender} color="text-blue-400" />
              <DetailItem icon={BookOpen} label="Agama" value={resident.religion} color="text-purple-400" />
              <DetailItem icon={Briefcase} label="Pendidikan" value={resident.education} color="text-rose-400" />
              <DetailItem icon={Heart} label="Status Perkawinan" value={resident.maritalStatus} color="text-pink-400" />
            </div>
            
            <div className="mt-6 p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
              <p className="text-[10px] text-slate-500 italic mb-1">Status Sinkronisasi Data:</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-300">Tersimpan di Cloud Storage</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-slate-950/30 flex justify-end gap-3">
             <button 
              onClick={() => onEdit(resident)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Ubah Data
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
