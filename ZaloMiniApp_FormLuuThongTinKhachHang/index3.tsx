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

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Select,
//   Picker,
// } from "zmp-ui";
// import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
// import api from "zmp-sdk";

// const { Option } = Select;

// // Danh sách tỉnh thành mới nhất (đã bao gồm các cập nhật hành chính)
// const PROVINCES = [
//   "TP. Hồ Chí Minh",
//   "TP. Hà Nội",
//   "TP. Cần Thơ",
//   "TP. Đà Nẵng",
//   "TP. Hải Phòng",
//   "TP. Huế",
//   "An Giang",
//   "Bắc Ninh",
//   "Cà Mau",
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

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1); // 1: Điều khoản, 2: Form
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { openSnackbar } = useSnackbar();

//   const [openProvince, setOpenProvince] = useState(false);

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbxBLZMUMmjwBTmn0qqv4WxYdyzojC1sP7R2wR6t_wfB1WhBMvC4ovVA0ubRtAObFLr5/exec";

//   useEffect(() => {
//     // Tự động lấy tên Zalo khi vừa vào
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   // Gọi App Script để giải mã số điện thoại
//   const fetchRealPhone = (token: string) => {
//     fetch(`${APP_SCRIPT_URL}?phoneToken=${token}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.phone) setPhone(data.phone);
//       })
//       .catch(() => openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" }));
//   };

//   const handleGetPhoneClick = () => {
//     getPhoneNumber({
//       success: (data) => {
//         if (data.token) fetchRealPhone(data.token);
//       },
//       fail: () => openSnackbar({ text: "Không lấy được SĐT", type: "error" }),
//     });
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !phone || !gender || !province) {
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
//       openSnackbar({ text: "Gửi thông tin thành công! 🎉", type: "success" });
//       setStep(1); // Quay lại trang đầu hoặc trang cám ơn
//     } catch (error) {
//       openSnackbar({ text: "Gửi thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // MÀN HÌNH 1: ĐIỀU KHOẢN
//   if (step === 1) {
//     return (
//       <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
//         <Text.Title className="mb-4 text-blue-600">
//           Khảo sát Thế Giới Kim Cương
//         </Text.Title>
//         <Box
//           className="p-3 border rounded-lg overflow-y-auto mb-4"
//           style={{ height: "60vh", backgroundColor: "#f9f9f9" }}
//         >
//           <Text size="small">
//             Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty Thế Giới
//             Kim Cương có thể thu thập và sử dụng thông tin cá nhân (DLCN) của
//             tôi...
//             <br />
//             <br />
//             Thời gian thực hiện khảo sát khoảng 5 phút. Thông tin của bạn sẽ
//             được bảo mật theo quy định của pháp luật Việt Nam.
//           </Text>
//         </Box>
//         <Box className="flex items-center mb-6">
//           {/* <Switch checked={agreed} onChange={(v) => setAgreed(v)} /> */}
//           <Switch
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//           />
//           <Text className="ml-2" bold>
//             Tôi ĐỒNG Ý và TIẾP TỤC
//           </Text>
//         </Box>
//         <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
//           Tiếp tục
//         </Button>
//       </Box>
//     );
//   }

//   // MÀN HÌNH 2: FORM KHẢO SÁT
//   return (
//     <Box className="bg-gray-100" style={{ minHeight: "100vh" }}>
//       <Box className="p-6 bg-white m-4 rounded-xl shadow-lg">
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
//                 <Button
//                   // size="xxSmall"
//                   variant="tertiary"
//                   onClick={handleGetPhoneClick}
//                 >
//                   Lấy số nhanh
//                 </Button>
//               }
//             />
//           </Box>

//           {/* <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               closeOnSelect
//               onChange={(val) => setProvince(val)}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box> */}

//           <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               onChange={(val) => {
//                 if (typeof val === "string") {
//                   setProvince(val);
//                 }
//               }}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box>

//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             className="mt-6"
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

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Select,
//   Picker,
// } from "zmp-ui";
// import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
// import api from "zmp-sdk";

// const { Option } = Select;

// // Danh sách tỉnh thành mới nhất (đã bao gồm các cập nhật hành chính)
// const PROVINCES = [
//   "TP. Hồ Chí Minh",
//   "TP. Hà Nội",
//   "TP. Cần Thơ",
//   "TP. Đà Nẵng",
//   "TP. Hải Phòng",
//   "TP. Huế",
//   "An Giang",
//   "Bắc Ninh",
//   "Cà Mau",
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

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1); // 1: Điều khoản, 2: Form
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { openSnackbar } = useSnackbar();

