
import React, { useState } from 'react';
import { Save, RefreshCw, DollarSign, Calendar, BookOpen, Link, ArrowRightCircle, Share2, Download, Loader2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Card } from './Common';
import { GlobalConfig, Student } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SettingsProps {
  config: GlobalConfig;
  setConfig: (c: GlobalConfig) => void;
  onManualSave: () => void;
  onNextMonth: () => void;
  onLoadData?: () => void;
  syncing?: boolean;
  students?: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  currentMonth?: number;
}

export const Settings = ({ 
  config, setConfig, onManualSave, onNextMonth, onLoadData, syncing, students, setStudents, currentMonth 
}: SettingsProps) => {
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const googleScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var headersPre = ["MÃ HS", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "ANH VĂN", "VẼ", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ", "BÉ MỚI", "GIẢM 50%", "GIẢM 100%"];
    var headersNur = ["MÃ HS", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ", "BÉ MỚI", "GIẢM 50%", "GIẢM 100%"];

    // 1. Ghi vào các sheet chính hiện tại
    writeSheetData(ss, "Lớp Mẫu Giáo", "THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP MẪU GIÁO", headersPre, data.formattedPreschool, "#d1e7dd");
    writeSheetData(ss, "Lớp Nhà Trẻ", "THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP NHÀ TRẺ", headersNur, data.formattedNursery, "#e0f2fe");

    // 2. Tự động lưu trữ lịch sử riêng theo từng tháng để tra cứu sau này
    var formattedMonth = data.month < 10 ? "0" + data.month : data.month;
    var archivePreName = "MG_Thang_" + formattedMonth + "_" + data.year;
    var archiveNurName = "NT_Thang_" + formattedMonth + "_" + data.year;
    
    writeSheetData(ss, archivePreName, "LỊCH SỬ THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP MẪU GIÁO", headersPre, data.formattedPreschool, "#d1e7dd");
    writeSheetData(ss, archiveNurName, "LỊCH SỬ THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP NHÀ TRẺ", headersNur, data.formattedNursery, "#e0f2fe");

    // --- 3. GHI TOÀN BỘ CHÈN DỮ LIỆU THÔ PHỤC VỤ DOWNLOAD ---
    var cacheSheet = ss.getSheetByName("RAW_DATA") || ss.insertSheet("RAW_DATA");
    cacheSheet.clear();
    cacheSheet.getRange(1, 1).setValue(JSON.stringify({
      students: data.students,
      attendance: data.attendance,
      config: data.config,
      month: data.month,
      year: data.year
    }));
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Hàm hỗ trợ ghi dữ liệu và định dạng thống nhất cho bất kỳ Sheet nào (Sheet chính lẫn Sheet Lưu Trữ lịch sử)
 */
function writeSheetData(ss, sheetName, titleText, headers, formattedData, titleBgColor) {
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  // Ghi tiêu đề danh sách ở Dòng 1
  sheet.getRange(1, 1).setValue(titleText);
  var numCols = headers.length;
  var titleRange = sheet.getRange(1, 1, 1, numCols);
  titleRange.merge();
  titleRange.setFontWeight("bold");
  titleRange.setFontSize(14);
  titleRange.setHorizontalAlignment("center");
  titleRange.setVerticalAlignment("middle");
  titleRange.setBackground(titleBgColor);
  sheet.setRowHeight(1, 40);

  // Ghi tiêu đề các cột ở Dòng 2
  sheet.getRange(2, 1, 1, numCols).setValues([headers]);
  var headerRange = sheet.getRange(2, 1, 1, numCols);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setBackground("#f1f5f9");
  headerRange.setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(2, 28);

  // Xóa sạch nội dung và định dạng viền cũ từ dòng thứ 3 trở đi
  var lastRow = sheet.getLastRow();
  if (lastRow >= 3) {
    var clearRange = sheet.getRange(3, 1, lastRow - 2, numCols + 9); // xóa rộng ra 9 cột đề phòng rác cũ
    clearRange.clearContent();
    clearRange.setBorder(false, false, false, false, false, false);
  }
  
  // Xóa triệt để các cột dư thừa từ cột numCols + 1 trở đi
  var maxCols = sheet.getMaxColumns();
  if (maxCols >= numCols + 1) {
    sheet.getRange(1, numCols + 1, sheet.getMaxRows(), maxCols - numCols).clear();
  }

  // Ghi dữ liệu mới vào Sheet từ Dòng 3
  if (formattedData && formattedData.length > 0) {
    var range = sheet.getRange(3, 1, formattedData.length, numCols);
    range.setValues(formattedData);
    range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
    range.setVerticalAlignment("middle");
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cacheSheet = ss.getSheetByName("RAW_DATA");
  if (cacheSheet) {
    var jsonStr = cacheSheet.getRange(1, 1).getValue();
    return ContentService.createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "No data found" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
    
    if (field === 'autoCSVCInStartMonth') {
      const isStartMonth = currentMonth === (config.startMonth || 8);
      if (isStartMonth && setStudents) {
        if (value === true) {
          if (window.confirm("Bạn vừa BẬT tính năng tự động thu CSVC. Hệ thống sẽ tích chọn 'Bé mới' cho TẤT CẢ học sinh để thu phí CSVC & Học phẩm trong tháng hiện tại. Bạn có đồng ý?")) {
            setStudents(prev => prev.map(s => ({ ...s, isNewStudent: true })));
          }
        } else if (value === false) {
          if (window.confirm("Bạn vừa TẮT tính năng tự động thu CSVC. Hệ thống sẽ bỏ tích chọn 'Bé mới' cho TẤT CẢ học sinh trong tháng hiện tại. Bạn có đồng ý?")) {
            setStudents(prev => prev.map(s => ({ ...s, isNewStudent: false })));
          }
        }
      }
    }

    if (field === 'startMonth') {
      const isStartMonth = currentMonth === value;
      if (isStartMonth && (config.autoCSVCInStartMonth ?? true) && setStudents) {
        if (window.confirm(`Tháng ${value} trùng với tháng hiện tại và cấu hình Tự động thu đang bật. Hệ thống sẽ tự động tích chọn 'Bé mới' cho TẤT CẢ học sinh để chuẩn bị thu phí CSVC & Học phẩm. Bạn có đồng ý?`)) {
          setStudents(prev => prev.map(s => ({ ...s, isNewStudent: true })));
        }
      }
    }
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
          <div className="flex items-center justify-between mb-6">
            <h5 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <Link size={18} className="text-purple-600" />
              Đồng bộ Google Sheets
            </h5>
            <button 
              onClick={onNextMonth}
              className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-purple-100 transition-all flex items-center gap-2"
            >
              <ArrowRightCircle size={16} />
              Chuyển tháng nhanh
            </button>
          </div>
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

              {/* Hướng dẫn khắc phục in nhiều trang trắng */}
              <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h6 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                      💡 Cải tiến lỗi in quá nhiều trang trắng trên Google Sheets
                    </h6>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      Để sửa hoàn toàn lỗi khi nhấn in trên Google Sheets ra quá nhiều trang trắng (do định dạng kẻ khung viền dư thừa cũ): 
                      Ứng dụng đã được cập nhật chỉ gửi đi dòng học sinh thực tế. Bạn hãy nâng cấp đoạn mã <b>Google Apps Script (bản mới bên dưới)</b> để tự động dọn dẹp sạch ô trống và kẻ khung viền mỏng tự động.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScriptCode(!showScriptCode)}
                    className="shrink-0 self-start sm:self-center px-3 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-200 transition-all cursor-pointer"
                  >
                    <span>{showScriptCode ? "Thu gọn" : "Xem mã Script mới"}</span>
                    {showScriptCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {showScriptCode && (
                  <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between bg-white px-3 py-2 border border-blue-100 rounded-t-xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Code.gs / Apps Script (MỚI)</span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 hover:text-blue-800 cursor-pointer"
                      >
                        {copiedScript ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span className={copiedScript ? "text-emerald-600" : ""}>
                          {copiedScript ? "Đã sao chép!" : "Sao chép mã"}
                        </span>
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-b-xl text-[10px] max-h-64 overflow-y-auto font-mono leading-relaxed whitespace-pre scrollbar-thin">
                      {googleScriptCode}
                    </pre>
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed space-y-1">
                      <p className="font-bold text-slate-700">📌 Các bước cập nhật rất đơn giản:</p>
                      <p>1. Nhấn nút <b>"Sao chép mã"</b> màu xanh ở trên.</p>
                      <p>2. Trên thanh menu Google Sheets của bạn, chọn <b>Tiện ích mở rộng (Extensions)</b> → <b>Apps Script</b>.</p>
                      <p>3. Chọn tất cả code cũ trong tệp <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-bold font-mono text-[9px]">Code.gs</code> rồi <b>Dán đè (Paste)</b> đè lên.</p>
                      <p>4. Nhấn <b>Lưu (Save)</b> (biểu tượng đĩa mềm hoặc phím tắt Ctrl+S / Cmd+S).</p>
                      <p>5. Nhấn nút <b>Triển khai (Deploy)</b> → <b>Quản lý bản triển khai (Manage deployments)</b> → Chọn biểu tượng <b>Bút chì (Edit)</b> → chọn Version là <b>Bản triển khai mới / New Version</b> rồi nhấn <b>Triển khai (Deploy)</b>.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {config.scriptUrl && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-purple-950">Chia sẻ cấu hình sang thiết bị khác</p>
                      <p className="text-[10px] text-purple-600">Gửi cấu hình Google Script URL sang các thiết bị khác hoặc đồng bộ nhanh với Zalo.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const baseUrl = window.location.origin + window.location.pathname;
                        const shareLink = `${baseUrl}?scriptUrl=${encodeURIComponent(config.scriptUrl || '')}`;
                        navigator.clipboard.writeText(shareLink);
                        alert("📋 Đã sao chép liên kết đồng bộ thông minh!\n\nHãy gửi liên kết này sang quý thiết bị khác và chỉ cần nhấn mở nó để đồng bộ cấu hình tự động.");
                      }}
                      className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-purple-200 cursor-pointer"
                    >
                      <Share2 size={14} /> Sao chép liên kết
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-950">Đồng bộ từ Google Sheets về máy</p>
                      <p className="text-[10px] text-blue-600">Tải toàn bộ hồ sơ học sinh, điểm danh và dữ liệu mới nhất từ Trang tính Google về máy.</p>
                    </div>
                    <button
                      type="button"
                      disabled={syncing}
                      onClick={onLoadData}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
                    >
                      {syncing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      Tải dữ liệu về máy
                    </button>
                  </div>
                </div>
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Tháng bắt đầu thu CSVC & HP
                </label>
                <input 
                  type="number"
                  min={1}
                  max={12}
                  value={config.startMonth || 8}
                  onChange={(e) => handleChange('startMonth', parseInt(e.target.value) || 8)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="autoCSVCInStartMonth"
                  checked={config.autoCSVCInStartMonth ?? true}
                  onChange={(e) => handleChange('autoCSVCInStartMonth', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer mt-0.5 accent-orange-600"
                />
                <label htmlFor="autoCSVCInStartMonth" className="text-[10px] font-bold text-slate-500 uppercase leading-tight cursor-pointer select-none">
                  Tự động thu cho cả trường trong tháng bắt đầu (bỏ tích để tự chọn thủ công)
                </label>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Tháng kết thúc năm học
              </label>
              <input 
                type="number"
                min={1}
                max={12}
                value={config.endMonth || 5}
                onChange={(e) => handleChange('endMonth', parseInt(e.target.value) || 5)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
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
