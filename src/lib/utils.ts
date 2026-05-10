import { differenceInYears, parseISO } from 'date-fns';

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch (e) {
    return 0;
  }
}

export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'];
export const EDUCATIONS = ['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'];
export const MARITAL_STATUSES = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
export const FAMILY_POSITIONS = ['Kepala Keluarga', 'Istri', 'Anak', 'Mertua', 'Orang Tua', 'Cucu', 'Lainnya'];
