
import React, { useState, useEffect } from 'react';
import { Student, GlobalConfig, Attendance, GiftedSubjects } from './types.ts';
import { DEFAULT_CONFIG } from './constants.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AttendanceTable } from './components/Attendance.tsx';
import { Invoices } from './components/Invoices.tsx';
import { Students } from './components/Students.tsx';
import { Settings } from './components/Settings.tsx';
import { LayoutDashboard, CalendarCheck, FileText, Users, Settings as SettingsIcon } from 'lucide-react';

const STORAGE_KEY = 'MXMS_APP_DATA';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Khởi tạo state từ LocalStorage hoặc mặc định
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_STUDENTS`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ATTENDANCE`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [config, setConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_CONFIG`);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_MONTH`);
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });
  
  const [currentYear, setCurrentYear] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_YEAR`);
    return saved ? parseInt(saved) : new Date().getFullYear();
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Tự động lưu khi có thay đổi (Auto-save)
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_STUDENTS`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ATTENDANCE`, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CONFIG`, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MONTH`, currentMonth.toString());
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_YEAR`, currentYear.toString());
  }, [currentYear]);

  const handleManualSave = () => {
    localStorage.setItem(`${STORAGE_KEY}_STUDENTS`, JSON.stringify(students));
    localStorage.setItem(`${STORAGE_KEY}_ATTENDANCE`, JSON.stringify(attendance));
    localStorage.setItem(`${STORAGE_KEY}_CONFIG`, JSON.stringify(config));
    localStorage.setItem(`${STORAGE_KEY}_MONTH`, currentMonth.toString());
    localStorage.setItem(`${STORAGE_KEY}_YEAR`, currentYear.toString());
    alert("Đã lưu toàn bộ dữ liệu vào bộ nhớ trình duyệt!");
  };

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
  const clearAllStudents = () => { 
    if(window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu không?")) {
      setStudents([]); 
      setAttendance([]); 
      setSelectedStudent(null);
      localStorage.removeItem(`${STORAGE_KEY}_STUDENTS`);
      localStorage.removeItem(`${STORAGE_KEY}_ATTENDANCE`);
    }
  };
  
  const importStudents = (newStudents: Student[]) => {
    setStudents(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const filteredNew = newStudents.filter(s => !existingIds.has(s.id));
      return [...prev, ...filteredNew];
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8fafc] overflow-hidden">
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar 
          activeTab={activeTab} setActiveTab={setActiveTab}
          currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
          currentYear={currentYear} setCurrentYear={setCurrentYear}
          config={config} setConfig={setConfig}
          onManualSave={handleManualSave}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 md:h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="md:hidden w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
               <LayoutDashboard size={18} className="text-white" />
            </div>
            <h2 className="text-sm md:text-lg font-black text-slate-800 uppercase italic tracking-tight truncate max-w-[150px] md:max-w-none">
              {activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'attendance' ? 'Điểm danh' : activeTab === 'invoices' ? 'Phiếu thu' : 'MXMS'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 font-black text-[10px] md:text-xs uppercase text-slate-700">
            <span className="hidden sm:inline">Tháng {currentMonth}/{currentYear}</span>
            <button 
              onClick={handleManualSave}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all md:mr-2"
            >
              Lưu dữ liệu
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-white shadow-sm">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
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
          {activeTab === 'settings' && <Settings config={config} setConfig={setConfig} onManualSave={handleManualSave} />}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex items-center justify-around z-50 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'attendance', icon: CalendarCheck, label: 'Điểm danh' },
            { id: 'invoices', icon: FileText, label: 'Phiếu' },
            { id: 'students', icon: Users, label: 'Bé' },
            { id: 'settings', icon: SettingsIcon, label: 'Cấu hình' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 py-1 transition-all rounded-xl ${activeTab === item.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-black uppercase mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
