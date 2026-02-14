
import React, { useMemo } from 'react';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Doanh thu dự kiến T{currentMonth}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </Card>
        <Card className="flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Tổng số học sinh</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.studentCount} bé</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
        </Card>
        <Card className="flex items-center justify-between border-l-4 border-l-orange-500">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Niên học còn lại</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{calculateMonthsRemaining(currentMonth)} tháng</h3>
          </div>
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <h4 className="font-bold text-slate-800 mb-8 uppercase text-xs tracking-widest">Biểu đồ doanh thu 2024</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} formatter={(v) => formatCurrency(v as number)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h4 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest">Bé mới trong tháng</h4>
          <div className="space-y-4">
            {students.filter(s => s.isNewStudent).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-emerald-600 shadow-sm uppercase">{s.name.split(' ').pop()?.charAt(0)}</div>
                  <span className="text-xs font-black text-slate-800 uppercase">{s.name}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
