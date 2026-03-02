
import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, X, Info, CheckCircle2, FileUp, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, Badge } from './Common';
import { Student } from '../types';

interface StudentsProps {
  students: Student[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
  onImport: (list: Student[]) => void;
  onClearAll: () => void;
}

export const Students = ({ students, onAdd, onUpdate, onDelete, onImport, onClearAll }: StudentsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClassTab, setActiveClassTab] = useState<'all' | 'nursery' | 'preschool'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    dob: '',
    className: 'Lớp Mẫu giáo',
    giftedSubjects: { english: false, drawing: false, rhythm: false },
    isNewStudent: false,
    admissionDate: new Date().toISOString().split('T')[0],
    phoneNumber: ''
  });

  const formatToInputDate = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedStudents: Student[] = data.map((row, index) => ({
        id: String(row.ID || row['Mã HS'] || `HS${Date.now()}${index}`),
        name: String(row.Name || row['Họ tên'] || row['Tên'] || 'Không rõ tên'),
        dob: formatToInputDate(row.DOB || row['Ngày sinh']),
        className: String(row.Class || row['Lớp'] || 'Lớp Mẫu giáo'),
        giftedSubjects: {
          english: row.English === true || row['Anh văn'] === true || String(row.English).toUpperCase() === 'TRUE',
          drawing: row.Drawing === true || row['Vẽ'] === true || String(row.Drawing).toUpperCase() === 'TRUE',
          rhythm: row.Rhythm === true || row['Nhịp điệu'] === true || String(row.Rhythm).toUpperCase() === 'TRUE'
        },
        isNewStudent: row.IsNewStudent === true || row['Mới'] === true || String(row.IsNewStudent).toUpperCase() === 'TRUE',
        admissionDate: formatToInputDate(row.AdmissionDate || row['Ngày nhập học']) || new Date().toISOString().split('T')[0],
        phoneNumber: String(row.PhoneNumber || row['SĐT'] || row['Số điện thoại'] || '')
      }));

      onImport(importedStudents);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`Đã nạp thành công ${importedStudents.length} bé vào danh sách!`);
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const classNameLower = s.className.toLowerCase();
    if (activeClassTab === 'nursery') return matchesSearch && classNameLower.includes('nhà trẻ');
    if (activeClassTab === 'preschool') return matchesSearch && classNameLower.includes('mẫu giáo');
    return matchesSearch;
  });

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        ...student,
        dob: formatToInputDate(student.dob)
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
        admissionDate: new Date().toISOString().split('T')[0],
        phoneNumber: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.dob) {
      alert("Vui lòng nhập họ tên và ngày sinh!");
      return;
    }
    if (editingStudent) {
      onUpdate(formData as Student);
    } else {
      onAdd(formData as Student);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xác nhận xóa bé ${name.toUpperCase()} khỏi danh sách?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên bé, lớp hoặc ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium shadow-sm"
            />
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveClassTab('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeClassTab === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Tất cả ({students.length})</button>
            <button onClick={() => setActiveClassTab('preschool')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeClassTab === 'preschool' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Khối Mẫu Giáo</button>
            <button onClick={() => setActiveClassTab('nursery')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeClassTab === 'nursery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Khối Nhà Trẻ</button>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-bold text-xs uppercase hover:bg-blue-100 transition-all shadow-sm whitespace-nowrap"
          >
            <FileUp size={18} />
            Nạp file Excel
          </button>

          <button 
            onClick={() => setIsConfirmingClear(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-xs uppercase hover:bg-red-100 transition-all shadow-sm whitespace-nowrap"
          >
            <Trash2 size={18} />
            Làm sạch
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            Tiếp nhận bé
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 text-slate-300">
           <FileUp size={80} className="mb-6 opacity-10" />
           <p className="font-black uppercase text-xl tracking-widest opacity-30 italic">Chưa có dữ liệu</p>
           <div className="flex gap-4 mt-6">
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Nạp Excel</button>
              <button onClick={() => handleOpenModal()} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Thêm thủ công</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student, index) => (
            <Card key={student.id} className="group hover:border-emerald-500 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-xl border-2 border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-100 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-50">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
                <Badge color={student.isNewStudent ? 'emerald' : 'slate'}>{student.isNewStudent ? 'Mới' : 'Cũ'}</Badge>
              </div>
              
              <h5 className="font-black text-slate-900 text-lg uppercase mb-0.5 truncate tracking-tight">{student.name}</h5>
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-3">{student.className}</p>
              
              <div className="space-y-2 mb-6">
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>NS: {student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <Calendar size={12} className="text-blue-500" />
                    <span>Nhập học: {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                 </div>
                 <div className="flex flex-wrap gap-1 mt-2">
                  {student.giftedSubjects.english && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md border border-blue-100 uppercase">Anh văn</span>}
                  {student.giftedSubjects.drawing && <span className="px-2 py-0.5 bg-pink-50 text-pink-600 text-[9px] font-black rounded-md border border-pink-100 uppercase">Vẽ</span>}
                  {student.giftedSubjects.rhythm && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded-md border border-purple-100 uppercase">Nhịp điệu</span>}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400">{student.phoneNumber || 'N/A'}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(student)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(student.id, student.name)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
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
                  <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lớp học</label>
                  <input type="text" value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày nhập học</label>
                  <input type="date" value={formData.admissionDate} onChange={(e) => setFormData({...formData, admissionDate: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <input type="checkbox" id="isNew" checked={formData.isNewStudent} onChange={(e) => setFormData({...formData, isNewStudent: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                <label htmlFor="isNew" className="text-xs font-bold text-emerald-800">Bé Mới (Tính phí CSVC & Học phẩm)</label>
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
