
export interface GiftedSubjects {
  english: boolean;
  drawing: boolean;
  rhythm: boolean;
}

export interface Student {
  id: string;
  name: string;
  dob: string;
  className: string;
  giftedSubjects: GiftedSubjects;
  isNewStudent: boolean;
  admissionDate: string;
  phoneNumber?: string; 
  status?: 'Đang học' | 'Tạm nghỉ' | 'Học hè';
  notes?: string;
  classEntryDate?: string;
  isHalfDiscount?: boolean; // Giảm 50%
  isFullDiscount?: boolean; // Giảm 100%
  tuitionDiscountAmount?: number; // Giảm học phí theo số tiền nhập vào
  lateEnrollmentDays?: number;
}

export interface Attendance {
  studentId: string;
  month: number;
  year: number;
  absentDays: number;
  isHalfDiscount?: boolean; // Giảm 50%
  isFullDiscount?: boolean; // Giảm 100%
  tuitionDiscountAmount?: number; // Giảm học phí theo số tiền nhập vào
}

export interface GlobalConfig {
  tuitionOver36: number; 
  tuitionUnder36: number; 
  mealFeePerDay: number;
  extraFee: number;
  giftedFees: {
    english: number;
    drawing: number;
    rhythm: number;
  };
  unitCSVC: number;
  unitMaterialLon: number;
  unitMaterialNho: number;
  standardDays: number;
  startMonth?: number;
  endMonth?: number;
  scriptUrl?: string;
}

export interface InvoiceDetail {
  student: Student;
  tuition: number;
  mealFee: number;
  giftedTotal: number;
  csvcFee: number;
  materialFee: number;
  extraFee: number;
  total: number;
  discountType: 'none' | '50%' | '100%' | 'custom'; 
  calculationInfo: {
    ageInMonths: number;
    absentDays: number;
    effectiveStandardDays: number;
    monthsRemaining: number;
    giftedBreakdown: string[];
    lateEnrollmentDays?: number;
  };
}
