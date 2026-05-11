import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, AlertCircle, Save, Info, User, History, Check, ArrowRight, HelpCircle } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { Resident, Mutation, MutationType, ResidentStatus } from '../types';

registerLocale('id', id);

interface MutationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mutation: Partial<Mutation>, updatedStatus: ResidentStatus, inactiveDate: string) => void;
  resident: Resident;
}

export const MutationForm: React.FC<MutationFormProps> = ({ isOpen, onClose, onSubmit, resident }) => {
  const [formData, setFormData] = useState({
    type: MutationType.MOVING,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      setError('Tanggal mutasi harus diisi');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    let updatedStatus = ResidentStatus.ACTIVE;
    if (formData.type === MutationType.DEATH) {
      updatedStatus = ResidentStatus.DECEASED;
    } else if (formData.type === MutationType.MOVING) {
      updatedStatus = ResidentStatus.MOVED_OUT;
    } else if (formData.type === MutationType.COMING) {
      updatedStatus = ResidentStatus.ACTIVE;
    } else if (formData.type === MutationType.BIRTH) {
      updatedStatus = ResidentStatus.ACTIVE;
    }

    const mutation: Partial<Mutation> = {
      residentId: resident.id,
      residentName: resident.fullName,
      type: formData.type,
      date: formData.date,
      description: formData.description,
    };

    onSubmit(mutation, updatedStatus, formData.date);
    onClose();
  };

  if (!isOpen) return null;

  const mutationOptions = [
    { value: MutationType.BIRTH, label: 'Kelahiran', status: 'Aktif' },
    { value: MutationType.COMING, label: 'Pindah Datang', status: 'Aktif' },
    { value: MutationType.DEATH, label: 'Kematian', status: 'Meninggal Dunia' },
    { value: MutationType.MOVING, label: 'Pindah Domisili', status: 'Pindah Domisili' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-slate-900 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{showConfirm ? 'Konfirmasi Mutasi' : 'Catat Mutasi'}</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mt-1">
                  {showConfirm ? 'Tinjau Rincian Perubahan' : 'Perubahan Status Penduduk'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {!showConfirm ? (
                <motion.div
                  key="form"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar"
                >
                  {error && (
                    <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-xs border border-rose-500/20 animate-pulse">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Target Resident Info */}
                  <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 shrink-0">
                      <User size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Target Penduduk</p>
                      <h3 className="text-white font-bold truncate">{resident.fullName}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">NIK: {resident.nik}</p>
                    </div>
                  </div>

                  <form id="mutation-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Pilih Jenis Mutasi</label>
                      <div className="grid grid-cols-2 gap-3">
                        {mutationOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: opt.value })}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col gap-2 ${
                              formData.type === opt.value
                                ? 'bg-indigo-600/20 border-indigo-500 ring-4 ring-indigo-500/10'
                                : 'bg-slate-950/20 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <span className={`text-sm font-black ${formData.type === opt.value ? 'text-white' : 'text-slate-400'}`}>
                              {opt.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1 h-1 rounded-full ${formData.type === opt.value ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">Hasil: {opt.status}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date & Note */}
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tanggal Peristiwa</label>
                        <DatePicker
                          selected={formData.date ? parseISO(formData.date) : null}
                          onChange={(date: Date | null) => {
                            if (date && isValid(date)) {
                              setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale="id"
                          maxDate={new Date()}
                          customInput={
                            <div className="relative">
                              <input
                                value={formData.date ? format(parseISO(formData.date), 'dd/MM/yyyy') : ''}
                                readOnly
                                className="w-full bg-indigo-500/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer pr-12 font-medium"
                                placeholder="Pilih Tanggal"
                              />
                              <Calendar size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400/50" />
                            </div>
                          }
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Keterangan Tambahan</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Contoh: Pindah mengikuti orang tua / Meninggal karena sakit di RS"
                          className="w-full bg-slate-950/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-all min-h-[100px] resize-none placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="h-full overflow-y-auto p-8 space-y-8 custom-scrollbar"
                >
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400">
                        <HelpCircle size={32} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Konfirmasi Data Mutasi</h3>
                        <p className="text-xs text-slate-500 mt-1">Pastikan informasi di bawah ini sudah benar</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Penduduk</span>
                        <span className="text-sm font-bold text-white">{resident.fullName}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Mutasi</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-indigo-400">{mutationOptions.find(o => o.value === formData.type)?.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal</span>
                        <span className="text-sm font-bold text-white">{format(parseISO(formData.date), 'dd MMMM yyyy', { locale: id })}</span>
                      </div>

                      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Status Baru</p>
                          <p className="text-sm font-black text-white">{mutationOptions.find(o => o.value === formData.type)?.status}</p>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-400">
                          <span className="text-[10px] font-bold opacity-50">{resident.status}</span>
                          <ArrowRight size={14} />
                          <Check size={18} className="bg-indigo-500 text-white rounded-full p-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Dengan menekan tombol konfirmasi, status kependudukan akan diperbarui secara permanen dalam sistem.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-5 border-t border-white/10 bg-slate-900/80 shrink-0 flex gap-3">
            {showConfirm && (
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
              >
                Kembali
              </button>
            )}
            <button
              onClick={showConfirm ? handleConfirmSubmit : undefined}
              form={!showConfirm ? "mutation-form" : undefined}
              type={!showConfirm ? "submit" : "button"}
              className={`font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                showConfirm 
                  ? 'flex-[2] bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 text-white' 
                  : 'w-full bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 text-white'
              }`}
            >
              {showConfirm ? <Check size={18} /> : <Save size={18} />}
              {showConfirm ? 'Ya, Konfirmasi' : 'Lanjutkan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
