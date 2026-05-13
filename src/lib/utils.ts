import { differenceInYears, parseISO } from 'date-fns';

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch (e) {
    return 0;
  }
}

export function getAgeCategory(age: number): string {
  if (age <= 5) return 'Balita (0-5)';
  if (age <= 11) return 'Anak-anak (6-11)';
  if (age <= 16) return 'Remaja Awal (12-16)';
  if (age <= 25) return 'Remaja Akhir (17-25)';
  if (age <= 35) return 'Dewasa Awal (26-35)';
  if (age <= 45) return 'Dewasa Akhir (36-45)';
  if (age <= 55) return 'Lansia Awal (46-55)';
  if (age <= 65) return 'Lansia Akhir (56-65)';
  return 'Manula (>65)';
}

export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'];
export const EDUCATIONS = ['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'];
export const MARITAL_STATUSES = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati', 'Duda', 'Janda'];
export const FAMILY_POSITIONS = ['Kepala Keluarga', 'Istri', 'Anak', 'Mertua', 'Orang Tua', 'Cucu', 'Lainnya'];
export const BLOOD_TYPES = ['-', 'A', 'B', 'AB', 'O'];
export const RESIDENCE_STATUSES = ['Milik Sendiri', 'Sewa/Kontrak', 'Menumpang', 'Rumah Dinas', 'Lainnya'];
export const ID_CARD_STATUSES = ['Setempat', 'Luar Wilayah'];

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export function getColorFromName(name: string): string {
  if (!name) return 'bg-slate-700';
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
    'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-orange-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

export const OCCUPATIONS = [
  'Belum/Tidak Bekerja',
  'Mengurus Rumah Tangga',
  'Pelajar/Mahasiswa',
  'Pensiunan',
  'Pegawai Negeri Sipil (PNS)',
  'Tentara Nasional Indonesia (TNI)',
  'Kepolisian RI (POLRI)',
  'Perdagangan',
  'Petani/Pekebun',
  'Peternak',
  'Nelayan/Perikanan',
  'Industri',
  'Konstruksi',
  'Transportasi',
  'Karyawan Swasta',
  'Karyawan BUMN',
  'Karyawan BUMD',
  'Karyawan Honorer',
  'Buruh Harian Lepas',
  'Buruh Tani/Perkebunan',
  'Buruh Nelayan/Perikanan',
  'Buruh Peternakan',
  'Pembantu Rumah Tangga',
  'Tukang Cukur',
  'Tukang Listrik',
  'Tukang Batu',
  'Tukang Kayu',
  'Tukang Sol Sepatu',
  'Tukang Las/Pandai Besi',
  'Tukang Jahit',
  'Tukang Gigi',
  'Penata Rias',
  'Penata Busana',
  'Penata Rambut',
  'Mekanik',
  'Seniman',
  'Tabib',
  'Paraji',
  'Perancang Busana',
  'Penterjemah',
  'Imam Masjid',
  'Pendeta',
  'Pastor',
  'Wartawan',
  'Ustadz/Mubaligh',
  'Juru Masak',
  'Promotor Acara',
  'Anggota DPR-RI',
  'Anggota DPD',
  'Anggota BPK',
  'Presiden',
  'Wakil Presiden',
  'Anggota Mahkamah Konstitusi',
  'Anggota Kabinet/Kementerian',
  'Duta Besar',
  'Gubernur',
  'Wakil Gubernur',
  'Bupati',
  'Wakil Bupati',
  'Walikota',
  'Wakil Walikota',
  'Anggota DPRD Provinsi',
  'Anggota DPRD Kabupaten/Kota',
  'Dosen',
  'Guru',
  'Pilot',
  'Pengacara',
  'Notaris',
  'Arsitek',
  'Akuntan',
  'Konsultan',
  'Dokter',
  'Bidan',
  'Perawat',
  'Apoteker',
  'Psikiater/Psikolog',
  'Penyiar Televisi',
  'Penyiar Radio',
  'Pelaut',
  'Peneliti',
  'Sopir',
  'Pialang',
  'Paranormal',
  'Pedagang',
  'Perangkat Desa',
  'Kepala Desa',
  'Biarawan',
  'Wiraswasta'
];
