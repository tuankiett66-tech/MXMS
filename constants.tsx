
import { GlobalConfig, Student } from './types';

export const DEFAULT_CONFIG: GlobalConfig = {
  tuitionOver36: 1700000,
  tuitionUnder36: 1800000,
  mealFeePerDay: 32000,
  extraFee: 140000,
  giftedFees: {
    english: 120000,
    drawing: 100000,
    rhythm: 100000,
  },
  unitCSVC: 75000,
  unitMaterialLon: 33000,
  unitMaterialNho: 29000,
  standardDays: 22,
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'HS001',
    name: 'Nguyễn An Nhiên',
    dob: '2021-05-15',
    className: 'Lớp Mầm 1',
    giftedSubjects: { english: true, drawing: false, rhythm: true },
    isNewStudent: true,
    admissionDate: '2025-01-10',
    phoneNumber: '0901234567'
  },
  {
    id: 'HS002',
    name: 'Trần Minh Tâm',
    dob: '2020-02-20',
    className: 'Lớp Chồi 2',
    giftedSubjects: { english: true, drawing: true, rhythm: true },
    isNewStudent: false,
    admissionDate: '2024-08-01',
    phoneNumber: '0911222333'
  }
];

export const MOCK_ATTENDANCE = [
  { studentId: 'HS001', month: 2, year: 2026, absentDays: 2 },
  { studentId: 'HS002', month: 2, year: 2026, absentDays: 0 },
];