//   const [openProvince, setOpenProvince] = useState(false);

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbybcsElQmQFo3k9bQRCfA1a9vuwjgclrtnXUwAAG083VFdkZebor6dt8rMa8F_xyfko/exec";

//   useEffect(() => {
//     // Tự động lấy tên Zalo khi vừa vào
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   // Gọi App Script để giải mã số điện thoại
//   const fetchRealPhone = (token: string) => {
//     fetch(`${APP_SCRIPT_URL}?phoneToken=${token}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.phone) setPhone(data.phone);
//       })
//       .catch(() => openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" }));
//   };

//   const handleGetPhoneClick = () => {
//     getPhoneNumber({
//       success: (data) => {
//         if (data.token) fetchRealPhone(data.token);
//       },
//       fail: () => openSnackbar({ text: "Không lấy được SĐT", type: "error" }),
//     });
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !phone || !gender || !province) {
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
//       openSnackbar({ text: "Gửi thông tin thành công! 🎉", type: "success" });
//       setStep(1); // Quay lại trang đầu hoặc trang cám ơn
//     } catch (error) {
//       openSnackbar({ text: "Gửi thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // MÀN HÌNH 1: ĐIỀU KHOẢN
//   if (step === 1) {
//     return (
//       <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
//         <Text.Title className="mb-4 text-blue-600">
//           Khảo sát Thế Giới Kim Cương
//         </Text.Title>
//         <Box
//           className="p-3 border rounded-lg overflow-y-auto mb-4"
//           style={{ height: "60vh", backgroundColor: "#f9f9f9" }}
//         >
//           <Text size="small">
//             Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty Thế Giới
//             Kim Cương có thể thu thập và sử dụng thông tin cá nhân (DLCN) của
//             tôi...
//             <br />
//             <br />
//             Thời gian thực hiện khảo sát khoảng 5 phút. Thông tin của bạn sẽ
//             được bảo mật theo quy định của pháp luật Việt Nam.
//           </Text>
//         </Box>
//         <Box className="flex items-center mb-6">
//           {/* <Switch checked={agreed} onChange={(v) => setAgreed(v)} /> */}
//           <Switch
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//           />
//           <Text className="ml-2" bold>
//             Tôi ĐỒNG Ý và TIẾP TỤC
//           </Text>
//         </Box>
//         <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
//           Tiếp tục
//         </Button>
//       </Box>
//     );
//   }

//   // MÀN HÌNH 2: FORM KHẢO SÁT
//   return (
//     <Box className="bg-gray-100" style={{ minHeight: "100vh" }}>
//       <Box className="p-6 bg-white m-4 rounded-xl shadow-lg">
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
//                 <Button
//                   // size="xxSmall"
//                   variant="tertiary"
//                   onClick={handleGetPhoneClick}
//                 >
//                   Lấy số nhanh
//                 </Button>
//               }
//             />
//           </Box>

//           {/* <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               closeOnSelect
//               onChange={(val) => setProvince(val)}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box> */}

//           <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               onChange={(val) => {
//                 if (typeof val === "string") {
//                   setProvince(val);
//                 }
//               }}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box>

//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             className="mt-6"
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

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Text,
//   Input,
//   Button,
//   Switch,
//   useSnackbar,
//   Select,
//   Picker,
// } from "zmp-ui";
// import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
// import api from "zmp-sdk";

// const { Option } = Select;

// // Danh sách tỉnh thành mới nhất (đã bao gồm các cập nhật hành chính)
// const PROVINCES = [
//   "An Giang",
//   "Bà Rịa - Vũng Tàu",
//   "Bạc Liêu",
//   "Bắc Giang",
//   "Bắc Kạn",
//   "Bắc Ninh",
//   "Bến Tre",
//   "Bình Dương",
//   "Bình Định",
//   "Bình Phước",
//   "Bình Thuận",
//   "Cà Mau",
//   "Cao Bằng",
//   "Cần Thơ",
//   "Đà Nẵng",
//   "Đắk Lắk",
//   "Đắk Nông",
//   "Điện Biên",
//   "Đồng Nai",
//   "Đồng Tháp",
//   "Gia Lai",
//   "Hà Giang",
//   "Hà Nam",
//   "Hà Nội",
//   "Hà Tĩnh",
//   "Hải Dương",
//   "Hải Phòng",
//   "Hậu Giang",
//   "Hòa Bình",
//   "Hưng Yên",
//   "Khánh Hòa",
//   "Kiên Giang",
//   "Kon Tum",
//   "Lai Châu",
//   "Lạng Sơn",
//   "Lào Cai",
//   "Lâm Đồng",
//   "Long An",
//   "Nam Định",
//   "Nghệ An",
//   "Ninh Bình",
//   "Ninh Thuận",
//   "Phú Thọ",
//   "Phú Yên",
//   "Quảng Bình",
//   "Quảng Nam",
//   "Quảng Ngãi",
//   "Quảng Ninh",
//   "Quảng Trị",
//   "Sóc Trăng",
//   "Sơn La",
//   "Tây Ninh",
//   "Thái Bình",
//   "Thái Nguyên",
//   "Thanh Hóa",
//   "Thừa Thiên Huế",
//   "Tiền Giang",
//   "TP. Hồ Chí Minh",
//   "Trà Vinh",
//   "Tuyên Quang",
//   "Vĩnh Long",
//   "Vĩnh Phúc",
//   "Yên Bái",
// ];

// export default function CustomerSurveyForm() {
//   const [step, setStep] = useState(1); // 1: Điều khoản, 2: Form
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [gender, setGender] = useState("");
//   const [province, setProvince] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { openSnackbar } = useSnackbar();

//   const [openProvince, setOpenProvince] = useState(false);

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbybcsElQmQFo3k9bQRCfA1a9vuwjgclrtnXUwAAG083VFdkZebor6dt8rMa8F_xyfko/exec";

//   useEffect(() => {
//     // Tự động lấy tên Zalo khi vừa vào
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   // Gọi App Script để giải mã số điện thoại
//   const fetchRealPhone = (token: string) => {
//     fetch(`${APP_SCRIPT_URL}?phoneToken=${token}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.phone) setPhone(data.phone);
//       })
//       .catch(() => openSnackbar({ text: "Lỗi giải mã SĐT", type: "error" }));
//   };

//   const handleGetPhoneClick = () => {
//     getPhoneNumber({
//       success: (data) => {
//         if (data.token) fetchRealPhone(data.token);
//       },
//       fail: () => openSnackbar({ text: "Không lấy được SĐT", type: "error" }),
//     });
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !phone || !gender || !province) {
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
//       openSnackbar({ text: "Gửi thông tin thành công! 🎉", type: "success" });
//       setStep(1); // Quay lại trang đầu hoặc trang cám ơn
//     } catch (error) {
//       openSnackbar({ text: "Gửi thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // MÀN HÌNH 1: ĐIỀU KHOẢN
//   if (step === 1) {
//     return (
//       <Box className="p-4 bg-white" style={{ minHeight: "100vh" }}>
//         <Text.Title className="mb-4 text-blue-600">
//           Khảo sát Thế Giới Kim Cương
//         </Text.Title>
//         <Box
//           className="p-3 border rounded-lg overflow-y-auto mb-4"
//           style={{ height: "60vh", backgroundColor: "#f9f9f9" }}
//         >
//           <Text size="small">
//             Trong quá trình tham gia khảo sát, tôi hiểu rằng Công ty Thế Giới
//             Kim Cương có thể thu thập và sử dụng thông tin cá nhân (DLCN) của
//             tôi...
//             <br />
//             <br />
//             Thời gian thực hiện khảo sát khoảng 5 phút. Thông tin của bạn sẽ
//             được bảo mật theo quy định của pháp luật Việt Nam.
//           </Text>
//         </Box>
//         <Box className="flex items-center mb-6">
//           {/* <Switch checked={agreed} onChange={(v) => setAgreed(v)} /> */}
//           <Switch
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//           />
//           <Text className="ml-2" bold>
//             Tôi ĐỒNG Ý và TIẾP TỤC
//           </Text>
//         </Box>
//         <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
//           Tiếp tục
//         </Button>
//       </Box>
//     );
//   }

//   // MÀN HÌNH 2: FORM KHẢO SÁT
//   return (
//     <Box className="bg-gray-100" style={{ minHeight: "100vh" }}>
//       <Box className="p-6 bg-white m-4 rounded-xl shadow-lg">
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
//                 <Button
//                   // size="xxSmall"
//                   variant="tertiary"
//                   onClick={handleGetPhoneClick}
//                 >
//                   Lấy số nhanh
//                 </Button>
//               }
//             />
//           </Box>

//           {/* <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               closeOnSelect
//               onChange={(val) => setProvince(val)}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box> */}

//           <Box>
//             <Text size="small" bold>
//               Tỉnh/ Thành <span style={{ color: "red" }}>*</span>
//             </Text>
//             <Select
//               placeholder="Chọn tỉnh thành"
//               value={province}
//               onChange={(val) => {
//                 if (typeof val === "string") {
//                   setProvince(val);
//                 }
//               }}
//             >
//               {PROVINCES.map((p) => (
//                 <Option key={p} value={p} title={p} />
//               ))}
//             </Select>
//           </Box>

//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             className="mt-6"
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

// import React, { useEffect, useState } from "react";
// import { Box, Text, Input, Button, Switch, useSnackbar } from "zmp-ui";
// import { getUserInfo, getPhoneNumber } from "zmp-sdk/apis";
// import api from "zmp-sdk";
// import { value } from "dom7";

// export default function CustomerSurveyForm() {
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [followOA, setFollowOA] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const { openSnackbar } = useSnackbar();

//   // Lấy OA ID trực tiếp từ file manifest.json
//   // const OA_ID_THE_GIOI_KIM_CUONG = getConfig((c) => c.manifest.permissions.zalo_oa_id); // OA_ID_THE_GIOI_KIM_CUONG = "94143331359749352";
//   const OA_ID_THE_GIOI_KIM_CUONG = "2814710308084754149";

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbwlvwK6A8De9MhM6Nz7SSYZZJC7Odyg7_30aOD8_ZKNK4S4pViCYP2f7a89O7PQFA-9/exec";

//   useEffect(() => {
//     // Tự động lấy tên Zalo khi vào ứng dụng
//     getUserInfo({
//       success: (res) => {
//         if (res.userInfo?.name) setFullName(res.userInfo.name);
//       },
//     });
//   }, []);

//   // Hàm lấy số điện thoại từ Zalo
//   const fetchPhoneNumber = () => {
//     getPhoneNumber({
//       success: (data) => {
//         // Lưu ý: Zalo trả về token. Để lấy SĐT thực, bạn cần quyền truy cập SĐT
//         // và giải mã token này ở phía Server.
//         console.log("Token SĐT:", data.token);
//         openSnackbar({
//           text: "Vui lòng kiểm tra quyền truy cập SĐT trên Zalo Developer",
//           type: "warning",
//         });
//       },
//       fail: (error) => {
//         console.error("Lỗi lấy SĐT:", error);
//         openSnackbar({
//           text: "Không thể lấy số điện thoại tự động",
//           type: "error",
//         });
//       },
//     });
//   };

//   const handleFollowOA = (checked: boolean) => {
//     setFollowOA(checked);
//     if (checked) {
//       api.followOA({
//         id: OA_ID_THE_GIOI_KIM_CUONG,
//         success: () => {
//           openSnackbar({
//             text: "Bạn đã quan tâm Thế Giới Kim Cương! ✨",
//             type: "success",
//             duration: 2000,
//           });
//         },
//         fail: (err) => {
//           openSnackbar({
//             text: "Không thể thực hiện quan tâm lúc này",
//             type: "error",
//           });
//           setFollowOA(false);
//         },
//       });
//     }
//   };

//   const handleSubmit = async () => {
//     if (!fullName || !phone) {
//       openSnackbar({ text: "Vui lòng nhập đầy đủ thông tin", type: "warning" });
//       return;
//     }
//     setLoading(true);
//     try {
//       const formData = new URLSearchParams();
//       formData.append("fullName", fullName);
//       formData.append("phone", phone);
//       formData.append("source", "Zalo Mini App");

//       await fetch(APP_SCRIPT_URL, {
//         method: "POST",
//         mode: "no-cors",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: formData.toString(),
//       });

//       openSnackbar({ text: "Đăng ký thành công! 🎉", type: "success" });
//       setPhone("");
//     } catch (error) {
//       openSnackbar({ text: "Gửi thông tin thất bại!", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Component phụ trợ hiển thị Label có dấu * đỏ
//   const LabelWithStar = ({ text }: { text: string }) => (
//     <Text size="small" style={{ marginBottom: "8px", display: "block" }}>
//       {text} <span style={{ color: "red", fontWeight: "bold" }}>*</span>
//     </Text>
//   );

//   return (
//     <Box
//       className="page"
//       style={{
//         backgroundColor: "#f4f7f9",
//         // minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         margin: 0,
//         padding: 0,
//       }}
//     >
//       {/* Banner tràn viền */}
//       <Box style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
//         <img
//           src="https://cdn.hstatic.net/files/1000381168/file/slide_km_1db1f9d59b3e42a1b762a95b670d1f6f_master.png"
//           style={{ width: "100%", objectFit: "cover" }}
//           alt="banner"
//         />
//       </Box>

//       {/* Form Container giãn nở hết phần còn lại của màn hình */}
//       <Box
//         className="m-4 bg-white p-6"
//         style={{
//           borderRadius: "16px",
//           marginTop: "-20px",
//           position: "relative",
//           boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
//           flex: 1, // Fix full màn hình bỏ khoảng trắng dưới
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         <Box className="text-center mb-6">
//           <Text.Title
//             size="large"
//             style={{ color: "#b4975a", fontWeight: "bold", fontSize: "20px" }}
//           >
//             THẾ GIỚI KIM CƯƠNG
//           </Text.Title>

//           <Text.Title
//             size="large"
//             style={{ color: "#FF0000", fontWeight: "bold", fontSize: "18px" }}
//           >
//             Thành viên tập đoàn Doji
//           </Text.Title>

//           <Text size="small" className="text-gray-500">
//             Đăng ký thông tin nhận ngay ưu đãi!
//           </Text>
//         </Box>

//         <Box className="space-y-6" style={{ flex: 1 }}>
//           <Box>
//             <LabelWithStar text="Họ tên khách hàng" />
//             <Input
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               placeholder="Nhập họ tên zalo của bạn"
//               clearable
//             />
//           </Box>

//           <Box>
//             <LabelWithStar text="Số điện thoại" />
//             <Input
//               value={phone}
//               type="tel"
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="Nhập số điện thoại"
//               clearable
//               suffix={
//                 <Button
//                   size="small"
//                   variant="tertiary"
//                   onClick={fetchPhoneNumber}
//                   style={{ color: "#b4975a", fontWeight: "bold" }}
//                 >
//                   Lấy số nhanh
//                 </Button>
//               }
//             />
//           </Box>

//           {/* Follow OA UI */}
//           <Box
//             className="flex justify-between items-center p-4"
//             style={{
//               backgroundColor: "#fafafa",
//               borderRadius: "12px",
//               border: "1px dashed #d1d1d1",
//             }}
//           >
//             <Box style={{ flex: 1, paddingRight: "10px" }}>
//               <Text size="normal" bold>
//                 Theo dõi Zalo OA
//               </Text>
//               <Text size="large" className="text-gray-400">
//                 Nhận ưu đãi độc quyền về trang sức & kim cương
//               </Text>
//             </Box>
//             <Switch
//               checked={followOA}
//               onChange={(val) => handleFollowOA(val)}
//             />
//           </Box>
//           <br />
//           <Button
//             fullWidth
//             loading={loading}
//             onClick={handleSubmit}
//             style={{
//               background: "linear-gradient(90deg, #b4975a 0%, #d4bd8a 100%)",
//               borderRadius: "24px",
//               fontWeight: "bold",
//               height: "48px",
//               marginTop: "auto", // Đẩy nút xuống dưới nếu cần
//             }}
//           >
//             ĐĂNG KÝ NGAY
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//   );
// }
