
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Printer, Phone, Share2, ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, List, MessageCircle, FileDown, Loader2 } from 'lucide-react';
import { Card, Badge } from './Common';
import { Student, GlobalConfig, Attendance } from '../types';
import { calculateInvoice, formatCurrency, generateZaloMessage, sortStudents, formatDateToDMY } from '../utils/calculations';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoicesProps {
  students: Student[];
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  selectedStudent: Student | null;
  setSelectedStudent: (s: Student | null) => void;
  bulkPrintClass: string | null;
  setBulkPrintClass: (s: string | null) => void;
}

export const Invoices = ({ students, config, attendance, currentMonth, currentYear, selectedStudent, setSelectedStudent, bulkPrintClass, setBulkPrintClass }: InvoicesProps) => {
  const [targetPhone, setTargetPhone] = useState('');
  const [selectionMode, setSelectionMode] = useState<'grid' | 'list'>('grid');
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStudent) setTargetPhone(selectedStudent.phoneNumber || '');
  }, [selectedStudent]);

  const activeStudents = useMemo(() => {
    return sortStudents(students.filter(s => s.status !== 'Tạm nghỉ'));
  }, [students]);

  const classes = useMemo(() => Array.from(new Set(activeStudents.map(s => s.className.trim() || "Chưa phân lớp"))), [activeStudents]);

  const currentIndex = useMemo(() => selectedStudent ? activeStudents.findIndex(s => s.id === selectedStudent.id) : -1, [selectedStudent, activeStudents]);
  const goToNext = () => currentIndex < activeStudents.length - 1 && setSelectedStudent(activeStudents[currentIndex + 1]);
  const goToPrev = () => currentIndex > 0 && setSelectedStudent(activeStudents[currentIndex - 1]);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    const element = printRef.current;
    const opt = {
      margin: 10,
      filename: `Giay_Bao_Hoc_Phi_${bulkPrintClass ? bulkPrintClass.replace(/\s+/g, '_') : 'Lop'}_T${currentMonth}_${currentYear}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] as const }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi khi tạo file PDF. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const classStudents = useMemo(() => {
    if (!bulkPrintClass) return [];
    return activeStudents.filter(s => (s.className.trim() || "Chưa phân lớp") === bulkPrintClass);
  }, [activeStudents, bulkPrintClass]);

  if (!selectedStudent && !bulkPrintClass) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
           <h3 className="text-xl font-black text-slate-800 uppercase italic">Chọn bé lập phiếu</h3>
           <div className="flex flex-wrap gap-2 no-print">
             {classes.map(cls => (
               <button 
                key={cls}
                onClick={() => {
                  setBulkPrintClass(cls);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
               >
                 <Printer size={14} /> Xử lý lớp {cls}
               </button>
             ))}
             <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>
             <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button onClick={() => setSelectionMode('grid')} className={`p-2 rounded-xl transition-all flex items-center gap-2 px-4 ${selectionMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setSelectionMode('list')} className={`p-2 rounded-xl transition-all flex items-center gap-2 px-4 ${selectionMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}><List size={18} /></button>
            </div>
          </div>
        </div>
        <div className={selectionMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-2"}>
          {activeStudents.map(s => (
            <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-6 rounded-[32px] bg-white border-2 border-slate-100 hover:border-emerald-500 cursor-pointer transition-all shadow-sm flex flex-col items-start`}>
              <Badge color={s.isNewStudent ? 'emerald' : 'slate'}>{s.isNewStudent ? 'Mới' : 'Cũ'}</Badge>
              <span className="font-black text-slate-900 text-lg uppercase mt-3">{s.name}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{s.className}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bulkPrintClass) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 gap-4">
          <button onClick={() => setBulkPrintClass(null)} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-wider self-start sm:self-auto"><ArrowLeft size={18} /> Quay lại</button>
          <h3 className="text-sm font-black text-emerald-700 uppercase">Lớp: {bulkPrintClass} ({classStudents.length} bé)</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />} 
              {isExporting ? 'Đang tạo PDF...' : 'Tạo File PDF'}
            </button>
            <button onClick={() => window.print()} className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-700"><Printer size={18} /> In nhanh</button>
          </div>
        </div>
        
        <div className="space-y-8" ref={printRef}>
          <style>{`
            @media print {
              @page { 
                size: A4 portrait; 
                margin: 15mm 10mm; 
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              #root, .flex-col, .flex-1, main {
                height: auto !important;
                overflow: visible !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .no-print { display: none !important; }
              header, nav, aside { display: none !important; }
              
              .print-container-wrapper {
                display: block !important;
                width: 100% !important;
              }
              
              .invoice-print-item {
                display: block !important;
                width: 100% !important;
                /* Bỏ height cố định để tránh tràn dòng và mất tiêu đề */
                min-height: 130mm !important; 
                padding: 5mm 0 !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                background: white !important;
                color: black !important;
                border: none !important;
                margin-bottom: 0 !important;
              }

              /* Thêm khoảng cách đầu trang cho từ trang 2 trở đi */
              .invoice-print-item:not(:first-child) {
                margin-top: 10mm !important;
              }

              .space-y-8, .p-8 { margin: 0 !important; padding: 0 !important; }
            }
          `}</style>
          <div className="print-container-wrapper">
          {classStudents.map((student) => {
            const inv = calculateInvoice(student, config, attendance, currentMonth, currentYear);
            const dob = formatDateToDMY(student.dob);
            return (
              <div key={student.id} className="invoice-print-item bg-white p-8 border border-slate-200 rounded-lg relative">
                <div className="text-center mb-4">
                  <h1 className="text-lg font-bold uppercase underline text-black">GIẤY BÁO ĐÓNG TIỀN HỌC PHÍ THÁNG {currentMonth} NĂM {currentYear}.</h1>
                </div>
                <div className="space-y-1 mb-2 font-medium text-black">
                  <p className="mb-2 text-[12pt]">- Họ và tên trẻ : <span className="font-bold uppercase">{student.name}</span> SN {dob}-{inv.calculationInfo.ageInMonths} tháng.</p>
                  <div className="invoice-line">
                    <span className="invoice-label">- Tiền học phí trong tháng {inv.discountType === '100%' ? '(Miễn 100%)' : inv.discountType === '50%' ? '(Giảm 50% - Nửa tháng)' : ''}</span>
                    <span className="invoice-dots">:</span>
                    <span className="invoice-value">{formatCurrency(inv.tuition)} đồng.</span>
                  </div>
                  <div className="invoice-line">
                    <span className="invoice-label">- Tiền ăn trong tháng ({inv.calculationInfo.effectiveStandardDays} ngày x {formatCurrency(config.mealFeePerDay)})</span>
                    <span className="invoice-dots">:</span>
                    <span className="invoice-value">{formatCurrency(inv.calculationInfo.effectiveStandardDays * config.mealFeePerDay)} đồng.</span>
                  </div>
                  {inv.calculationInfo.giftedBreakdown.map((b, i) => {
                    const parts = b.split(':');
                    return (
                      <div key={i} className="invoice-line">
                        <span className="invoice-label">- {parts[0].trim().replace('-', '')}</span>
                        <span className="invoice-dots">:</span>
                        <span className="invoice-value">{parts[1].trim()}</span>
                      </div>
                    );
                  })}
                  <div className="invoice-line">
                    <span className="invoice-label">- Các khoản phụ thu (Vệ sinh phí, Gaz, Điện, Nước bình...)</span>
                    <span className="invoice-dots">:</span>
                    <span className="invoice-value">{formatCurrency(inv.extraFee)} đồng.</span>
                  </div>
                  {inv.csvcFee > 0 && (
                    <div className="invoice-line">
                      <span className="invoice-label">- Cơ sở vật chất ({inv.calculationInfo.monthsRemaining} tháng)</span>
                      <span className="invoice-dots">:</span>
                      <span className="invoice-value">{formatCurrency(inv.csvcFee)} đồng.</span>
                    </div>
                  )}
                  {inv.materialFee > 0 && (
                    <div className="invoice-line">
                      <span className="invoice-label">- Học phẩm ({inv.calculationInfo.monthsRemaining} tháng)</span>
                      <span className="invoice-dots">:</span>
                      <span className="invoice-value">{formatCurrency(inv.materialFee)} đồng.</span>
                    </div>
                  )}
                  <div className="invoice-line">
                    <span className="invoice-label">- Số ngày nghỉ có phép : {inv.calculationInfo.absentDays} ngày. Trừ lại</span>
                    <span className="invoice-dots">:</span>
                    <span className="invoice-value">{formatCurrency(inv.calculationInfo.absentDays * config.mealFeePerDay)} đồng.</span>
                  </div>
                  {inv.calculationInfo.lateEnrollmentDays !== undefined && inv.calculationInfo.lateEnrollmentDays > 0 && (
                    <div className="invoice-line">
                      <span className="invoice-label">- Số ngày nhập học muộn : {inv.calculationInfo.lateEnrollmentDays} ngày. Trừ lại</span>
                      <span className="invoice-dots">:</span>
                      <span className="invoice-value">{formatCurrency(inv.calculationInfo.lateEnrollmentDays * config.mealFeePerDay)} đồng.</span>
                    </div>
                  )}
                </div>
                <div className="text-center py-2 border-y-2 border-black my-2">
                  <h2 className="text-xl font-bold uppercase text-black">TỔNG CỘNG : {formatCurrency(inv.total)} ĐỒNG.</h2>
                </div>
                <div className="mt-2 space-y-0.5 text-[10.5pt] italic text-black leading-tight">
                  <p>Thông tin chuyển khoản: <span className="font-bold uppercase not-italic">TRẦN THỊ TRÚC GIANG</span></p>
                  <p>Số tài khoản: <span className="font-bold not-italic">6350205 014046</span> Agribank Phước Kiển</p>
                  <p>Nội dung: {student.name}, {student.className}.</p>
                  <div className="pt-2 text-center">
                    <p className="font-bold text-base not-italic uppercase underline decoration-2 underline-offset-4">Xin chân thành cảm ơn!</p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStudent) return null;

  const inv = calculateInvoice(selectedStudent, config, attendance, currentMonth, currentYear);
  const zaloMsg = generateZaloMessage(inv, currentMonth, currentYear, config);
  const formattedDOB = formatDateToDMY(selectedStudent.dob);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print bg-white p-3 rounded-[24px] border border-slate-200 shadow-sm">
        <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-wider"><ArrowLeft size={18} /> Quay lại</button>
        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
          <button onClick={goToPrev} disabled={currentIndex === 0} className="p-2 text-slate-600 hover:bg-white rounded-lg disabled:opacity-30"><ChevronLeft size={20} /></button>
          <div className="px-6 border-x border-slate-200 text-center min-w-[200px]">
            <p className="text-sm font-black text-emerald-700 uppercase">{selectedStudent.name}</p>
          </div>
          <button onClick={goToNext} disabled={currentIndex === students.length - 1} className="p-2 text-slate-600 hover:bg-white rounded-lg disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
        <div className="hidden sm:block w-[140px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Phiếu thu giấy - Tối ưu in 1/2 trang A4 */}
        <div className="bg-white rounded-lg p-8 shadow-2xl border border-slate-200 relative text-black" id="invoice-print" style={{ color: '#000' }}>
          <style>{`
            @media print {
              @page { 
                size: A4 portrait;
                margin: 15mm 10mm; 
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              #root, .flex-col, .flex-1, main {
                height: auto !important;
                overflow: visible !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * { visibility: hidden; }
              #invoice-print, #invoice-print * { visibility: visible; }
              #invoice-print { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                min-height: 140mm;
                padding: 0;
                border: none; 
                box-shadow: none; 
                font-family: 'Times New Roman', Times, serif; 
                color: #000 !important;
                background: white !important;
                display: block !important;
              }
              .no-print { display: none !important; }
            }
            .invoice-line { 
              display: flex;
              align-items: flex-end;
              gap: 4px;
              margin-bottom: 2px;
              width: 100%;
              color: #000 !important;
              font-size: 12pt;
            }
            .invoice-label { flex-grow: 1; border-bottom: 1px dotted #000; padding-bottom: 1px; }
            .invoice-dots { border-bottom: 1px dotted #000; flex-grow: 0; padding-bottom: 1px; font-weight: bold; }
            .invoice-value { font-weight: bold; min-width: 120px; text-align: right; border-bottom: 1px dotted #000; padding-bottom: 1px; }
          `}</style>
          
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold uppercase underline text-black">GIẤY BÁO ĐÓNG TIỀN HỌC PHÍ THÁNG {currentMonth} NĂM {currentYear}.</h1>
          </div>

          <div className="space-y-1 mb-2 font-medium text-black">
            <p className="mb-2 text-[12pt]">- Họ và tên trẻ : <span className="font-bold uppercase">{selectedStudent.name}</span> SN {formattedDOB}-{inv.calculationInfo.ageInMonths} tháng.</p>
            
            <div className="invoice-line">
              <span className="invoice-label">- Tiền học phí trong tháng {inv.discountType === '100%' ? '(Miễn 100%)' : inv.discountType === '50%' ? '(Giảm 50% - Nửa tháng)' : ''}</span>
              <span className="invoice-dots">:</span>
              <span className="invoice-value">{formatCurrency(inv.tuition)} đồng.</span>
            </div>

            <div className="invoice-line">
              <span className="invoice-label">- Tiền ăn trong tháng ({inv.calculationInfo.effectiveStandardDays} ngày x {formatCurrency(config.mealFeePerDay)})</span>
              <span className="invoice-dots">:</span>
              <span className="invoice-value">{formatCurrency(inv.calculationInfo.effectiveStandardDays * config.mealFeePerDay)} đồng.</span>
            </div>

            {inv.calculationInfo.giftedBreakdown.map((b, i) => {
              const parts = b.split(':');
              return (
                <div key={i} className="invoice-line">
                  <span className="invoice-label">- {parts[0].trim().replace('-', '')}</span>
                  <span className="invoice-dots">:</span>
                  <span className="invoice-value">{parts[1].trim()}</span>
                </div>
              );
            })}

            <div className="invoice-line">
              <span className="invoice-label">- Các khoản phụ thu (Vệ sinh phí, Gaz, Điện, Nước bình...)</span>
              <span className="invoice-dots">:</span>
              <span className="invoice-value">{formatCurrency(inv.extraFee)} đồng.</span>
            </div>

            {inv.csvcFee > 0 && (
              <div className="invoice-line">
                <span className="invoice-label">- Cơ sở vật chất ({inv.calculationInfo.monthsRemaining} tháng)</span>
                <span className="invoice-dots">:</span>
                <span className="invoice-value">{formatCurrency(inv.csvcFee)} đồng.</span>
              </div>
            )}

            {inv.materialFee > 0 && (
              <div className="invoice-line">
                <span className="invoice-label">- Học phẩm ({inv.calculationInfo.monthsRemaining} tháng)</span>
                <span className="invoice-dots">:</span>
                <span className="invoice-value">{formatCurrency(inv.materialFee)} đồng.</span>
              </div>
            )}

            <div className="invoice-line">
              <span className="invoice-label">- Số ngày nghỉ có phép : {inv.calculationInfo.absentDays} ngày. Trừ lại</span>
              <span className="invoice-dots">:</span>
              <span className="invoice-value">{formatCurrency(inv.calculationInfo.absentDays * config.mealFeePerDay)} đồng.</span>
            </div>
            {inv.calculationInfo.lateEnrollmentDays !== undefined && inv.calculationInfo.lateEnrollmentDays > 0 && (
              <div className="invoice-line">
                <span className="invoice-label">- Số ngày nhập học muộn : {inv.calculationInfo.lateEnrollmentDays} ngày. Trừ lại</span>
                <span className="invoice-dots">:</span>
                <span className="invoice-value">{formatCurrency(inv.calculationInfo.lateEnrollmentDays * config.mealFeePerDay)} đồng.</span>
              </div>
            )}
          </div>

          <div className="text-center py-2 border-y-2 border-black my-2">
            <h2 className="text-xl font-bold uppercase text-black">TỔNG CỘNG : {formatCurrency(inv.total)} ĐỒNG.</h2>
          </div>

          <div className="mt-2 space-y-0.5 text-[10.5pt] italic text-black leading-tight">
            <p>Thông tin chuyển khoản: <span className="font-bold uppercase not-italic">TRẦN THỊ TRÚC GIANG</span></p>
            <p>Số tài khoản: <span className="font-bold not-italic">6350205 014046</span> Agribank Phước Kiển</p>
            <p>Nội dung: {selectedStudent.name}, {selectedStudent.className}.</p>
            <div className="pt-2 text-center">
              <p className="font-bold text-base not-italic uppercase underline decoration-2 underline-offset-4">Xin chân thành cảm ơn!</p>
            </div>
          </div>

          <button onClick={() => window.print()} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase text-sm no-print shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
            <Printer size={20} /> Xác nhận & In Phiếu
          </button>
        </div>

        {/* Cột Zalo Message */}
        <div className="space-y-6 no-print">
          <Card className="border-t-4 border-t-blue-600 sticky top-24">
             <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-slate-800 uppercase text-xs flex items-center">
                  <MessageCircle size={16} className="mr-2 text-blue-600" /> Gửi báo phí qua Zalo
                </h4>
             </div>

             <div className="mb-4 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại phụ huynh</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
             </div>

             <div className="bg-blue-50/50 rounded-2xl p-6 text-[11px] font-medium text-slate-800 border border-blue-100 whitespace-pre-wrap h-[400px] overflow-y-auto leading-relaxed shadow-inner mb-4">
               {zaloMsg}
             </div>

             <button 
                onClick={() => { 
                  navigator.clipboard.writeText(zaloMsg); 
                  alert('Đã sao chép nội dung Zalo!'); 
                  const phoneClean = targetPhone.replace(/\D/g, '');
                  if (phoneClean) {
                    window.open(`https://zalo.me/${phoneClean}`, '_blank'); 
                  } else {
                    alert('Vui lòng nhập số điện thoại phụ huynh trước khi gửi!');
                  }
                }} 
                className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
             >
               <Share2 size={20} /> Sao chép & Mở Zalo
             </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
