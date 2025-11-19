import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Destructuring để lấy class Pool từ thư viện pg
const { Pool } = pg;

// Tạo pool kết nối database với chuỗi kết nối từ biến môi trường
const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: {
    rejectUnauthorized: false, // Cho phép kết nối SSL không verify certificate
  },
});

export default pool;
