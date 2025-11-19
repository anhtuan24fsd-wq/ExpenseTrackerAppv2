import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAccounts,
  createAccount,
  addMoneyToAccount,
} from "../controllers/accountController.js";

// Khởi tạo router
const router = express.Router();

// Route lấy danh sách tài khoản (có thể lấy theo id hoặc tất cả)
router.get("/:id", authMiddleware, getAccounts);

// Route tạo tài khoản mới
router.post("/create", authMiddleware, createAccount);

// Route thêm tiền vào tài khoản theo id
router.post("/add-money/:id", authMiddleware, addMoneyToAccount);

export default router;
