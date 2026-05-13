export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
}

export enum ResidenceStatus {
  OWNED = 'Milik Sendiri',
  RENTED = 'Sewa/Kontrak',
  STAYING = 'Menumpang',
  OFFICIAL_RESIDENCE = 'Rumah Dinas',
  OTHERS = 'Lainnya'
}

export enum IDCardStatus {
  LOCAL = 'Setempat',
  OUTSIDE = 'Luar Wilayah'
}

export enum ResidentStatus {
  ACTIVE = 'Aktif',
  DECEASED = 'Meninggal Dunia',
  MOVED_OUT = 'Pindah Domisili',
  INACTIVE = 'Tidak Aktif'
}

export enum MutationType {
  BIRTH = 'Kelahiran',
  DEATH = 'Kematian',
  COMING = 'Penduduk Datang',
  MOVING = 'Penduduk Pindah'
}

export interface Mutation {
  id: string;
  residentId: string;
  residentName: string;
  type: MutationType;
  date: string;
  description: string;
  ownerId: string;
  createdAt: any;
}

export interface Resident {
  id: string;
  kkNumber: string;
  fullName: string;
  nik: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string; // ISO date string
  religion: string;
  education: string;
  maritalStatus: string;
  familyPosition: string;
  occupation: string;
  bloodType: string;
  phone: string;
  fatherName: string;
  motherName: string;
  residenceStatus?: ResidenceStatus;
  idCardStatus?: IDCardStatus;
  residencyCategory?: string;
  status: ResidentStatus;
  inactiveDate?: string;
  photoUrl?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

export interface OperationType {
  CREATE : 'create';
  UPDATE : 'update';
  DELETE : 'delete';
  LIST : 'list';
  GET : 'get';
  WRITE : 'write';
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
