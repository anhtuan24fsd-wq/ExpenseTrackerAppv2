import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getUser,
  changePassword,
  updateUser,
} from "../controllers/userController.js";

// Khởi tạo router
const router = express.Router();

// Route lấy thông tin user (yêu cầu xác thực)
router.get("/", authMiddleware, getUser);

// Route đổi mật khẩu (yêu cầu xác thực)
router.put("/change-password", authMiddleware, changePassword);

// Route cập nhật thông tin user theo id (yêu cầu xác thực)
router.put("/:id", authMiddleware, updateUser);

export default router;
