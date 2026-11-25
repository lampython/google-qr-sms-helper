# Google QR SMS Helper (`google-qr-sms-helper`) - Tiếng Việt

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-1a73e8?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Version-1.1.0-34a853?style=flat-square" alt="Version 1.1.0" />
  <img src="https://img.shields.io/badge/Ngôn%20ngữ-Tiếng%20Việt-34a853?style=flat-square" alt="Tiếng Việt" />
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-ea4335?style=flat-square" alt="Platform" />
</p>

<p align="center">
  <b>Chuyển đổi cơ chế xác minh quét mã QR bắt buộc của Google (MO-SMS / GMS Constellation) trên trình duyệt máy tính quay về quy trình truyền thống: Nhập số điện thoại nhận mã OTP SMS 6 số hoặc cuộc gọi thoại.</b>
</p>

---

## 📦 1. Hướng Dẫn Cài Đặt (Installation)

### Cách 1: Nạp trực tiếp thư mục (Khuyên dùng)
1. Mở Chrome / Edge / Brave, truy cập `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
3. Nhấp nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
4. Chọn thư mục dự án `google-qr-sms-helper` để hoàn tất nạp extension.

### Cách 2: Dùng file nén đóng gói sẵn
Giải nén file trong `output/google-qr-sms-helper-v1.1.0.zip` và nạp vào trình duyệt như trên.

---

## 🚀 2. Quy Trình Vượt Xác Minh Bằng Cloud Shell

> [!IMPORTANT]
> **Quy tắc cốt lõi**: Không bấm hạ cấp trực tiếp từ các trang chuyển hướng đăng nhập bên thứ 3 (như Antigravity / Gemini Code Assist CLI) vì tham số `continue` bị lồng nhiều lớp redirect và Google sẽ ép quay lại QR.  
> **Hãy mở Google Cloud Console, kích hoạt Cloud Shell để mở cửa sổ `Verify` nguyên bản trước**! Sau khi xác minh SMS thành công 1 lần trên profile đó, tài khoản Google sẽ mở khóa toàn bộ, sau đó đăng nhập các tool khác sẽ trơn tru không bị hỏi lại.

### Bước 1: Mở Cloud Shell trên Google Cloud Console
1. Truy cập [https://console.cloud.google.com/](https://console.cloud.google.com/) trên profile Google cần xác minh.
2. Nhấn vào biểu tượng kích hoạt Cloud Shell `[>_]` ở góc trên bên phải (hoặc bấm nút `1. Tự động click Cloud Shell` trên popup extension ở góc dưới phải).
3. Khi thanh bên dưới bật lên thông báo `Verify your account`, click nút màu xanh **`Verify`**.

### Bước 2: Hạ cấp về chọn xác minh SMS
1. Sau khi bấm `Verify`, trình duyệt sẽ chuyển sang màn hình quét mã QR (`/v3/signin/challenge/iap/qrcode`).
2. Chờ ảnh mã QR tải xong, bấm nút **`⚡ Hạ cấp sang nhận SMS`** trên popup extension ở góc dưới phải:
   - Extension tự động đọc mã QR bằng `BarcodeDetector` nguyên bản;
   - Gửi ngầm request `MypxBd` và `YDtwf` kèm payload `[null, uuid, dsh, 7, null, tl, false]` lên backend Google;
   - Nhận về trạng thái `[3, null, 4]` (báo thiết bị không phải Android để kích hoạt chế độ fallback SMS);
   - Giả lập request header và `navigator` sang **`iPad Mini`** rồi chuyển hướng sang `/uplevelingstep/selection?...&idv_xdevice=1`.

### Bước 3: Nhập số điện thoại nhận mã OTP SMS
1. Trang sẽ chuyển về giao diện chọn hình thức xác minh:
   - Tích chọn **Tin nhắn văn bản (Text message / SMS)** (hoặc Cuộc gọi).
2. Nhập số điện thoại của bạn (hỗ trợ số thực hoặc sim thuê OTP các nước) và ấn gửi mã.
3. Nhận mã `G-xxxxxx` gồm 6 số, điền vào và ấn **Tiếp theo (Next)** để hoàn tất.
4. Sau khi xong, profile đó đã được xác thực an toàn.

---

## 📁 Cấu Trúc Thư Mục

```text
google-qr-sms-helper/
├── assets/
│   ├── cloud-shell-verify.png  # Ảnh minh họa nút Cloud Shell
│   ├── icon-16.png             # Icon extension 16px
│   ├── icon-48.png             # Icon extension 48px
│   └── icon-128.png            # Icon extension 128px
├── manifest.json               # Cấu hình Chrome Extension Manifest V3 tiếng Việt
├── background.js               # Service Worker: DNR rules iPad Mini + RPC [3,null,4]
├── content.js                  # Giao diện nổi tiếng Việt + BarcodeDetector QR
├── ua_spoof.js                 # Overwrite navigator môi trường iPad Mini (MAIN world)
├── output/
│   └── google-qr-sms-helper-v1.1.0.zip
└── README.md
```
