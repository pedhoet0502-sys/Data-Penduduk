import React from 'react';
import { motion } from 'motion/react';
import { User, CreditCard, Calendar, MapPin, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { Resident } from '../types';
import { calculateAge } from '../lib/utils';

interface ResidentCardProps {
  resident: Resident;
  onEdit: (resident: Resident) => void;
  onDelete: (id: string) => void;
  onViewDetail: (resident: Resident) => void;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onEdit, onDelete, onViewDetail }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-800/40 rounded-xl p-5 shadow-sm border border-white/5 hover:border-white/20 transition-all cursor-pointer relative"
      id={`resident-card-${resident.id}`}
      onClick={() => onViewDetail(resident)}
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
          <div>
            <p className="text-[10px] text-indigo-400 font-mono mb-0.5">NIK: {resident.nik}</p>
            <h3 className="font-bold text-slate-100 text-base">{resident.fullName}</h3>
          </div>
        </div>
        <div className="flex gap-1">
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
          <span className="text-sm font-medium text-slate-300">{resident.familyPosition}</span>
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
        <span>{resident.gender} • {resident.maritalStatus}</span>
        <div className="flex items-center gap-1 text-indigo-500 font-bold">
          Detail <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
};
