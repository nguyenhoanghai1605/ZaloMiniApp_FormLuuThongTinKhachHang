//Update 20260122
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Text,
  Input,
  Button,
  Switch,
  useSnackbar,
  Sheet,
  Page,
  Icon,
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

// ==============================================================================================
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
  const [province, setProvince] = useState("-- Chọn Tỉnh/Thành --");
  const [realPhone, setRealPhone] = useState("");

  // State UI
  const [searchTerm, setSearchTerm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { openSnackbar } = useSnackbar();

  // Lấy thông tin User khi load app
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

  // Lọc danh sách tỉnh thành dựa trên ô tìm kiếm
  const filteredProvinces = useMemo(() => {
    return PROVINCES.filter((p) =>
      p.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleNumberInput = (text: string, setter: (val: string) => void) => {
    setter(text.replace(/[^0-9]/g, ""));
  };

  const handleStartSurvey = async () => {
    setProcessing(true);
    try {
      const { token } = await getPhoneNumber({});
      if (token) {
        const accessToken = await getAccessToken({});

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
          setStep(2);
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
          zaloId,
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

  // --- UI MÀN 1: GIỚI THIỆU ---
  if (step === 1) {
    return (
      <Page className="bg-white flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 pt-8">
          <Text.Title
            className="mb-6 text-blue-700 text-center font-bold"
            size="xLarge"
          >
            KHẢO SÁT Ý KIẾN KHÁCH HÀNG
            <br />
            THẾ GIỚI KIM CƯƠNG
          </Text.Title>

          <Box className="p-5 border border-gray-200 rounded-2xl mb-6 bg-gray-50 shadow-sm">
            <div className="space-y-4 text-justify text-sm leading-relaxed text-gray-700">
              <p>
                <b>Thế Giới Kim Cương</b> chân thành cảm ơn Quý Khách đã tin
                tưởng.
              </p>
              <p>
                Khảo sát này nhằm nâng cao chất lượng sản phẩm và trải nghiệm
                mua sắm.
              </p>
              <p className="font-medium text-blue-600">
                ⏱ Thời gian thực hiện: khoảng 3 phút.
              </p>
              <p>
                Thông tin của Quý Khách được <b>bảo mật tuyệt đối</b>.
              </p>
            </div>
          </Box>

          <div
            className="flex items-center bg-blue-50 p-4 rounded-xl cursor-pointer border border-blue-100"
            onClick={() => setAgreed(!agreed)}
          >
            <Switch checked={agreed} />
            <Text className="ml-3 font-semibold text-blue-800">
              Tôi ĐỒNG Ý tham gia
            </Text>
          </div>
        </div>

        <Box className="p-4 bg-white border-t border-gray-100">
          <Button
            fullWidth
            size="large"
            disabled={!agreed}
            loading={processing}
            onClick={handleStartSurvey}
          >
            Tiếp tục
          </Button>
        </Box>
      </Page>
    );
  }

  // --- UI MÀN 3: THÀNH CÔNG ---
  if (step === 3) {
    return (
      <Page className="bg-white flex flex-col items-center justify-center h-screen p-6">
        <Box className="text-center w-full">
          <div className="mb-6 text-green-500 text-7xl">✓</div>
          <Text.Title size="xLarge">Gửi thành công!</Text.Title>
          <Text className="mt-4 text-gray-500">
            Cảm ơn Quý Khách đã dành thời gian quý báu.
          </Text>
          <Button fullWidth className="mt-10" onClick={() => closeApp({})}>
            Đóng ứng dụng
          </Button>
        </Box>
      </Page>
    );
  }

  // --- UI MÀN 2: FORM NHẬP LIỆU ---
  return (
    <Page className="bg-gray-50 h-screen overflow-auto">
      <Box className="p-4 mb-24">
        <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 shadow-md bg-white border">
          <img
            src={BANNER_URL}
            alt="Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/600x200?text=THE+GIOI+KIM+CUONG";
            }}
          />
        </div>

        <Box className="bg-white rounded-2xl shadow-sm p-5 space-y-6">
          <Text.Title className="text-center text-blue-800 uppercase tracking-wide">
            Thông tin cá nhân
          </Text.Title>

          <Box>
            <Text className="mb-2 font-medium">
              Họ và tên <span className="text-red-500">*</span>
            </Text>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
              clearable
            />
          </Box>

          <Box>
            <Text className="mb-2 font-medium">
              Số điện thoại <span className="text-red-500">*</span>
            </Text>
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
            <Text className="mb-2 font-medium">
              Tỉnh/ Thành <span className="text-red-500">*</span>
            </Text>
            <Input
              readOnly
              placeholder="Chọn tỉnh thành"
              value={province}
              onClick={() => setSheetVisible(true)}
              // Suffix giúp hiển thị icon mũi tên xuống phía bên phải
              suffix={<Icon icon="zi-chevron-down" className="text-gray-400" />}
              // Đảm bảo không có border lạ khi focus vì đây là nút chọn
              className="cursor-pointer"
            />
          </Box>
        </Box>
      </Box>

      {/* Footer Button */}
      <Box className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50 shadow-2xl">
        <Button fullWidth loading={loading} onClick={handleSubmit} size="large">
          HOÀN TẤT KHẢO SÁT
        </Button>
      </Box>

      {/* Sheet chọn Tỉnh/Thành với Tìm kiếm */}
      <Sheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
          setSearchTerm("");
        }}
        autoHeight
        title="Chọn Tỉnh/Thành"
      >
        <Box className="p-4 flex flex-col h-[70vh]">
          <Box className="mb-4 sticky top-0 bg-white z-10">
            <Input
              placeholder="Tìm kiếm tỉnh thành..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              clearable
              prefix={<Icon icon="zi-search" />}
            />
          </Box>

          <Box className="overflow-y-auto flex-1">
            {filteredProvinces.map((p) => (
              <div
                key={p}
                className="py-4 border-b border-gray-50 active:bg-blue-50 flex justify-between items-center transition-colors"
                onClick={() => {
                  setProvince(p);
                  setSheetVisible(false);
                  setSearchTerm("");
                }}
              >
                <Text
                  className={
                    province === p ? "text-blue-600 font-bold" : "text-gray-700"
                  }
                >
                  {p}
                </Text>
                {province === p && (
                  <Icon icon="zi-check" className="text-blue-600" />
                )}
              </div>
            ))}
            {filteredProvinces.length === 0 && (
              <Box className="py-10 text-center text-gray-400 italic">
                Không tìm thấy kết quả phù hợp
              </Box>
            )}
          </Box>
        </Box>
      </Sheet>
    </Page>
  );
}

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Sheet,
//   Page,
// } from "zmp-ui";
// import {
//   getUserInfo,
//   getPhoneNumber,
//   getAccessToken,
//   closeApp,
// } from "zmp-sdk/apis";

// const PROVINCES = [
//   "TP. Hồ Chí Minh",
//   "TP. Hà Nội",
//   "TP. Đà Nẵng",
//   "Cần Thơ",
//   "Hải Phòng",
//   "Bình Dương",
//   "Đồng Nai",
//   "Khác...",
// ];

// // ==============================================================================================
// // CẤU HÌNH URL
// const GAS_URL =
//   "https://script.google.com/macros/s/AKfycbw21kAjCPNa-4mvQ894xAXaMrNhQDebro_QYpUHrj5MzsKbb9zmjO8_cn2pIqa2_uAO/exec";
// const N8N_URL = "https://n8n.zela.vn/webhook/zalo-decode";
// const BANNER_URL =
//   "https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png";
// // ==============================================================================================

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1);

//   // State Form
//   const [fullName, setFullName] = useState("");
//   const [zaloId, setZaloId] = useState("");
//   const [birthYear, setBirthYear] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("TP. Hồ Chí Minh");
//   const [realPhone, setRealPhone] = useState("");

//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [sheetVisible, setSheetVisible] = useState(false);
//   const { openSnackbar } = useSnackbar();

//   // Lấy thông tin User
//   useEffect(() => {
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo) {
//           if (res.userInfo.name) setFullName(res.userInfo.name);
//           if (res.userInfo.id) setZaloId(res.userInfo.id);
//         }
//       },
//       fail: (err) => console.log("Lỗi lấy thông tin:", err),
//     });
//   }, []);

//   const handleNumberInput = (text: string, setter: (val: string) => void) => {
//     setter(text.replace(/[^0-9]/g, ""));
//   };

//   const handleStartSurvey = async () => {
//     setProcessing(true);
//     try {
//       const { token } = await getPhoneNumber({});
//       if (token) {
//         const accessToken = await getAccessToken({});

//         // Gọi n8n lấy SĐT
//         const resN8n = await fetch(N8N_URL, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             phone_token: token,
//             access_token: accessToken,
//           }),
//         });
//         const dataN8n = await resN8n.json();

//         if (dataN8n.phone) {
//           // Gọi GAS check trùng
//           const resCheck = await fetch(GAS_URL, {
//             method: "POST",
//             redirect: "follow",
//             headers: { "Content-Type": "text/plain;charset=utf-8" },
//             body: JSON.stringify({
//               action: "check_phone",
//               phone: dataN8n.phone,
//             }),
//           });
//           const dataCheck = await resCheck.json();

//           if (dataCheck.status === "exists") {
//             openSnackbar({
//               text: "Bạn đã tham gia rồi, xin cảm ơn!",
//               type: "warning",
//             });
//             setProcessing(false);
//             return;
//           } else {
//             setRealPhone(dataN8n.phone);
//             openSnackbar({ text: "Xác thực thành công!", type: "success" });
//             setStep(2);
//           }
//         } else {
//           setStep(2); // Lỗi n8n -> Nhập tay
//         }
//       }
//     } catch (error) {
//       console.log("Lỗi hoặc từ chối:", error);
//       setStep(2);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleSubmit = async () => {
//     if (
//       !fullName.trim() ||
//       !realPhone.trim() ||
//       !birthYear ||
//       !gender ||
//       !province
//     ) {
//       openSnackbar({ text: "Vui lòng điền đủ thông tin (*)", type: "error" });
//       return;
//     }
//     if (realPhone.length < 9) {
//       openSnackbar({ text: "SĐT không hợp lệ", type: "error" });
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(GAS_URL, {
//         method: "POST",
//         redirect: "follow",
//         headers: { "Content-Type": "text/plain;charset=utf-8" },
//         body: JSON.stringify({
//           action: "save_data",
//           fullName,
//           birthYear,
//           gender,
//           province,
//           phone: realPhone,
//           zaloId: zaloId,
//         }),
//       });

//       const resData = await response.json();
//       if (resData.status === "success") {
//         setStep(3);
//       } else {
//         openSnackbar({ text: resData.message || "Lỗi gửi đơn", type: "error" });
//       }
//     } catch (e) {
//       openSnackbar({ text: "Lỗi kết nối Server", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- UI MÀN 1 (ĐÃ CHỈNH SỬA ĐẸP HƠN) ---
//   if (step === 1) {
//     return (
//       <Page className="bg-white flex flex-col h-screen overflow-hidden">
//         {/* Phần nội dung có thể cuộn */}
//         <div className="flex-1 overflow-y-auto p-4">
//           <Text.Title
//             className="mb-5 text-blue-700 text-center font-bold"
//             size="xLarge"
//           >
//             KHẢO SÁT Ý KIẾN KHÁCH HÀNG
//             <br />
//             THẾ GIỚI KIM CƯƠNG
//           </Text.Title>

//           <Box className="p-4 border border-gray-200 rounded-xl mb-4 bg-gray-50 text-gray-700 shadow-sm">
//             <div className="space-y-3 text-justify text-sm">
//               <p>
//                 <b>Thế Giới Kim Cương</b> chân thành cảm ơn Quý Khách đã tin
//                 tưởng lựa chọn sản phẩm của chúng tôi.
//               </p>
//               <p>
//                 Khảo sát này nhằm ghi nhận ý kiến của Quý Khách để không ngừng
//                 nâng cao chất lượng trang sức và trải nghiệm mua sắm.
//               </p>
//               <p className="font-medium text-blue-600">
//                 ⏱ Thời gian thực hiện: khoảng 3 phút.
//               </p>
//               <p>
//                 Thông tin Quý Khách cung cấp (như họ tên, số điện thoại, khu
//                 vực…) chỉ được sử dụng cho mục đích khảo sát và chăm sóc khách
//                 hàng, được <b>bảo mật tuyệt đối</b> theo quy định pháp luật.
//               </p>
//               <p className="italic">
//                 ✨ Mỗi chia sẻ của Quý Khách là giá trị giúp Thế Giới Kim Cương
//                 phục vụ tốt hơn.
//               </p>
//               <p className="text-center font-bold text-gray-800">
//                 Xin chân thành cảm ơn!
//               </p>
//             </div>
//           </Box>

//           {/* Nút Đồng ý nằm ngay dưới nội dung, không bị đẩy xa */}
//           <div
//             className="flex items-center bg-blue-50 p-3 rounded-lg cursor-pointer border border-blue-100 active:bg-blue-100 transition-all"
//             onClick={() => setAgreed(!agreed)}
//           >
//             <Switch checked={agreed} onChange={() => setAgreed(!agreed)} />
//             <Text className="ml-3 font-medium text-blue-800">
//               Tôi ĐỒNG Ý tham gia
//             </Text>
//           </div>
//         </div>

//         {/* Nút Tiếp tục cố định ở dưới cùng */}
//         <Box className="p-4 bg-white border-t border-gray-100">
//           <Button
//             fullWidth
//             size="large"
//             disabled={!agreed}
//             loading={processing}
//             onClick={handleStartSurvey}
//             className="shadow-lg"
//           >
//             {processing ? "Đang xử lý..." : "Tiếp tục"}
//           </Button>
//         </Box>
//       </Page>
//     );
//   }

//   // --- UI MÀN 3 ---
//   if (step === 3) {
//     return (
//       <Page className="bg-white flex flex-col items-center justify-center h-screen">
//         <Box className="text-center p-6">
//           <div className="mb-4 text-green-500 text-6xl">✓</div>
//           <Text.Title>Gửi thành công!</Text.Title>
//           <Text className="mt-2 text-gray-500">
//             Cảm ơn Quý Khách đã tham gia.
//           </Text>
//           <Button fullWidth className="mt-8" onClick={() => closeApp({})}>
//             Đóng ứng dụng
//           </Button>
//         </Box>
//       </Page>
//     );
//   }

//   // --- UI MÀN 2 ---
//   return (
//     <Page className="bg-gray-100 h-screen overflow-auto">
//       <Box className="p-4 mb-20">
//         {/* Banner */}
//         <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-md bg-white">
//           <img
//             src={BANNER_URL}
//             alt="Banner TGKC"
//             className="w-full h-full object-cover"
//             onError={(e) => {
//               (e.target as HTMLImageElement).src =
//                 "https://via.placeholder.com/600x200?text=THE+GIOI+KIM+CUONG";
//             }}
//           />
//         </div>

//         <Box className="bg-white rounded-xl shadow p-5 space-y-5">
//           <Text.Title className="text-center text-blue-800">
//             THÔNG TIN CÁ NHÂN
//           </Text.Title>

//           <Box>
//             <Text.Header className="mb-1">
//               Họ và tên <span className="text-red-500">*</span>
//             </Text.Header>
//             <Input
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               placeholder="Nhập họ tên"
//               clearable
//             />
//           </Box>
//           <Box>
//             <Text.Header className="mb-1">
//               Số điện thoại <span className="text-red-500">*</span>
//             </Text.Header>
//             <Input
//               type="text"
//               inputMode="numeric"
//               value={realPhone}
//               onChange={(e) => handleNumberInput(e.target.value, setRealPhone)}
//               placeholder="09xx..."
//               clearable
//             />
//           </Box>
//           <Box>
//             <Text.Header className="mb-1">
//               Năm sinh <span className="text-red-500">*</span>
//             </Text.Header>
//             <Input
//               type="text"
//               inputMode="numeric"
//               value={birthYear}
//               onChange={(e) => handleNumberInput(e.target.value, setBirthYear)}
//               placeholder="VD: 1990"
//             />
//           </Box>
//           <Box>
//             <Text.Header className="mb-1">
//               Giới tính <span className="text-red-500">*</span>
//             </Text.Header>
//             <Box className="flex space-x-2">
//               {["Nam", "Nữ", "Khác"].map((g) => (
//                 <Button
//                   key={g}
//                   size="small"
//                   variant={gender === g ? "primary" : "secondary"}
//                   onClick={() => setGender(g)}
//                 >
//                   {g}
//                 </Button>
//               ))}
//             </Box>
//           </Box>
//           <Box>
//             <Text.Header className="mb-1">
//               Tỉnh/ Thành <span className="text-red-500">*</span>
//             </Text.Header>
//             <Input
//               readOnly
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               onClick={() => setSheetVisible(true)}
//               suffix={<div className="text-gray-400">▼</div>}
//             />
//           </Box>
//         </Box>
//       </Box>

//       <Box className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-top z-50">
//         <Button fullWidth loading={loading} onClick={handleSubmit} size="large">
//           HOÀN TẤT KHẢO SÁT
//         </Button>
//       </Box>

//       <Sheet
//         visible={sheetVisible}
//         onClose={() => setSheetVisible(false)}
//         autoHeight
//         title="Chọn Tỉnh/Thành"
//       >
//         <Box className="p-4 h-64 overflow-y-auto">
//           {PROVINCES.map((p) => (
//             <div
//               key={p}
//               className="py-3 border-b text-lg active:bg-gray-100 cursor-pointer"
//               onClick={() => {
//                 setProvince(p);
//                 setSheetVisible(false);
//               }}
//             >
//               {p}
//             </div>
//           ))}
//         </Box>
//       </Sheet>
//     </Page>
//   );
// }

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Sheet,
//   Modal,
// } from "zmp-ui";
// import { getUserInfo, getPhoneNumber, closeApp } from "zmp-sdk/apis";

// const PROVINCES = [
//   "TP. Hồ Chí Minh",
//   "TP. Hà Nội",
//   "TP. Cần Thơ",
//   "TP. Đà Nẵng",
//   "TP. Hải Phòng",
//   "TP. Huế",
//   "An Giang",
//   "Bắc Ninh",
//   "Cà Mau",
//   "Cao Bằng",
//   "Đắk Lắk",
//   "Điện Biên",
//   "Đồng Nai",
//   "Đồng Tháp",
//   "Gia Lai",
//   "Hà Tĩnh",
//   "Hưng Yên",
//   "Khánh Hoà",
//   "Lai Châu",
//   "Lâm Đồng",
//   "Lạng Sơn",
//   "Lào Cai",
//   "Nghệ An",
//   "Ninh Bình",
//   "Phú Thọ",
//   "Quảng Ngãi",
//   "Quảng Ninh",
//   "Quảng Trị",
//   "Sơn La",
//   "Tây Ninh",
//   "Thái Nguyên",
//   "Thanh Hóa",
//   "Tuyên Quang",
//   "Vĩnh Long",
// ];

// const removeAccents = (str: string) => {
//   if (!str) return "";
//   return str
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/đ/g, "d")
//     .replace(/Đ/g, "D")
//     .toLowerCase();
// };

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1);
//   const [fullName, setFullName] = useState("");
//   const [birthYear, setBirthYear] = useState("");
//   const [phone, setPhone] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [showSkipModal, setShowSkipModal] = useState(false);
//   const [sheetVisible, setSheetVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const { openSnackbar } = useSnackbar();
//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbwqPpPOSwMQajE_55PsOG-M4c9YmaCQCdyebz0jbLHZxS8LXJfDYtrbOLKpumSvuQv0/exec"; // DÁN URL SAU KHI DEPLOY LẠI VÀO ĐÂY

//   useEffect(() => {
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   // HÀM HIỆN POPUP VÀ GIẢI MÃ SĐT
//   const handleRequestPhone = () => {
//     setLoading(true);
//     console.log("Đang gọi getPhoneNumber từ Zalo SDK...");

//     getPhoneNumber({
//       success: async (data) => {
//         // data.token này chính là cái bạn đã lấy được
//         if (data.token) {
//           try {
//             // QUAN TRỌNG: Phải dùng encodeURIComponent để bảo vệ Token khi gửi qua URL
//             const tokenSafe = encodeURIComponent(data.token);
//             const apiUrl = `${APP_SCRIPT_URL}?phoneToken=${tokenSafe}`;

//             console.log("Đang gửi token sang Apps Script để giải mã...");
//             const response = await fetch(apiUrl);
//             const result = await response.json();

//             if (result.phone) {
//               setPhone(result.phone);
//               openSnackbar({
//                 text: "Tự động lấy số điện thoại thành công!",
//                 type: "success",
//               });
//               setStep(2); // Thành công thì sang màn hình 2
//             } else {
//               // Nếu Apps Script trả về lỗi (ví dụ LỖI_-108)
//               console.error("Lỗi từ Server:", result.error);
//               openSnackbar({
//                 text: "Lỗi giải mã: " + result.error,
//                 type: "error",
//                 duration: 5000,
//               });
//               setStep(2); // Dù lỗi vẫn cho sang màn 2 để khách tự nhập tay
//             }
//           } catch (e) {
//             console.error("Lỗi kết nối fetch:", e);
//             openSnackbar({
//               text: "Lỗi kết nối đến máy chủ giải mã",
//               type: "error",
//             });
//             setStep(2);
//           }
//         } else {
//           setStep(2);
//         }
//         setLoading(false);
//       },
//       fail: (err) => {
//         console.error("Người dùng từ chối hoặc lỗi SDK:", err);
//         // Nếu người dùng bấm "Từ chối" trên Popup, vẫn cho họ sang màn 2 để nhập tay
//         setStep(2);
//         setLoading(false);
//       },
//     });
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !birthYear || !phone || !gender || !province) {
//       openSnackbar({
//         text: "Vui lòng nhập đầy đủ thông tin *",
//         type: "warning",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         fullName,
//         birthYear,
//         phone,
//         gender,
//         province,
//       });
//       await fetch(APP_SCRIPT_URL, {
//         method: "POST",
//         mode: "no-cors",
//         body: params,
//       });
//       setStep(3);
//     } catch (e) {
//       openSnackbar({ text: "Gửi thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- MÀN HÌNH 1 ---
//   if (step === 1) {
//     return (
//       <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
//         <Text.Title className="mb-4 text-blue-600">
//           Khảo sát Thế Giới Kim Cương
//         </Text.Title>
//         <Box
//           className="p-3 border rounded-lg mb-4"
//           style={{
//             height: "55vh",
//             backgroundColor: "#f9f9f9",
//             overflowY: "auto",
//           }}
//         >
//           <Text size="small">
//             Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty có thể thu
//             thập thông tin cá nhân...
//           </Text>
//         </Box>
//         <Box className="flex items-center mb-6">
//           <Switch
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//           />
//           <Text className="ml-2">
//             Tôi <b>ĐỒNG Ý</b> và <b>TIẾP TỤC</b>
//           </Text>
//         </Box>
//         <Button
//           fullWidth
//           disabled={!agreed}
//           loading={loading}
//           onClick={handleRequestPhone}
//         >
//           Tiếp tục
//         </Button>
//         {!agreed && (
//           <Button
//             fullWidth
//             variant="tertiary"
//             className="mt-2"
//             onClick={() => setShowSkipModal(true)}
//           >
//             Bỏ qua
//           </Button>
//         )}

//         <Modal visible={showSkipModal} onClose={() => setShowSkipModal(false)}>
//           <Box className="p-4 text-center">
//             <Text bold size="large">
//               Xác nhận
//             </Text>
//             <Text className="my-4">
//               Anh/Chị xác nhận không tham gia khảo sát này?
//             </Text>
//             <Button fullWidth onClick={() => setShowSkipModal(false)}>
//               Tiếp tục
//             </Button>
//             <Button
//               fullWidth
//               variant="tertiary"
//               type="danger"
//               className="mt-2"
//               onClick={() => closeApp({})}
//             >
//               Thoát
//             </Button>
//           </Box>
//         </Modal>
//       </Box>
//     );
//   }

//   // --- MÀN HÌNH 3 ---
//   if (step === 3) {
//     return (
//       <Box
//         className="p-6 bg-white flex flex-col items-center justify-center"
//         style={{ minHeight: "100vh" }}
//       >
//         <Text bold style={{ fontSize: "18px" }}>
//           Cảm ơn Quý Khách Hàng!
//         </Text>
//         <Box className="my-6 w-full">
//           <img
//             src="https://file.hstatic.net/1000381168/file/mathew.jpg"
//             style={{ width: "100%", borderRadius: "8px" }}
//           />
//         </Box>
//         <Button fullWidth onClick={() => closeApp({})}>
//           Đóng
//         </Button>
//       </Box>
//     );
//   }

//   // --- MÀN HÌNH 2 (FORM) ---
//   return (
//     <Box className="bg-gray-100 p-4" style={{ minHeight: "100vh" }}>
//       <Box className="p-6 bg-white rounded-xl shadow-lg">
//         <img
//           src="https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png"
//           style={{ width: "100%" }}
//         />
//         <Text.Title className="text-center my-4" style={{ color: "#b4975a" }}>
//           THÔNG TIN KHÁCH HÀNG
//         </Text.Title>
//         <Box className="space-y-4">
//           <Input
//             label="Họ và tên *"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//           />
//           <Input
//             label="Năm sinh *"
//             value={birthYear}
//             onChange={(e) => setBirthYear(e.target.value)}
//           />
//           <Box>
//             <Text size="small" bold className="mb-2">
//               Giới tính *
//             </Text>
//             <Box className="flex space-x-2">
//               {["Nam", "Nữ"].map((g) => (
//                 <Button
//                   key={g}
//                   size="small"
//                   variant={gender === g ? "primary" : "secondary"}
//                   onClick={() => setGender(g)}
//                 >
//                   {g}
//                 </Button>
//               ))}
//             </Box>
//           </Box>
//           <Input
//             label="Số điện thoại *"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//           />
//           <Input
//             label="Tỉnh thành *"
//             readOnly
//             value={province}
//             onClick={() => setSheetVisible(true)}
//           />
//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             style={{
//               background: "linear-gradient(90deg, #b4975a, #d4bd8a)",
//               borderRadius: "24px",
//             }}
//           >
//             GỬI THÔNG TIN
//           </Button>
//         </Box>
//       </Box>

//       <Sheet
//         visible={sheetVisible}
//         onClose={() => setSheetVisible(false)}
//         title="Chọn Tỉnh/Thành"
//       >
//         <Box className="p-4">
//           <Input.Search
//             placeholder="Tìm..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="mb-4"
//           />
//           <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
//             {PROVINCES.filter((p) =>
//               removeAccents(p).includes(removeAccents(searchQuery))
//             ).map((p) => (
//               <div
//                 key={p}
//                 className="py-3 border-b"
//                 onClick={() => {
//                   setProvince(p);
//                   setSheetVisible(false);
//                 }}
//               >
//                 {p}
//               </div>
//             ))}
//           </div>
//         </Box>
//       </Sheet>
//     </Box>
//   );
// }

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Sheet,
//   Modal,
// } from "zmp-ui";
// import { getUserInfo, getPhoneNumber, closeApp } from "zmp-sdk/apis";

// // 1. Danh sách tỉnh thành
// const PROVINCES = [
//   "TP. Hồ Chí Minh",
//   "TP. Hà Nội",
//   "TP. Cần Thơ",
//   "TP. Đà Nẵng",
//   "TP. Hải Phòng",
//   "TP. Huế",
//   "An Giang",
//   "Bắc Ninh",
//   "Cà Mau",
//   "Cao Bằng",
//   "Đắk Lắk",
//   "Điện Biên",
//   "Đồng Nai",
//   "Đồng Tháp",
//   "Gia Lai",
//   "Hà Tĩnh",
//   "Hưng Yên",
//   "Khánh Hoà",
//   "Lai Châu",
//   "Lâm Đồng",
//   "Lạng Sơn",
//   "Lào Cai",
//   "Nghệ An",
//   "Ninh Bình",
//   "Phú Thọ",
//   "Quảng Ngãi",
//   "Quảng Ninh",
//   "Quảng Trị",
//   "Sơn La",
//   "Tây Ninh",
//   "Thái Nguyên",
//   "Thanh Hóa",
//   "Tuyên Quang",
//   "Vĩnh Long",
// ];

// const removeAccents = (str: string) => {
//   if (!str) return "";
//   return str
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/đ/g, "d")
//     .replace(/Đ/g, "D")
//     .toLowerCase();
// };

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1);
//   const [fullName, setFullName] = useState("");
//   const [birthYear, setBirthYear] = useState(""); // State mới cho Năm sinh
//   const [phone, setPhone] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [showSkipModal, setShowSkipModal] = useState(false);
//   const [sheetVisible, setSheetVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const { openSnackbar } = useSnackbar();

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbzFl_h0veQtvQQCHFgw0lGbtiYYcsOskN5bKrn0L5BIvLffK9flPn9BoYnIzau06Tt_/exec";

