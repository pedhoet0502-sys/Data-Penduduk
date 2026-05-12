import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, User, CreditCard, Calendar, MapPin, Trash2, Edit2, ChevronRight, Zap, Check, X, RefreshCcw, CheckCircle2, History, Briefcase } from 'lucide-react';
import { Resident, ResidentStatus } from '../types';
import { calculateAge, MARITAL_STATUSES, FAMILY_POSITIONS, getInitials, getColorFromName } from '../lib/utils';
import { format } from 'date-fns';

interface ResidentCardProps {
  resident: Resident;
  onEdit: (resident: Resident) => void;
  onDelete: (id: string) => void;
  onViewDetail: (resident: Resident) => void;
  onUpdate: (data: Partial<Resident>) => Promise<void>;
  onAddMutation?: (resident: Resident) => void;
  isReadOnly?: boolean;
  ownerEmail?: string;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onEdit, onDelete, onViewDetail, onUpdate, onAddMutation, isReadOnly = false, ownerEmail }) => {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, translateY: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99, translateY: 0 }}
      className={`bg-slate-800/30 rounded-2xl p-4 sm:p-5 shadow-sm border transition-all cursor-pointer relative ${isInlineEditing ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-indigo-500/5' : 'border-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5'}`}
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

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-lg border border-white/10 ${resident.photoUrl ? 'bg-slate-800' : getColorFromName(resident.fullName)}`}>
            {resident.photoUrl ? (
              <img src={resident.photoUrl} alt={resident.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-base font-black tracking-tight">{getInitials(resident.fullName)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[9px] text-indigo-400 font-mono tracking-tight">NIK {resident.nik}</p>
              {resident.updatedAt ? (
                <CheckCircle2 size={12} className="text-emerald-500" />
              ) : (
                <RefreshCcw size={12} className="text-amber-500 animate-spin-slow" />
              )}
            </div>
            <h3 className="font-bold text-slate-100 text-base leading-tight flex items-center gap-2">
              {resident.fullName}
              {isReadOnly && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[7px] font-black uppercase tracking-widest shadow-sm truncate max-w-[80px]" title={`Milik: ${ownerEmail || 'Akun Lain'}`}>
                  <Users size={7} /> {ownerEmail ? ownerEmail.split('@')[0] : 'Berbagi'}
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="flex gap-0.5 sm:gap-1 shrink-0">
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
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resident.id);
              }}
              className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
              id={`delete-btn-${resident.id}`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CreditCard size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">No. KK</span>
          </div>
          <span className="text-xs font-bold text-slate-300 truncate">{resident.kkNumber}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">Hubungan</span>
          </div>
          {isInlineEditing ? (
            <select
              value={inlineFamilyPosition}
              onChange={(e) => setInlineFamilyPosition(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] p-1 text-white outline-none focus:border-indigo-500"
            >
              {FAMILY_POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-300">{resident.familyPosition}</span>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Calendar size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">Tgl Lahir</span>
          </div>
          <span className="text-xs font-bold text-slate-300 line-clamp-1">{format(new Date(resident.birthDate), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <User size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">Usia</span>
          </div>
          <span className="text-xs font-black text-indigo-400">{calculateAge(resident.birthDate)} Thn</span>
        </div>
        <div className="flex flex-col col-span-2 bg-slate-950/40 p-2 rounded-xl border border-white/5 mt-0.5 shadow-inner">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Briefcase size={10} className="text-indigo-400/60" />
            <span className="text-[8px] text-indigo-400/60 uppercase font-black tracking-[0.15em]">Pekerjaan</span>
          </div>
          <span className="text-xs font-bold text-white leading-tight truncate">{resident.occupation}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <User size={12} className="text-slate-500" />
          <span>{resident.gender} • </span>
          {isInlineEditing ? (
            <select
              value={inlineMaritalStatus}
              onChange={(e) => setInlineMaritalStatus(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-md text-xs p-1 text-white outline-none focus:border-indigo-500 ml-1"
            >
              {MARITAL_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          ) : (
            <span>{resident.maritalStatus}</span>
          )}
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

