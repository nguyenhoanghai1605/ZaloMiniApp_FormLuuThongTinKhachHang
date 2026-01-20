import React, { useEffect, useState } from "react";
import { Box, Text, Input, Button, Switch, useSnackbar, Sheet } from "zmp-ui";
import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";

// 1. Danh sách tỉnh thành
const PROVINCES = [
  "TP. Hồ Chí Minh",
  "TP. Hà Nội",
  "TP. Cần Thơ",
  "TP. Đà Nẵng",
  "TP. Hải Phòng",
  "TP. Huế",
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hoà",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

// 2. Hàm hỗ trợ tìm kiếm không dấu (Quan trọng để tìm kiếm mượt)
const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

export default function CustomerSurveyForm() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState(""); // Lưu tỉnh thành đã chọn
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // State cho Sheet tìm kiếm
  const [sheetVisible, setSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { openSnackbar } = useSnackbar();

  const APP_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxBLZMUMmjwBTmn0qqv4WxYdyzojC1sP7R2wR6t_wfB1WhBMvC4ovVA0ubRtAObFLr5/exec";

  useEffect(() => {
    getUserInfo({
      success: (res) => {
        if (res.userInfo?.name) setFullName(res.userInfo.name);
      },
    });
  }, []);

  const handleGetPhoneClick = () => {
    getPhoneNumber({
      success: (data) => {
        if (data.token) {
          fetch(`${APP_SCRIPT_URL}?phoneToken=${data.token}`)
            .then((res) => res.json())
            .then((d) => {
              if (d.phone) setPhone(d.phone);
            })
            .catch(() =>
              openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" })
            );
        }
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
      setStep(1);
    } catch (error) {
      openSnackbar({ text: "Gửi thất bại!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

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
            Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty có thể sử
            dụng thông tin cá nhân của tôi...
          </Text>
        </Box>
        <Box className="flex items-center mb-6">
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
                <Button variant="tertiary" onClick={handleGetPhoneClick}>
                  Lấy số nhanh
                </Button>
              }
            />
          </Box>

          {/* PHẦN CHỌN TỈNH THÀNH - ĐÃ SỬA LỖI KHÔNG LOAD ĐƯỢC DỮ LIỆU */}
          <Box>
            <Text size="small" bold>
              Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
            </Text>
            <Input
              readOnly
              placeholder="Chọn tỉnh thành"
              value={province} // QUAN TRỌNG: Hiển thị giá trị từ state province
              onClick={() => setSheetVisible(true)}
            />

            <Sheet
              visible={sheetVisible}
              onClose={() => setSheetVisible(false)}
              autoHeight
              title="Chọn Tỉnh/Thành"
            >
              <Box className="p-4" style={{ minHeight: "60vh" }}>
                <Input.Search
                  placeholder="Tìm tên tỉnh thành..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                <Box style={{ maxHeight: "45vh", overflowY: "auto" }}>
                  {PROVINCES.filter((p) =>
                    removeAccents(p).includes(removeAccents(searchQuery))
                  ).map((p) => (
                    <div
                      key={p}
                      className="py-3 border-b active:bg-gray-100"
                      style={{ cursor: "pointer", display: "block" }}
                      onClick={() => {
                        setProvince(p); // Gán giá trị vào state
                        setSheetVisible(false); // Đóng sheet
                        setSearchQuery(""); // Reset ô tìm kiếm
                      }}
                    >
                      <Text>{p}</Text>
                    </div>
                  ))}
                </Box>
              </Box>
            </Sheet>
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
