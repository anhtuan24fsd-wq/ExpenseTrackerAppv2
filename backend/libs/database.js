import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Destructuring để lấy class Pool từ thư viện pg
const { Pool } = pg;

// Tạo pool kết nối database với chuỗi kết nối từ biến môi trường
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
