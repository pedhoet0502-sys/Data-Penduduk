export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
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
