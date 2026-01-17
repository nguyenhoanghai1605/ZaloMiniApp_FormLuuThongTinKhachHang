
{
  /* <NavigationBar /> */
}
import React, { useEffect, useState } from "react";
import { Box, Text, Input, Button, Switch, useSnackbar } from "zmp-ui";
import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
import api from "zmp-sdk";
import { value } from "dom7";

export default function CustomerSurveyForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [followOA, setFollowOA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { openSnackbar } = useSnackbar();

  const OA_ID_THE_GIOI_KIM_CUONG = "94143331359749352";
  const APP_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwlvwK6A8De9MhM6Nz7SSYZZJC7Odyg7_30aOD8_ZKNK4S4pViCYP2f7a89O7PQFA-9/exec";

  useEffect(() => {
    // Tự động lấy tên Zalo khi vào ứng dụng
    getUserInfo({
      success: (res) => {
        if (res.userInfo?.name) setFullName(res.userInfo.name);
      },
    });
  }, []);

  // Hàm lấy số điện thoại từ Zalo
  const fetchPhoneNumber = () => {
    getPhoneNumber({
      success: (data) => {
        // Lưu ý: Zalo trả về token. Để lấy SĐT thực, bạn cần quyền truy cập SĐT
        // và giải mã token này ở phía Server.
        console.log("Token SĐT:", data.token);
        openSnackbar({
          text: "Vui lòng kiểm tra quyền truy cập SĐT trên Zalo Developer",
          type: "warning",
        });
      },
      fail: (error) => {
        console.error("Lỗi lấy SĐT:", error);
        openSnackbar({
          text: "Không thể lấy số điện thoại tự động",
          type: "error",
        });
      },
    });
  };

  const handleFollowOA = (checked: boolean) => {
    setFollowOA(checked);
    if (checked) {
      api.followOA({
        id: OA_ID_THE_GIOI_KIM_CUONG,
        success: () => {
          openSnackbar({
            text: "Bạn đã quan tâm Thế Giới Kim Cương! ✨",
            type: "success",
            duration: 2000,
          });
        },
        fail: (err) => {
          openSnackbar({
            text: "Không thể thực hiện quan tâm lúc này",
            type: "error",
          });
          setFollowOA(false);
        },
      });
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !phone) {
      openSnackbar({ text: "Vui lòng nhập đầy đủ thông tin", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("fullName", fullName);
      formData.append("phone", phone);
      formData.append("source", "Zalo Mini App");

      await fetch(APP_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      openSnackbar({ text: "Đăng ký thành công! 🎉", type: "success" });
      setPhone("");
    } catch (error) {
      openSnackbar({ text: "Gửi thông tin thất bại!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Component phụ trợ hiển thị Label có dấu * đỏ
  const LabelWithStar = ({ text }: { text: string }) => (
    <Text size="small" style={{ marginBottom: "8px", display: "block" }}>
      {text} <span style={{ color: "red", fontWeight: "bold" }}>*</span>
    </Text>
  );

  return (
    <Box
      className="page"
      style={{
        backgroundColor: "#f4f7f9",
        // minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Banner tràn viền */}
      <Box style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
        <img
          src="https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png"
          style={{ width: "100%", objectFit: "cover" }}
          alt="banner"
        />
      </Box>

      {/* Form Container giãn nở hết phần còn lại của màn hình */}
      <Box
        className="m-4 bg-white p-6"
        style={{
          borderRadius: "16px",
          marginTop: "-20px",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          flex: 1, // Fix full màn hình bỏ khoảng trắng dưới
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box className="text-center mb-6">
          <Text.Title
            size="large"
            style={{ color: "#b4975a", fontWeight: "bold", fontSize: "20px" }}
          >
            THẾ GIỚI KIM CƯƠNG
          </Text.Title>

          <Text.Title
            size="large"
            style={{ color: "#FF0000", fontWeight: "bold", fontSize: "18px" }}
          >
            Thành viên tập đoàn Doji
          </Text.Title>

          <Text size="small" className="text-gray-500">
            Đăng ký thông tin nhận ngay ưu đãi!
          </Text>
        </Box>

        <Box className="space-y-6" style={{ flex: 1 }}>
          <Box>
            <LabelWithStar text="Họ tên khách hàng" />
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên zalo của bạn"
              clearable
            />
          </Box>

          <Box>
            <LabelWithStar text="Số điện thoại" />
            <Input
              value={phone}
              type="tel"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              clearable
              suffix={
                <Button
                  size="small"
                  variant="tertiary"
                  onClick={fetchPhoneNumber}
                  style={{ color: "#b4975a", fontWeight: "bold" }}
                >
                  Lấy số nhanh
                </Button>
              }
            />
          </Box>

          {/* Follow OA UI */}
          <Box
            className="flex justify-between items-center p-4"
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "12px",
              border: "1px dashed #d1d1d1",
            }}
          >
            <Box style={{ flex: 1, paddingRight: "10px" }}>
              <Text size="normal" bold>
                Theo dõi Zalo OA
              </Text>
              <Text size="large" className="text-gray-400">
                Nhận ưu đãi độc quyền về trang sức & kim cương
              </Text>
            </Box>
            <Switch
              checked={followOA}
              onChange={(val) => handleFollowOA(val)}
            />
          </Box>
          <br />
          <Button
            fullWidth
            loading={loading}
            onClick={handleSubmit}
            style={{
              background: "linear-gradient(90deg, #b4975a 0%, #d4bd8a 100%)",
              borderRadius: "24px",
              fontWeight: "bold",
              height: "48px",
              marginTop: "auto", // Đẩy nút xuống dưới nếu cần
            }}
          >
            ĐĂNG KÝ NGAY
          </Button>
        </Box>
      </Box>
    </Box>
  );
}







===============
App Script: Google Sheet

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Đợi tối đa 10 giây để nhận quyền ghi

  try {
    const SHEET_ID = "1XDrsdB1H5gK7kk139Wy2O-XxCWK83W6cyjLKnEW9xJ8";
    const SHEET_NAME = "datakh";

    const doc = SpreadsheetApp.openById(SHEET_ID);
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Lấy dữ liệu từ request
    const fullName = e.parameter.fullName || "";
    const phone = e.parameter.phone || "";
    const source = e.parameter.source || "Zalo Mini App";

    // Ghi vào sheet
    sheet.appendRow([
      new Date(), // Thời gian ghi nhận
      "'"+fullName, // Thêm dấu ' để tránh lỗi format nếu tên bắt đầu bằng dấu =
      "'"+phone,    // Thêm dấu ' để giữ số 0 ở đầu số điện thoại
      source
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    lock.releaseLock(); // Giải phóng khóa
  }
}





===============
Hướng dẫn
Để lấy được chuỗi AKfycb... (đó chính là Web App URL), bạn cần thực hiện thao tác Deploy (Triển khai) trên trang soạn thảo Google Apps Script nơi bạn đã dán code doPost.

Hãy làm theo đúng 5 bước sau đây:

Bước 1: Tại giao diện viết code Apps Script, nhìn lên góc trên bên phải, bấm nút màu xanh Deploy (Triển khai) -> chọn New deployment (Tạo quy trình triển khai mới).

Bước 2: Một hộp thoại hiện ra. Bên cạnh chữ "Select type" (Chọn loại), bấm vào biểu tượng bánh răng ⚙️ -> chọn Web app (Ứng dụng web).

Bước 3: Cấu hình cực kỳ quan trọng (Làm sai bước này Zalo App sẽ không gửi được):

Description (Mô tả): Điền gì cũng được (ví dụ: Kết nối Zalo).

Execute as (Thực thi dưới dạng): Chọn Me (Tôi) (nghĩa là script chạy bằng quyền của bạn để ghi vào Sheet).

Who has access (Ai có quyền truy cập): Chọn Anyone (Bất kỳ ai).

Lưu ý: Bắt buộc phải chọn "Anyone" thì Zalo Mini App (là người ngoài) mới gọi được vào code này.

Bước 4: Bấm nút Deploy (Triển khai) ở dưới cùng. (Nếu là lần đầu, Google sẽ yêu cầu bạn cấp quyền. Hãy bấm "Review permissions" -> Chọn mail bạn -> Bấm "Advanced" (Nâng cao) -> Bấm "Go to... (unsafe)" -> Bấm "Allow".)

Bước 5: Sau khi xong, nó sẽ hiện ra một cái link dài ở ô Web app URL.

Link này sẽ có dạng: https://script.google.com/macros/s/AKfycb.../exec

Bạn bấm nút Copy để sao chép link này.

👉 Cuối cùng: Dán toàn bộ đường link vừa copy vào biến APP_SCRIPT_URL trong file code React (index.tsx) của bạn.
