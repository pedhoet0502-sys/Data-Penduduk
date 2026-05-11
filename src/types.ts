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
