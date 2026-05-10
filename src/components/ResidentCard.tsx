import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, CreditCard, Calendar, MapPin, Trash2, Edit2, ChevronRight, Zap, Check, X, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Resident } from '../types';
import { calculateAge, MARITAL_STATUSES, FAMILY_POSITIONS } from '../lib/utils';

interface ResidentCardProps {
  resident: Resident;
  onEdit: (resident: Resident) => void;
  onDelete: (id: string) => void;
  onViewDetail: (resident: Resident) => void;
  onUpdate: (data: Partial<Resident>) => Promise<void>;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onEdit, onDelete, onViewDetail, onUpdate }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineFamilyPosition, setInlineFamilyPosition] = useState(resident.familyPosition);
  const [inlineMaritalStatus, setInlineMaritalStatus] = useState(resident.maritalStatus);
  const [isSaving, setIsSaving] = useState(false);

  const handleQuickSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
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
    setIsInlineEditing(!isInlineEditing);
    if (!isInlineEditing) {
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
      className={`bg-slate-800/40 rounded-xl p-5 shadow-sm border transition-all cursor-pointer relative ${isInlineEditing ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-indigo-500/5' : 'border-white/5 hover:border-white/20'}`}
      id={`resident-card-${resident.id}`}
      onClick={() => !isInlineEditing && onViewDetail(resident)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 overflow-hidden">
            {resident.photoUrl ? (
              <img src={resident.photoUrl} alt={resident.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] text-indigo-400 font-mono">NIK: {resident.nik}</p>
              {resident.updatedAt ? (
                <div className="flex items-center gap-1" title="Tersinkronisasi">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              ) : (
                <div className="flex items-center gap-1" title="Tersimpan Lokal">
                  <RefreshCcw size={10} className="text-amber-500 animate-spin-slow" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-slate-100 text-base leading-tight">{resident.fullName}</h3>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggleInlineEdit}
            className={`p-2 rounded-lg transition-all ${isInlineEditing ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-indigo-400'}`}
            title="Edit Cepat"
          >
            <Zap size={16} />
          </button>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">No. KK</span>
          <span className="text-sm font-medium text-slate-300">{resident.kkNumber}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Hubungan</span>
          {isInlineEditing ? (
            <select
              value={inlineFamilyPosition}
              onChange={(e) => setInlineFamilyPosition(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 bg-slate-900 border border-white/10 rounded-md text-xs p-1 text-white outline-none focus:border-indigo-500"
            >
              {FAMILY_POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          ) : (
            <span className="text-sm font-medium text-slate-300">{resident.familyPosition}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Tempat, Tgl Lahir</span>
          <span className="text-sm font-medium text-slate-300 line-clamp-1">{resident.birthPlace}, {new Date(resident.birthDate).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Usia</span>
          <span className="text-sm font-bold text-indigo-400">{calculateAge(resident.birthDate)} Tahun</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
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
              onClick={handleQuickSave}
              disabled={isSaving}
              className="p-1 px-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold"
            >
              {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />} 
              Simpan
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-indigo-500 font-bold">
            Detail <ChevronRight size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

