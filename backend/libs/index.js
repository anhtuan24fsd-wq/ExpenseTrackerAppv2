import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Hàm băm mật khẩu để mã hóa mật khẩu người dùng trước khi lưu vào database
export const hashPassword = async (userValue) => {
  // Tạo salt với độ phức tạp 10 rounds để tăng cường bảo mật
  const salt = await bcrypt.genSalt(10);
  // Băm mật khẩu với salt vừa tạo
  const hashedPassword = await bcrypt.hash(userValue, salt);
  // Trả về mật khẩu đã được băm
  return hashedPassword;
};

// Hàm so sánh mật khẩu người dùng nhập với mật khẩu đã băm trong database
export const comparePassword = async (userPassword, password) => {
  try {
    // Sử dụng bcrypt.compare để so sánh mật khẩu gốc với mật khẩu đã băm
    const isMatch = await bcrypt.compare(userPassword, password);
    // Trả về kết quả so sánh (true nếu khớp, false nếu không khớp)
    return isMatch;
  } catch (error) {
    // In lỗi ra console nếu có lỗi xảy ra trong quá trình so sánh
    console.log(error);
    // Trả về false nếu có lỗi
    return false;
  }
};

// Hàm tạo JWT token để xác thực người dùng
export const createJWT = (id) => {
  // Tạo và trả về JWT token với userId, secret key từ biến môi trường và thời gian hết hạn 30 ngày
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token sẽ hết hạn sau 30 ngày
  });
};

// Hàm lấy tên tháng theo số tháng
export const getMonthName = (index) => {
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  return monthNames[index];
};
