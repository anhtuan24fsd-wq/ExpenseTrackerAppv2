import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getTransactions,
  getDashboardInfomation,
  addTransaction,
  transferMoneyToAccount,
} from "../controllers/transactionController.js";

// Khởi tạo router
const router = express.Router();

// Route lấy danh sách giao dịch
router.get("/", authMiddleware, getTransactions);

// Route lấy thông tin dashboard
router.get("/dashboard", authMiddleware, getDashboardInfomation);

// Route thêm giao dịch mới cho tài khoản
router.post("/add-transaction/:account_id", authMiddleware, addTransaction);

// Route chuyển tiền giữa các tài khoản
router.post("/transfer-money", authMiddleware, transferMoneyToAccount);

export default router;
