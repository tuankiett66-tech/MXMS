
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Card } from './Common';
import { Student, Attendance, GiftedSubjects } from '../types';
import { sortStudents } from '../utils/calculations';

interface AttendanceProps {
  students: Student[];
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
  onAttendanceChange: (id: string, change: number) => void;
  onToggleDiscount: (id: string, type: '50%' | '100%') => void;
  onToggleGifted: (id: string, subject: keyof GiftedSubjects) => void;
  onToggleNew: (id: string) => void;
  onViewInvoice: (s: Student) => void;
}

export const AttendanceTable = ({ 
  students, attendance, currentMonth, currentYear, onAttendanceChange, onToggleDiscount, onToggleGifted, onToggleNew, onViewInvoice 
}: AttendanceProps) => {
  const [activeClassTab, setActiveClassTab] = useState<'all' | 'nursery' | 'preschool'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const activeStudents = students.filter(s => s.status !== 'Tạm nghỉ');
  const sortedStudents = sortStudents(activeStudents);

  const filteredStudents = sortedStudents.filter(s => {
    const classNameLower = s.className.toLowerCase();
    const isClassMatch = activeClassTab === 'all' || 
                         (activeClassTab === 'nursery' && classNameLower.includes('nhà trẻ')) ||
                         (activeClassTab === 'preschool' && classNameLower.includes('mẫu giáo'));
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
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
        
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl justify-end">
          {/* Tìm kiếm */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm bé điểm danh..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-xs text-slate-700 shadow-inner"
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
            {['all', 'preschool', 'nursery'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveClassTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeClassTab === tab ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'preschool' ? 'Khối MG' : 'Khối NT'}
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
              <th className="pb-4 text-center text-blue-600">Giảm HP 50%</th>
              <th className="pb-4 text-center">Vắng</th>
              <th className="pb-4 text-right pr-2">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStudents.map((student, index) => {
              const att = attendance.find(a => a.studentId === student.id && a.month === currentMonth && a.year === currentYear);
              return (
                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-2">
                    <span className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg font-black text-[10px]">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{student.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{student.className}</p>
                  </td>
                  
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.english} onChange={() => onToggleGifted(student.id, 'english')} className="w-6 h-6 accent-blue-600 rounded-lg cursor-pointer border-2" /></div></td>
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.drawing} onChange={() => onToggleGifted(student.id, 'drawing')} className="w-6 h-6 accent-pink-600 rounded-lg cursor-pointer border-2" /></div></td>
                  <td className="py-4"><div className="flex justify-center"><input type="checkbox" checked={student.giftedSubjects.rhythm} onChange={() => onToggleGifted(student.id, 'rhythm')} className="w-6 h-6 accent-purple-600 rounded-lg cursor-pointer border-2" /></div></td>

                  <td className="py-4 bg-orange-50/30">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={!!att?.isFullDiscount} 
                        onChange={() => onToggleDiscount(student.id, '100%')} 
                        className="w-7 h-7 accent-orange-600 rounded-lg cursor-pointer border-2 border-orange-200 hover:scale-110 transition-transform"
                      />
                    </div>
                  </td>
                  <td className="py-4 bg-blue-50/30">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        checked={!!att?.isHalfDiscount} 
                        onChange={() => onToggleDiscount(student.id, '50%')} 
                        className="w-7 h-7 accent-blue-600 rounded-lg cursor-pointer border-2 border-blue-200 hover:scale-110 transition-transform"
                      />
                    </div>
                  </td>
                  
                  <td className="py-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => onAttendanceChange(student.id, -1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-black bg-white hover:bg-slate-50 transition-all text-xs">-</button>
                      <span className="font-black text-slate-900 text-base min-w-[20px] text-center">{att?.absentDays || 0}</span>
                      <button onClick={() => onAttendanceChange(student.id, 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-black bg-white hover:bg-slate-50 transition-all text-xs">+</button>
                    </div>
                  </td>
                  
                  <td className="py-4 text-right pr-2">
                    <button onClick={() => onViewInvoice(student)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 uppercase transition-all shadow-md">Lập phiếu</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
