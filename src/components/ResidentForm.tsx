import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Gender, Resident } from '../types';
import { RELIGIONS, EDUCATIONS, MARITAL_STATUSES, FAMILY_POSITIONS, calculateAge } from '../lib/utils';

interface ResidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Resident>) => void;
  initialData?: Resident | null;
}

export const ResidentForm: React.FC<ResidentFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Resident>>({
    kkNumber: '',
    fullName: '',
    nik: '',
    gender: Gender.MALE,
    birthPlace: '',
    birthDate: '',
    religion: RELIGIONS[0],
    education: EDUCATIONS[0],
    maritalStatus: MARITAL_STATUSES[0],
    familyPosition: FAMILY_POSITIONS[0],
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        kkNumber: '',
        fullName: '',
        nik: '',
        gender: Gender.MALE,
        birthPlace: '',
        birthDate: '',
        religion: RELIGIONS[0],
        education: EDUCATIONS[3], // Default SMA
        maritalStatus: MARITAL_STATUSES[0],
        familyPosition: FAMILY_POSITIONS[0],
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detailed Validation
    if (!formData.kkNumber || formData.kkNumber.length !== 16 || !/^\d+$/.test(formData.kkNumber)) {
      setError('Nomor KK harus 16 digit angka');
      return;
    }
    if (!formData.nik || formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
      setError('NIK harus 16 digit angka');
      return;
    }
    if (!formData.fullName || formData.fullName.trim().length < 3) {
      setError('Nama Lengkap minimal 3 karakter');
      return;
    }
    if (!formData.gender) {
      setError('Pilih Jenis Kelamin');
      return;
    }
    if (!formData.birthPlace || formData.birthPlace.trim().length === 0) {
      setError('Tempat Lahir harus diisi');
      return;
    }
    if (!formData.birthDate) {
      setError('Tanggal Lahir harus diisi');
      return;
    }
    if (!formData.religion) {
      setError('Pilih Agama');
      return;
    }
    if (!formData.education) {
      setError('Pilih Pendidikan');
      return;
    }
    if (!formData.maritalStatus) {
      setError('Pilih Status Perkawinan');
      return;
    }
    if (!formData.familyPosition) {
      setError('Pilih Status Hubungan dalam Keluarga');
      return;
    }

    setError(null);
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-slate-900 w-full max-w-xl sm:rounded-2xl border-t sm:border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
          id="resident-form-container"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'Edit Data Penduduk' : 'Detail Data Penduduk'}
              </h2>
              <p className="text-xs text-slate-500 italic">Lengkapi formulir di bawah ini dengan benar.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors" id="close-form-btn">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-lg flex items-center gap-3 text-xs font-semibold border border-rose-500/20">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Nomor KK</label>
                <input
                  type="text"
                  name="kkNumber"
                  value={formData.kkNumber}
                  onChange={handleInputChange}
                  maxLength={16}
                  placeholder="16 digit"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white transition-all"
                  id="input-kk"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">NIK</label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  maxLength={16}
                  placeholder="16 digit"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white transition-all"
                  id="input-nik"
                  required
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Nama Lengkap</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Sesuai KTP"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white transition-all"
                  id="input-name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Jenis Kelamin</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  id="select-gender"
                >
                  <option value={Gender.MALE}>Laki-laki</option>
                  <option value={Gender.FEMALE}>Perempuan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Agama</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                  id="select-religion"
                >
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tempat Lahir</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleInputChange}
                    placeholder="Kota/Kab"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                    id="input-birthplace"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                    id="input-birthdate"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Pendidikan</label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                  id="select-education"
                >
                  {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Usia</label>
                <input
                  type="text"
                  value={formData.birthDate ? `${calculateAge(formData.birthDate)} Tahun` : '-'}
                  disabled
                  className="w-full bg-slate-800/50 border border-white/5 rounded-lg p-3 text-sm text-indigo-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Status Kawin</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                  id="select-marital"
                >
                  {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Hub. Keluarga</label>
                <select
                  name="familyPosition"
                  value={formData.familyPosition}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                  id="select-family"
                >
                  {FAMILY_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-auto pt-6 pb-8 flex flex-col gap-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                id="submit-form-btn"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
