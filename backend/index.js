import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";

// Tải các biến môi trường từ file .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình middleware CORS để cho phép yêu cầu từ mọi nguồn
app.use(
  cors({
    origin: "*", // Cho phép tất cả các domain truy cập
  })
);

// Cấu hình middleware để xử lý dữ liệu JSON và URL-encoded
app.use(express.json()); // Xử lý dữ liệu JSON trong request body
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu form-encoded

// Định nghĩa tiền tố cho các API routes
const API_PREFIX = "/api-v1";
app.use(API_PREFIX, routes); // Áp dụng routes với tiền tố API

// Cấu hình port cho server với giá trị mặc định
const PORT = process.env.PORT || 8000;

// Khởi động server và lắng nghe trên port đã định
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
