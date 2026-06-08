
# Tom tat tinh nang MXMS - Cap nhat [08/06/2026]

## 1. Luu tru du lieu (Persistence)
- **Tu dong luu**: He thong tu dong luu moi thay doi (Hoc sinh, Diem danh, Cau hinh, Thong tin mien giam) vao bo nho trinh duyet (LocalStorage).
- **Nut Luu thu cong**: Them nut "Luu du lieu" (Save) tai Sidebar va Header de nguoi dung chu dong kiem soat.
- **Khong mat du lieu khi Reload**: Ngay hoc chuan (22 ngay), Thang/Nam dang chon va tat ca thong so phi se khong bi tro ve mac dinh khi tai lai trang.

## 2. Nap/Xuat file Excel thong minh (Du lieu bao ve 100%)
- **Tu dong nhan dien cot**: Ho ten, Ma HS, Ngay sinh, Lop, SĐT, Anh van, Ve, Nhip dieu, Be Moi, Giam 50%, Giam 100%.
- **Chuyen doi ngay sinh**: Tu dong parse ngay sinh nhieu dinh dang tu Excel ve YYYY-MM-DD chuẩn de hien thi va chinh sua chinh xac.
- **Sap nhap thong minh (Smart Merge)**: Khi nap file Excel, ung dung se tu dong so khop theo **Ma HS** hoac **Ho va ten** (khong phan biet chu hoa/thuong, loai bo khoang trang dac biet). Neu hoc sinh da ton tai, he thong se cap nhat thong tin moi chu khong tao dong trung lap.
- **Xuat Excel tròn tria (Round-trip)**: File Excel xuat ra co day du cac cot "MA HS", "BE MOI", "GIAM 50%", "GIAM 100%" (danh dau chuot bang ky tu "X") giup de dang tai su dung khi nhap lai vao he thong ma khong bi mat mat thong tin dac biet nao.

## 3. Phan loai khoi & So thu tu (STT)
- Tu dong phan loai be vao "Khoi Mau Giao" (neu lop co chu "Mau giao") va "Khoi Nha Tre" (neu lop co chu "Nha tre").
- **STT tu dong**: Danh so 1, 2, 3... cho tung be trong danh sach va tung khoi lop rieng biet de de dang quan ly danh sach.

## 4. Giao dien Mobile & In an
- Menu duoi cho mobile.
- Phieu thu in 1/2 A4 tiet kiem giay.
- Gui Zalo nhanh qua nut bam tren dien thoai.

## 5. So Thanh Toan Tien An Chuan 100%
- **Giao dien nghiep vu hien dai**: Them Tab "Sổ tiền ăn" de theo doi so ngay nghi hoc, so ngay di hoc va so tien hoan lai cho tung be trong tung khoi lop (Mau giao va Nha tre).
- **Tinh toan thuc te tu dong**: So ngay di hoc thuc te tu dong tinh theo lich va dieu chinh thong minh cho be cu/moi, thoi gian nghi phep dong bo 100% tu tab Diem danh.
- **In an giay chuan**: Thiet ke layout in hoa co dong chu ky Nguoi Lap Bang, Hieu Truong Duyet giong nhu ban in thu cong truyen thong.
- **Xuat Excel nang thuong**: Hieu chinh de file Excel xuat ra co dinh dang dep, gop o tieu de phan chia nghiem tuc va de dang khao cuu luu tru.
