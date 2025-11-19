import express from "express";
import { signUpUser, signInUser } from "../controllers/authController.js";

// Khởi tạo router để định nghĩa các routes cho authentication
const router = express.Router();

// Route xử lý đăng ký người dùng mới
// POST /api-v1/auth/sign-up
router.post("/sign-up", signUpUser);

// Route xử lý đăng nhập người dùng
// POST /api-v1/auth/sign-in
router.post("/sign-in", signInUser);

export default router;
