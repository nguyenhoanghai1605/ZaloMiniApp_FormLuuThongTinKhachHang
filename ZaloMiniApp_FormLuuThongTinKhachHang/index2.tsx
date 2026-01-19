// APPS CRIPT GOOGLE SHEET
const SHEET_ID = "1XDrsdB1H5gK7kk139Wy2O-XxCWK83W6cyjLKnEW9xJ8";
const SHEET_NAME = "datakh";
const ZALO_SECRET_KEY = "uJO3RGQVpnZAOlZUcNHt"; 

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Nhận dữ liệu từ Mini App gửi lên
    let fullName = e.parameter.fullName || "Không tên";
    let phone = e.parameter.phone || "";
    let gender = e.parameter.gender || "Chưa xác định";
    let province = e.parameter.province || "Chưa chọn";
    let phoneToken = e.parameter.phoneToken || "";

    // Giải mã SĐT nếu có token
    if (phoneToken) {
      const decryptedPhone = getRealPhoneNumber(phoneToken);
      if (decryptedPhone) phone = decryptedPhone;
    }

    sheet.appendRow([
      new Date(), 
      "'" + fullName, 
      "'" + phone, 
      gender, 
      province, 
      "Zalo Mini App"
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



=======================================================================================================
// Index.tsx  
import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  Switch,
  useSnackbar,
  Select,
  Picker,
} from "zmp-ui";
import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
import api from "zmp-sdk";

const { Option } = Select;

// Danh sách tỉnh thành mới nhất (đã bao gồm các cập nhật hành chính)
const PROVINCES = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bạc Liêu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Dương",
  "Bình Định",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Lâm Đồng",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "TP. Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

export default function CustomerSurveyForm() {
  const [step, setStep] = useState(1); // 1: Điều khoản, 2: Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { openSnackbar } = useSnackbar();

  const [openProvince, setOpenProvince] = useState(false);

  const APP_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbybcsElQmQFo3k9bQRCfA1a9vuwjgclrtnXUwAAG083VFdkZebor6dt8rMa8F_xyfko/exec";

  useEffect(() => {
    // Tự động lấy tên Zalo khi vừa vào
    getUserInfo({
      success: (res) => {
        if (res.userInfo?.name) setFullName(res.userInfo.name);
      },
    });
  }, []);

  // Gọi App Script để giải mã số điện thoại
  const fetchRealPhone = (token: string) => {
    fetch(`${APP_SCRIPT_URL}?phoneToken=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.phone) setPhone(data.phone);
      })
      .catch(() => openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" }));
  };

  const handleGetPhoneClick = () => {
    getPhoneNumber({
      success: (data) => {
        if (data.token) fetchRealPhone(data.token);
      },
      fail: () => openSnackbar({ text: "Không lấy được SĐT", type: "error" }),
    });
  };

  const handleSubmit = async () => {
    if (!fullName || !phone || !gender || !province) {
      openSnackbar({
        text: "Vui lòng nhập đầy đủ thông tin *",
        type: "warning",
      });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fullName,
        phone,
        gender,
        province,
        source: "Zalo Mini App",
      });
      await fetch(APP_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: params,
      });
      openSnackbar({ text: "Gửi thông tin thành công! 🎉", type: "success" });
      setStep(1); // Quay lại trang đầu hoặc trang cám ơn
    } catch (error) {
      openSnackbar({ text: "Gửi thất bại!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // MÀN HÌNH 1: ĐIỀU KHOẢN
  if (step === 1) {
    return (
      <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
        <Text.Title className="mb-4 text-blue-600">
          Khảo sát Thế Giới Kim Cương
        </Text.Title>
        <Box
          className="p-3 border rounded-lg overflow-y-auto mb-4"
          style={{ height: "60vh", backgroundColor: "#f9f9f9" }}
        >
          <Text size="small">
            Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty Thế Giới
            Kim Cương có thể thu thập và sử dụng thông tin cá nhân (DLCN) của
            tôi...
            <br />
            <br />
            Thời gian thực hiện khảo sát khoảng 5 phút. Thông tin của bạn sẽ
            được bảo mật theo quy định của pháp luật Việt Nam.
          </Text>
        </Box>
        <Box className="flex items-center mb-6">
          {/* <Switch checked={agreed} onChange={(v) => setAgreed(v)} /> */}
          <Switch
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <Text className="ml-2" bold>
            Tôi ĐỒNG Ý và TIẾP TỤC
          </Text>
        </Box>
        <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
          Tiếp tục
        </Button>
      </Box>
    );
  }

  // MÀN HÌNH 2: FORM KHẢO SÁT
  return (
    <Box className="bg-gray-100" style={{ minHeight: "100vh" }}>
      <Box className="p-6 bg-white m-4 rounded-xl shadow-lg">
        <Text.Title className="text-center mb-6" style={{ color: "#b4975a" }}>
          THÔNG TIN KHÁCH HÀNG
        </Text.Title>

        <Box className="space-y-4">
          <Box>
            <Text size="small" bold>
              Họ và tên <span style={{ color: "red" }}>*</span>
            </Text>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
            />
          </Box>

          <Box>
            <Text size="small" bold className="mb-2 block">
              Giới tính <span style={{ color: "red" }}>*</span>
            </Text>
            <Box className="flex space-x-2">
              {["Nam", "Nữ", "Khác"].map((g) => (
                <Button
                  key={g}
                  size="small"
                  variant={gender === g ? "primary" : "secondary"}
                  onClick={() => setGender(g)}
                >
                  {g}
                </Button>
              ))}
            </Box>
          </Box>

          <Box>
            <Text size="small" bold>
              Số điện thoại <span style={{ color: "red" }}>*</span>
            </Text>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09..."
              suffix={
                <Button
                  // size="xxSmall"
                  variant="tertiary"
                  onClick={handleGetPhoneClick}
                >
                  Lấy số nhanh
                </Button>
              }
            />
          </Box>

          {/* <Box>
            <Text size="small" bold>
              Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              placeholder="Chọn tỉnh thành"
              value={province}
              closeOnSelect
              onChange={(val) => setProvince(val)}
            >
              {PROVINCES.map((p) => (
                <Option key={p} value={p} title={p} />
              ))}
            </Select>
          </Box> */}

          <Box>
            <Text size="small" bold>
              Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              placeholder="Chọn tỉnh thành"
              value={province}
              onChange={(val) => {
                if (typeof val === "string") {
                  setProvince(val);
                }
              }}
            >
              {PROVINCES.map((p) => (
                <Option key={p} value={p} title={p} />
              ))}
            </Select>
          </Box>

          <Button
            fullWidth
            loading={loading}
            onClick={handleSubmit}
            className="mt-6"
            style={{
              background: "linear-gradient(90deg, #b4975a, #d4bd8a)",
              borderRadius: "24px",
            }}
          >
            GỬI THÔNG TIN
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
