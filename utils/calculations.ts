
import { Student, GlobalConfig, InvoiceDetail, Attendance } from '../types';

export const formatDateToVietnamYMD = (d: Date): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    let year = '';
    let month = '';
    let day = '';
    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
    }
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (err) {
    console.error('Error formatting date to Asia/Ho_Chi_Minh timezone:', err);
  }
  
  // Fallback to local timezone dates if Intl fails
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeToYMD = (dateStr: any): string => {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return formatDateToVietnamYMD(d);
    } catch {
      return '';
    }
  }

  const cleanStr = dateStr.trim();
  // 1. Nếu đã đúng chuẩn YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }

  // 2. Nếu là ISO string hoặc định dạng rác có chứa T
  if (cleanStr.includes('T')) {
    try {
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        return formatDateToVietnamYMD(d);
      }
    } catch {}
    
    const rawDate = cleanStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      return rawDate;
    }
  }

  // 3. Nếu là dạng DD/MM/YYYY hoặc D/M/YYYY
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      if (y.length === 4) {
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 4. Nếu là dạng DD-MM-YYYY hoặc D-M-YYYY (năm ở cuối)
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  // 5. Thử parse thông thường nhưng an toàn với timezone địa phương
  try {
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return formatDateToVietnamYMD(d);
    }
  } catch {}

  return '';
};

