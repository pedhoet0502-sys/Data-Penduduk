import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, User, UserRound, CreditCard, Calendar, MapPin, Trash2, Edit2, ChevronRight, Zap, Check, X, RefreshCcw, CheckCircle2, History, Briefcase, UserPlus, Cake, Droplets } from 'lucide-react';
import { Resident, ResidentStatus, Gender } from '../types';
import { calculateAge, MARITAL_STATUSES, FAMILY_POSITIONS, getInitials, getColorFromName } from '../lib/utils';
import { format } from 'date-fns';

interface ResidentCardProps {
  resident: Resident;
  onEdit: (resident: Resident) => void;
  onViewDetail: (resident: Resident) => void;
  onUpdate: (data: Partial<Resident>) => Promise<void>;
  onAddMutation?: (resident: Resident) => void;
  isReadOnly?: boolean;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onEdit, onViewDetail, onUpdate, onAddMutation, isReadOnly = false }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineFamilyPosition, setInlineFamilyPosition] = useState(resident.familyPosition);
  const [inlineMaritalStatus, setInlineMaritalStatus] = useState(resident.maritalStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleQuickSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    setShowConfirm(false);
    try {
      await onUpdate({
        ...resident,
        familyPosition: inlineFamilyPosition,
        maritalStatus: inlineMaritalStatus,
      });
      setIsInlineEditing(false);
    } catch (error) {
      console.error('Failed to quick update:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInlineEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInlineEditing) {
      setIsInlineEditing(false);
      setShowConfirm(false);
    } else {
      setIsInlineEditing(true);
      setInlineFamilyPosition(resident.familyPosition);
      setInlineMaritalStatus(resident.maritalStatus);
    }
  };

  const isBirthday = () => {
    const today = new Date();
    const birthDate = new Date(resident.birthDate);
    return today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, translateY: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99, translateY: 0 }}
      className={`bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 shadow-lg border transition-all cursor-pointer relative group ${isInlineEditing ? 'border-indigo-500/60 ring-2 ring-indigo-500/10 shadow-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
      id={`resident-card-${resident.id}`}
      onClick={() => !isInlineEditing && onViewDetail(resident)}
    >
      {/* Confirmation Overlay */}
      {showConfirm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
            <RefreshCcw size={24} className="text-amber-500" />
          </div>
          <h4 className="text-white font-bold text-sm mb-1">Simpan Perubahan?</h4>
          <p className="text-slate-400 text-[10px] mb-4">Apakah Anda yakin ingin memperbarui data {resident.fullName}?</p>
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleQuickSave}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              Ya, Simpan
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-xl border-2 border-white/10 shrink-0 ${resident.photoUrl ? 'bg-slate-800' : getColorFromName(resident.fullName)}`}>
            {resident.photoUrl ? (
              <img src={resident.photoUrl} alt={resident.fullName} className="w-full h-full object-cover transform transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl font-black tracking-tighter">{getInitials(resident.fullName)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <h3 className="font-extrabold text-white text-lg leading-tight tracking-tight flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
              <span className="truncate">{resident.fullName}</span>
              {isReadOnly && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[7px] font-black uppercase tracking-widest shadow-sm truncate max-w-[80px]" title="Mode Baca Saja (Akses Terbatas)">
                  <Users size={7} /> READ ONLY
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`flex items-center justify-center p-1 rounded border shadow-sm transition-colors ${
                resident.gender === Gender.MALE 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`} title={resident.gender}>
                {resident.gender === Gender.MALE ? <User size={10} strokeWidth={3} /> : <UserRound size={10} strokeWidth={3} />}
              </div>
              <span className="px-2 py-0.5 bg-slate-900 border border-white/5 text-indigo-400 text-[10px] font-mono font-black rounded tracking-wider shadow-sm">
                NIK {resident.nik}
              </span>
              {resident.updatedAt ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <RefreshCcw size={13} className="text-amber-400 animate-spin-slow" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            {!isReadOnly && (
            <button
              onClick={toggleInlineEdit}
              className={`p-2 rounded-lg transition-all ${isInlineEditing ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-indigo-400'}`}
              title="Edit Cepat"
            >
              <Zap size={16} />
            </button>
          )}
          {!isReadOnly && (resident.status || ResidentStatus.ACTIVE) === ResidentStatus.ACTIVE && onAddMutation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddMutation(resident);
              }}
              className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
              title="Mutasi Data"
            >
              <History size={16} />
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(resident);
              }}
              className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
              id={`edit-btn-${resident.id}`}
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 shadow-inner">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">No. KK</span>
          </div>
          <span className="text-sm font-bold text-slate-200">{resident.kkNumber}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hubungan</span>
          </div>
          {isInlineEditing ? (
            <select
              value={inlineFamilyPosition}
              onChange={(e) => setInlineFamilyPosition(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border border-indigo-500/30 rounded-lg text-xs p-1.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/20 ml-1 transition-all shadow-inner"
            >
              {FAMILY_POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-bold text-slate-200">{resident.familyPosition}</span>
              {resident.idCardStatus === 'Luar Wilayah' && (
                <div 
                  className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/20"
                  title="KTP Luar Wilayah (Pendatang)"
                >
                  <UserPlus size={11} strokeWidth={3} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lahir</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-200">{format(new Date(resident.birthDate), 'dd/MM/yyyy')}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <User size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Usia</span>
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-black text-indigo-400">{calculateAge(resident.birthDate)} Thn</span>
            {isBirthday() && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-400 flex items-center justify-center shrink-0 ml-2 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/20"
                title="Hari Ini Ulang Tahun! 🎉"
              >
                <Cake size={11} strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pekerjaan</span>
          </div>
          <span className="text-sm font-bold text-slate-200 leading-relaxed">{resident.occupation}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={12} className="text-rose-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gol. Darah</span>
          </div>
          <span className="text-sm font-bold text-slate-200">{resident.bloodType || '-'}</span>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded-lg border border-white/5">
            {resident.gender === Gender.MALE ? <User size={12} className="text-slate-500" /> : <UserRound size={12} className="text-slate-500" />}
            <span className="font-medium">{resident.gender}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-slate-500 font-bold">•</span>
            {isInlineEditing ? (
              <select
                value={inlineMaritalStatus}
                onChange={(e) => setInlineMaritalStatus(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none text-xs p-0 text-white outline-none focus:ring-0"
              >
                {MARITAL_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            ) : (
              <span className="font-medium">{resident.maritalStatus}</span>
            )}
          </div>
        </div>
        
        {isInlineEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setIsInlineEditing(false); }}
              className="p-1 px-2 rounded-md bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Batal
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              disabled={isSaving}
              className="p-1 px-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold"
            >
              {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />} 
              Simpan
            </button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1 text-indigo-500 font-bold"
          >
            Detail <ChevronRight size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

