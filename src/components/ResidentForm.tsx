import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, Camera, Upload, Loader2, Image as ImageIcon, Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { Gender, Resident, ResidenceStatus, ResidentStatus, MutationType } from '../types';
import { RELIGIONS, EDUCATIONS, MARITAL_STATUSES, FAMILY_POSITIONS, OCCUPATIONS, BLOOD_TYPES, RESIDENCE_STATUSES, calculateAge } from '../lib/utils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

registerLocale('id', id);

const CustomDatePickerInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick }, ref) => (
  <div className="relative" onClick={onClick}>
    <input
      value={value}
      readOnly
      ref={ref}
      className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500 transition-all cursor-pointer pr-10"
      placeholder="Pilih Tanggal"
    />
    <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
  </div>
));

interface ResidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Resident>, mutationType?: MutationType) => void;
  initialData?: Resident | null;
  residents?: Resident[];
}

export const ResidentForm: React.FC<ResidentFormProps> = ({ isOpen, onClose, onSubmit, initialData, residents = [] }) => {
  const [formData, setFormData] = useState<Partial<Resident>>({
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
    occupation: OCCUPATIONS[0],
    residenceStatus: ResidenceStatus.OWNED,
    fatherName: '',
    motherName: '',
    bloodType: '-',
    phone: '',
    photoUrl: '',
    status: ResidentStatus.ACTIVE,
  });

  const [registrationType, setRegistrationType] = useState<MutationType | 'NORMAL'>('NORMAL');

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        kkNumber: initialData.kkNumber || '',
        fullName: initialData.fullName || '',
        nik: initialData.nik || '',
        gender: initialData.gender || Gender.MALE,
        birthPlace: initialData.birthPlace || '',
        birthDate: initialData.birthDate || '',
        religion: initialData.religion || RELIGIONS[0],
        education: initialData.education || EDUCATIONS[3],
        maritalStatus: initialData.maritalStatus || MARITAL_STATUSES[0],
        familyPosition: initialData.familyPosition || FAMILY_POSITIONS[0],
        occupation: initialData.occupation || OCCUPATIONS[0],
        residenceStatus: initialData.residenceStatus || ResidenceStatus.OWNED,
        fatherName: initialData.fatherName || '',
        motherName: initialData.motherName || '',
        bloodType: initialData.bloodType || '-',
        phone: initialData.phone || '',
        photoUrl: initialData.photoUrl || '',
        status: initialData.status || ResidentStatus.ACTIVE,
        inactiveDate: initialData.inactiveDate || '',
      });
      setPreviewUrl(initialData.photoUrl || null);
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
        occupation: OCCUPATIONS[0],
        residenceStatus: ResidenceStatus.OWNED,
        fatherName: '',
        motherName: '',
        bloodType: '-',
        phone: '',
        photoUrl: '',
        status: ResidentStatus.ACTIVE,
      });
      setPreviewUrl(null);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `residents/${Date.now()}_${safeFileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, photoUrl: url }));
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      // Give more specific error messages if possible
      if (err.code === 'storage/unauthorized') {
        setError('Gagal: Izin ditolak. Anda harus masuk untuk mengunggah.');
      } else if (err.code === 'storage/quota-exceeded') {
        setError('Gagal: Kuota penyimpanan habis.');
      } else if (err.code === 'storage/retry-limit-exceeded') {
        setError('Gagal: Waktu unggah habis. Periksa koneksi Anda.');
      } else {
        setError(`Gagal mengunggah foto: ${err.message || 'Silakan coba lagi.'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

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
    if (!formData.occupation) {
      setError('Pilih Pekerjaan');
      return;
    }
    if (formData.familyPosition === 'Kepala Keluarga' && !formData.residenceStatus) {
      setError('Pilih Status Tempat Tinggal');
      return;
    }
    if (!formData.fatherName.trim()) {
      setError('Isi Nama Ayah');
      return;
    }
    if (!formData.motherName.trim()) {
      setError('Isi Nama Ibu');
      return;
    }
    if (formData.phone && !/^\d+$/.test(formData.phone)) {
      setError('Nomor Telepon harus berupa angka');
      return;
    }

    // 🔍 Duplicate Check (Identical Data Detection)
    const isDuplicate = residents.some(r => {
      // Skip if we are editing the same resident
      if (initialData && r.id === initialData.id) return false;

      return (
        r.kkNumber === formData.kkNumber &&
        r.nik === formData.nik &&
        r.fullName?.trim().toLowerCase() === formData.fullName?.trim().toLowerCase() &&
        r.gender === formData.gender &&
        r.birthPlace?.trim().toLowerCase() === formData.birthPlace?.trim().toLowerCase() &&
        r.birthDate === formData.birthDate &&
        r.religion === formData.religion &&
        r.education === formData.education &&
        r.maritalStatus === formData.maritalStatus &&
        r.familyPosition === formData.familyPosition &&
        r.occupation === formData.occupation &&
        r.bloodType === formData.bloodType &&
        (r.phone || '') === (formData.phone || '') &&
        r.fatherName?.trim().toLowerCase() === formData.fatherName?.trim().toLowerCase() &&
        r.motherName?.trim().toLowerCase() === formData.motherName?.trim().toLowerCase() &&
        r.residenceStatus === formData.residenceStatus
      );
    });

    if (isDuplicate) {
      setError('Peringatan: Data ini sudah ada dalam sistem (Duplikat Identik). Silakan periksa kembali.');
      return;
    }

    setError(null);
    onSubmit(formData, registrationType !== 'NORMAL' ? registrationType : undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 🛡️ Strict numeric validation for KK and NIK
    if (name === 'kkNumber' || name === 'nik' || name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

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
            {!initialData && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Tipe Pendaftaran / Mutasi Masuk</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'NORMAL', label: 'Biasa', desc: 'Data Existing' },
                    { id: MutationType.BIRTH, label: 'Kelahiran', desc: 'Warga Baru' },
                    { id: MutationType.COMING, label: 'Pindah Datang', desc: 'Warga Baru' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setRegistrationType(type.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        registrationType === type.id
                          ? 'bg-indigo-600/20 border-indigo-500 ring-4 ring-indigo-500/10'
                          : 'bg-slate-950/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <p className={`text-[11px] font-black uppercase tracking-tight ${registrationType === type.id ? 'text-white' : 'text-slate-500'}`}>{type.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-lg flex items-center gap-3 text-xs font-semibold border border-rose-500/20">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Photo Upload Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/30 rounded-2xl border border-white/5 space-y-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="text-slate-600" size={32} />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="text-indigo-400 animate-spin" size={24} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Foto Profil</p>
                <p className="text-[9px] text-slate-600 mt-1 italic">Klik ikon kamera untuk mengunggah (Format: JPG/PNG, Maks. 2MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor KK</label>
                <input
                  type="text"
                  name="kkNumber"
                  value={formData.kkNumber}
                  onChange={handleInputChange}
                  maxLength={16}
                  placeholder="16 digit nomor KK"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 focus:bg-slate-950/60 outline-none text-white transition-all shadow-inner"
                  id="input-kk"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">NIK</label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  maxLength={16}
                  placeholder="16 digit NIK"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 focus:bg-slate-950/60 outline-none text-white transition-all shadow-inner"
                  id="input-nik"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nama Lengkap sesuai KTP"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 focus:bg-slate-950/60 outline-none text-white transition-all shadow-inner"
                  id="input-name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Kelamin</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-indigo-500/50 outline-none appearance-none cursor-pointer"
                  id="select-gender"
                >
                  <option value={Gender.MALE}>Laki-laki</option>
                  <option value={Gender.FEMALE}>Perempuan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Agama</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:border-indigo-500/50 outline-none cursor-pointer"
                  id="select-religion"
                >
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tempat Lahir</label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  placeholder="Kota/Kabupaten"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all font-medium"
                  id="input-birthplace"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tanggal Lahir</label>
                <div className="relative group">
                  <DatePicker
                    selected={formData.birthDate ? parseISO(formData.birthDate) : null}
                    onChange={(date: Date | null) => {
                      if (date && isValid(date)) {
                        setFormData(prev => ({ ...prev, birthDate: format(date, 'yyyy-MM-dd') }));
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Pilih Tanggal"
                    locale="id"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                    id="input-birthdate"
                    autoComplete="off"
                    customInput={
                      <CustomDatePickerInput />
                    }
                  />
                  {formData.birthDate && (
                    <div className="absolute -top-6 right-0">
                      <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-tighter">
                        {calculateAge(formData.birthDate)} Thn
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pendidikan</label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                  id="select-education"
                >
                  {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status Kawin</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                  id="select-marital"
                >
                  {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Hubungan Keluarga</label>
                <select
                  name="familyPosition"
                  value={formData.familyPosition}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                  id="select-family"
                >
                  {FAMILY_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gol. Darah</label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                  id="select-bloodtype"
                >
                  {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>

              {formData.familyPosition === 'Kepala Keluarga' && (
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status Tempat Tinggal</label>
                  <select
                    name="residenceStatus"
                    value={formData.residenceStatus}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                    id="select-residenceStatus"
                    required
                  >
                    {RESIDENCE_STATUSES.map(rs => <option key={rs} value={rs}>{rs}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 outline-none text-white transition-all shadow-inner"
                  id="input-phone"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Ayah</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Nama Lengkap Ayah Kandung"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 outline-none text-white transition-all shadow-inner"
                  id="input-fatherName"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Ibu</label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  placeholder="Nama Lengkap Ibu Kandung"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm focus:border-indigo-500/50 outline-none text-white transition-all shadow-inner"
                  id="input-motherName"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pekerjaan</label>
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                  id="select-occupation"
                  required
                >
                  {OCCUPATIONS.map(p => <option key={p} value={p}>{p}</option>)}
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
