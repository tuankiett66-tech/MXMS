
import React, { useMemo } from 'react';
import { TrendingUp, Users, Calendar, FileSpreadsheet, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Card } from './Common';
import { Student, GlobalConfig, Attendance } from '../types';
import { calculateInvoice, formatCurrency, calculateMonthsRemaining } from '../utils/calculations';

interface DashboardProps {
  students: Student[];
  config: GlobalConfig;
  attendance: Attendance[];
  currentMonth: number;
  currentYear: number;
}

export const Dashboard = ({ students, config, attendance, currentMonth, currentYear }: DashboardProps) => {
  const stats = useMemo(() => {
    const invoices = students.map(s => calculateInvoice(s, config, attendance, currentMonth, currentYear));
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
    return {
      totalRevenue,
      studentCount: students.length,
      newCount: students.filter(s => s.isNewStudent).length
    };
  }, [students, config, attendance, currentMonth, currentYear]);

  const revenueData = [
    { name: 'T1', value: 125500000 }, { name: 'T2', value: 135000000 },
    { name: 'T3', value: 110000000 }, { name: 'T4', value: 120000000 },
    { name: 'T5', value: 145000000 }, { name: 'T6', value: 125000000 },
  ];

  const exportClassExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Group students by class
    const classes = Array.from(new Set(students.map(s => s.className)));
    
    classes.forEach(className => {
      const classStudents = students.filter(s => s.className === className);
      const data = classStudents.map((s, index) => {
        const inv = calculateInvoice(s, config, attendance, currentMonth, currentYear);
        return {
          "STT": index + 1,
          "Họ và tên": s.name.toUpperCase(),
          "Lớp": s.className,
          "Tổng cộng (VNĐ)": inv.total,
          "Hình thức (TM/CK)": "",
          "Ngày đóng": "",
          "Ký tên / Ghi chú": ""
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 5 },  // STT
        { wch: 30 }, // Họ và tên
        { wch: 15 }, // Lớp
        { wch: 20 }, // Tổng cộng
        { wch: 15 }, // Hình thức
        { wch: 15 }, // Ngày đóng
        { wch: 25 }, // Ký tên
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, className.substring(0, 31)); // Sheet name max 31 chars
    });

    XLSX.writeFile(wb, `Theo_doi_thu_phi_T${currentMonth}_${currentYear}.xlsx`);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-black text-slate-800 uppercase italic">Bảng điều khiển</h3>
        <button 
          onClick={exportClassExcel}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <FileSpreadsheet size={18} />
          Xuất file theo dõi lớp
        </button>
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
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{calculateMonthsRemaining(currentMonth)} tháng</h3>
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
            {students.filter(s => s.isNewStudent).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bé mới tháng này</p>
            ) : (
              students.filter(s => s.isNewStudent).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm uppercase">{s.name.split(' ').pop()?.charAt(0)}</div>
                    <span className="text-[10px] md:text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{s.name}</span>
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