//   useEffect(() => {
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   const handleGetPhoneClick = () => {
//     getPhoneNumber({
//       success: (data) => {
//         if (data.token) {
//           fetch(`${APP_SCRIPT_URL}?phoneToken=${data.token}`)
//             .then((res) => res.json())
//             .then((d) => {
//               if (d.phone) setPhone(d.phone);
//             })
//             .catch(() =>
//               openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" })
//             );
//         }
//       },
//       fail: () => openSnackbar({ text: "Không lấy được SĐT", type: "error" }),
//     });
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !birthYear || !phone || !gender || !province) {
//       openSnackbar({
//         text: "Vui lòng nhập đầy đủ thông tin *",
//         type: "warning",
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         fullName,
//         birthYear,
//         phone,
//         gender,
//         province,
//         source: "Zalo Mini App",
//       });
//       await fetch(APP_SCRIPT_URL, {
//         method: "POST",
//         mode: "no-cors",
//         body: params,
//       });
//       setStep(3);
//     } catch (e) {
//       openSnackbar({ text: "Gửi thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- MÀN HÌNH 1: ĐIỀU KHOẢN ---
//   if (step === 1) {
//     return (
//       <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
//         <Text.Title className="mb-4 text-blue-600">
//           Khảo sát Thế Giới Kim Cương
//         </Text.Title>
//         <Box
//           className="p-3 border rounded-lg mb-4"
//           style={{
//             height: "55vh",
//             backgroundColor: "#f9f9f9",
//             overflowY: "auto",
//           }}
//         >
//           <Text size="small">
//             Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty có thể thu
//             thập và sử dụng thông tin cá nhân của tôi để phục vụ mục đích chăm
//             sóc khách hàng...
//           </Text>
//         </Box>

//         <Box className="flex items-center mb-6">
//           <Switch
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//           />
//           <Text className="ml-2">
//             Tôi <span style={{ fontWeight: "900" }}>ĐỒNG Ý</span> và{" "}
//             <span style={{ fontWeight: "900" }}>TIẾP TỤC</span>
//           </Text>
//         </Box>

//         <Box className="space-y-2">
//           <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
//             Tiếp tục
//           </Button>
//           {!agreed && (
//             <Button
//               fullWidth
//               variant="tertiary"
//               onClick={() => setShowSkipModal(true)}
//             >
//               Bỏ qua
//             </Button>
//           )}
//         </Box>

//         <Modal visible={showSkipModal} onClose={() => setShowSkipModal(false)}>
//           <Box className="flex flex-col items-center">
//             <Text
//               bold
//               className="mb-4 text-center"
//               style={{ fontSize: "28px", lineHeight: "36px", color: "#000" }}
//             >
//               Xác nhận
//             </Text>
//             <Text className="text-center mb-6">
//               Anh/Chị xác nhận không tham gia khảo sát này?
//             </Text>
//             <Box className="w-full space-y-2">
//               <Button
//                 fullWidth
//                 variant="primary"
//                 onClick={() => setShowSkipModal(false)}
//               >
//                 Tiếp tục khảo sát
//               </Button>
//               <Button
//                 fullWidth
//                 variant="tertiary"
//                 type="danger"
//                 onClick={() => closeApp({})}
//               >
//                 Thoát ứng dụng
//               </Button>
//             </Box>
//           </Box>
//         </Modal>
//       </Box>
//     );
//   }

//   // --- MÀN HÌNH 3: CẢM ƠN ---
//   if (step === 3) {
//     return (
//       <Box
//         className="p-6 bg-white flex flex-col items-center justify-center"
//         style={{ minHeight: "100vh" }}
//       >
//         <Box className="text-center mb-6">
//           <Text bold className="mb-2" style={{ fontSize: "18px" }}>
//             Cảm ơn Quý Khách Hàng!
//           </Text>
//           <Text size="small" className="text-gray-600 text-center">
//             Chúng tôi trân trọng sự đóng góp của bạn.
//           </Text>
//         </Box>
//         <Box
//           className="mb-8 p-4 border rounded-xl"
//           style={{
//             borderColor: "#ffcccc",
//             backgroundColor: "#fffafa",
//             width: "100%",
//           }}
//         >
//           <img
//             src="https://file.hstatic.net/1000381168/file/mathew.jpg"
//             style={{ width: "100%", borderRadius: "8px" }}
//           />
//         </Box>
//         <Button fullWidth onClick={() => closeApp({})}>
//           Đóng
//         </Button>
//       </Box>
//     );
//   }

//   // --- MÀN HÌNH 2: FORM KHẢO SÁT ---
//   return (
//     <Box className="bg-gray-100 p-4" style={{ minHeight: "100vh" }}>
//       <Box className="p-6 bg-white rounded-xl shadow-lg">
//         <Box style={{ width: "100%", overflow: "hidden", borderRadius: "8px" }}>
//           <img
//             src="https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png"
//             style={{ width: "100%" }}
//             alt="banner"
//           />
//         </Box>
//         <br />
//         <Text.Title className="text-center mb-6" style={{ color: "#b4975a" }}>
//           THÔNG TIN KHÁCH HÀNG
//         </Text.Title>

//         <Box className="space-y-4">
//           <Box>
//             <Text size="small" bold>
//               Họ và tên <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Input
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               placeholder="Nhập họ tên"
//             />
//           </Box>

//           <Box>
//             <Text size="small" bold>
//               Năm sinh <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Input
//               type="text"
//               value={birthYear}
//               onChange={(e) => setBirthYear(e.target.value)}
//               placeholder="Ví dụ: 1995"
//             />
//           </Box>

//           <Box>
//             <Text size="small" bold className="mb-2 block">
//               Giới tính <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Box className="flex space-x-2">
//               {["Nam", "Nữ", "Khác"].map((g) => (
//                 <Button
//                   key={g}
//                   size="small"
//                   variant={gender === g ? "primary" : "secondary"}
//                   onClick={() => setGender(g)}
//                 >
//                   {g}
//                 </Button>
//               ))}
//             </Box>
//           </Box>

//           <Box>
//             <Text size="small" bold>
//               Số điện thoại <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Input
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="09..."
//               suffix={
//                 <Button variant="tertiary" onClick={handleGetPhoneClick}>
//                   Lấy số nhanh
//                 </Button>
//               }
//             />
//           </Box>

//           <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Input
//               readOnly
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               onClick={() => setSheetVisible(true)}
//             />
//             <Sheet
//               visible={sheetVisible}
//               onClose={() => setSheetVisible(false)}
//               autoHeight
//               title="Chọn Tỉnh/Thành"
//             >
//               <Box className="p-4" style={{ minHeight: "60vh" }}>
//                 <Input.Search
//                   placeholder="Tìm kiếm..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="mb-4"
//                 />
//                 <div style={{ maxHeight: "45vh", overflowY: "auto" }}>
//                   {PROVINCES.filter((p) =>
//                     removeAccents(p).includes(removeAccents(searchQuery))
//                   ).map((p) => (
//                     <div
//                       key={p}
//                       className="py-3 border-b active:bg-gray-100"
//                       style={{ cursor: "pointer" }}
//                       onClick={() => {
//                         setProvince(p);
//                         setSheetVisible(false);
//                         setSearchQuery("");
//                       }}
//                     >
//                       <Text>{p}</Text>
//                     </div>
//                   ))}
//                 </div>
//               </Box>
//             </Sheet>
//           </Box>

//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             style={{
//               background: "linear-gradient(90deg, #b4975a, #d4bd8a)",
//               borderRadius: "24px",
//             }}
//           >
//             GỬI THÔNG TIN
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//   );
// }

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
