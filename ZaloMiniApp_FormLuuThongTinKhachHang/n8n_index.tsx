import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  Switch,
  useSnackbar,
  Sheet,
  Page,
} from "zmp-ui";
import {
  getUserInfo,
  getPhoneNumber,
  getAccessToken,
  closeApp,
} from "zmp-sdk/apis";

const PROVINCES = [
  "TP. Hồ Chí Minh",
  "TP. Hà Nội",
  "TP. Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bình Dương",
  "Đồng Nai",
  "Khác...",
];

// ==============================================================================================
// CẤU HÌNH URL
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw21kAjCPNa-4mvQ894xAXaMrNhQDebro_QYpUHrj5MzsKbb9zmjO8_cn2pIqa2_uAO/exec";
const N8N_URL = "https://n8n.zela.vn/webhook/zalo-decode";
const BANNER_URL =
  "https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png";
// ==============================================================================================

export default function CustomerSurveyForm() {
  const [step, setStep] = useState(1);

  // State Form
  const [fullName, setFullName] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("TP. Hồ Chí Minh");
  const [realPhone, setRealPhone] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { openSnackbar } = useSnackbar();

  // Lấy thông tin User
  useEffect(() => {
    getUserInfo({
      success: (res) => {
        if (res.userInfo) {
          if (res.userInfo.name) setFullName(res.userInfo.name);
          if (res.userInfo.id) setZaloId(res.userInfo.id);
        }
      },
      fail: (err) => console.log("Lỗi lấy thông tin:", err),
    });
  }, []);

  const handleNumberInput = (text: string, setter: (val: string) => void) => {
    setter(text.replace(/[^0-9]/g, ""));
  };

  const handleStartSurvey = async () => {
    setProcessing(true);
    try {
      const { token } = await getPhoneNumber({});
      if (token) {
        const accessToken = await getAccessToken({});

        // Gọi n8n lấy SĐT
        const resN8n = await fetch(N8N_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_token: token,
            access_token: accessToken,
          }),
        });
        const dataN8n = await resN8n.json();

        if (dataN8n.phone) {
          // Gọi GAS check trùng
          const resCheck = await fetch(GAS_URL, {
            method: "POST",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "check_phone",
              phone: dataN8n.phone,
            }),
          });
          const dataCheck = await resCheck.json();

          if (dataCheck.status === "exists") {
            openSnackbar({
              text: "Bạn đã tham gia rồi, xin cảm ơn!",
              type: "warning",
            });
            setProcessing(false);
            return;
          } else {
            setRealPhone(dataN8n.phone);
            openSnackbar({ text: "Xác thực thành công!", type: "success" });
            setStep(2);
          }
        } else {
          setStep(2); // Lỗi n8n -> Nhập tay
        }
      }
    } catch (error) {
      console.log("Lỗi hoặc từ chối:", error);
      setStep(2);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !fullName.trim() ||
      !realPhone.trim() ||
      !birthYear ||
      !gender ||
      !province
    ) {
      openSnackbar({ text: "Vui lòng điền đủ thông tin (*)", type: "error" });
      return;
    }
    if (realPhone.length < 9) {
      openSnackbar({ text: "SĐT không hợp lệ", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "save_data",
          fullName,
          birthYear,
          gender,
          province,
          phone: realPhone,
          zaloId: zaloId,
        }),
      });

      const resData = await response.json();
      if (resData.status === "success") {
        setStep(3);
      } else {
        openSnackbar({ text: resData.message || "Lỗi gửi đơn", type: "error" });
      }
    } catch (e) {
      openSnackbar({ text: "Lỗi kết nối Server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- UI MÀN 1 (ĐÃ CHỈNH SỬA ĐẸP HƠN) ---
  if (step === 1) {
    return (
      <Page className="bg-white flex flex-col h-screen overflow-hidden">
        {/* Phần nội dung có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-4">
          <Text.Title
            className="mb-5 text-blue-700 text-center font-bold"
            size="xLarge"
          >
            KHẢO SÁT Ý KIẾN KHÁCH HÀNG
            <br />
            THẾ GIỚI KIM CƯƠNG
          </Text.Title>

          <Box className="p-4 border border-gray-200 rounded-xl mb-4 bg-gray-50 text-gray-700 shadow-sm">
            <div className="space-y-3 text-justify text-sm">
              <p>
                <b>Thế Giới Kim Cương</b> chân thành cảm ơn Quý Khách đã tin
                tưởng lựa chọn sản phẩm của chúng tôi.
              </p>
              <p>
                Khảo sát này nhằm ghi nhận ý kiến của Quý Khách để không ngừng
                nâng cao chất lượng trang sức và trải nghiệm mua sắm.
              </p>
              <p className="font-medium text-blue-600">
                ⏱ Thời gian thực hiện: khoảng 3 phút.
              </p>
              <p>
                Thông tin Quý Khách cung cấp (như họ tên, số điện thoại, khu
                vực…) chỉ được sử dụng cho mục đích khảo sát và chăm sóc khách
                hàng, được <b>bảo mật tuyệt đối</b> theo quy định pháp luật.
              </p>
              <p className="italic">
                ✨ Mỗi chia sẻ của Quý Khách là giá trị giúp Thế Giới Kim Cương
                phục vụ tốt hơn.
              </p>
              <p className="text-center font-bold text-gray-800">
                Xin chân thành cảm ơn!
              </p>
            </div>
          </Box>

          {/* Nút Đồng ý nằm ngay dưới nội dung, không bị đẩy xa */}
          <div
            className="flex items-center bg-blue-50 p-3 rounded-lg cursor-pointer border border-blue-100 active:bg-blue-100 transition-all"
            onClick={() => setAgreed(!agreed)}
          >
            <Switch checked={agreed} onChange={() => setAgreed(!agreed)} />
            <Text className="ml-3 font-medium text-blue-800">
              Tôi ĐỒNG Ý tham gia
            </Text>
          </div>
        </div>

        {/* Nút Tiếp tục cố định ở dưới cùng */}
        <Box className="p-4 bg-white border-t border-gray-100">
          <Button
            fullWidth
            size="large"
            disabled={!agreed}
            loading={processing}
            onClick={handleStartSurvey}
            className="shadow-lg"
          >
            {processing ? "Đang xử lý..." : "Tiếp tục"}
          </Button>
        </Box>
      </Page>
    );
  }

  // --- UI MÀN 3 ---
  if (step === 3) {
    return (
      <Page className="bg-white flex flex-col items-center justify-center h-screen">
        <Box className="text-center p-6">
          <div className="mb-4 text-green-500 text-6xl">✓</div>
          <Text.Title>Gửi thành công!</Text.Title>
          <Text className="mt-2 text-gray-500">
            Cảm ơn Quý Khách đã tham gia.
          </Text>
          <Button fullWidth className="mt-8" onClick={() => closeApp({})}>
            Đóng ứng dụng
          </Button>
        </Box>
      </Page>
    );
  }

  // --- UI MÀN 2 ---
  return (
    <Page className="bg-gray-100 h-screen overflow-auto">
      <Box className="p-4 mb-20">
        {/* Banner */}
        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-md bg-white">
          <img
            src={BANNER_URL}
            alt="Banner TGKC"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/600x200?text=THE+GIOI+KIM+CUONG";
            }}
          />
        </div>

        <Box className="bg-white rounded-xl shadow p-5 space-y-5">
          <Text.Title className="text-center text-blue-800">
            THÔNG TIN CÁ NHÂN
          </Text.Title>

          <Box>
            <Text.Header className="mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </Text.Header>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
              clearable
            />
          </Box>
          <Box>
            <Text.Header className="mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </Text.Header>
            <Input
              type="text"
              inputMode="numeric"
              value={realPhone}
              onChange={(e) => handleNumberInput(e.target.value, setRealPhone)}
              placeholder="09xx..."
              clearable
            />
          </Box>
          <Box>
            <Text.Header className="mb-1">
              Năm sinh <span className="text-red-500">*</span>
            </Text.Header>
            <Input
              type="text"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => handleNumberInput(e.target.value, setBirthYear)}
              placeholder="VD: 1990"
            />
          </Box>
          <Box>
            <Text.Header className="mb-1">
              Giới tính <span className="text-red-500">*</span>
            </Text.Header>
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
            <Text.Header className="mb-1">
              Tỉnh/ Thành <span className="text-red-500">*</span>
            </Text.Header>
            <Input
              readOnly
              placeholder="Chọn tỉnh thành"
              value={province}
              onClick={() => setSheetVisible(true)}
              suffix={<div className="text-gray-400">▼</div>}
            />
          </Box>
        </Box>
      </Box>

      <Box className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-top z-50">
        <Button fullWidth loading={loading} onClick={handleSubmit} size="large">
          HOÀN TẤT KHẢO SÁT
        </Button>
      </Box>

      <Sheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        autoHeight
        title="Chọn Tỉnh/Thành"
      >
        <Box className="p-4 h-64 overflow-y-auto">
          {PROVINCES.map((p) => (
            <div
              key={p}
              className="py-3 border-b text-lg active:bg-gray-100 cursor-pointer"
              onClick={() => {
                setProvince(p);
                setSheetVisible(false);
              }}
            >
              {p}
            </div>
          ))}
        </Box>
      </Sheet>
    </Page>
  );
}
