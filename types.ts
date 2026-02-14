
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
}

export interface Attendance {
  studentId: string;
  month: number;
  year: number;
  absentDays: number;
  isHalfDiscount?: boolean; // Giảm 50%
  isFullDiscount?: boolean; // Giảm 100%
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
  discountType: 'none' | '50%' | '100%'; 
  calculationInfo: {
    ageInMonths: number;
    absentDaysLastMonth: number;
    monthsRemaining: number;
    giftedBreakdown: string[];
  };
}
