
import { Student, GlobalConfig, InvoiceDetail, Attendance } from '../types';

export const calculateAgeInMonths = (dob: string): number => {
  const birth = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const calculateMonthsRemaining = (month: number): number => {
  return ((8 - month) % 12 + 12) % 12 + 1;
};

export const calculateInvoice = (
  student: Student,
  config: GlobalConfig,
  attendanceData: Attendance[],
  currentMonth: number,
  currentYear: number
): InvoiceDetail => {
  const ageMonths = calculateAgeInMonths(student.dob);
  const monthsRemaining = calculateMonthsRemaining(currentMonth);
  
  const currentAttendance = attendanceData.find(
    a => a.studentId === student.id && a.month === currentMonth && a.year === currentYear
  );

  const isFull = !!currentAttendance?.isFullDiscount;
  const isHalf = !!currentAttendance?.isHalfDiscount;

  // 1. Lấy giá gốc dựa trên tuổi
  let baseTuition = ageMonths >= 36 ? config.tuitionOver36 : config.tuitionUnder36;
  let finalTuition = baseTuition;

  // 2. Ô giảm phí CHỈ áp dụng cho Học phí chính
  let discountType: 'none' | '50%' | '100%' = 'none';
  if (isFull) {
    finalTuition = 0;
    discountType = '100%';
  } else if (isHalf) {
    finalTuition = baseTuition / 2;
    discountType = '50%';
  }

  // Tiền ăn tính theo tháng hiện tại
  const absentDays = currentAttendance ? currentAttendance.absentDays : 0;
  
  // LOGIC MỚI: Nếu là bé mới và nhập học trong tháng này, tính lại số ngày ăn tiêu chuẩn
  let effectiveStandardDays = config.standardDays;
  const admission = new Date(student.admissionDate);
  if (admission.getMonth() + 1 === currentMonth && admission.getFullYear() === currentYear) {
    // Đếm số ngày làm việc (Thứ 2 - Thứ 6) TRƯỚC ngày nhập học trong tháng
    let missedDays = 0;
    const tempDate = new Date(currentYear, currentMonth - 1, 1);
    while (tempDate < admission) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Không phải CN (0) hoặc T7 (6)
        missedDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    effectiveStandardDays = Math.max(0, config.standardDays - missedDays);
  }

  const mealFee = (effectiveStandardDays * config.mealFeePerDay) - (absentDays * config.mealFeePerDay);

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
  if (student.isNewStudent) {
    csvcFee = monthsRemaining * config.unitCSVC;
    const matUnitPrice = ageMonths >= 36 ? config.unitMaterialLon : config.unitMaterialNho;
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
      giftedBreakdown
    }
  };
};

export const generateZaloMessage = (invoice: InvoiceDetail, month: number, year: number, config: GlobalConfig): string => {
  const { student, total, tuition, extraFee, csvcFee, materialFee, calculationInfo, discountType } = invoice;
  const formattedDOB = new Date(student.dob).toLocaleDateString('vi-VN');
  const fullMealFee = calculationInfo.effectiveStandardDays * config.mealFeePerDay;
  const absentDeduction = calculationInfo.absentDays * config.mealFeePerDay;

  let msg = `GIẤY BÁO ĐÓNG TIỀN HỌC PHÍ THÁNG ${month} NĂM ${year}.\n\n`;
  msg += `- Họ và tên trẻ : ${student.name.toUpperCase()} SN ${formattedDOB}-${calculationInfo.ageInMonths} tháng.\n`;
  
  let tuitionLabel = `Tiền học phí trong tháng`;
  if (discountType === '100%') tuitionLabel += ` (Miễn 100%)`;
  if (discountType === '50%') tuitionLabel += ` (Giảm 50% - Nửa tháng)`;

  msg += `- ${tuitionLabel} : ${formatCurrency(tuition)} đồng.\n`;
  msg += `- Tiền ăn trong tháng (${calculationInfo.effectiveStandardDays} ngày x ${formatCurrency(config.mealFeePerDay)}) : ${formatCurrency(fullMealFee)} đồng.\n`;
  
  calculationInfo.giftedBreakdown.forEach(item => {
    msg += `- ${item}\n`;
  });

  msg += `- Các khoản phụ thu (Vệ sinh phí, Gaz, Điện, Nước bình...) : ${formatCurrency(extraFee)} đồng.\n`;

  if (csvcFee > 0) msg += `- Cơ sở vật chất (${calculationInfo.monthsRemaining} tháng) : ${formatCurrency(csvcFee)} đồng.\n`;
  if (materialFee > 0) msg += `- Học phẩm (${calculationInfo.monthsRemaining} tháng) : ${formatCurrency(materialFee)} đồng.\n`;

  msg += `- Số ngày nghỉ có phép trong tháng : ${calculationInfo.absentDays} ngày . Trừ lại : ${formatCurrency(absentDeduction)} đồng.\n\n`;
  
  msg += `TỔNG CỘNG : ${formatCurrency(total)} đồng.\n\n`;
  msg += `Thông tin chuyển khoản: Tên thụ hưởng: TRẦN THỊ TRÚC GIANG\n`;
  msg += `Số tài khoản: 6350205 014046 Tại Ngân hàng Agribank Phước Kiển\n`;
  msg += `Nội dung chuyển khoản: ${student.name}, ${student.className}.\n\n`;
  msg += `Phụ huynh vui lòng đóng học phí từ ngày 1 đến 10 tây hàng tháng. Rất mong phụ huynh đóng học phí đúng thời gian qui định của nhà trường.\n`;
  msg += `Xin chân thành cảm ơn!`;

  return msg;
};
