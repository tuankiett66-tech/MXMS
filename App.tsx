
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Student, GlobalConfig, Attendance, GiftedSubjects } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AttendanceTable } from './components/Attendance';
import { Invoices } from './components/Invoices';
import { Students } from './components/Students';
import { Settings } from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // KHỞI TẠO RỖNG: Tránh việc nạp file mà vẫn hiện 2 bé mặc định
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handleAttendanceChange = (studentId: string, change: number) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.month === currentMonth && a.year === currentYear);
      if (existing) {
        return prev.map(a => 
          a.studentId === studentId && a.month === currentMonth && a.year === currentYear
          ? { ...a, absentDays: Math.max(0, a.absentDays + change) }
          : a
        );
      }
      return [...prev, { studentId, month: currentMonth, year: currentYear, absentDays: Math.max(0, change) }];
    });
  };

  const handleToggleDiscount = (studentId: string, type: '50%' | '100%') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.month === currentMonth && a.year === currentYear);
      if (existing) {
        return prev.map(a => {
          if (a.studentId === studentId && a.month === currentMonth && a.year === currentYear) {
            if (type === '50%') return { ...a, isHalfDiscount: !a.isHalfDiscount, isFullDiscount: false };
            if (type === '100%') return { ...a, isFullDiscount: !a.isFullDiscount, isHalfDiscount: false };
          }
          return a;
        });
      }
      return [...prev, { 
        studentId, month: currentMonth, year: currentYear, absentDays: 0, 
        isHalfDiscount: type === '50%', isFullDiscount: type === '100%' 
      }];
    });
  };

  const toggleGiftedSubject = (studentId: string, subject: keyof GiftedSubjects) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          giftedSubjects: { ...s.giftedSubjects, [subject]: !s.giftedSubjects[subject] }
        };
      }
      return s;
    }));
  };

  const toggleNewStudent = (studentId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isNewStudent: !s.isNewStudent } : s));
  };

  const addStudent = (newStudent: Student) => setStudents(prev => [...prev, newStudent]);
  const updateStudent = (updated: Student) => setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  const deleteStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));
  const clearAllStudents = () => { setStudents([]); setAttendance([]); setSelectedStudent(null); };
  
  // LOGIC NẠP GỘP: Không ghi đè, chỉ thêm mới dựa trên ID
  const importStudents = (newStudents: Student[]) => {
    setStudents(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const filteredNew = newStudents.filter(s => !existingIds.has(s.id));
      return [...prev, ...filteredNew];
    });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab}
        currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
        currentYear={currentYear} setCurrentYear={setCurrentYear}
        config={config} setConfig={setConfig}
      />
      <div className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10 no-print">
          <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">
            {activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'attendance' ? 'Điểm danh & Giảm phí' : 'Hệ thống MXMS'}
          </h2>
          <div className="flex items-center space-x-2 pl-4 font-black text-xs uppercase text-slate-700">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">AD</div>
            <span>Admin MXMS</span>
          </div>
        </header>
        <main className="p-8">
          {activeTab === 'dashboard' && <Dashboard students={students} config={config} attendance={attendance} currentMonth={currentMonth} currentYear={currentYear} />}
          {activeTab === 'attendance' && (
            <AttendanceTable 
              students={students} attendance={attendance} 
              currentMonth={currentMonth} currentYear={currentYear} 
              onAttendanceChange={handleAttendanceChange}
              onToggleDiscount={handleToggleDiscount}
              onToggleGifted={toggleGiftedSubject}
              onToggleNew={toggleNewStudent}
              onViewInvoice={(s) => { setSelectedStudent(s); setActiveTab('invoices'); }}
            />
          )}
          {activeTab === 'invoices' && <Invoices students={students} config={config} attendance={attendance} currentMonth={currentMonth} currentYear={currentYear} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} />}
          {activeTab === 'students' && <Students students={students} onAdd={addStudent} onUpdate={updateStudent} onDelete={deleteStudent} onImport={importStudents} onClearAll={clearAllStudents} />}
          {activeTab === 'settings' && <Settings config={config} setConfig={setConfig} />}
        </main>
      </div>
    </div>
  );
}
