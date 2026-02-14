
import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, X, Upload, Info, AlertCircle, FileSpreadsheet, FileUp, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, Badge } from './Common';
import { Student } from '../types';
import { calculateAgeInMonths } from '../utils/calculations';

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
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    dob: '',
    className: 'Lớp Mầm 1',
    giftedSubjects: { english: false, drawing: false, rhythm: false },
    isNewStudent: false,
    admissionDate: new Date().toISOString().split('T')[0],
    phoneNumber: ''
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const ageMonths = calculateAgeInMonths(s.dob);
    if (activeClassTab === 'nursery') return matchesSearch && ageMonths < 36;
    if (activeClassTab === 'preschool') return matchesSearch && ageMonths >= 36;
    return matchesSearch;
  });

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        id: `HS${Date.now()}`,
        name: '',
        dob: '',
        className: 'Lớp Mầm 1',
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
      alert("Vui lòng nhập đầy đủ Tên và Ngày sinh!");
      return;
    }
    if (editingStudent) {
      onUpdate(formData as Student);
    } else {
      onAdd(formData as Student);
    }
    setShowModal(false);
  };

  const formatExcelDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    const parts = String(value).split(/[/-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return String(value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const importedData: Student[] = json.map((row) => {
          const name = String(row['Họ và tên'] || row['Họ tên'] || row['Tên'] || row['Name'] || row['name'] || 'Không tên');
          const dob = formatExcelDate(row['Ngày sinh'] || row['NS'] || row['DOB'] || row['dob']);
          const className = String(row['Lớp'] || row['Lớp học'] || row['Class'] || row['class'] || 'Lớp Nhà trẻ');
          const phone = String(row['Số điện thoại'] || row['SĐT'] || row['Phone'] || row['PhoneNumber'] || '');
          const admission = formatExcelDate(row['Ngày nhập học'] || row['Ngày vào'] || row['AdmissionDate'] || new Date().toISOString().split('T')[0]);
          
          const statusRaw = String(row['Bé mới'] || row['Trạng thái'] || row['IsNewStudent'] || 'Cũ').toLowerCase();
          const isNew = statusRaw.includes('mới') || statusRaw === 'true';

          const rawId = row['ID'] || row['Mã số'];
          const generatedId = rawId ? String(rawId) : `HS-${name.replace(/\s+/g, '')}-${dob.replace(/-/g, '')}`;

          return {
            id: generatedId,
            name,
            dob,
            className,
            giftedSubjects: {
              english: String(row['Anh văn'] || row['English'] || '').toUpperCase() === 'TRUE',
              drawing: String(row['Vẽ'] || row['Drawing'] || '').toUpperCase() === 'TRUE',
              rhythm: String(row['Nhịp điệu'] || row['Rhythm'] || '').toUpperCase() === 'TRUE',
            },
            isNewStudent: isNew,
            admissionDate: admission,
            phoneNumber: phone
          };
        });

        if (importedData.length > 0) {
          onImport(importedData);
          alert(`Đã nạp gộp thành công ${importedData.length} bé vào danh sách!`);
        } else {
          alert('Không tìm thấy dữ liệu học sinh trong file!');
        }
      } catch (err) {
        alert('Lỗi khi đọc file Excel. Hãy kiểm tra các cột: Họ tên, Ngày sinh, Lớp...');
      } finally {
        setImportLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
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
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveClassTab('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClassTab === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >Tất cả ({students.length})</button>
            <button 
              onClick={() => setActiveClassTab('preschool')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClassTab === 'preschool' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >Khối Mẫu Giáo</button>
            <button 
              onClick={() => setActiveClassTab('nursery')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClassTab === 'nursery' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >Khối Nhà Trẻ</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            {isConfirmingClear ? (
              <div className="flex items-center gap-1 bg-red-600 rounded-2xl p-1 animate-in zoom-in duration-200">
                <button 
                  onClick={() => { onClearAll(); setIsConfirmingClear(false); }}
                  className="px-4 py-2 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase shadow-lg"
                >BẤM ĐỂ XÓA HẾT!</button>
                <button 
                  onClick={() => setIsConfirmingClear(false)}
                  className="p-2 text-white hover:bg-red-700 rounded-xl"
                ><X size={16} /></button>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingClear(true)}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-xs uppercase hover:bg-red-100 transition-all shadow-sm"
              >
                <Trash2 size={18} />
                Làm sạch
              </button>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx, .xls, .csv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className={`flex items-center gap-2 px-4 py-3 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl font-bold text-xs uppercase hover:bg-emerald-50 transition-all shadow-sm ${importLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {importLoading ? <RefreshCw className="animate-spin" size={18} /> : (students.length > 0 ? <Layers size={18} /> : <FileUp size={18} />)}
            {importLoading ? 'Đang đọc...' : (students.length > 0 ? 'Nạp thêm file (Gộp)' : 'Nạp từ PC')}
          </button>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Tiếp nhận bé
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 text-slate-300">
           <FileSpreadsheet size={80} className="mb-6 opacity-10" />
           <p className="font-black uppercase text-xl tracking-widest opacity-30 italic">Chưa có dữ liệu học sinh</p>
           <div className="mt-4 flex flex-col items-center gap-2 text-center max-w-sm px-6">
             <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">
               Hệ thống sẽ mặc định là "Bé cũ". 
               Nếu muốn đánh dấu bé mới, hãy thêm cột "Trạng thái" và ghi chữ "Mới".
             </p>
             <button onClick={() => fileInputRef.current?.click()} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg hover:bg-emerald-700">Bắt đầu nạp file</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map(student => (
            <Card key={student.id} className="group hover:border-emerald-500 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-xl border-2 border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border border-slate-50">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge color={student.isNewStudent ? 'emerald' : 'slate'}>{student.isNewStudent ? 'Mới' : 'Cũ'}</Badge>
                </div>
              </div>
              
              <h5 className="font-black text-slate-900 text-lg uppercase mb-0.5 truncate tracking-tight">{student.name}</h5>
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-3">{student.className} • {student.id}</p>
              
              <div className="space-y-2 mb-6">
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>NS: {new Date(student.dob).toLocaleDateString('vi-VN')}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <Info size={12} className="text-slate-300" />
                    <span>Nhập học: {student.admissionDate}</span>
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
                  <button onClick={() => window.confirm(`Xóa bé ${student.name.toUpperCase()}?`) && onDelete(student.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
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
                  <input type="text" value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                  <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none" />
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
