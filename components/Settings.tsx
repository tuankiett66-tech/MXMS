
import React from 'react';
import { Save, RefreshCw, DollarSign, Calendar, BookOpen, Link } from 'lucide-react';
import { Card } from './Common';
import { GlobalConfig } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SettingsProps {
  config: GlobalConfig;
  setConfig: (c: GlobalConfig) => void;
  onManualSave: () => void;
}

export const Settings = ({ config, setConfig, onManualSave }: SettingsProps) => {
  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleGiftedChange = (field: string, value: number) => {
    setConfig({ 
      ...config, 
      giftedFees: { ...config.giftedFees, [field]: value } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Google Script Sync */}
        <Card className="border-t-4 border-t-purple-600 md:col-span-2">
          <h5 className="font-black text-slate-800 text-sm uppercase mb-6 flex items-center gap-2">
            <Link size={18} className="text-purple-600" />
            Đồng bộ Google Sheets
          </h5>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Google Apps Script URL</label>
              <input 
                type="text" 
                placeholder="https://script.google.com/macros/s/.../exec"
                value={config.scriptUrl || ''}
                onChange={(e) => handleChange('scriptUrl', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-purple-500"
              />
              <p className="mt-2 text-[10px] text-slate-400 italic">Dán link Script URL của bạn vào đây để đồng bộ dữ liệu lên Google Sheets.</p>
            </div>
          </div>
        </Card>

        {/* Tuitions */}
        <Card className="border-t-4 border-t-emerald-600">
          <h5 className="font-black text-slate-800 text-sm uppercase mb-6 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            Đơn giá Học phí chính
          </h5>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Lớp Nhà Trẻ (Dưới 36 tháng) 
                <span className="ml-2 text-emerald-600 lowercase">({formatCurrency(config.tuitionUnder36)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.tuitionUnder36}
                onChange={(e) => handleChange('tuitionUnder36', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Lớp Mẫu Giáo (Trên 36 tháng)
                <span className="ml-2 text-emerald-600 lowercase">({formatCurrency(config.tuitionOver36)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.tuitionOver36}
                onChange={(e) => handleChange('tuitionOver36', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </Card>

        {/* Gifted Fees */}
        <Card className="border-t-4 border-t-blue-600">
          <h5 className="font-black text-slate-800 text-sm uppercase mb-6 flex items-center gap-2">
            <RefreshCw size={18} className="text-blue-600" />
            Phí môn Năng khiếu
          </h5>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Anh văn (Cambrige)
                <span className="ml-2 text-blue-600 lowercase">({formatCurrency(config.giftedFees.english)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.giftedFees.english}
                onChange={(e) => handleGiftedChange('english', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Vẽ sáng tạo
                  <span className="ml-2 text-blue-600 lowercase">({formatCurrency(config.giftedFees.drawing)} đ)</span>
                </label>
                <input 
                  type="number" 
                  value={config.giftedFees.drawing}
                  onChange={(e) => handleGiftedChange('drawing', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Nhịp điệu
                  <span className="ml-2 text-blue-600 lowercase">({formatCurrency(config.giftedFees.rhythm)} đ)</span>
                </label>
                <input 
                  type="number" 
                  value={config.giftedFees.rhythm}
                  onChange={(e) => handleGiftedChange('rhythm', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Others */}
        <Card className="border-t-4 border-t-orange-600 md:col-span-2">
          <h5 className="font-black text-slate-800 text-sm uppercase mb-6 flex items-center gap-2">
            <BookOpen size={18} className="text-orange-600" />
            Định mức Phụ phí & Vật tư
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Tiền ăn/Ngày
                <span className="ml-2 text-orange-600 lowercase">({formatCurrency(config.mealFeePerDay)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.mealFeePerDay}
                onChange={(e) => handleChange('mealFeePerDay', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Phụ phí/Tháng
                <span className="ml-2 text-orange-600 lowercase">({formatCurrency(config.extraFee)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.extraFee}
                onChange={(e) => handleChange('extraFee', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ngày học chuẩn</label>
              <input 
                type="number" 
                value={config.standardDays}
                onChange={(e) => handleChange('standardDays', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                CSVC/Tháng (Bé mới)
                <span className="ml-2 text-orange-600 lowercase">({formatCurrency(config.unitCSVC)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.unitCSVC}
                onChange={(e) => handleChange('unitCSVC', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Học phẩm/Tháng (MG)
                <span className="ml-2 text-orange-600 lowercase">({formatCurrency(config.unitMaterialLon)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.unitMaterialLon}
                onChange={(e) => handleChange('unitMaterialLon', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Học phẩm/Tháng (NT)
                <span className="ml-2 text-orange-600 lowercase">({formatCurrency(config.unitMaterialNho)} đ)</span>
              </label>
              <input 
                type="number" 
                value={config.unitMaterialNho}
                onChange={(e) => handleChange('unitMaterialNho', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={onManualSave}
          className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
        >
          <Save size={20} />
          Lưu toàn bộ cấu hình
        </button>
      </div>
    </div>
  );
};
