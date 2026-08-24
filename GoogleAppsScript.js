/**
 * GOOGLE APPS SCRIPT CHO ỨNG DỤNG QUẢN LÝ MẦM XANH (MXMS)
 * Phiên bản tối ưu hóa: Tự động lưu trữ lịch sử các tháng riêng biệt, 
 * tự động dọn dẹp ô trống dư thừa và kẻ khung viền mỏng tự động.
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
    
    var fullJsonStr = JSON.stringify({
      students: data.students,
      attendance: data.attendance,
      config: data.config,
      month: data.month,
      year: data.year
    });
    
    // Tự động chia nhỏ dữ liệu thành các đoạn dưới 40000 ký tự (Giới hạn tối đa 1 ô của Google Sheets là 50000)
    var chunkSize = 40000;
    var chunks = [];
    for (var i = 0; i < fullJsonStr.length; i += chunkSize) {
      chunks.push([fullJsonStr.substring(i, i + chunkSize)]);
    }
    
    if (chunks.length > 0) {
      cacheSheet.getRange(1, 1, chunks.length, 1).setValues(chunks);
    }
    
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
    var lastRow = cacheSheet.getLastRow();
    if (lastRow > 0) {
      var values = cacheSheet.getRange(1, 1, lastRow, 1).getValues();
      var jsonStr = "";
      for (var i = 0; i < values.length; i++) {
        jsonStr += values[i][0];
      }
      return ContentService.createTextOutput(jsonStr)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "No data found" }))
    .setMimeType(ContentService.MimeType.JSON);
}