export const formatDateToDMY = (dateStr: any): string => {
  const ymd = normalizeToYMD(dateStr);
  if (!ymd) return '';
  const parts = ymd.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const calculateAgeInMonths = (dob: string): number => {
  const normalized = normalizeToYMD(dob);
  if (!normalized) return 0;
  const parts = normalized.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    const birth = new Date(year, month, day);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  }
  return 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const isNurseryClass = (className: string): boolean => {
  if (!className) return false;
  const name = className.toLowerCase().normalize("NFC");
  const norm = className.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return name.includes('nhà trẻ') || 
         name.includes('nha trẻ') ||
         name.includes('khối nt') ||
         norm.includes('nha tre') ||
         norm.includes('nt');
};

export const isPreschoolClass = (className: string): boolean => {
  if (!className) return false;
  return !isNurseryClass(className);
};

export const sortStudents = (list: Student[]): Student[] => {
  return [...list].sort((a, b) => {
    // 1. Sắp xếp theo trạng thái: Đang học trước, Tạm nghỉ sau
    const statusA = a.status === 'Tạm nghỉ' ? 1 : 0;
    const statusB = b.status === 'Tạm nghỉ' ? 1 : 0;
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // 2. Phân loại lớp: Lớp Mẫu giáo xếp trước, Lớp Nhà trẻ xếp sau
    const isNurseryA = isNurseryClass(a.className) ? 1 : 0;
    const isNurseryB = isNurseryClass(b.className) ? 1 : 0;
    if (isNurseryA !== isNurseryB) {
      return isNurseryA - isNurseryB;
    }

    // 3. Sắp xếp theo mã số số thứ tự phía sau (M1, M2... N1, N2... T1, T2...)
    const getNum = (id: string) => {
      const match = id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const isCustomIDA = a.id.startsWith('M') || a.id.startsWith('N') || a.id.startsWith('T');
    const isCustomIDB = b.id.startsWith('M') || b.id.startsWith('N') || b.id.startsWith('T');

    if (isCustomIDA && isCustomIDB) {
      return getNum(a.id) - getNum(b.id);
    }

    // Dự phòng khi chưa đồng bộ mã số: Sắp xếp theo ngày nhập học / ngày lập dòng và tên
    const parseDate = (valArr: (string | undefined)[]) => {
      for (const val of valArr) {
        if (!val) continue;
        const time = new Date(val).getTime();
        if (!isNaN(time)) return time;
      }
      return 0;
    };
    const dateA = parseDate([a.classEntryDate, a.admissionDate]);
    const dateB = parseDate([b.classEntryDate, b.admissionDate]);
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    return a.name.localeCompare(b.name, 'vi');
  });
};

export const ensureClassEntryDates = (list: Student[]): Student[] => {
  const now = Date.now();
  return list.map((student, index) => {
    const dob = normalizeToYMD(student.dob);
    const admissionDate = normalizeToYMD(student.admissionDate);
    
    let classEntryDate = student.classEntryDate;
    if (!classEntryDate) {
      const admissionTime = admissionDate ? new Date(admissionDate).getTime() : NaN;
      const fallbackTime = !isNaN(admissionTime) ? admissionTime + index : now + index * 1000;
      classEntryDate = new Date(fallbackTime).toISOString();
    }
    
    return {
      ...student,
      dob,
      admissionDate,
      classEntryDate
    };
  });
};

export const getSchoolYearLabel = (currentMonth: number, currentYear: number, startMonth: number = 8): string => {
  const startYear = currentMonth >= startMonth ? currentYear : currentYear - 1;
  return `${startYear}-${startYear + 1}`;
};

export const isStudentNew = (
  student: { isNewStudent?: boolean },
  currentMonth: number,
  config: { startMonth?: number; autoCSVCInStartMonth?: boolean }
): boolean => {
  if (currentMonth === (config.startMonth || 8)) {
    if (config.autoCSVCInStartMonth) {
      return student.isNewStudent !== false;
    } else {
      return !!student.isNewStudent;
    }
  }
  return !!student.isNewStudent;
};

export const calculateMonthsRemaining = (month: number, startMonth: number = 8, endMonth: number = 7): number => {
  const remaining = ((endMonth - month) % 12 + 12) % 12 + 1;
  const maxMonths = endMonth >= startMonth
    ? endMonth - startMonth + 1
    : (12 - startMonth + 1) + endMonth;
  return remaining <= maxMonths ? remaining : maxMonths;
};

export const calculateInvoice = (
  student: Student,
  config: GlobalConfig,
  attendanceData: Attendance[],
  currentMonth: number,
  currentYear: number
): InvoiceDetail => {
  const ageMonths = calculateAgeInMonths(student.dob);
  const monthsRemaining = calculateMonthsRemaining(currentMonth, config.startMonth || 8, config.endMonth || 7);
  
  const currentAttendance = attendanceData.find(
    a => a.studentId === student.id && a.month === currentMonth && a.year === currentYear
  );

  const isFull = student.isFullDiscount !== undefined ? !!student.isFullDiscount : !!currentAttendance?.isFullDiscount;
  const isHalf = student.isHalfDiscount !== undefined ? !!student.isHalfDiscount : !!currentAttendance?.isHalfDiscount;
  const discountAmount = student.tuitionDiscountAmount !== undefined ? student.tuitionDiscountAmount : currentAttendance?.tuitionDiscountAmount;

  // 1. Lấy giá gốc dựa trên tuổi
  let baseTuition = ageMonths >= 36 ? config.tuitionOver36 : config.tuitionUnder36;
  let finalTuition = baseTuition;

  // 2. Ô giảm phí CHỈ áp dụng cho Học phí chính
  let discountType: 'none' | '50%' | '100%' | 'custom' = 'none';
  if (isFull) {
    finalTuition = 0;
    discountType = '100%';
  } else if (discountAmount !== undefined && discountAmount > 0) {
    finalTuition = Math.max(0, baseTuition - discountAmount);
    discountType = 'custom';
  } else if (isHalf) {
    finalTuition = baseTuition / 2;
    discountType = '50%';
  }

  // Tiền ăn tính theo tháng hiện tại
  const absentDays = currentAttendance ? currentAttendance.absentDays : 0;
  const lateEnrollmentDays = student.lateEnrollmentDays || 0;
  
  // Đảm bảo "Ngày học chuẩn" luôn đúng theo cài đặt trên ứng dụng của bạn cho tất cả học sinh (bao gồm cả bé mới).
  // Số ngày học chuẩn sẽ không tự động điều chỉnh nhảy ngày để người dùng có toàn quyền kiểm soát tiền ăn.
  const effectiveStandardDays = config.standardDays;

  const lateEnrollmentDeduction = lateEnrollmentDays * config.mealFeePerDay;
  let mealFee = (effectiveStandardDays * config.mealFeePerDay) - (absentDays * config.mealFeePerDay) - lateEnrollmentDeduction;
  if (mealFee < 0) mealFee = 0;

  let giftedTotal = 0;
  const giftedBreakdown: string[] = [];
  
  // LOGIC MỚI: Luôn tính tiền 100% môn năng khiếu, không quan tâm ô giảm học phí
  if (student.giftedSubjects.english) {
    const fee = config.giftedFees.english;
    giftedTotal += fee;
    giftedBreakdown.push(`Học Anh Văn : ${formatCurrency(fee)} đồng.`);
  }
  if (student.giftedSubjects.drawing) {
    const fee = config.giftedFees.drawing;
    giftedTotal += fee;
    giftedBreakdown.push(`Học Vẽ : ${formatCurrency(fee)} đồng.`);
  }
  if (student.giftedSubjects.rhythm) {
    const fee = config.giftedFees.rhythm;
    giftedTotal += fee;
    giftedBreakdown.push(`Học Nhịp Điệu : ${formatCurrency(fee)} đồng.`);
  }

  let csvcFee = 0;
  let materialFee = 0;
  if (isStudentNew(student, currentMonth, config)) {
    csvcFee = monthsRemaining * config.unitCSVC;
    const isNursery = isNurseryClass(student.className);
    const isPreschool = isPreschoolClass(student.className);
    const matUnitPrice = isNursery 
      ? config.unitMaterialNho 
      : (isPreschool ? config.unitMaterialLon : (ageMonths >= 36 ? config.unitMaterialLon : config.unitMaterialNho));
    materialFee = monthsRemaining * matUnitPrice;
  }

  const total = finalTuition + mealFee + giftedTotal + csvcFee + materialFee + config.extraFee;

  return {
    student,
    tuition: finalTuition,
    mealFee,
    giftedTotal,
    csvcFee,
    materialFee,
    extraFee: config.extraFee,
    total,
    discountType,
    calculationInfo: {
      ageInMonths: ageMonths,
      absentDays: absentDays,
      effectiveStandardDays,
      monthsRemaining,
      giftedBreakdown,
      lateEnrollmentDays
    }
  };
};

export const generateZaloMessage = (invoice: InvoiceDetail, month: number, year: number, config: GlobalConfig): string => {
  const { student, total, tuition, extraFee, csvcFee, materialFee, calculationInfo, discountType } = invoice;
  const formattedDOB = formatDateToDMY(student.dob);
  const lateEnrollmentDays = calculationInfo.lateEnrollmentDays || 0;
  const activeMealDays = calculationInfo.effectiveStandardDays - lateEnrollmentDays;
  const fullMealFee = activeMealDays * config.mealFeePerDay;
  const absentDeduction = calculationInfo.absentDays * config.mealFeePerDay;

  let msg = `GIẤY BÁO ĐÓNG TIỀN HỌC PHÍ THÁNG ${month} NĂM ${year}.\n\n`;
  msg += `- Họ và tên trẻ : ${student.name.toUpperCase()} SN ${formattedDOB}-${calculationInfo.ageInMonths} tháng.\n`;
  
  let tuitionLabel = `Tiền học phí trong tháng`;
  if (discountType === '100%') tuitionLabel += ` (Miễn 100%)`;
  if (discountType === '50%') tuitionLabel += ` (Giảm 50% - Nửa tháng)`;
  const customDisc = student.tuitionDiscountAmount !== undefined ? student.tuitionDiscountAmount : 0;
  if (discountType === 'custom' && customDisc > 0) tuitionLabel += ` (Giảm ${formatCurrency(customDisc)}đ)`;

  msg += `- ${tuitionLabel} : ${formatCurrency(tuition)} đồng.\n`;
  msg += `- Tiền ăn trong tháng (${activeMealDays} ngày x ${formatCurrency(config.mealFeePerDay)}) : ${formatCurrency(fullMealFee)} đồng.\n`;
  
  calculationInfo.giftedBreakdown.forEach(item => {
    msg += `- ${item}\n`;
  });

  msg += `- Các khoản phụ thu (Vệ sinh phí, Gaz, Điện, Nước bình...) : ${formatCurrency(extraFee)} đồng.\n`;

  if (csvcFee > 0) msg += `- Cơ sở vật chất (${calculationInfo.monthsRemaining} tháng) : ${formatCurrency(csvcFee)} đồng.\n`;
  if (materialFee > 0) msg += `- Học phẩm (${calculationInfo.monthsRemaining} tháng) : ${formatCurrency(materialFee)} đồng.\n`;

  msg += `- Số ngày nghỉ có phép trong tháng : ${calculationInfo.absentDays} ngày . Trừ lại : ${formatCurrency(absentDeduction)} đồng.\n`;
  
  if (student.notes) {
    msg += `* Ghi chú: ${student.notes}\n`;
  }
  
  msg += `\n`;
  
  msg += `TỔNG CỘNG : ${formatCurrency(total)} đồng.\n\n`;
  msg += `Thông tin chuyển khoản: Tên thụ hưởng: TRẦN THỊ TRÚC GIANG\n`;
  msg += `Số tài khoản: 6350205 014046 Tại Ngân hàng Agribank Phước Kiển\n`;
  msg += `Nội dung chuyển khoản: ${student.name}, ${student.className}.\n\n`;
  msg += `Phụ huynh vui lòng đóng học phí từ ngày 1 đến 10 tây hàng tháng. Rất mong phụ huynh đóng học phí đúng thời gian qui định của nhà trường.\n`;
  msg += `Xin chân thành cảm ơn!`;

  return msg;
};

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const syncStudentIdsAndAttendance = (
  studentsList: Student[],
  attendanceList: Attendance[]
): { students: Student[]; attendance: Attendance[] } => {
  const compareByDateAndName = (a: Student, b: Student) => {
    const parseDate = (valArr: (string | undefined)[]) => {
      for (const val of valArr) {
        if (!val) continue;
        const time = new Date(val).getTime();
        if (!isNaN(time)) return time;
      }
      return 0;
    };
    const dateA = parseDate([a.classEntryDate, a.admissionDate]);
    const dateB = parseDate([b.classEntryDate, b.admissionDate]);
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    return a.name.localeCompare(b.name, 'vi');
  };

  // 1. Phân chia học sinh đang học và tạm nghỉ
  const activePreschool = studentsList
    .filter(s => s.status !== 'Tạm nghỉ' && isPreschoolClass(s.className))
    .sort(compareByDateAndName);

  const activeNursery = studentsList
    .filter(s => s.status !== 'Tạm nghỉ' && isNurseryClass(s.className))
    .sort(compareByDateAndName);

  const paused = studentsList
    .filter(s => s.status === 'Tạm nghỉ')
    .sort(compareByDateAndName);

  const newStudents: Student[] = [];
  const idMap: Record<string, string> = {};

  // Gán M1, M2... cho Lớp Mẫu giáo
  activePreschool.forEach((student, index) => {
    const newId = `M${index + 1}`;
    idMap[student.id] = newId;
    newStudents.push({
      ...student,
      id: newId
    });
  });

  // Gán N1, N2... cho Lớp Nhà trẻ
  activeNursery.forEach((student, index) => {
    const newId = `N${index + 1}`;
    idMap[student.id] = newId;
    newStudents.push({
      ...student,
      id: newId
    });
  });

  // Gán T1, T2... cho nhóm Tạm nghỉ
  paused.forEach((student, index) => {
    const newId = `T${index + 1}`;
    idMap[student.id] = newId;
    newStudents.push({
      ...student,
      id: newId
    });
  });

  // 2. Cập nhật danh sách điểm danh theo mã định danh mới
  const newAttendance = attendanceList.map(att => {
    if (idMap[att.studentId]) {
      return {
        ...att,
        studentId: idMap[att.studentId]
      };
    }
    return att;
  });

  return {
    students: newStudents,
    attendance: newAttendance
  };
};
