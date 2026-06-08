
import React, { useState, useEffect } from 'react';
import { Student, GlobalConfig, Attendance, GiftedSubjects } from './types.ts';
import { DEFAULT_CONFIG } from './constants.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AttendanceTable } from './components/Attendance.tsx';
import { Invoices } from './components/Invoices.tsx';
import { Students } from './components/Students.tsx';
import { Settings } from './components/Settings.tsx';
import { MealRefund } from './components/MealRefund.tsx';
import { LayoutDashboard, CalendarCheck, FileText, Users, Settings as SettingsIcon, RefreshCw, Loader2, Utensils, Download } from 'lucide-react';
import { calculateInvoice, formatCurrency, sortStudents, isPreschoolClass, isNurseryClass, ensureClassEntryDates, formatDateToDMY } from './utils/calculations.ts';

const STORAGE_KEY = 'MXMS_APP_DATA';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Khởi tạo state từ LocalStorage hoặc mặc định
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_STUDENTS`);
    return saved ? ensureClassEntryDates(JSON.parse(saved)) : [];
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
  const [bulkPrintClass, setBulkPrintClass] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Tải dữ liệu từ Google Sheets khi mở app hoặc khi nhận URL tham số
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlScript = params.get('scriptUrl');
    
    if (urlScript) {
      const decodedUrl = decodeURIComponent(urlScript);
      const updatedConfig = { ...config, scriptUrl: decodedUrl };
      setConfig(updatedConfig);
      localStorage.setItem(`${STORAGE_KEY}_CONFIG`, JSON.stringify(updatedConfig));
      
      // Dọn dẹp URL tham số để địa chỉ web trông sạch sẽ hơn
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const autoLoad = async () => {
        setSyncing(true);
        try {
          const response = await fetch(decodedUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.students) setStudents(ensureClassEntryDates(data.students));
          if (data.attendance) setAttendance(data.attendance);
          if (data.config) setConfig(data.config);
          if (data.month) setCurrentMonth(data.month);
          if (data.year) setCurrentYear(data.year);
          alert("⚡ Tự động liên kết và tải dữ liệu từ Google Sheets thành công!");
        } catch (error: any) {
          console.error("Lỗi khi tải dữ liệu tự động:", error);
          alert(
            `Phát hiện đường dẫn cấu hình mới nhưng không thể tải dữ liệu!\n\n` +
            `Chi tiết lỗi: ${error.message || error}`
          );
        } finally {
          setSyncing(false);
        }
      };
      autoLoad();
    } else if (config.scriptUrl) {
      loadData();
    }
  }, []);

  const handleBulkPrint = (className: string) => {
    setBulkPrintClass(className);
    setSelectedStudent(null);
    setActiveTab('invoices');
  };

  const loadData = async () => {
    if (!config.scriptUrl) {
      alert(
        "💡 Bạn chưa thiết lập liên kết đồng bộ Google Sheets!\n\n" +
        "Vui lòng vào tab 'Cấu hình phí' -> phần 'Đồng bộ Google Sheets' dán link Google Apps Script URL của bạn.\n" +
        "Sau đó, bạn sẽ có thể lưu trữ và tải dữ liệu lưu trên Google Trang Tính về máy bất kỳ lúc nào!"
      );
      return;
    }
    setSyncing(true);
    try {
      const response = await fetch(config.scriptUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.students) setStudents(ensureClassEntryDates(data.students));
      if (data.attendance) setAttendance(data.attendance);
      if (data.config) setConfig(data.config);
      if (data.month) setCurrentMonth(data.month);
      if (data.year) setCurrentYear(data.year);
      alert("🎉 Tải toàn bộ dữ liệu từ Google Sheets thành công!");
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu từ Google Sheets:", error);
      alert(
        `❌ Không thể tải dữ liệu từ Google Sheets!\n\n` +
        `Hướng dẫn khắc phục trên thiết bị này:\n\n` +
        `1. QUAN TRỌNG: Mở Google Apps Script của bạn và chọn Triển khai mới (New Deployment):\n` +
        `   - Execute as (Thực thi dưới quyền): Chọn "Me" (Tôi)\n` +
        `   - Who has access (Ai có quyền truy cập): Phải chọn "Anyone" (Bất kỳ ai / Mọi người)\n` +
        `   => Nếu chọn "Anyone with Google account" hoặc "Only me", các thiết bị khác hoặc khi không đăng nhập Google sẽ bị chặn tải do bảo mật CORS.\n\n` +
        `2. Hãy thử copy đường dán Script URL dán trực tiếp lên trình duyệt tab mới xem có hiện ra dữ liệu JSON không.\n` +
        `3. Hãy thử tắt Trình chặn quảng cáo (Adblock / Brave shield) nếu có.\n\n` +
        `Chi tiết lỗi hệ thống: ${error.message || error}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const saveData = async () => {
    // Lưu vào LocalStorage trước
    localStorage.setItem(`${STORAGE_KEY}_STUDENTS`, JSON.stringify(students));
    localStorage.setItem(`${STORAGE_KEY}_ATTENDANCE`, JSON.stringify(attendance));
    localStorage.setItem(`${STORAGE_KEY}_CONFIG`, JSON.stringify(config));
    localStorage.setItem(`${STORAGE_KEY}_MONTH`, currentMonth.toString());
    localStorage.setItem(`${STORAGE_KEY}_YEAR`, currentYear.toString());

    if (!config.scriptUrl) {
      alert("Đã lưu vào bộ nhớ trình duyệt!");
      return;
    }

    setSyncing(true);
    try {
      // Chuẩn bị dữ liệu định dạng cho các Sheet (Chỉ đồng bộ các bé Đang học & Học hè, bỏ qua Tạm nghỉ)
      const activeStudentsForSheet = students.filter(s => s.status !== 'Tạm nghỉ');
      const sortedActiveStudents = sortStudents(activeStudentsForSheet);

      const preschoolRows = sortedActiveStudents
        .filter(s => isPreschoolClass(s.className))
        .map((s, i) => {
          const inv = calculateInvoice(s, config, attendance, currentMonth, currentYear);
          const formattedDOB = s.dob ? formatDateToDMY(s.dob) : "";
          return [
            i + 1, s.name.toUpperCase(), formattedDOB, 
            formatCurrency(inv.tuition), formatCurrency(inv.mealFee),
            formatCurrency(s.giftedSubjects.english ? config.giftedFees.english : 0),
            formatCurrency(s.giftedSubjects.drawing ? config.giftedFees.drawing : 0),
            formatCurrency(s.giftedSubjects.rhythm ? config.giftedFees.rhythm : 0),
            formatCurrency(inv.extraFee), formatCurrency(inv.csvcFee), formatCurrency(inv.materialFee),
            inv.calculationInfo.absentDays, formatCurrency(inv.total), s.notes || ""
          ];
        });

      // Tạo thêm 150 dòng trống để xóa trắng các dòng thừa cũ ở Google Sheets
      // khi số học sinh bị giảm đi (ví dụ bé chuyển sang "Tạm nghỉ")
      const paddedPreschoolRows = [...preschoolRows];
      const emptyPreschoolRow = Array(14).fill("");
      for (let i = 0; i < 150; i++) {
        paddedPreschoolRows.push(emptyPreschoolRow);
      }

      const nurseryRows = sortedActiveStudents
        .filter(s => isNurseryClass(s.className))
        .map((s, i) => {
          const inv = calculateInvoice(s, config, attendance, currentMonth, currentYear);
          const formattedDOB = s.dob ? formatDateToDMY(s.dob) : "";
          return [
            i + 1, s.name.toUpperCase(), formattedDOB, 
            formatCurrency(inv.tuition), formatCurrency(inv.mealFee),
            formatCurrency(s.giftedSubjects.rhythm ? config.giftedFees.rhythm : 0),
            formatCurrency(inv.extraFee), formatCurrency(inv.csvcFee), formatCurrency(inv.materialFee),
            inv.calculationInfo.absentDays, formatCurrency(inv.total), s.notes || ""
          ];
        });

      const paddedNurseryRows = [...nurseryRows];
      const emptyNurseryRow = Array(12).fill("");
      for (let i = 0; i < 150; i++) {
        paddedNurseryRows.push(emptyNurseryRow);
      }

      const payload = {
        students,
        attendance,
        config,
        formattedPreschool: paddedPreschoolRows,
        formattedNursery: paddedNurseryRows,
        month: currentMonth,
        year: currentYear
      };

      // Sử dụng fetch POST lên Apps Script
      // Lưu ý: Apps Script yêu cầu redirect, fetch sẽ tự xử lý nếu không dùng no-cors
      // Nhưng để tránh lỗi CORS phức tạp, ta dùng no-cors nếu chỉ cần gửi đi
      await fetch(config.scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert("🎉 Đã đồng bộ dữ liệu lên Google Sheets thành công!");
    } catch (error: any) {
      console.error("Lỗi khi đồng bộ:", error);
      alert(
        `❌ Lỗi khi đồng bộ dữ liệu lên Google Sheets!\n\n` +
        `Vui lòng kiểm tra:\n` +
        `- Đảm bảo thiết bị của bạn có kết nối mạng.\n` +
        `- Google Apps Script phải được triển khai (Deploy) công khai cho "Anyone" (Bất kỳ ai).\n\n` +
        `Chi tiết lỗi: ${error.message || error}`
      );
    } finally {
      setSyncing(false);
    }
  };

  // Tự động lưu khi có thay đổi (Auto-save vào LocalStorage)
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
    saveData();
  };

  const handleNextMonth = () => {
    if (window.confirm(`Bạn có chắc chắn muốn CHUYỂN SANG THÁNG MỚI? \n\nLưu ý: \n1. Hệ thống sẽ tự động tắt trạng thái "Bé mới" cho tất cả học sinh. \n2. Dữ liệu sẽ được đồng bộ lên Google Sheets.`)) {
      // 1. Tắt trạng thái bé mới
      setStudents(prev => prev.map(s => ({ ...s, isNewStudent: false })));
      
      // 2. Tăng tháng
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
      
      // 3. Thông báo thành công (saveData sẽ được gọi qua useEffect hoặc thủ công)
      alert(`Đã chuyển sang Tháng ${nextMonth}/${nextYear} thành công!`);
    }
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

  const handleUpdateAbsentDays = (studentId: string, absentDays: number) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.month === currentMonth && a.year === currentYear);
      if (existing) {
        return prev.map(a => 
          a.studentId === studentId && a.month === currentMonth && a.year === currentYear
          ? { ...a, absentDays: Math.max(0, absentDays) }
          : a
        );
      }
      return [...prev, { studentId, month: currentMonth, year: currentYear, absentDays: Math.max(0, absentDays) }];
    });
  };

  const handleToggleDiscount = (studentId: string, type: '50%' | '100%') => {
    // 1. Cập nhật thuộc tính bền vững trên đối tượng Student để lưu giữ khi đổi tháng
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        if (type === '50%') return { ...s, isHalfDiscount: !s.isHalfDiscount, isFullDiscount: false };
        if (type === '100%') return { ...s, isFullDiscount: !s.isFullDiscount, isHalfDiscount: false };
      }
      return s;
    }));

    // 2. Đồng thời cập nhật dữ liệu điểm danh tháng hiện tại
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
      const idMap = new Map(prev.map(s => [s.id, s]));
      const nameMap = new Map(prev.map(s => [s.name.trim().toLowerCase(), s]));
      const updatedList = [...prev];

      newStudents.forEach(newS => {
        const keyId = newS.id;
        const keyName = newS.name.trim().toLowerCase();

        // Match first by ID, if match not found, try by trimmed name (case-insensitive)
        const matched = idMap.get(keyId) || nameMap.get(keyName);

        if (matched) {
          const idx = updatedList.findIndex(s => s.id === matched.id);
          if (idx !== -1) {
            updatedList[idx] = {
              ...updatedList[idx],
              name: newS.name || updatedList[idx].name,
              dob: newS.dob || updatedList[idx].dob,
              className: newS.className || updatedList[idx].className,
              phoneNumber: newS.phoneNumber || updatedList[idx].phoneNumber,
              notes: newS.notes || updatedList[idx].notes,
              status: newS.status || updatedList[idx].status,
              isNewStudent: newS.isNewStudent !== undefined ? newS.isNewStudent : updatedList[idx].isNewStudent,
              isHalfDiscount: newS.isHalfDiscount !== undefined ? newS.isHalfDiscount : updatedList[idx].isHalfDiscount,
              isFullDiscount: newS.isFullDiscount !== undefined ? newS.isFullDiscount : updatedList[idx].isFullDiscount,
              giftedSubjects: {
                english: newS.giftedSubjects?.english !== undefined ? newS.giftedSubjects.english : updatedList[idx].giftedSubjects?.english,
                drawing: newS.giftedSubjects?.drawing !== undefined ? newS.giftedSubjects.drawing : updatedList[idx].giftedSubjects?.drawing,
                rhythm: newS.giftedSubjects?.rhythm !== undefined ? newS.giftedSubjects.rhythm : updatedList[idx].giftedSubjects?.rhythm,
              }
            };
          }
        } else {
          updatedList.push(newS);
        }
      });
      return updatedList;
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
          onLoadData={loadData}
          syncing={syncing}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 md:h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="md:hidden w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
               <LayoutDashboard size={18} className="text-white" />
            </div>
            <h2 className="text-sm md:text-lg font-black text-slate-800 uppercase italic tracking-tight truncate max-w-[150px] md:max-w-none">
              {activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'attendance' ? 'Điểm danh' : activeTab === 'invoices' ? 'Phiếu thu' : activeTab === 'mealRefund' ? 'Sổ tiền ăn' : 'MXMS'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 font-black text-[10px] md:text-xs uppercase text-slate-700">
            <span className="hidden sm:inline">Tháng {currentMonth}/{currentYear}</span>
            <button 
              onClick={handleManualSave}
              disabled={syncing}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Lưu dữ liệu hiện tại lên bộ nhớ máy & Google Trang Tính"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : null}
              Lưu dữ liệu
            </button>
            <button 
              onClick={loadData}
              disabled={syncing}
              className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Tải dữ liệu từ Google Trang Tính xuống bộ nhớ máy"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Tải dữ liệu
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-white shadow-sm">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard students={students} config={config} attendance={attendance} currentMonth={currentMonth} currentYear={currentYear} onBulkPrint={handleBulkPrint} />}
          {activeTab === 'attendance' && (
            <AttendanceTable 
              students={students} attendance={attendance} 
              currentMonth={currentMonth} currentYear={currentYear} 
              onAttendanceChange={handleAttendanceChange}
              onToggleDiscount={handleToggleDiscount}
              onToggleGifted={toggleGiftedSubject}
              onToggleNew={toggleNewStudent}
              onViewInvoice={(s) => { setSelectedStudent(s); setBulkPrintClass(null); setActiveTab('invoices'); }}
            />
          )}
          {activeTab === 'invoices' && <Invoices students={students} config={config} attendance={attendance} currentMonth={currentMonth} currentYear={currentYear} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} bulkPrintClass={bulkPrintClass} setBulkPrintClass={setBulkPrintClass} />}
          {activeTab === 'mealRefund' && <MealRefund students={students} config={config} attendance={attendance} currentMonth={currentMonth} currentYear={currentYear} onUpdateAbsentDays={handleUpdateAbsentDays} />}
          {activeTab === 'students' && <Students students={students} onAdd={addStudent} onUpdate={updateStudent} onDelete={deleteStudent} onImport={importStudents} onClearAll={clearAllStudents} />}
          {activeTab === 'settings' && <Settings config={config} setConfig={setConfig} onManualSave={handleManualSave} onNextMonth={handleNextMonth} onLoadData={loadData} syncing={syncing} />}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-1 py-2 flex items-center justify-around z-50 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'attendance', icon: CalendarCheck, label: 'Điểm danh' },
            { id: 'invoices', icon: FileText, label: 'Phiếu' },
            { id: 'mealRefund', icon: Utensils, label: 'Sổ ăn' },
            { id: 'students', icon: Users, label: 'Bé Excel' },
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
