
import React, { useState, useEffect } from 'react';
import { Search, X, Pencil } from 'lucide-react';
import { Card } from './Common';
import { Student, Attendance, GiftedSubjects } from '../types';
import { sortStudents, isPreschoolClass, isNurseryClass, formatDateToDMY, formatCurrency, removeVietnameseTones, isStudentNew } from '../utils/calculations';

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

  return (
    <input 
      type="text"
      value={text}
      onChange={handleTextChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

interface AttendanceProps {
  students: Student[];
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  config: any;
  onAttendanceChange: (id: string, change: number) => void;
  onToggleDiscount: (id: string, type: '50%' | '100%') => void;
  onToggleGifted: (id: string, subject: keyof GiftedSubjects) => void;
  onToggleNew: (id: string) => void;
  onViewInvoice: (s: Student) => void;
  onUpdateStudent?: (student: Student) => void;
}

export const AttendanceTable = ({ 
  students, attendance, currentMonth, currentYear, config, onAttendanceChange, onToggleDiscount, onToggleGifted, onToggleNew, onViewInvoice, onUpdateStudent 
}: AttendanceProps) => {
  const [activeClassTab, setActiveClassTab] = useState<'preschool' | 'nursery'>('preschool');
  const [searchTerm, setSearchTerm] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [shouldUpdateAdmission, setShouldUpdateAdmission] = useState(true);

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      ...student,
      giftedSubjects: { ...student.giftedSubjects }
    });
    setShouldUpdateAdmission(true);
    setShowEditModal(true);
  };

  const handleSaveStudent = () => {
    if (!formData.name?.trim()) {
      alert("Vui lòng nhập tên bé");
      return;
    }
    
    if (!onUpdateStudent || !editingStudent) return;
    
    let finalData = { ...editingStudent, ...formData } as Student;
    
    // Nếu chuyển lớp
    if (editingStudent.className !== finalData.className) {
      if (shouldUpdateAdmission) {
        // Cập nhật ngày nhập học lớp mới thành hôm nay để dán cuối danh sách
        const todayStr = new Date().toISOString().split('T')[0];
        finalData.classEntryDate = todayStr;
      }
    }
    
    onUpdateStudent(finalData);
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
  const sortedStudents = sortStudents(activeStudents);

  const filteredStudents = sortedStudents.filter(s => {
    const isClassMatch = (activeClassTab === 'nursery' && isNurseryClass(s.className)) ||
                         (activeClassTab === 'preschool' && isPreschoolClass(s.className));
    const searchNorm = removeVietnameseTones(searchTerm).toLowerCase();
    const nameNorm = removeVietnameseTones(s.name).toLowerCase();
    const classNorm = removeVietnameseTones(s.className).toLowerCase();
    const idNorm = removeVietnameseTones(s.id).toLowerCase();

    const matchesSearch = nameNorm.includes(searchNorm) || 
                          classNorm.includes(searchNorm) || 
                          idNorm.includes(searchNorm);
    return isClassMatch && matchesSearch;
  });

  const totalAbsentDays = filteredStudents.reduce((acc, student) => {
    const att = attendance.find(a => a.studentId === student.id && a.month === currentMonth && a.year === currentYear);
    return acc + (att?.absentDays || 0);
  }, 0);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-8 gap-4 no-print">
        <div className="flex flex-col gap-1 shrink-0">
          <h4 className="font-black text-slate-800 text-xl italic uppercase tracking-tight text-emerald-700 shrink-0">Bảng phí & Điểm danh T{currentMonth}</h4>
          <p className="text-[10px] font-black uppercase text-slate-500">Tổng cộng ngày phép: <span className="text-emerald-700 text-sm">{totalAbsentDays} ngày</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 flex-1 max-w-2xl justify-end">
          {/* Tìm kiếm */}
          <div className="relative w-full sm:min-w-[240px] sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm bé điểm danh..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-xs text-slate-800 shadow-inner"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all p-1 rounded-full hover:bg-slate-200 flex items-center justify-center"
                title="Xóa tìm kiếm"
              >
                <X size={12} className="stroke-[3]" />
              </button>
            )}
          </div>

          {/* Menu Khối Lớp */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            {['preschool', 'nursery'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveClassTab(tab as any)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClassTab === tab ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {tab === 'preschool' ? 'Khối MG' : 'Khối NT'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-4 pl-2 w-12">STT</th>
              <th className="pb-4 min-w-[150px]">Học sinh</th>
              <th className="pb-4 text-center">Anh văn</th>
              <th className="pb-4 text-center">Vẽ</th>
              <th className="pb-4 text-center">N.Điệu</th>
              <th className="pb-4 text-center text-orange-600">Giảm HP 100%</th>
              <th className="pb-4 text-center text-blue-600">Giảm tiền HP</th>
              <th className="pb-4 text-center">Vắng</th>
              <th className="pb-4 text-right pr-2">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.map((student, index) => {
              const att = attendance.find(a => a.studentId === student.id && a.month === currentMonth && a.year === currentYear);
              const isEven = index % 2 === 0;
              return (
                <tr 
                  key={student.id} 
                  className={`group transition-all duration-150 ${
                    isEven ? 'bg-slate-100/60' : 'bg-white'
                  } hover:bg-emerald-50/85`}
                >
                  <td className="py-4 pl-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-slate-200 text-slate-700 group-hover:bg-white rounded-lg font-black text-[10px] transition-colors">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 font-black">
                    <div className="flex items-center gap-1.5 group/name">
                      <button 
                        onClick={() => handleOpenEditModal(student)}
                        className="text-sm font-black text-slate-800 uppercase leading-none hover:text-emerald-700 hover:underline transition-all text-left flex items-center gap-1 cursor-pointer"
                        title="Bấm để chỉnh sửa chi tiết hồ sơ bé"
                      >
                        {student.name}
                        <Pencil size={11} className="text-slate-400 group-hover/name:text-emerald-600 opacity-40 group-hover/name:opacity-100 transition-all duration-150" />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">{student.className}</p>
                  </td>
                  
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.english} onChange={() => onToggleGifted(student.id, 'english')} className="w-6 h-6 accent-blue-600 rounded-lg cursor-pointer border-2" /></div></td>
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.drawing} onChange={() => onToggleGifted(student.id, 'drawing')} className="w-6 h-6 accent-pink-600 rounded-lg cursor-pointer border-2" /></div></td>
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.rhythm} onChange={() => onToggleGifted(student.id, 'rhythm')} className="w-6 h-6 accent-purple-600 rounded-lg cursor-pointer border-2" /></div></td>

                  <td className={`py-4 transition-colors ${isEven ? 'bg-orange-50/70' : 'bg-orange-50/30'} group-hover:bg-orange-100/50`}>
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={student.isFullDiscount !== undefined ? !!student.isFullDiscount : !!att?.isFullDiscount} 
                        onChange={() => onToggleDiscount(student.id, '100%')} 
                        className="w-7 h-7 accent-orange-600 rounded-lg cursor-pointer border-2 border-orange-200 hover:scale-110 transition-transform"
                      />
                    </div>
                  </td>
                  <td className={`py-4 transition-colors ${isEven ? 'bg-blue-50/70' : 'bg-blue-50/30'} group-hover:bg-blue-100/50 text-center font-bold`}>
                    <div className="flex justify-center">
                      {student.tuitionDiscountAmount && student.tuitionDiscountAmount > 0 ? (
                        <button 
                          onClick={() => handleOpenEditModal(student)}
                          className="px-2 py-1 bg-sky-100 text-sky-800 text-[11px] font-extrabold rounded-lg hover:bg-sky-200 border border-sky-200 transition-all font-mono"
                          title="Bấm để sửa số tiền giảm học phí"
                        >
                          -{formatCurrency(student.tuitionDiscountAmount)}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenEditModal(student)}
                          className="text-slate-400 hover:text-emerald-700 font-extrabold text-[11px] transition-colors flex items-center justify-center gap-0.5"
                          title="Bấm để nhập mức giảm học phí"
                        >
                          <span className="text-sm font-semibold">+</span>0đ
                        </button>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4">
                    <div className="flex items-center justify-center space-x-1.5 bg-slate-100/40 p-1 rounded-xl max-w-[125px] mx-auto border border-slate-200/40 shadow-sm">
                      <button 
                        onClick={() => onAttendanceChange(student.id, -1)} 
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-black bg-white hover:bg-slate-100 active:scale-95 transition-all text-sm text-slate-500 shadow-sm cursor-pointer select-none"
                        title="Giảm 1 ngày vắng"
                      >
                        -
                      </button>
                      <div className={`w-11 h-8 flex items-center justify-center rounded-lg transition-all border ${
                        (att?.absentDays || 0) > 0 
                          ? 'bg-amber-400 border-amber-500 text-amber-950 scale-105 shadow-sm ring-2 ring-amber-400/20' 
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        <span className="font-mono font-black text-base">{att?.absentDays || 0}</span>
                      </div>
                      <button 
                        onClick={() => onAttendanceChange(student.id, 1)} 
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-black bg-white hover:bg-slate-100 active:scale-95 transition-all text-sm text-slate-500 shadow-sm cursor-pointer select-none"
                        title="Tăng 1 ngày vắng"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  
                  <td className="py-4 text-right pr-3">
                    <button onClick={() => onViewInvoice(student)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 uppercase transition-all shadow-md">Lập phiếu</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-xl font-black text-slate-800 uppercase italic">Cập nhật hồ sơ bé</h4>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Họ và tên bé</label>
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all" />
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-[20px] py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Lớp Mẫu giáo">Lớp Mẫu giáo</option>
                    <option value="Lớp Nhà trẻ">Lớp Nhà trẻ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                  <input type="text" value={formData.phoneNumber || ''} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-[20px] py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500 font-bold"
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
                    id="autoUpdateAdmissionAtt"
                    checked={shouldUpdateAdmission}
                    onChange={(e) => setShouldUpdateAdmission(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 mt-0.5 shrink-0 cursor-pointer" 
                  />
                  <div className="space-y-1">
                    <label htmlFor="autoUpdateAdmissionAtt" className="text-xs font-black text-amber-950 block cursor-pointer">
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
                  <input type="checkbox" id="isNewAtt" checked={isStudentNew(formData as any, currentMonth, config)} onChange={(e) => setFormData({...formData, isNewStudent: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                  <label htmlFor="isNewAtt" className="text-xs font-bold text-emerald-800">Bé Mới (Tính phí CSVC & Học phẩm)</label>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-amber-50 rounded-2xl border border-amber-100 justify-center">
                  <label htmlFor="tuitionDiscAtt" className="text-[10px] font-black text-amber-800 uppercase tracking-widest pl-1">Mức giảm học phí (VND)</label>
                  <input 
                    type="number" 
                    id="tuitionDiscAtt"
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
                    id="isFullDiscAtt" 
                    checked={!!formData.isFullDiscount} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      isFullDiscount: e.target.checked, 
                      isHalfDiscount: e.target.checked ? false : !!formData.isHalfDiscount,
                      tuitionDiscountAmount: e.target.checked ? 0 : formData.tuitionDiscountAmount
                    })} 
                    className="w-5 h-5 accent-red-600 cursor-pointer" 
                  />
                  <label htmlFor="isFullDiscAtt" className="text-xs font-bold text-red-800 cursor-pointer">Giảm học phí 100% (Miễn phí)</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <input type="checkbox" id="isEnglishAtt" checked={!!formData.giftedSubjects?.english} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, english: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
                  <label htmlFor="isEnglishAtt" className="text-xs font-bold text-blue-800">Học Anh Văn</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                  <input type="checkbox" id="isDrawingAtt" checked={!!formData.giftedSubjects?.drawing} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, drawing: e.target.checked}})} className="w-5 h-5 accent-pink-600" />
                  <label htmlFor="isDrawingAtt" className="text-xs font-bold text-pink-800">Học Vẽ</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <input type="checkbox" id="isRhythmAtt" checked={!!formData.giftedSubjects?.rhythm} onChange={(e) => setFormData({...formData, giftedSubjects: {...formData.giftedSubjects!, rhythm: e.target.checked}})} className="w-5 h-5 accent-purple-600" />
                  <label htmlFor="isRhythmAtt" className="text-xs font-bold text-purple-800">Học Nhịp Điệu</label>
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
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs">Hủy</button>
              <button onClick={handleSaveStudent} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">Lưu hồ sơ</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
