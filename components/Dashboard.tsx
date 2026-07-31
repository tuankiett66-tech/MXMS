
import React, { useMemo } from 'react';
import { TrendingUp, Users, Calendar, FileSpreadsheet, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { Card } from './Common';
import { Student, GlobalConfig, Attendance } from '../types';
import { calculateInvoice, formatCurrency, calculateMonthsRemaining, sortStudents, isStudentNew } from '../utils/calculations';

interface DashboardProps {
  students: Student[];
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  onBulkPrint: (className: string) => void;
}

export const Dashboard = ({ students, config, attendance, currentMonth, currentYear, onBulkPrint }: DashboardProps) => {
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
    const invoices = activeStudents.map(s => calculateInvoice(s, config, attendance, currentMonth, currentYear));
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
    return {
      totalRevenue,
      studentCount: activeStudents.length,
      newCount: activeStudents.filter(s => isStudentNew(s, currentMonth, config)).length
    };
  }, [students, config, attendance, currentMonth, currentYear]);

  const classes = useMemo(() => {
    const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
    return Array.from(new Set(activeStudents.map(s => s.className.trim() || "Chưa phân lớp")));
  }, [students]);

  const revenueData = [
    { name: 'T1', value: 125500000 }, { name: 'T2', value: 135000000 },
    { name: 'T3', value: 110000000 }, { name: 'T4', value: 120000000 },
    { name: 'T5', value: 145000000 }, { name: 'T6', value: 125000000 },
  ];

  const exportAllExcel = () => {
    const wb = XLSX.utils.book_new();
    const groups = ['Mẫu giáo', 'Nhà trẻ'];
    
    groups.forEach(groupName => {
      const isPreschool = groupName === 'Mẫu giáo';
      // Chỉ xuất học sinh Đang học và Học hè, loại bỏ Tạm nghỉ; đồng thời sắp xếp chuẩn theo ngày nhập học tăng dần
      const filteredStudents = sortStudents(
        students.filter(s => s.status !== 'Tạm nghỉ' && (s.className || "").toLowerCase().includes(groupName.toLowerCase()))
      );

      if (filteredStudents.length === 0) return;

      const title = `THU HỌC PHÍ THÁNG ${currentMonth}/${currentYear} LỚP ${groupName.toUpperCase()}`;
      const headers = isPreschool 
        ? ["MÃ HS", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "ANH VĂN", "VẼ", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ", "BÉ MỚI", "GIẢM 50%", "GIẢM 100%"]
        : ["MÃ HS", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ", "BÉ MỚI", "GIẢM 50%", "GIẢM 100%"];

      const rows = filteredStudents.map((s) => {
        const inv = calculateInvoice(s, config, attendance, currentMonth, currentYear);
        const formattedDOB = s.dob ? s.dob : ""; // Dạng yyyy-mm-dd chuẩn ngày như của người dùng trong ảnh
        
        return isPreschool ? [
          s.id,
          s.name.toUpperCase(), 
          formattedDOB, 
          inv.tuition, 
          inv.mealFee,
          s.giftedSubjects.english ? config.giftedFees.english : 0,
          s.giftedSubjects.drawing ? config.giftedFees.drawing : 0,
          s.giftedSubjects.rhythm ? config.giftedFees.rhythm : 0,
          inv.extraFee, 
          inv.csvcFee, 
          inv.materialFee,
          inv.calculationInfo.absentDays, 
          inv.total, 
          s.notes || "",
          isStudentNew(s, currentMonth, config) ? "X" : "",
          s.isHalfDiscount ? "X" : "",
          s.isFullDiscount ? "X" : ""
        ] : [
          s.id,
          s.name.toUpperCase(), 
          formattedDOB, 
          inv.tuition, 
          inv.mealFee,
          s.giftedSubjects.rhythm ? config.giftedFees.rhythm : 0,
          inv.extraFee, 
          inv.csvcFee, 
          inv.materialFee,
          inv.calculationInfo.absentDays, 
          inv.total, 
          s.notes || "",
          isStudentNew(s, currentMonth, config) ? "X" : "",
          s.isHalfDiscount ? "X" : "",
          s.isFullDiscount ? "X" : ""
        ];
      });

      const wsData = [[title], headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Áp dụng định dạng phong cách in ấn tuyệt đẹp, giống hệt mẫu trang tính người dùng cung cấp
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      
      const thinBorder = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };

      const rowHeights = [
        { hpt: 35 }, // Dòng Tiêu Đề Lớp to rõ
        { hpt: 26 }  // Dòng Tiêu Đề Cột
      ];
      for (let r = 2; r <= range.e.r; r++) {
        rowHeights.push({ hpt: 22 }); // Các dòng dữ liệu học sinh giãn rộng rãi phù hợp điền tay và nhìn rõ
      }
      ws['!rows'] = rowHeights;

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell_ref]) {
            ws[cell_ref] = { t: 's', v: '' }; // Đảm bảo cell rỗng vẫn có đối tượng định dạng để tạo khung viền khép kín
          }
          const cell = ws[cell_ref];

          // Font nền tảng: cỡ 11, viền mỏng đen khép kín các ô
          cell.s = {
            font: { name: "Arial", sz: 11, color: { rgb: "000000" } },
            alignment: { vertical: "center" },
            border: thinBorder
          };

          if (R === 0) {
            // [Tiêu đề bảng]
            cell.s = {
              font: { name: "Arial", sz: 13, bold: true, color: { rgb: "000000" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {} // Tiêu đề gộp không cần vẽ viền ở các ô con bên trong
            };
          } else if (R === 1) {
            // [Đề mục các cột]
            cell.s = {
              font: { name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "E2E8F0" } }, // Màu xám nhạt (Tailwind Slate-200) sang trọng, in mực đen/mực màu đều rõ nét
              alignment: { horizontal: "center", vertical: "center", wrapText: true },
              border: thinBorder
            };
          } else {
            // [Thông tin học sinh]
            if (C === 0) {
              // Cột MÃ HS
              cell.s.alignment = { horizontal: "center", vertical: "center" };
              cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "15803d" } }; // Màu xanh lá in đậm nổi bật
            } else if (C === 1) {
              // Cột Họ và tên (Căn trái, tên viết hoa)
              cell.s.alignment = { horizontal: "left", vertical: "center" };
              cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } };
            } else if (C === 2) {
              // Cột Ngày sinh
              cell.s.alignment = { horizontal: "center", vertical: "center" };
            } else if (isPreschool) {
              // Khối Mẫu Giáo
              // Tiền: 3 -> 10, Phép: 11, Thành tiền: 12 (Bold), Ghi chú: 13, Bé mới: 14, Giảm 50%: 15, Giảm 100%: 16
              if (C >= 3 && C <= 10) {
                cell.t = 'n';
                cell.z = '#,##0';
                cell.s.alignment = { horizontal: "right", vertical: "center" };
              } else if (C === 11) {
                cell.s.alignment = { horizontal: "center", vertical: "center" };
              } else if (C === 12) {
                cell.t = 'n';
                cell.z = '#,##0';
                cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } };
                cell.s.alignment = { horizontal: "right", vertical: "center" };
              } else if (C === 13) {
                cell.s.alignment = { horizontal: "left", vertical: "center" };
              } else if (C === 14 || C === 15 || C === 16) {
                cell.s.alignment = { horizontal: "center", vertical: "center" };
                cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } };
                if (C === 14 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "D1FAE5" } }; // Nền lục nhạt cho Bé mới
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "047857" } };
                } else if (C === 15 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } }; // Nền hổ phách nhạt cho 50%
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "B45309" } };
                } else if (C === 16 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } }; // Nền đỏ nhạt cho 100%
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "B91C1C" } };
                }
              }
            } else {
              // Khối Nhà Trẻ
              // Tiền: 3 -> 8, Phép: 9, Thành tiền: 10 (Bold), Ghi chú: 11, Bé mới: 12, Giảm 50%: 13, Giảm 100%: 14
              if (C >= 3 && C <= 8) {
                cell.t = 'n';
                cell.z = '#,##0';
                cell.s.alignment = { horizontal: "right", vertical: "center" };
              } else if (C === 9) {
                cell.s.alignment = { horizontal: "center", vertical: "center" };
              } else if (C === 10) {
                cell.t = 'n';
                cell.z = '#,##0';
                cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } };
                cell.s.alignment = { horizontal: "right", vertical: "center" };
              } else if (C === 11) {
                cell.s.alignment = { horizontal: "left", vertical: "center" };
              } else if (C === 12 || C === 13 || C === 14) {
                cell.s.alignment = { horizontal: "center", vertical: "center" };
                cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } };
                if (C === 12 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "D1FAE5" } }; // Nền lục nhạt cho Bé mới
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "047857" } };
                } else if (C === 13 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } }; // Nền hổ phách nhạt cho 50%
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "B45309" } };
                } else if (C === 14 && cell.v === "X") {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } }; // Nền đỏ nhạt cho 100%
                  cell.s.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "B91C1C" } };
                }
              }
            }
          }
        }
      }

      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
      ws['!cols'] = headers.map((h, i) => {
        if (i === 0) return { wch: 10 }; // Mã HS
        if (i === 1) return { wch: 28 }; // Họ và tên
        if (i === 2) return { wch: 14 }; // Ngày sinh
        const lastThreeIndex = headers.length - 3;
        if (i >= lastThreeIndex) return { wch: 10 }; // Bé mới, Giảm 50%, Giảm 100%
        if (h === "GHI CHÚ") return { wch: 18 };
        return { wch: 13 }; // Các cột còn lại
      });

      XLSX.utils.book_append_sheet(wb, ws, groupName);
    });

    if (wb.SheetNames.length > 0) {
      XLSX.writeFile(wb, `Tong_Hop_Hoc_Phi_T${currentMonth}_${currentYear}.xlsx`);
    } else {
      alert("Không có dữ liệu học sinh để xuất!");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-black text-slate-800 uppercase italic">Bảng điều khiển</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={exportAllExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <FileSpreadsheet size={18} /> Xuất Toàn Bộ Excel
          </button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {["Khối Mẫu Giáo", "Khối Nhà Trẻ"].map(group => (
               <button 
                key={group}
                onClick={() => onBulkPrint(group)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:border-red-500 hover:text-red-600 transition-all shadow-md"
               >
                 <Download size={16} /> Xuất PDF {group}
               </button>
            ))}
          </div>
        </div>
      </div>
      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="flex items-center justify-between border-l-4 border-l-emerald-500 p-4 md:p-6">
          <div>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Doanh thu dự kiến T{currentMonth}</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
        </Card>
        
        <Card className="flex items-center justify-between border-l-4 border-l-blue-500 p-4 md:p-6">
          <div>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Tổng số học sinh</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{stats.studentCount} bé</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        </Card>

        <Card className="flex items-center justify-between border-l-4 border-l-orange-500 p-4 md:p-6 sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Niên học còn lại</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{calculateMonthsRemaining(currentMonth, config.startMonth || 8, config.endMonth || 7)} tháng</h3>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2">
          <h4 className="font-bold text-slate-800 mb-6 md:mb-8 uppercase text-[10px] md:text-xs tracking-widest">Biểu đồ doanh thu dự kiến</h4>
          <div className="h-[200px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} formatter={(v) => formatCurrency(v as number)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h4 className="font-bold text-slate-800 mb-6 uppercase text-[10px] md:text-xs tracking-widest">Học sinh mới</h4>
          <div className="space-y-3">
            {students.filter(s => isStudentNew(s, currentMonth, config)).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bé mới tháng này</p>
            ) : (
              students.filter(s => isStudentNew(s, currentMonth, config)).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm uppercase">{s.name.split(' ').pop()?.charAt(0)}</div>
                    <span className="text-[10px] md:text-xs font-black text-slate-800 uppercase whitespace-normal break-words leading-tight flex-1">{s.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
