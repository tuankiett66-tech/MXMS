
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, X, Info, CheckCircle2, FileUp, Calendar, Trash } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, Badge } from './Common';
import { Student, GlobalConfig, Attendance } from '../types';
import { 
  sortStudents, 
  isPreschoolClass, 
  isNurseryClass, 
  formatDateToDMY, 
  normalizeToYMD, 
  formatDateToVietnamYMD,
  calculateInvoice,
  formatCurrency,
  removeVietnameseTones,
  isStudentNew
} from '../utils/calculations';

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

const DateInput = ({ value, onChange, className = '', placeholder = 'DD/MM/YYYY' }: DateInputProps) => {
  const formatYMDtoDMY = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  const formatDMYtoYMD = (dmy: string) => {
    const parts = dmy.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      
      const dayNum = Number(d);
      const monthNum = Number(m);
      const yearNum = Number(y);
      
      if (
        y.length === 4 &&
        !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 &&
        !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 &&
        !isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100
      ) {
        return `${y}-${m}-${d}`;
      }
    }
    return '';
  };

  const [text, setText] = useState(() => formatYMDtoDMY(value));
  
  useEffect(() => {
    setText(formatYMDtoDMY(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    const isDeleting = input.length < text.length;
    
    // Allow only digits and slashes
    input = input.replace(/[^0-9/]/g, '');
    
    if (!isDeleting) {
      if (/^\d{2}$/.test(input)) {
        input = input + '/';
      } else if (/^\d{2}\/\d{2}$/.test(input)) {
        input = input + '/';
      }
    }
    
    input = input.replace(/\/\/+/g, '/');
    
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    
    setText(input);

    const ymd = formatDMYtoYMD(input);
    if (ymd) {
      onChange(ymd);
    }
  };

  const handleBlur = () => {
    const ymd = formatDMYtoYMD(text);
    if (ymd) {
      onChange(ymd);
    } else {
      setText(formatYMDtoDMY(value));
    }
  };

  const pickerRef = useRef<HTMLInputElement>(null);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (newVal) {
      onChange(newVal);
      setText(formatYMDtoDMY(newVal));
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={className}
        maxLength={10}
      />
      
      <input
        type="date"
        ref={pickerRef}
        value={value || ''}
        onChange={handlePickerChange}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
      
      <button
        type="button"
        onClick={() => {
          try {
            pickerRef.current?.showPicker();
          } catch {
            pickerRef.current?.focus();
          }
        }}
        className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
        title="Chọn ngày"
      >
        <Calendar size={18} />
      </button>
    </div>
  );
};

interface StudentRowProps {
  student: Student;
  index: number;
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  isPreschool: boolean;
  onUpdate: (s: Student) => void;
  onDelete: (id: string, name: string) => void;
  onOpenModal: (s: Student) => void;
}

const StudentRow = ({ 
  student, 
  index, 
  config, 
  attendance, 
  currentMonth, 
  currentYear, 
  isPreschool,
  onUpdate, 
  onDelete, 
  onOpenModal 
}: StudentRowProps) => {
  const [localName, setLocalName] = useState(student.name);
  const [localNotes, setLocalNotes] = useState(student.notes || '');

  useEffect(() => {
    setLocalName(student.name);
  }, [student.name]);

  useEffect(() => {
    setLocalNotes(student.notes || '');
  }, [student.notes]);

  const handleNameBlur = () => {
    const trimmed = localName.trim();
    if (trimmed !== student.name) {
      if (trimmed === '') {
        setLocalName(student.name); 
      } else {
        onUpdate({ ...student, name: trimmed });
      }
    }
  };

  const handleNotesBlur = () => {
    const trimmed = localNotes.trim();
    if (trimmed !== (student.notes || '')) {
      onUpdate({ ...student, notes: trimmed });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const invoice = calculateInvoice(student, config, attendance, currentMonth, currentYear);
  const { tuition, mealFee, csvcFee, materialFee, total, discountType } = invoice;
  const absentDays = invoice.calculationInfo.absentDays;

  const englishFee = config.giftedFees.english;
  const drawingFee = config.giftedFees.drawing;
  const rhythmFee = config.giftedFees.rhythm;

  const toggleEnglish = () => {
    onUpdate({
      ...student,
      giftedSubjects: {
        ...student.giftedSubjects,
        english: !student.giftedSubjects.english
      }
    });
  };

  const toggleDrawing = () => {
    onUpdate({
      ...student,
      giftedSubjects: {
        ...student.giftedSubjects,
        drawing: !student.giftedSubjects.drawing
      }
    });
  };

  const toggleRhythm = () => {
    onUpdate({
      ...student,
      giftedSubjects: {
        ...student.giftedSubjects,
        rhythm: !student.giftedSubjects.rhythm
      }
    });
  };

  const cycleDiscount = () => {
    // Nếu chưa giảm gì cả -> chuyển sang Miễn học phí 100% (vì giảm tiền cần người dùng chủ động điền trong Modal)
    if (!student.isFullDiscount && (!student.tuitionDiscountAmount || student.tuitionDiscountAmount === 0)) {
      onUpdate({ ...student, isFullDiscount: true, isHalfDiscount: false, tuitionDiscountAmount: 0 });
    } else {
      // Nếu đang được miễn 100% hoặc đang giảm tiền -> chuyển về Không giảm học phí
      onUpdate({ ...student, isFullDiscount: false, isHalfDiscount: false, tuitionDiscountAmount: 0 });
    }
  };

  const toggleNewStudent = () => {
    onUpdate({ ...student, isNewStudent: !student.isNewStudent });
  };

  return (
    <tr className="hover:bg-slate-50/80 bg-white transition-all text-xs border-b border-slate-200 group">
      {/* 1. STT & Mã HS */}
      <td 
        onClick={() => onOpenModal(student)}
        className="py-2 px-1 text-center bg-slate-50 w-[70px] min-w-[70px] max-w-[70px] select-none border-r border-slate-200 cursor-pointer group-hover:bg-slate-100 hover:bg-slate-200 transition-colors sticky left-0 z-10"
        title="Bấm để chỉnh sửa chi tiết hồ sơ bé"
      >
        <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
          <span className="text-[9px] text-slate-400 font-bold">#{index + 1}</span>
          <span className="text-[11px] font-black text-emerald-700 font-mono tracking-tight bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">{student.id}</span>
        </div>
      </td>

      {/* 2. Họ và tên bé */}
      <td className="py-1 px-2 w-[200px] min-w-[200px] max-w-[200px] border-r border-slate-200 sticky left-[70px] z-10 bg-white group-hover:bg-slate-100 transition-colors">
        <input 
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-2 py-1.5 rounded-lg text-slate-900 font-extrabold uppercase transition-all text-xs tracking-tight animate-none"
          placeholder="Họ tên của bé..."
        />
      </td>

      {/* 3. Ngày sinh */}
      <td className="py-1 px-2 min-w-[130px] border-r border-slate-200">
        <DateInput 
          value={student.dob || ''}
          onChange={(val) => {
            if (val !== student.dob) {
              onUpdate({ ...student, dob: val });
            }
          }}
          className="w-full bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none pl-2 pr-8 py-1 rounded-lg text-slate-800 font-bold text-xs text-center transition-all"
        />
      </td>

      {/* 4. Học phí */}
      <td 
        onClick={cycleDiscount}
        className="py-1 px-3 min-w-[125px] text-right font-extrabold text-slate-900 border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
        title="Bấm để thay đổi miễn giảm học phí (Không giảm -> Giảm 50% -> Miễn phí)"
      >
        <div className="flex flex-col items-end">
          <span>{formatCurrency(tuition)}</span>
          {discountType === '50%' && (
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold font-sans mt-0.5 animate-in fade-in duration-200">Giảm 50%</span>
          )}
          {discountType === 'custom' && student.tuitionDiscountAmount && (
            <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded font-extrabold font-sans mt-0.5 animate-in fade-in duration-200">Giảm {formatCurrency(student.tuitionDiscountAmount)}đ</span>
          )}
          {discountType === '100%' && (
            <span className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded font-bold font-sans mt-0.5 animate-in fade-in duration-200">Miễn 100%</span>
          )}
        </div>
      </td>

      {/* 5. Tiền ăn */}
      <td className="py-1 px-3 min-w-[110px] text-right font-extrabold text-slate-800 bg-emerald-50/20 border-r border-slate-200">
        {formatCurrency(mealFee)}
      </td>

      {/* 6, 7, 8. Môn năng khiếu (Conditionally rendered) */}
      {isPreschool ? (
        <>
          {/* ANH VĂN */}
          <td 
            onClick={toggleEnglish}
            className={`py-1 px-3 min-w-[95px] text-right font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none ${
              student.giftedSubjects.english 
                ? 'text-blue-700 bg-blue-50/40 font-extrabold' 
                : 'text-slate-400 font-normal'
            }`}
            title="Bấm nhấp để bật/tắt môn Anh Văn"
          >
            {student.giftedSubjects.english ? formatCurrency(englishFee) : '0'}
          </td>
          {/* VẼ */}
          <td 
            onClick={toggleDrawing}
            className={`py-1 px-3 min-w-[95px] text-right font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none ${
              student.giftedSubjects.drawing 
                ? 'text-pink-700 bg-pink-50/40 font-extrabold' 
                : 'text-slate-400 font-normal'
            }`}
            title="Bấm nhấp để bật/tắt môn Vẽ"
          >
            {student.giftedSubjects.drawing ? formatCurrency(drawingFee) : '0'}
          </td>
        </>
      ) : null}

      {/* NHỊP ĐIỆU */}
      <td 
        onClick={toggleRhythm}
        className={`py-1 px-3 min-w-[95px] text-right font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none ${
          student.giftedSubjects.rhythm 
            ? 'text-purple-700 bg-purple-50/40 font-extrabold' 
            : 'text-slate-400 font-normal'
        }`}
        title="Bấm nhấp để bật/tắt môn Nhịp Điệu"
      >
        {student.giftedSubjects.rhythm ? formatCurrency(rhythmFee) : '0'}
      </td>

      {/* PHỤ PHÍ */}
      <td className="py-1 px-3 min-w-[110px] text-right font-bold text-slate-700 border-r border-slate-200">
        {formatCurrency(config.extraFee)}
      </td>

      {/* CSVC */}
      <td 
        onClick={toggleNewStudent}
        className={`py-1 px-3 min-w-[100px] text-right font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none ${
          isStudentNew(student, currentMonth, config)
            ? 'text-teal-700 bg-teal-50/30 font-extrabold' 
            : 'text-slate-400 font-normal'
        }`}
        title="Bấm nhấp để bật/tắt trạng thái Bé Mới (Phí CSVN & Học Phẩm)"
      >
        {isStudentNew(student, currentMonth, config) ? formatCurrency(csvcFee) : '0'}
      </td>

      {/* HỌC PHẨM */}
      <td 
        onClick={toggleNewStudent}
        className={`py-1 px-3 min-w-[100px] text-right font-bold border-r border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all select-none ${
          isStudentNew(student, currentMonth, config)
            ? 'text-cyan-700 bg-cyan-50/30 font-extrabold' 
            : 'text-slate-400 font-normal'
        }`}
        title="Bấm nhấp để bật/tắt trạng thái Bé Mới (Phí CSVN & Học Phẩm)"
      >
        {isStudentNew(student, currentMonth, config) ? formatCurrency(materialFee) : '0'}
      </td>

      {/* NGÀY PHÉP */}
      <td className="py-1 px-2 min-w-[95px] text-center font-bold text-slate-600 border-r border-slate-200">
        {absentDays > 0 ? (
          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-mono text-xs">{absentDays} ngày</span>
        ) : (
          <span className="text-slate-400">0</span>
        )}
      </td>

      {/* THÀNH TIỀN */}
      <td className="py-1 px-3 min-w-[125px] text-right font-black text-rose-600 border-r border-slate-200 bg-rose-50/10">
        {formatCurrency(total)}
      </td>

      {/* GHI CHÚ */}
      <td className="py-1 px-2 min-w-[220px] relative border-b border-slate-200 overflow-visible">
        <input 
          type="text"
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none px-2 py-1 rounded-sm text-slate-800 font-bold text-xs transition-all animate-none"
          placeholder="Nhập ghi chú cho bé..."
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 flex items-center gap-1 bg-white/95 pl-2 py-1 shadow-md rounded-lg border border-slate-200 z-[5]">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenModal(student); }}
            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
            title="Sửa chi tiết thông tin và lớp học"
          >
            <Edit2 size={13} className="stroke-[2.5]" />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(student.id, student.name); }}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
            title="Xóa bé khỏi danh sách"
          >
            <Trash2 size={13} className="stroke-[2.5]" />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface StudentsProps {
  students: Student[];
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
  onImport: (list: Student[]) => void;
  onClearAll: () => void;
}

const getTodayYMD = () => {
  return formatDateToVietnamYMD(new Date());
};

export const Students = ({ 
  students, 
  config, 
  attendance, 
  currentMonth, 
  currentYear, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onImport, 
  onClearAll 
}: StudentsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClassTab, setActiveClassTab] = useState<'preschool' | 'nursery' | 'paused'>('preschool');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [shouldUpdateAdmission, setShouldUpdateAdmission] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    dob: '',
    className: 'Lớp Mẫu giáo',
    giftedSubjects: { english: false, drawing: false, rhythm: false },
    isNewStudent: false,
    admissionDate: getTodayYMD(),
    phoneNumber: '',
    status: 'Đang học',
    notes: '',
    isHalfDiscount: false,
    isFullDiscount: false,
    tuitionDiscountAmount: 0
  });

  const formatToInputDate = (dateStr: any) => {
    return normalizeToYMD(dateStr);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      
      let sheetsToParse: { name: string; ws: any; forcedClass?: string }[] = [];

      // Detect sheets matching "Lớp Mẫu Giáo" and "Lớp Nhà Trẻ"
      const preschoolSheets = wb.SheetNames.filter(name => {
        const n = name.toLowerCase();
        return n.includes("mẫu giáo") || n.includes("mau giao") || n.includes("preschool");
      });

      const nurserySheets = wb.SheetNames.filter(name => {
        const n = name.toLowerCase();
        return n.includes("nhà trẻ") || n.includes("nha tre") || n.includes("nursery");
      });

      if (preschoolSheets.length > 0 || nurserySheets.length > 0) {
        preschoolSheets.forEach(name => {
          sheetsToParse.push({ name, ws: wb.Sheets[name], forcedClass: 'Lớp Mẫu giáo' });
        });
        nurserySheets.forEach(name => {
          sheetsToParse.push({ name, ws: wb.Sheets[name], forcedClass: 'Lớp Nhà trẻ' });
        });
      } else {
        // Fallback: parse the first sheet only
        sheetsToParse.push({ name: wb.SheetNames[0], ws: wb.Sheets[wb.SheetNames[0]] });
      }

      let importedStudents: Student[] = [];
      let globalIndex = 0;

      sheetsToParse.forEach(sheetObj => {
        const ws = sheetObj.ws;
        if (!ws) return;

        // Check format of report
        const cellA1 = ws['A1'] ? String(ws['A1'].v).toUpperCase() : '';
        const isReportFormat = cellA1.includes('THU HỌC PHÍ') || cellA1.includes('TIỀN ĂN') || cellA1.includes('BÁO ĐÓNG TIỀN');
        
        const data = XLSX.utils.sheet_to_json(ws, { range: isReportFormat ? 2 : 0 }) as any[];

        data.forEach((row) => {
          const name = String(row['HỌ VÀ TÊN'] || row['Họ và tên'] || row.Name || row['Họ tên'] || row['Tên'] || '').trim();
          if (!name || name === 'Không rõ tên' || name.toUpperCase().includes('TỔNG CỘNG') || name.toUpperCase().includes('NGƯỜI LẬP BẢNG') || name.includes('---')) {
            return; // Skip empty/header/footer rows
          }

          // Map birth date
          let dob = '';
          const dobValue = row['NGÀY SINH'] || row['NĂM SINH'] || row.DOB || row['Ngày sinh'];
          if (dobValue) {
            if (typeof dobValue === 'number' && dobValue > 1900 && dobValue < 2100) {
              dob = `${dobValue}-01-01`;
            } else {
              dob = formatToInputDate(dobValue);
            }
          }

          // Map gifted subjects
          const english = (row['ANH VĂN'] && Number(row['ANH VĂN']) > 0) || row.English === true || row['Anh văn'] === true;
          const drawing = (row['VẼ'] && Number(row['VẼ']) > 0) || row.Drawing === true || row['Vẽ'] === true;
          const rhythm = (row['NHỊP ĐIỆU'] && Number(row['NHỊP ĐIỆU']) > 0) || row.Rhythm === true || row['Nhịp điệu'] === true;

          // Check if new student
          const isNewStudent = (Number(row['CSVC']) > 0 || Number(row['HỌC PHẨM']) > 0) || 
                              (row.IsNewStudent === true || row['Mới'] === true);

          // Check fee discounts
          const sheetHalf = !!(row['GIẢM 50%'] === true || row['Giảm 50%'] === true || String(row['GIẢM 50%'] || '').trim().toUpperCase() === 'X' || row.IsHalfDiscount === true || row.isHalfDiscount === true);
          const sheetFull = !!(row['GIẢM 100%'] === true || row['Giảm 100%'] === true || String(row['GIẢM 100%'] || '').trim().toUpperCase() === 'X' || row.IsFullDiscount === true || row.isFullDiscount === true);
          const isFullDiscount = sheetFull;
          const isHalfDiscount = sheetHalf && !sheetFull;

          const rawClass = String(row.Class || row['Lớp'] || '');
          const className = sheetObj.forcedClass 
            ? sheetObj.forcedClass
            : (rawClass 
                ? (isNurseryClass(rawClass) ? 'Lớp Nhà trẻ' : 'Lớp Mẫu giáo')
                : (activeClassTab === 'nursery' ? 'Lớp Nhà trẻ' : 'Lớp Mẫu giáo'));

          importedStudents.push({
            id: String(row.ID || row['Mã HS'] || `HS${Date.now()}${globalIndex}`),
            name,
            dob,
            className,
            giftedSubjects: { english, drawing, rhythm },
            isNewStudent,
            admissionDate: formatToInputDate(row.AdmissionDate || row['Ngày nhập học']) || getTodayYMD(),
            phoneNumber: String(row.PhoneNumber || row['SĐT'] || row['Số điện thoại'] || ''),
            status: row['Trạng thái'] || row.Status || 'Đang học',
            notes: String(row['GHI CHÚ'] || row['Ghi chú'] || row['Ghi Chú'] || row.Notes || row.notes || '').trim(),
            classEntryDate: new Date(Date.now() + globalIndex * 1000).toISOString(),
            isHalfDiscount,
            isFullDiscount
          });

          globalIndex++;
        });
      });

      if (importedStudents.length === 0) {
        alert("Không tìm thấy dòng học sinh hợp lệ nào để nạp. Vui lòng kiểm tra lại cấu trúc file!");
        return;
      }

      onImport(importedStudents);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`Đã nạp thành công tổng cộng ${importedStudents.length} bé từ các sheet lớp học vào danh sách!`);
    };
    reader.readAsBinaryString(file);
  };

  const sortedAndFiltered = sortStudents(students);

  const filteredStudents = sortedAndFiltered.filter(s => {
    const searchNorm = removeVietnameseTones(searchTerm).toLowerCase();
    const nameNorm = removeVietnameseTones(s.name).toLowerCase();
    const classNorm = removeVietnameseTones(s.className).toLowerCase();
    const idNorm = removeVietnameseTones(s.id).toLowerCase();

    const matchesSearch = nameNorm.includes(searchNorm) || 
                          classNorm.includes(searchNorm) ||
                          idNorm.includes(searchNorm);
    
    if (activeClassTab === 'nursery') return matchesSearch && isNurseryClass(s.className) && s.status !== 'Tạm nghỉ';
    if (activeClassTab === 'preschool') return matchesSearch && isPreschoolClass(s.className) && s.status !== 'Tạm nghỉ';
    if (activeClassTab === 'paused') return matchesSearch && s.status === 'Tạm nghỉ';
    return matchesSearch;
  });

  const handleOpenModal = (student?: Student) => {
    setShouldUpdateAdmission(true);
    if (student) {
      setEditingStudent(student);
      setFormData({
        ...student,
        className: isNurseryClass(student.className) ? 'Lớp Nhà trẻ' : 'Lớp Mẫu giáo',
        dob: formatToInputDate(student.dob),
        admissionDate: formatToInputDate(student.admissionDate) || getTodayYMD(),
        status: student.status || 'Đang học',
        notes: student.notes || '',
        classEntryDate: student.classEntryDate || student.admissionDate,
        isHalfDiscount: student.isHalfDiscount || false,
        isFullDiscount: student.isFullDiscount || false,
        lateEnrollmentDays: student.lateEnrollmentDays || 0,
        tuitionDiscountAmount: student.tuitionDiscountAmount || 0,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        id: `HS${Date.now()}`,
        name: '',
        dob: '',
        className: 'Lớp Mẫu giáo',
        giftedSubjects: { english: false, drawing: false, rhythm: false },
        isNewStudent: false,
        admissionDate: getTodayYMD(),
        phoneNumber: '',
        status: 'Đang học',
        notes: '',
        classEntryDate: getTodayYMD(),
        isHalfDiscount: false,
        isFullDiscount: false,
        lateEnrollmentDays: 0,
        tuitionDiscountAmount: 0,
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.dob) {
      alert("Vui lòng nhập họ tên và ngày sinh!");
      return;
    }

    let finalData = { ...formData };
    if (finalData.dob) finalData.dob = normalizeToYMD(finalData.dob);
    if (finalData.admissionDate) finalData.admissionDate = normalizeToYMD(finalData.admissionDate);
    
    // Xác định classEntryDate để kiểm soát thứ tự dòng của bé trên sheet
    if (!editingStudent) {
      // Khi thêm mới bé, gán thời gian hiện tại để bé luôn xếp cuối danh sách (CUỐI HÀNG)
      finalData.classEntryDate = new Date().toISOString();
    } else if (editingStudent.status === 'Tạm nghỉ' && finalData.status !== 'Tạm nghỉ') {
      // Khi bé từ tạm nghỉ quay lại học (hoặc học hè), xếp bé xuống cuối danh sách (CUỐI HÀNG)
      finalData.classEntryDate = new Date().toISOString();
    } else if (finalData.className !== editingStudent.className) {
      // Khi chuyển lớp cho bé
      if (shouldUpdateAdmission) {
        finalData.classEntryDate = new Date().toISOString();
      } else {
        finalData.classEntryDate = editingStudent.classEntryDate || editingStudent.admissionDate;
      }
    }

    if (editingStudent) {
      onUpdate(finalData as Student);
    } else {
      onAdd(finalData as Student);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xác nhận xóa bé ${name.toUpperCase()} khỏi danh sách?`)) {
      onDelete(id);
    }
  };

  const isPreschool = activeClassTab === 'preschool';

  const sumTuition = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).tuition;
  }, 0);
  const sumMealFee = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).mealFee;
  }, 0);
  const sumEnglish = isPreschool ? filteredStudents.reduce((sum, s) => {
    return sum + (s.giftedSubjects.english ? config.giftedFees.english : 0);
  }, 0) : 0;
  const sumDrawing = isPreschool ? filteredStudents.reduce((sum, s) => {
    return sum + (s.giftedSubjects.drawing ? config.giftedFees.drawing : 0);
  }, 0) : 0;
  const sumRhythm = filteredStudents.reduce((sum, s) => {
    return sum + (s.giftedSubjects.rhythm ? config.giftedFees.rhythm : 0);
  }, 0);
  const sumExtra = filteredStudents.reduce((sum, s) => {
    return sum + config.extraFee;
  }, 0);
  const sumCSVC = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).csvcFee;
  }, 0);
  const sumMaterial = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).materialFee;
  }, 0);
  const sumAbsent = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).calculationInfo.absentDays;
  }, 0);
  const sumGrandTotal = filteredStudents.reduce((sum, s) => {
    return sum + calculateInvoice(s, config, attendance, currentMonth, currentYear).total;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* BỐ CỤC KHU VỰC ĐIỀU KHIỂN - CHIA LÀM 2 DÒNG RÕ RÀNG TỐI ƯU CHO MÀN HÌNH VUÔNG */}
      <div className="space-y-4">
        {/* DÒNG 1: Ô TÌM KIẾM - BÉ MỚI - LÀM SẠCH - NẠP EXCEL */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ô Tìm Kiếm - Chiếm hết khoảng trống còn lại để tránh lãng phí diện tích */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên bé hoặc ghi chú..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-sm text-slate-800 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all p-1.5 rounded-full hover:bg-slate-100 flex items-center justify-center"
                title="Xóa tìm kiếm"
              >
                <X size={14} className="stroke-[3]" />
              </button>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />

          {/* Nút Bé Mới */}
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 whitespace-nowrap"
            title="Tiếp nhận bé mới"
          >
            <Plus size={18} />
            Bé mới
          </button>

          {/* Nút Làm Sạch */}
          <button 
            onClick={() => setIsConfirmingClear(true)}
            className="flex items-center gap-1.5 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-xs uppercase hover:bg-red-100 transition-all shadow-sm whitespace-nowrap"
            title="Xóa sạch dữ liệu"
          >
            <Trash2 size={18} />
            Làm sạch
          </button>

          {/* Nút Nạp Excel */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-bold text-xs uppercase hover:bg-blue-100 transition-all shadow-sm whitespace-nowrap"
            title="Nạp dữ liệu từ file Excel"
          >
            <FileUp size={18} />
            Nạp Excel
          </button>
        </div>

        {/* DÒNG 2: CÁC NÚT PHÂN LOẠI LỚP (MẪU GIÁO - NHÀ TRẺ - TẠM NGHỈ) */}
        <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar w-max max-w-full">
          <button 
            onClick={() => setActiveClassTab('preschool')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
              activeClassTab === 'preschool' 
                ? 'bg-[#385723] text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <span>🟢 Lớp Mẫu Giáo</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeClassTab === 'preschool' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {students.filter(s => s.status !== 'Tạm nghỉ' && isPreschoolClass(s.className)).length} bé
            </span>
          </button>
          
          <button 
            onClick={() => setActiveClassTab('nursery')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
              activeClassTab === 'nursery' 
                ? 'bg-[#1f4e78] text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <span>🔵 Lớp Nhà Trẻ</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeClassTab === 'nursery' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {students.filter(s => s.status !== 'Tạm nghỉ' && isNurseryClass(s.className)).length} bé
            </span>
          </button>

          <button 
            onClick={() => setActiveClassTab('paused')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
              activeClassTab === 'paused' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <span>🟡 Tạm nghỉ / Hè</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeClassTab === 'paused' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-800'}`}>
              {students.filter(s => s.status === 'Tạm nghỉ').length} bé
            </span>
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 text-slate-300">
           <FileUp size={80} className="mb-6 opacity-10" />
           <p className="font-black uppercase text-xl tracking-widest opacity-30 italic">Chưa có dữ liệu học sinh</p>
           <div className="flex gap-4 mt-6">
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Nạp Excel</button>
               <button onClick={() => handleOpenModal()} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Thêm thủ công</button>
           </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full max-h-[calc(100vh-280px)] min-h-[420px] overflow-auto rounded-[30px] border-2 border-slate-200/80 bg-white shadow-md scrollbar-thin">
            <table className="w-full text-left border-collapse border border-slate-200">
              {activeClassTab === 'preschool' ? (
                /* ============= 14 CỘT LỚP MẪU GIÁO ============= */
                <>
                  <thead className="bg-[#f8fafc] sticky top-0 z-10 text-center font-bold">
                    <tr className="bg-[#e2f0d9] border border-[#a9d08e]">
                      <th colSpan={14} className="py-3 px-4 border border-[#a9d08e] text-center text-sm font-black uppercase text-[#385723]">
                        THU HỌC PHÍ THÁNG {currentMonth}/{currentYear} LỚP MẪU GIÁO
                      </th>
                    </tr>
                    <tr className="bg-slate-100 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-[70px] min-w-[70px] max-w-[70px] select-none sticky left-0 z-20 bg-slate-100">STT</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left pl-4 w-[200px] min-w-[200px] max-w-[200px] sticky left-[70px] z-20 bg-slate-100">Họ và tên</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[130px]">Ngày sinh</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[125px]">Học phí</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[110px]">Tiền ăn</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[95px]">Anh văn</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[95px]">Vẽ</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[95px]">Nhịp điệu</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[110px]">Phụ phí</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[100px]">CSVC</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[100px]">Học phẩm</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[95px]">Ngày phép</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[125px]">Thành tiền</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left min-w-[220px]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-24 text-center font-black uppercase text-xs tracking-wider text-slate-400 bg-slate-50/20 italic">
                          Không tìm thấy bé nào trong lớp Mẫu giáo
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          index={idx}
                          config={config}
                          attendance={attendance}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          isPreschool={true}
                          onUpdate={onUpdate}
                          onDelete={handleDelete}
                          onOpenModal={handleOpenModal}
                        />
                      ))
                    )}
                    {/* Hàng tổng cộng 14 cột */}
                    {filteredStudents.length > 0 && (
                      <tr className="bg-slate-100 font-black text-xs text-slate-800 border-t border-slate-300">
                        <td className="py-3 px-1 border border-slate-300 text-center w-[70px] min-w-[70px] max-w-[70px] sticky left-0 z-10 bg-slate-100"></td>
                        <td className="py-3 px-3 border border-slate-300 text-center w-[200px] min-w-[200px] max-w-[200px] font-black uppercase text-slate-700 sticky left-[70px] z-10 bg-slate-100">TỔNG CỘNG</td>
                        <td className="py-3 px-3 border border-slate-300 text-center min-w-[130px] bg-slate-100"></td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-slate-900">{formatCurrency(sumTuition)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-emerald-800 bg-emerald-50/20">{formatCurrency(sumMealFee)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-blue-800">{formatCurrency(sumEnglish)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-pink-800">{formatCurrency(sumDrawing)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-purple-800">{formatCurrency(sumRhythm)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-slate-800">{formatCurrency(sumExtra)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-teal-800">{formatCurrency(sumCSVC)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-cyan-800">{formatCurrency(sumMaterial)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-center font-bold text-red-700">{sumAbsent} ngày</td>
                        <td className="py-3 px-3 border border-[#f43f5e]/30 text-right font-black text-rose-600 bg-rose-100/30">{formatCurrency(sumGrandTotal)}</td>
                        <td className="py-3 px-3 border border-slate-300"></td>
                      </tr>
                    )}
                  </tbody>
                </>
              ) : activeClassTab === 'nursery' ? (
                /* ============= 12 CỘT LỚP NHÀ TRẺ ============= */
                <>
                  <thead className="bg-[#f8fafc] sticky top-0 z-10 text-center font-bold">
                    <tr className="bg-[#ddebf7] border border-[#9bc2e6]">
                      <th colSpan={12} className="py-3 px-4 border border-[#9bc2e6] text-center text-sm font-black uppercase text-[#1f4e78]">
                        THU HỌC PHÍ THÁNG {currentMonth}/{currentYear} LỚP NHÀ TRẺ
                      </th>
                    </tr>
                    <tr className="bg-slate-100 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-[70px] min-w-[70px] max-w-[70px] select-none sticky left-0 z-20 bg-slate-100">STT</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left pl-4 w-[200px] min-w-[200px] max-w-[200px] sticky left-[70px] z-20 bg-slate-100">Họ và tên</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[130px]">Ngày sinh</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[125px]">Học phí</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[110px]">Tiền ăn</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[95px]">Nhịp điệu</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[110px]">Phụ phí</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[100px]">CSVC</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[100px]">Học phẩm</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[95px]">Ngày phép</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right min-w-[125px]">Thành tiền</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left min-w-[220px]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-24 text-center font-black uppercase text-xs tracking-wider text-slate-400 bg-slate-50/20 italic">
                          Không tìm thấy bé nào trong lớp Nhà trẻ
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          index={idx}
                          config={config}
                          attendance={attendance}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          isPreschool={false}
                          onUpdate={onUpdate}
                          onDelete={handleDelete}
                          onOpenModal={handleOpenModal}
                        />
                      ))
                    )}
                    {/* Hàng tổng cộng 12 cột */}
                    {filteredStudents.length > 0 && (
                      <tr className="bg-slate-100 font-black text-xs text-slate-800 border-t border-slate-300">
                        <td className="py-3 px-1 border border-slate-300 text-center w-[70px] min-w-[70px] max-w-[70px] sticky left-0 z-10 bg-slate-100"></td>
                        <td className="py-3 px-3 border border-slate-300 text-center w-[200px] min-w-[200px] max-w-[200px] font-black uppercase text-slate-700 sticky left-[70px] z-10 bg-slate-100">TỔNG CỘNG</td>
                        <td className="py-3 px-3 border border-slate-300 text-center min-w-[130px] bg-slate-100"></td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-slate-900">{formatCurrency(sumTuition)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-emerald-850 bg-emerald-50/20">{formatCurrency(sumMealFee)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-purple-800">{formatCurrency(sumRhythm)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-slate-800">{formatCurrency(sumExtra)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-teal-800">{formatCurrency(sumCSVC)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-right font-black text-cyan-800">{formatCurrency(sumMaterial)}</td>
                        <td className="py-3 px-3 border border-slate-300 text-center font-bold text-red-700">{sumAbsent} ngày</td>
                        <td className="py-3 px-3 border border-[#f43f5e]/30 text-right font-black text-rose-600 bg-rose-100/30">{formatCurrency(sumGrandTotal)}</td>
                        <td className="py-3 px-3 border border-slate-300"></td>
                      </tr>
                    )}
                  </tbody>
                </>
              ) : (
                /* ============= 8 CỘT TẠM NGHỈ ============= */
                <>
                  <thead className="bg-[#f8fafc] sticky top-0 z-10 text-center font-bold">
                    <tr className="bg-[#fff2cc] border border-[#f8cbad]">
                      <th colSpan={8} className="py-3 px-4 border border-[#f8cbad] text-center text-sm font-black uppercase text-[#bd5115]">
                        DANH SÁCH BÉ ĐANG TẠM NGHỈ / BẢO LƯU HÈ
                      </th>
                    </tr>
                    <tr className="bg-slate-100 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-[70px] min-w-[70px] max-w-[70px] select-none sticky left-0 z-20 bg-slate-100">STT</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left pl-4 w-[200px] min-w-[200px] max-w-[200px] sticky left-[70px] z-20 bg-slate-100">Họ và tên</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[130px]">Ngày sinh</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[140px]">Lớp trước khi nghỉ</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left min-w-[125px]">Số điện thoại</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[110px]">Trạng thái</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-left min-w-[220px]">Ghi chú</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-center min-w-[185px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center font-black uppercase text-xs tracking-wider text-slate-400 bg-slate-50/20 italic">
                          Không có bé nào đang tạm nghỉ
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-amber-50/20 bg-white transition-all text-xs border-b border-slate-200 group">
                          <td 
                            onClick={() => handleOpenModal(student)}
                            className="py-2 px-1 text-center bg-slate-50 w-[70px] min-w-[70px] max-w-[70px] select-none border-r border-slate-200 cursor-pointer group-hover:bg-slate-100 hover:bg-slate-200 transition-colors sticky left-0 z-10"
                            title="Bấm để chỉnh sửa chi tiết hồ sơ bé"
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
                              <span className="text-[9px] text-slate-400 font-bold">#{idx + 1}</span>
                              <span className="text-[11px] font-black text-amber-700 font-mono tracking-tight bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{student.id}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 w-[200px] min-w-[200px] max-w-[200px] font-extrabold text-slate-900 border-r border-slate-200 uppercase sticky left-[70px] z-10 bg-white group-hover:bg-slate-100 transition-colors">
                            <button onClick={() => handleOpenModal(student)} className="hover:text-emerald-700 transition-colors text-left font-black">
                              {student.name}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200 font-medium">
                            {student.dob ? formatDateToDMY(student.dob) : ''}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200 font-bold">
                            {student.className}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 font-mono">
                            {student.phoneNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">
                              Tạm nghỉ
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200" title={student.notes}>
                            {student.notes || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  onUpdate({ ...student, status: 'Đang học' });
                                  alert(`Đã khôi phục bé ${student.name.toUpperCase()} vào trạng thái Đang học thành công!`);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                              >
                                Khôi phục
                              </button>
                              <button 
                                onClick={() => handleOpenModal(student)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 active:scale-95 transition-all"
                              >
                                Sửa
                              </button>
                              <button 
                                onClick={() => handleDelete(student.id, student.name)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 active:scale-95 transition-all"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {filteredStudents.length > 0 && (
                      <tr className="bg-amber-50/40 text-xs text-amber-800 font-black border-t border-slate-300">
                        <td colSpan={8} className="py-3 px-4 text-center font-extrabold uppercase text-slate-700">
                          TỔNG CỘNG CÓ {filteredStudents.length} BÉ ĐANG TẠM NGHỈ / BẢO LƯU HÈ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>

          {/* Ô HƯỚNG DẪN ĐƯỢC CHUYỂN XUỐNG DƯỚI CÙNG THEO YÊU CẦU CỦA NGƯỜI DÙNG */}
          <div className="flex items-start md:items-center gap-2.5 px-5 py-3.5 bg-emerald-50/60 border border-emerald-100 rounded-[20px] text-[11px] text-emerald-800 font-bold shadow-sm animate-in fade-in duration-300">
            <span className="text-sm select-none">💡</span>
            <span className="leading-snug">
              <strong>Mẹo thao tác trực tiếp trên bảng Excel:</strong> Nhấp đúp (Double-click) dòng hoặc nhấp vào Họ Tên để Sửa hồ sơ chi tiết. Có thể nhấp chuột trực tiếp vào các phí: <strong>Học phí (Đóng/Giảm/Miễn)</strong>, các môn phụ <strong>(Anh văn, Vẽ, Nhịp điệu)</strong>, hoặc <strong>CSVC/Học phẩm (Bé mới)</strong> để thay đổi chính sách đóng phí cực nhanh của bé đó!
            </span>
          </div>
        </div>
      )}

      {isConfirmingClear && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white p-8 rounded-[40px] max-w-sm text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Trash2 size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-800 uppercase italic mb-2">Xóa sạch dữ liệu?</h4>
              <div className="flex gap-4">
                 <button onClick={() => setIsConfirmingClear(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Hủy</button>
                 <button onClick={() => { onClearAll(); setIsConfirmingClear(false); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-red-200">Xóa hết!</button>
              </div>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-xl font-black text-slate-800 uppercase italic">{editingStudent ? 'Cập nhật hồ sơ' : 'Tiếp nhận bé mới'}</h4>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Họ và tên bé</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày sinh</label>
                  <DateInput value={formData.dob || ''} onChange={(val) => setFormData({...formData, dob: val})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 pl-4 pr-12 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lớp học</label>
                  <select 
                    value={formData.className || 'Lớp Mẫu giáo'} 
                    onChange={(e) => setFormData({...formData, className: e.target.value})} 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Lớp Mẫu giáo">Lớp Mẫu giáo</option>
                    <option value="Lớp Nhà trẻ">Lớp Nhà trẻ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày nhập học &amp; ngày muộn</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <DateInput value={formData.admissionDate || ''} onChange={(val) => setFormData({...formData, admissionDate: val})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 pl-4 pr-12 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="w-[100px] shrink-0 relative">
                      <input 
                        type="number" 
                        min="0"
                        max="30"
                        placeholder="0"
                        value={formData.lateEnrollmentDays || 0} 
                        onChange={(e) => setFormData({...formData, lateEnrollmentDays: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-2 text-center font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all font-mono"
                        title="Số ngày nhập học muộn (để tự động trừ tiền ăn tương ứng)"
                      />
                      <span className="absolute -top-2 right-2 bg-amber-500 text-white font-extrabold text-[8px] rounded px-1.5 py-0.5 uppercase tracking-wider leading-none shadow-sm">Muộn</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Trạng thái học tập</label>
                  <select 
                    value={formData.status || 'Đang học'} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})} 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Đang học">Đang học (Chính thức)</option>
                    <option value="Học hè">Học hè (Chỉ học hè 3 tháng)</option>
                    <option value="Tạm nghỉ">Tạm nghỉ (Lưu hồ sơ - Nghỉ hè/Tạm dừng)</option>
                  </select>
                </div>
              </div>

              {editingStudent && formData.className !== editingStudent.className && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/40 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                  <input 
                    type="checkbox" 
                    id="autoUpdateAdmission"
                    checked={shouldUpdateAdmission}
                    onChange={(e) => setShouldUpdateAdmission(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 mt-0.5 shrink-0 cursor-pointer" 
                  />
                  <div className="space-y-1">
                    <label htmlFor="autoUpdateAdmission" className="text-xs font-black text-amber-950 block cursor-pointer">
                      Xếp bé tự động xuống cuối danh sách lớp mới (Khuyên dùng)
                    </label>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                      Bạn đang chuyển lớp cho bé từ <strong>{editingStudent.className}</strong> sang <strong>{formData.className}</strong>. 
                      Hệ thống sẽ giữ nguyên <strong>Ngày nhập học gốc ({formatDateToDMY(editingStudent.admissionDate)})</strong> để bảo toàn lịch sử học tập &amp; không bị tính sai học phí, 
                      đồng thời tự động dán bé vào dòng cuối của danh sách lớp mới.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <input type="checkbox" id="isNew" checked={isStudentNew(formData as any, currentMonth, config)} onChange={(e) => setFormData({...formData, isNewStudent: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                  <label htmlFor="isNew" className="text-xs font-bold text-emerald-800">Bé Mới (Tính phí CSVC & Học phẩm)</label>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-amber-50 rounded-2xl border border-amber-100 justify-center">
                  <label htmlFor="tuitionDisc" className="text-[10px] font-black text-amber-800 uppercase tracking-widest pl-1">Mức giảm học phí (VND)</label>
                  <input 
                    type="number" 
                    id="tuitionDisc"
                    placeholder="Nhập số tiền..."
                    value={formData.tuitionDiscountAmount || ''} 
                    onChange={(e) => {
                      const amount = Math.max(0, parseInt(e.target.value) || 0);
                      setFormData({
                        ...formData, 
                        tuitionDiscountAmount: amount,
                        isFullDiscount: amount > 0 ? false : !!formData.isFullDiscount
                      });
                    }}
                    className="w-full bg-white border border-amber-250 rounded-xl py-1.5 px-3 font-bold text-amber-950 outline-none focus:border-amber-500 text-xs transition-all font-mono" 
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <input 
                    type="checkbox" 
                    id="isFullDisc" 
                    checked={formData.isFullDiscount || false} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      isFullDiscount: e.target.checked, 
                      isHalfDiscount: e.target.checked ? false : !!formData.isHalfDiscount,
                      tuitionDiscountAmount: e.target.checked ? 0 : formData.tuitionDiscountAmount
                    })} 
                    className="w-5 h-5 accent-red-600 cursor-pointer" 
                  />
                  <label htmlFor="isFullDisc" className="text-xs font-bold text-red-800 cursor-pointer">Giảm học phí 100% (Miễn phí)</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <input type="checkbox" id="isEnglish" checked={formData.giftedSubjects?.english} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, english: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
                  <label htmlFor="isEnglish" className="text-xs font-bold text-blue-800">Học Anh Văn</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                  <input type="checkbox" id="isDrawing" checked={formData.giftedSubjects?.drawing} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, drawing: e.target.checked}})} className="w-5 h-5 accent-pink-600" />
                  <label htmlFor="isDrawing" className="text-xs font-bold text-pink-800">Học Vẽ</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <input type="checkbox" id="isRhythm" checked={formData.giftedSubjects?.rhythm} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, rhythm: e.target.checked}})} className="w-5 h-5 accent-purple-600" />
                  <label htmlFor="isRhythm" className="text-xs font-bold text-purple-800">Học Nhịp Điệu</label>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nhãn ghi chú (Đặc điểm/Ghi chú cần theo dõi)</label>
                <textarea 
                  value={formData.notes || ''} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Nhập ghi chú cho bé (ví dụ: dị ứng đồ ăn, đón muộn, mức đóng đặc biệt...)" 
                  rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium text-sm resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs">Hủy</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">Lưu hồ sơ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
