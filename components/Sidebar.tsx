
import React from 'react';
import { LayoutDashboard, Users, CalendarCheck, FileText, Settings, Calendar, Save } from 'lucide-react';
import { GlobalConfig } from '../types';
import { calculateMonthsRemaining } from '../utils/calculations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentMonth: number;
  setCurrentMonth: (m: number) => void;
  currentYear: number;
  setCurrentYear: (y: number) => void;
  config: GlobalConfig;
  setConfig: (c: GlobalConfig) => void;
  onManualSave: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Sidebar = ({ 
  activeTab, setActiveTab, currentMonth, setCurrentMonth, currentYear, setCurrentYear, config, setConfig, onManualSave 
}: SidebarProps) => {
  return (
    <div className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 space-y-6 no-print overflow-y-auto shrink-0">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 leading-none text-sm uppercase">MXMS Admin</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Quản Lý Mầm Xanh</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100 shadow-inner">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian & Phí nhanh</p>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Tháng</label>
            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="w-full bg-white border-2 border-slate-200 rounded-lg text-sm font-bold p-2 text-slate-900 outline-none focus:border-emerald-500 transition-colors"
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m < 10 ? `0${m}` : m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Năm</label>
            <select 
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="w-full bg-white border-2 border-slate-200 rounded-lg text-sm font-bold p-2 text-slate-900 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Tiền ăn/Ngày (VNĐ)</label>
            <input 
              type="number" 
              value={config.mealFeePerDay}
              onChange={(e) => setConfig({...config, mealFeePerDay: parseInt(e.target.value) || 0})}
              className="w-full bg-white border-2 border-slate-200 rounded-lg text-sm font-black p-2 text-emerald-700 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Phụ phí/Tháng (VNĐ)</label>
            <input 
              type="number" 
              value={config.extraFee}
              onChange={(e) => setConfig({...config, extraFee: parseInt(e.target.value) || 0})}
              className="w-full bg-white border-2 border-slate-200 rounded-lg text-sm font-black p-2 text-blue-700 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Ngày học chuẩn</label>
            <input 
              type="number" 
              value={config.standardDays}
              onChange={(e) => setConfig({...config, standardDays: parseInt(e.target.value) || 0})}
              className="w-full bg-white border-2 border-slate-200 rounded-lg text-sm font-bold p-2 text-slate-900 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200">
           <div className="flex justify-between text-[10px] mb-3">
             <span className="text-slate-500 font-bold uppercase">Niên học còn:</span>
             <span className="text-emerald-700 font-black">{calculateMonthsRemaining(currentMonth)} tháng</span>
           </div>
           <button 
            onClick={onManualSave}
            className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
           >
             <Save size={14} /> Lưu lại (Save)
           </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem icon={LayoutDashboard} label="Tổng quan" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon={CalendarCheck} label="Điểm danh" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
        <SidebarItem icon={FileText} label="Phiếu thu" active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} />
        <SidebarItem icon={Users} label="Học sinh" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
        <SidebarItem icon={Settings} label="Cấu hình phí" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
        <p className="text-[10px] text-emerald-800 leading-relaxed font-bold">Niên học: 2025-2026</p>
      </div>
    </div>
  );
};
