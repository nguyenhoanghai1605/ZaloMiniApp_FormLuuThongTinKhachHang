const SHEET_ID = "1XDrsdB1H5gK7kk139Wy2O-XxCWK83W6cyjLKnEW9xJ8";
const SHEET_NAME = "datakh";
const ZALO_SECRET_KEY = "uJO3RGQVpnZAOlZUcNHt"; 

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Đợi tối đa 10s để tránh xung đột ghi file
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Nhận dữ liệu từ Mini App gửi lên
    let fullName = e.parameter.fullName || "Không tên";
    let birthYear = e.parameter.birthYear || ""; // Nhận Năm sinh từ Mini App
    let phone = e.parameter.phone || "";
    let gender = e.parameter.gender || "Chưa xác định";
    let province = e.parameter.province || "Chưa chọn";
    let phoneToken = e.parameter.phoneToken || "";

    // Giải mã SĐT nếu người dùng chọn "Lấy số nhanh" (token gửi về Apps Script)
    if (phoneToken) {
      const decryptedPhone = getRealPhoneNumber(phoneToken);
      if (decryptedPhone) phone = decryptedPhone;
    }

    // Ghi dữ liệu xuống Sheet theo thứ tự cột
    sheet.appendRow([
      new Date(),       // Cột 1: Thời gian
      "'" + fullName,   // Cột 2: Họ tên (Dùng dấu nháy đơn để tránh lỗi định dạng)
      birthYear,        // Cột 3: Năm sinh (Mới thêm)
      "'" + phone,      // Cột 4: Số điện thoại
      gender,           // Cột 5: Giới tính
      province,         // Cột 6: Tỉnh thành
      "Zalo Mini App"   // Cột 7: Nguồn
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "phone": phone }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getRealPhoneNumber(token) {
  try {
    const url = "https://graph.zalo.me/v2.0/me/info";
    const options = {
      "method": "get",
      "headers": { "access_token": token, "secret_key": ZALO_SECRET_KEY },
      "muteHttpExceptions": true
    };
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    if (json.data && json.data.number) {
      let num = json.data.number;
      return num.startsWith("84") ? "0" + num.slice(2) : num;
    }
    return null;
  } catch (e) { return null; }
}
