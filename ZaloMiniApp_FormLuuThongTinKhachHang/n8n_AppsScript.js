const ZALO_APP_SECRET = "uJO3RGQVpnZAOlZUcNHt"; 

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // --- CASE 1: CHECK TRÙNG SĐT ---
    if (data.action === "check_phone") {
      if (checkPhoneNumberExists(sheet, data.phone)) {
        return responseJSON({ status: "exists", message: "Số này đã tham gia rồi!" });
      }
      return responseJSON({ status: "ok" });
    }

    // --- CASE 2: LƯU DATA (Thêm Zalo UID) ---
    if (data.action === "save_data") {
      if (checkPhoneNumberExists(sheet, data.phone)) {
        return responseJSON({ status: "error", message: "Số điện thoại đã tồn tại!" });
      }

      sheet.appendRow([
        "'" + new Date().toLocaleString("vi-VN"), // A: Thời gian
        data.fullName,                            // B: Tên
        "'" + data.phone,                         // C: SĐT
        data.birthYear,                           // D: Năm sinh
        data.gender,                              // E: Giới tính
        data.province,                            // F: Tỉnh thành
        "'" + data.zaloId                         // G: Zalo UID (MỚI) - Thêm ' để không bị lỗi số lớn
      ]);
      return responseJSON({ status: "success" });
    }

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Hàm kiểm tra trùng SĐT (Cột C - index 2)
function checkPhoneNumberExists(sheet, phoneToCheck) {
  const PHONE_COL_INDEX = 2; 
  const data = sheet.getDataRange().getValues();
  const searchPhone = String(phoneToCheck).trim();

  for (let i = 0; i < data.length; i++) {
    const rowPhone = String(data[i][PHONE_COL_INDEX]).replace(/'/g, "").trim();
    if (rowPhone === searchPhone && rowPhone !== "") return true;
  }
  return false;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
