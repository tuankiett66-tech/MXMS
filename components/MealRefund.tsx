import React, { useState, useMemo } from 'react';
import { Printer, FileSpreadsheet, UserPlus, CheckSquare, Square } from 'lucide-react';
import { Card } from './Common';
import { Student, GlobalConfig, Attendance } from '../types';
import { calculateInvoice, formatCurrency, sortStudents, isPreschoolClass, isNurseryClass } from '../utils/calculations';
import * as XLSX from 'xlsx-js-style';

interface MealRefundProps {
  students: Student[];
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  onUpdateAbsentDays: (studentId: string, absentDays: number) => void;
}

export const MealRefund = ({ students, config, attendance, currentMonth, currentYear, onUpdateAbsentDays }: MealRefundProps) => {
  const [activeGroup, setActiveGroup] = useState<'preschool' | 'nursery'>('preschool');
  const [onlyWithAbsents, setOnlyWithAbsents] = useState<boolean>(true);

  // Filter students by active status (skip suspended students) and by selected group
  const filteredStudents = useMemo(() => {
    const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
    const sorted = sortStudents(activeStudents);
    const inGroup = sorted.filter(s => {
      if (activeGroup === 'preschool') {
        return isPreschoolClass(s.className);
      } else {
        return isNurseryClass(s.className);
      }
    });

    if (onlyWithAbsents) {
      return inGroup.filter(s => {
        const matchingAttendance = attendance.find(
          a => a.studentId === s.id && a.month === currentMonth && a.year === currentYear
        );
        return matchingAttendance && matchingAttendance.absentDays > 0;
      });
    }

    return inGroup;
  }, [students, activeGroup, onlyWithAbsents, attendance, currentMonth, currentYear]);

  // Children in current group who have exactly 0 absent days (used for the quick-add list)
  const studentsWithNoAbsents = useMemo(() => {
    const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
    const sorted = sortStudents(activeStudents);
    const inGroup = sorted.filter(s => {
      if (activeGroup === 'preschool') {
        return isPreschoolClass(s.className);
      } else {
        return isNurseryClass(s.className);
      }
    });

    return inGroup.filter(s => {
      const matchingAttendance = attendance.find(
        a => a.studentId === s.id && a.month === currentMonth && a.year === currentYear
      );
      return !matchingAttendance || matchingAttendance.absentDays === 0;
    });
  }, [students, activeGroup, attendance, currentMonth, currentYear]);

  // Calculate calendar days in selected month/year
  const calendarDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  // Calculate invoice data for each student
  const tableData = useMemo(() => {
    return filteredStudents.map((s, index) => {
      const inv = calculateInvoice(s, config, attendance, currentMonth, currentYear);
      const absentDays = inv.calculationInfo.absentDays;
      const mealFeePerDay = config.mealFeePerDay;
      const refundAmount = absentDays * mealFeePerDay;
      const scheduledDays = inv.calculationInfo.effectiveStandardDays; // "Số ngày đi học"

      const fullNameAndDob = s.name.toUpperCase();

      return {
        stt: index + 1,
        studentId: s.id,
        name: s.name.toUpperCase(),
        fullNameAndDob,
        class: s.className,
        scheduledDays,
        absentDays,
        mealFeePerDay,
        refundAmount,
      };
    });
  }, [filteredStudents, config, attendance, currentMonth, currentYear]);

  // Totals for the summary row
  const totals = useMemo(() => {
    return tableData.reduce((acc, curr) => {
      return {
        absentDays: acc.absentDays + curr.absentDays,
        refundAmount: acc.refundAmount + curr.refundAmount
      };
    }, { absentDays: 0, refundAmount: 0 });
  }, [tableData]);

  const groupLabel = activeGroup === 'preschool' ? 'Khối Mẫu Giáo' : 'Khối Nhà Trẻ';

  // Export to Excel according to the design criteria shown in the user's paper image
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const title = `SỔ THANH TOÁN TIỀN ĂN LỚP ${activeGroup === 'preschool' ? 'MẪU GIÁO' : 'NHÀ TRẺ'}`;
    const subTitle = `THÁNG ${currentMonth} NĂM ${currentYear}`;
    
    // Column headers
    const headers = [
      "STT", 
      "HỌ VÀ TÊN BÉ", 
      "TỔNG SỐ NGÀY TRONG THÁNG", 
      "SỐ NGÀY ĐI HỌC", 
      "SỐ NGÀY NGHỈ HỌC", 
      "SỐ TIỀN ĂN/NGÀY", 
      "SỐ TIỀN HOÀN LẠI", 
      "KÝ NHẬN"
    ];

    // Map rows
    const rows = tableData.map(item => [
      item.stt,
      item.fullNameAndDob,
      calendarDays,
      item.scheduledDays,
      item.absentDays,
      item.mealFeePerDay,
      item.refundAmount,
      "" // Cột ký nhận để trống để điền tay hoặc ký tên
    ]);

    // Add total row
    const totalRow = [
      "",
      "TỔNG CỘNG",
      "",
      "",
      totals.absentDays,
      "",
      totals.refundAmount,
      ""
    ];

    const wsData = [[title], [subTitle], [], headers, ...rows, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const thinBorder = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    // Row heights matching paper comfort
    ws['!rows'] = [
      { hpt: 28 }, // Tiêu đề chính
      { hpt: 20 }, // Tiêu đề phụ
      { hpt: 10 }, // Trống
      { hpt: 26 }, // Khối tiêu đề
      ...rows.map(() => ({ hpt: 24 })), // Dữ liệu rộng rãi
      { hpt: 26 }  // Dòng tổng cộng
    ];

    // Alignments and styles
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (!cell) continue;

        if (R === 0) {
          // Tiêu đề chính
          cell.s = {
            font: { name: "Arial", sz: 14, bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else if (R === 1) {
          // Tiêu đề phụ
          cell.s = {
            font: { name: "Arial", sz: 11, bold: true, italic: true, color: { rgb: "555555" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else if (R === 3) {
          // Headers
          cell.s = {
            font: { name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "F1F5F9" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: thinBorder
          };
        } else if (R > 3) {
          const isLastRow = R === range.e.r;
          
          cell.s = {
            font: { name: "Arial", sz: 11, bold: isLastRow, color: { rgb: "000000" } },
            alignment: { vertical: "center" },
            border: thinBorder
          };

          if (isLastRow) {
            cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
          }

          if (C === 0) {
            // STT
            cell.s.alignment = { horizontal: "center", vertical: "center" };
          } else if (C === 1) {
            // Họ tên bé
            cell.s.alignment = { horizontal: "left", vertical: "center" };
          } else if (C === 2 || C === 3 || C === 4) {
            // Ngày trong tháng, Đi học, Nghỉ học
            cell.s.alignment = { horizontal: "center", vertical: "center" };
            if (cell.v !== "") {
              cell.t = 'n';
              cell.z = '#,##0';
            }
          } else if (C === 5 || C === 6) {
            // Số tiền ăn, Số tiền hoàn lại
            cell.s.alignment = { horizontal: "right", vertical: "center" };
            if (cell.v !== "") {
              cell.t = 'n';
              cell.z = '#,##0';
            }
          } else if (C === 7) {
            // Ký nhận
            cell.s.alignment = { horizontal: "center", vertical: "center" };
          }
        }
      }
    }

    // Merges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Gộp tiêu đề lớn
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Gộp tiêu đề phụ
      { s: { r: range.e.r, c: 1 }, e: { r: range.e.r, c: 3 } } // Gộp "TỔNG CỘNG"
    ];

    // Col widths
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 40 }, // Họ và tên bé (rộng hơn để chứa SN)
      { wch: 15 }, // Tổng ngày trong tháng
      { wch: 15 }, // Số ngày đi học
      { wch: 15 }, // Số ngày nghỉ
      { wch: 16 }, // Tiền ăn/Ngày
      { wch: 18 }, // Tiền hoàn lại
      { wch: 16 }  // Ký nhận
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Sổ hoàn tiền ăn");
    XLSX.writeFile(wb, `So_Thanh_Toan_Tien_An_KHOI_${activeGroup.toUpperCase()}_T${currentMonth}_${currentYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <style>{`
        .print-only-num {
          display: none !important;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print-only-num {
            display: inline !important;
            font-size: 15px !important;
            font-weight: 900 !important;
            color: #000 !important;
            border: none !important;
          }
          #meal-refund-print-area, #meal-refund-print-area * {
            visibility: visible;
          }
          #meal-refund-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000 !important;
            background-color: #fff !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            color: #000 !important;
            padding: 7px 5px !important;
            font-size: 13px !important;
            font-weight: 800 !important;
          }
          td.print-bold-num, td.print-bold-num span {
            font-size: 15px !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 900 !important;
            font-size: 11px !important;
          }
          .print-title {
            font-size: 18px !important;
            font-weight: 900 !important;
            text-align: center !important;
            margin-bottom: 4px !important;
            text-transform: uppercase !important;
          }
          .print-subtitle {
            font-size: 12px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            text-transform: uppercase !important;
          }
        }
      `}</style>

      {/* Selector & Action tab controls */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 no-print bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lớp / Khối selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveGroup('preschool')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-350 cursor-pointer ${activeGroup === 'preschool' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Lớp Mẫu Giáo
            </button>
            <button
              onClick={() => setActiveGroup('nursery')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-350 cursor-pointer ${activeGroup === 'nursery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Lớp Nhà Trẻ
            </button>
          </div>

          {/* Toggle "Chỉ hiện các bé có ngày nghỉ" */}
          <button
            onClick={() => setOnlyWithAbsents(!onlyWithAbsents)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 text-xs font-black uppercase tracking-wide cursor-pointer ${
              onlyWithAbsents 
                ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-500 text-amber-700 font-extrabold' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {onlyWithAbsents ? (
              <CheckSquare className="w-4 h-4 text-amber-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            Chỉ hiện bé có ngày nghỉ
          </button>
        </div>

        {/* Quick add and actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Add-student-to-refund dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-2xl px-3 py-2 w-full md:w-64 transition-colors">
            <UserPlus size={16} className="text-slate-400 shrink-0" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateAbsentDays(e.target.value, 1);
                }
              }}
              className="bg-transparent border-none text-xs font-black text-slate-700 outline-none w-full cursor-pointer uppercase"
            >
              <option value="">+ THÊM NHANH BÉ VÀO SỔ...</option>
              {studentsWithNoAbsents.length === 0 ? (
                <option disabled>TẤT CẢ CC BÉ ĐÃ CÓ MẶT</option>
              ) : (
                studentsWithNoAbsents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name.toUpperCase()} ({s.className})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Document export & print actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={exportExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-100 transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} /> Xuất Excel
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition-all active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> In Sổ (A4)
            </button>
          </div>
        </div>
      </div>

      {/* Table Area (with responsive desktop container and absolute print target class) */}
      <Card className="p-6 md:p-10 shadow-sm border border-slate-100 overflow-hidden" id="meal-refund-print-area">
        {/* Printable headers */}
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight print-title">
            SỔ THANH TOÁN TIỀN ĂN LỚP {activeGroup === 'preschool' ? 'MẪU GIÁO' : 'NHÀ TRẺ'}
          </h3>
          <p className="text-sm font-black text-slate-500 tracking-wider uppercase mt-1 print-subtitle">
            THÁNG {currentMonth} NĂM {currentYear}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-750 text-[10px] md:text-xs font-black uppercase tracking-wider">
                <th className="py-4 px-2 text-center border border-slate-200 w-10 text-slate-900">STT</th>
                <th className="py-4 px-4 border border-slate-200 min-w-[220px] md:min-w-[260px] w-auto text-slate-900">HỌ VÀ TÊN BÉ</th>
                <th className="py-4 px-2 text-center border border-slate-200 w-24 text-slate-900">TỔNG SỐ NGÀY<br/>TRONG THÁNG</th>
                <th className="py-4 px-2 text-center border border-slate-200 w-20 text-slate-900">SỐ NGÀY<br/>ĐI HỌC</th>
                <th className="py-4 px-2 text-center border border-slate-200 w-20 text-slate-900">SỐ NGÀY<br/>NGHỈ HỌC</th>
                <th className="py-4 px-3 text-right border border-slate-200 w-28 text-slate-900">SỐ TIỀN ĂN<br/>/NGÀY (VNĐ)</th>
                <th className="py-4 px-3 text-right border border-slate-200 w-28 text-slate-900">SỐ TIỀN<br/>HOÀN LẠI (VNĐ)</th>
                <th className="py-4 px-3 text-center border border-slate-200 w-24 text-slate-900">KÝ NHẬN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-800 font-bold">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 uppercase tracking-widest font-black bg-slate-50/50">
                    Sổ trống (Không có bé nghỉ) <br />
                    <span className="text-[10px] font-bold text-slate-400 mt-2 block tracking-normal italic normal-case">
                      (Bấm nút "Thêm nhanh bé vào sổ" ở trên hoặc tắt chiếc phễu lọc "Chỉ hiện bé có ngày nghỉ" để tự do chỉnh sửa)
                    </span>
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2 text-center border border-slate-150 font-mono text-slate-455 print-bold-num">{row.stt}</td>
                    <td className="py-3 px-4 border border-slate-150 font-extrabold uppercase text-slate-900 tracking-tight whitespace-nowrap">
                      {row.fullNameAndDob}
                    </td>
                    <td className="py-3 px-2 text-center border border-slate-150 text-slate-600 font-mono print-bold-num">
                      {calendarDays}
                    </td>
                    <td className="py-3 px-2 text-center border border-slate-150 text-emerald-700 font-black font-mono print-bold-num">
                      {row.scheduledDays}
                    </td>
                    
                    {/* Interactive Input with high contrast, elegant state handling */}
                    <td className="py-1 px-1 text-center border border-slate-150 font-black font-mono print-bold-num">
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          max={calendarDays}
                          value={row.absentDays}
                          onChange={(e) => onUpdateAbsentDays(row.studentId, parseInt(e.target.value) || 0)}
                          className="no-print w-16 px-2 py-1 text-center bg-slate-50 hover:bg-slate-100 focus:bg-amber-50 focus:border-amber-500 border border-slate-250 rounded-xl font-black text-amber-700 outline-none transition-all duration-150"
                        />
                        <span className="print-only-num">
                          {row.absentDays > 0 ? row.absentDays : '0'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right border border-slate-150 font-mono text-slate-650 print-bold-num">
                      {formatCurrency(row.mealFeePerDay)}
                    </td>
                    <td className="py-3 px-3 text-right border border-slate-150 font-black text-rose-600 font-mono bg-rose-50/10 print-bold-num">
                      {row.refundAmount > 0 ? formatCurrency(row.refundAmount) : '0'}
                    </td>
                    <td className="py-3 px-3 border border-slate-150 text-center text-slate-300">
                      {/* Blank cell for signature on print */}
                      <span className="opacity-0">Ký nhận</span>
                    </td>
                  </tr>
                ))
              )}
              {tableData.length > 0 && (
                <tr className="bg-slate-50 font-black text-xs md:text-sm text-slate-900">
                  <td colSpan={4} className="py-4 px-4 text-right border border-slate-200 font-black uppercase tracking-wide print-bold-num">
                    TỔNG CỘNG HOÀN LẠI:
                  </td>
                  <td className="py-4 px-3 text-center border border-slate-200 text-amber-700 font-mono print-bold-num">
                    {totals.absentDays} ngày nghỉ
                  </td>
                  <td className="py-4 px-4 border border-slate-200"></td>
                  <td className="py-4 px-4 text-right border border-slate-200 text-rose-700 font-mono bg-rose-50/50 print-bold-num">
                    {formatCurrency(totals.refundAmount)} đ
                  </td>
                  <td className="py-4 px-4 border border-slate-200"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Small print note / signers area at the bottom */}
        <div className="hidden print:flex justify-between items-start mt-12 text-[11px] text-black font-bold">
          <div className="text-center w-48">
            <p className="uppercase font-black text-[9px] tracking-wider text-slate-500 mb-1">Người Lập Bảng</p>
            <p className="italic text-slate-400 text-[9px] font-medium">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div className="text-center w-64">
            <p className="mb-1">Ngày ...... tháng ...... năm 2026</p>
            <p className="uppercase font-black text-[9px] tracking-wider text-slate-500 mb-1">Hiệu Trưởng Duyệt</p>
            <p className="italic text-slate-400 text-[9px] font-medium">(Ký tên và đóng dấu)</p>
            <div className="h-16"></div>
          </div>
        </div>
      </Card>

      {/* Helpful info context */}
      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-[11px] md:text-xs text-amber-850 leading-relaxed font-bold space-y-2 no-print shadow-inner">
        <p className="uppercase tracking-widest text-amber-600 font-black text-xs">💡 Mẹo quản lý danh sách hiệu quả:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Chỉ hiện bé có ngày nghỉ</b> (Mặc định được bật): Giúp sổ in ra tối ưu nhất, bỏ qua các em đi học đầy đủ để tiết kiệm giấy và dễ theo dõi.</li>
          <li><b>Thêm bé mới chuyển hoặc nghỉ hẳn vào tháng tiếp theo</b>: Sử dụng ô <i>"+ Thêm nhanh bé vào sổ"</i> để chọn các bé hiện có 0 ngày nghỉ trong lớp. Hệ thống sẽ gán 1 ngày nghỉ làm mặc định để các em lập tức hiển thị trên giao diện lọc rút gọn này, sau đó bạn tha hồ gõ số ngày nghỉ thích hợp.</li>
          <li><b>Nhập tay nhanh số ngày nghỉ</b>: Bạn có thể nhập thẳng số ngày nghỉ mong muốn vào ô input. Hệ thống sẽ ngay lập tức tính toán tự động số tiền hoàn trả tương ứng mà không làm gián đoạn sổ điểm danh của bạn.</li>
        </ul>
      </div>
    </div>
  );
};
