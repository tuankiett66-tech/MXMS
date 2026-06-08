/**
 * GOOGLE APPS SCRIPT CHO ỨNG DỤNG QUẢN LÝ MẦM XANH (MXMS)
 * Phiên bản tối ưu hóa: Tự động xóa nội dung thừa cũ, xóa khung viền thừa cũ,
 * và chỉ kẻ khung viền (border) cho các dòng học sinh thực tế.
 * 
 * >>> HƯỚNG DẪN CÀI ĐẶT / CẬP NHẬT:
 * 1. Trên Google Sheets, nhấn 'Tiện ích mở rộng' (Extensions) -> 'Apps Script'.
 * 2. Xóa toàn bộ đoạn mã cũ trong tệp Code.gs.
 * 3. Dán toàn bộ mã dưới đây vào.
 * 4. Nhấn biểu tượng Lưu (Save) hình đĩa mềm.
 * 5. Nhấn nút 'Triển khai' (Deploy) ở trên cùng bên phải -> 'Quản lý bản triển khai' (Manage deployments) -> Chọn phiên bản mới hoặc 'Triển khai mới' (New deployment).
 *    - Loại triển khai: Ứng dụng khách (Web App).
 *    - Execute as (Thực thi dưới quyền): Chọn "Me" (Tôi).
 *    - Who has access (Ai có quyền truy cập): Chọn "Anyone" (Bất kỳ ai / Mọi người) - BẮT BUỘC để tránh lỗi CORS.
 * 6. Copy link URL của Web App mới dán vào mục cấu hình của ứng dụng.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- 1. GHI DỮ LIỆU KHỐI MẪU GIÁO (Lớp Mẫu Giáo) ---
    var sheetPreschool = ss.getSheetByName("Lớp Mẫu Giáo") || ss.insertSheet("Lớp Mẫu Giáo");
    
    // Ghi tiêu đề danh sách ở Dòng 1
    sheetPreschool.getRange(1, 1).setValue("THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP MẪU GIÁO");
    var titleRangePre = sheetPreschool.getRange(1, 1, 1, 14);
    titleRangePre.merge();
    titleRangePre.setFontWeight("bold");
    titleRangePre.setFontSize(14);
    titleRangePre.setHorizontalAlignment("center");
    titleRangePre.setVerticalAlignment("middle");
    titleRangePre.setBackground("#d1e7dd"); // xanh lá nhạt dịu mát
    sheetPreschool.setRowHeight(1, 40);

    // Ghi tiêu đề các cột ở Dòng 2 (Bỏ hoàn toàn 4 cột không cần thiết: MÃ HS, BÉ MỚI, GIẢM 50%, GIẢM 100%)
    var headersPre = ["STT", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "ANH VĂN", "VẼ", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ"];
    sheetPreschool.getRange(2, 1, 1, 14).setValues([headersPre]);
    var headerRangePre = sheetPreschool.getRange(2, 1, 1, 14);
    headerRangePre.setFontWeight("bold");
    headerRangePre.setHorizontalAlignment("center");
    headerRangePre.setVerticalAlignment("middle");
    headerRangePre.setBackground("#f1f5f9");
    headerRangePre.setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheetPreschool.setRowHeight(2, 28);

    // Xóa sạch nội dung và định dạng viền (Borders) cũ từ dòng thứ 3 trở đi
    var lastRowPre = sheetPreschool.getLastRow();
    if (lastRowPre >= 3) {
      var clearRangePre = sheetPreschool.getRange(3, 1, lastRowPre - 2, 24); // xóa dư ra 24 cột đề phòng trước đó còn rác
      clearRangePre.clearContent();
      clearRangePre.setBorder(false, false, false, false, false, false);
    }
    
    // Xóa triệt để các cột dư thừa từ cột O (cột 15) trở đi trong bảng tính
    var maxColsPre = sheetPreschool.getMaxColumns();
    if (maxColsPre >= 15) {
      sheetPreschool.getRange(1, 15, sheetPreschool.getMaxRows(), maxColsPre - 14).clear();
    }

    // Ghi dữ liệu Khối Mẫu Giáo mới vào Sheet từ Dòng 3
    if (data.formattedPreschool && data.formattedPreschool.length > 0) {
      var rangePre = sheetPreschool.getRange(3, 1, data.formattedPreschool.length, 14);
      rangePre.setValues(data.formattedPreschool);
      // Chỉ kẻ khung viền mỏng nhẹ cho các ô có dữ liệu học sinh thực tế (màu xám nhạt #cccccc)
      rangePre.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
      rangePre.setVerticalAlignment("middle");
    }
    
    // --- 2. GHI DỮ LIỆU KHỐI NHÀ TRẺ (Lớp Nhà Trẻ) ---
    var sheetNursery = ss.getSheetByName("Lớp Nhà Trẻ") || ss.insertSheet("Lớp Nhà Trẻ");
    
    // Ghi tiêu đề danh sách ở Dòng 1
    sheetNursery.getRange(1, 1).setValue("THU HỌC PHÍ THÁNG " + data.month + "/" + data.year + " LỚP NHÀ TRẺ");
    var titleRangeNur = sheetNursery.getRange(1, 1, 1, 12);
    titleRangeNur.merge();
    titleRangeNur.setFontWeight("bold");
    titleRangeNur.setFontSize(14);
    titleRangeNur.setHorizontalAlignment("center");
    titleRangeNur.setVerticalAlignment("middle");
    titleRangeNur.setBackground("#e0f2fe"); // xanh dương nhạt dịu mát
    sheetNursery.setRowHeight(1, 40);

    // Ghi tiêu đề các cột ở Dòng 2 (Bỏ hoàn toàn 4 cột không cần thiết: MÃ HS, BÉ MỚI, GIẢM 50%, GIẢM 100%)
    var headersNur = ["STT", "HỌ VÀ TÊN", "NGÀY SINH", "HỌC PHÍ", "TIỀN ĂN", "NHỊP ĐIỆU", "PHỤ PHÍ", "CSVC", "HỌC PHẨM", "NGÀY PHÉP", "THÀNH TIỀN", "GHI CHÚ"];
    sheetNursery.getRange(2, 1, 1, 12).setValues([headersNur]);
    var headerRangeNur = sheetNursery.getRange(2, 1, 1, 12);
    headerRangeNur.setFontWeight("bold");
    headerRangeNur.setHorizontalAlignment("center");
    headerRangeNur.setVerticalAlignment("middle");
    headerRangeNur.setBackground("#f1f5f9");
    headerRangeNur.setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheetNursery.setRowHeight(2, 28);

    // Xóa sạch nội dung và định dạng viền (Borders) cũ từ dòng thứ 3 trở đi
    var lastRowNur = sheetNursery.getLastRow();
    if (lastRowNur >= 3) {
      var clearRangeNur = sheetNursery.getRange(3, 1, lastRowNur - 2, 24); // xóa dư ra 24 cột đề phòng trước đó còn rác
      clearRangeNur.clearContent();
      clearRangeNur.setBorder(false, false, false, false, false, false);
    }
    
    // Xóa triệt để các cột dư thừa từ cột M (cột 13) trở đi trong bảng tính
    var maxColsNur = sheetNursery.getMaxColumns();
    if (maxColsNur >= 13) {
      sheetNursery.getRange(1, 13, sheetNursery.getMaxRows(), maxColsNur - 12).clear();
    }

    // Ghi dữ liệu Khối Nhà Trẻ mới vào Sheet từ Dòng 3
    if (data.formattedNursery && data.formattedNursery.length > 0) {
      var rangeNur = sheetNursery.getRange(3, 1, data.formattedNursery.length, 12);
      rangeNur.setValues(data.formattedNursery);
      // Chỉ kẻ khung viền mỏng cho các ô có dữ liệu học sinh thực tế
      rangeNur.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
      rangeNur.setVerticalAlignment("middle");
    }
    
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
}
