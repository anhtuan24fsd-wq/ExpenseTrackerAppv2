import { getMonthName } from "../libs/index.js";
import pool from "../libs/database.js";

// Hàm lấy danh sách giao dịch với bộ lọc theo ngày và tìm kiếm
export const getTransactions = async (req, res) => {
  try {
    // Lấy ngày hiện tại
    const today = new Date();
    // Tạo ngày 7 ngày trước
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(_sevenDaysAgo.getDate() - 7);
    // Chuyển đổi sang định dạng ISO và lấy phần ngày
    const sevenDaysAgo = _sevenDaysAgo.toISOString().split("T")[0];
    // Lấy các tham số từ query string
    const { dateFrom, dateTo, search } = req.query;
    // Lấy userId từ thông tin user đã xác thực
    const { userId } = req.user;
    // Xác định ngày bắt đầu (mặc định là 7 ngày trước)
    const startDate = new Date(dateFrom || sevenDaysAgo);
    // Xác định ngày kết thúc (mặc định là ngày hiện tại)
    const endDate = new Date(dateTo || new Date());
    // Truy vấn database để lấy danh sách giao dịch
    const transactions = await pool.query({
      text: "SELECT * FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3 AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC",
      values: [userId, startDate, endDate, search || ""],
    });
    // Trả về kết quả thành công với danh sách giao dịch
    return res.status(200).json({ status: true, data: transactions.rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm lấy thông tin dashboard bao gồm tổng thu nhập, chi tiêu, biểu đồ và giao dịch gần đây
export const getDashboardInfomation = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã xác thực
    const { userId } = req.user;
    // Khởi tạo biến tổng thu nhập
    let totalIncome = 0;
    // Khởi tạo biến tổng chi tiêu
    let totalExpense = 0;
    // Truy vấn tổng số tiền theo loại giao dịch (thu/chi)
    const transactionResult = await pool.query({
      text: "SELECT type, SUM(amount) AS total FROM tbltransaction WHERE user_id = $1 GROUP BY type",
      values: [userId],
    });
    // Lấy kết quả giao dịch
    const transactions = transactionResult.rows;
    // Duyệt qua từng giao dịch để tính tổng thu nhập và chi tiêu
    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        // Cộng dồn tổng thu nhập
        totalIncome += parseFloat(transaction.total);
      } else {
        // Cộng dồn tổng chi tiêu
        totalExpense += parseFloat(transaction.total);
      }
    });
    // Tính số dư khả dụng = tổng thu nhập - tổng chi tiêu
    const availableBalance = totalIncome - totalExpense;
    // Lấy năm hiện tại
    const year = new Date().getFullYear();
    // Ngày bắt đầu năm (1/1)
    const startDate = new Date(year, 0, 1);
    // Ngày kết thúc năm (31/12)
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    // Truy vấn dữ liệu giao dịch theo tháng trong năm
    const result = await pool.query({
      text: "SELECT EXTRACT(MONTH FROM createdAt) AS month, type, SUM(amount) AS totalAmount FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3 GROUP BY EXTRACT(MONTH FROM createdAt), type",
      values: [userId, startDate, endDate],
    });
    // Tạo mảng dữ liệu biểu đồ cho 12 tháng
    const data = new Array(12).fill().map((_, index) => {
      // Lọc dữ liệu theo tháng
      const monthData = result.rows.filter(
        (item) => parseInt(item.month) === index + 1
      );
      // Lấy tổng thu nhập trong tháng
      const income =
        parseFloat(
          monthData.find((item) => item.type === "income")?.totalamount
        ) || 0;
      // Lấy tổng chi tiêu trong tháng
      const expense =
        parseFloat(
          monthData.find((item) => item.type === "expense")?.totalamount
        ) || 0;
      // Trả về object chứa thông tin tháng
      return {
        label: getMonthName(index),
        income: income,
        expense: expense,
      };
    });

    // Truy vấn 5 giao dịch gần nhất
    const lastTransactionResult = await pool.query({
      text: "SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY id DESC LIMIT 5",
      values: [userId],
    });
    const lastTransactions = lastTransactionResult.rows;
    // Truy vấn 5 tài khoản gần nhất
    const lastAccountResult = await pool.query({
      text: "SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY id DESC LIMIT 5",
      values: [userId],
    });
    const lastAccounts = lastAccountResult.rows;
    // Trả về tất cả thông tin dashboard
    res.status(200).json({
      status: true,
      availableBalance,
      totalIncome,
      totalExpense,
      chartData: data,
      lastTransactions,
      lastAccounts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm thêm giao dịch chi tiêu mới cho một tài khoản
export const addTransaction = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã xác thực
    const { userId } = req.user;
    // Lấy account_id từ params
    const { account_id } = req.params;
    // Lấy thông tin giao dịch từ body
    const { description, source, amount } = req.body;
    // Kiểm tra các trường bắt buộc
    if (!description || !source || !amount) {
      return res.status(403).json({
        status: false,
        message: "Vui lòng cung cấp tất cả các trường bắt buộc",
      });
    }
    // Kiểm tra số tiền phải lớn hơn 0
    if (Number(amount) <= 0) {
      return res.status(403).json({
        status: false,
        message: "Số tiền phải lớn hơn 0",
      });
    }
    // Truy vấn thông tin tài khoản
    const result = await pool.query({
      text: "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      values: [account_id, userId],
    });
    const accountInformation = result.rows[0];
    // Kiểm tra tài khoản có tồn tại không
    if (!accountInformation) {
      return res.status(403).json({
        status: false,
        message: "Tài khoản không tồn tại hoặc không thuộc về người dùng này",
      });
    }
    // Kiểm tra số dư tài khoản có đủ không
    if (
      accountInformation.account_balance <= 0 ||
      accountInformation.account_balance < Number(amount)
    ) {
      return res.status(403).json({
        status: false,
        message: "Số dư tài khoản không đủ",
      });
    }
    // Bắt đầu transaction database
    await pool.query({ text: "BEGIN" });
    // Trừ tiền từ tài khoản
    await pool.query({
      text: "UPDATE tblaccount SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      values: [amount, account_id],
    });
    // Thêm bản ghi giao dịch vào database
    await pool.query({
      text: "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [userId, description, "expense", "Completed", amount, source],
    });
    // Commit transaction
    await pool.query({ text: "COMMIT" });
    // Trả về kết quả thành công
    return res.status(200).json({
      status: true,
      message: "Thêm giao dịch thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm chuyển tiền giữa hai tài khoản
export const transferMoneyToAccount = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã xác thực
    const { userId } = req.user;
    // Lấy thông tin chuyển tiền từ body
    const { fromAccountId, toAccountId, amount } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(403).json({
        status: false,
        message: "Vui lòng cung cấp tất cả các trường bắt buộc",
      });
    }

    // Kiểm tra không được chuyển tiền cho chính mình
    if (fromAccountId === toAccountId) {
      return res.status(403).json({
        status: false,
        message: "Không thể chuyển tiền cho chính tài khoản này",
      });
    }

    // Chuyển đổi amount sang số
    const newAmount = Number(amount);

    // Kiểm tra số tiền hợp lệ
    if (newAmount <= 0 || isNaN(newAmount)) {
      return res.status(403).json({
        status: false,
        message: "Số tiền phải lớn hơn 0",
      });
    }

    // Lấy thông tin tài khoản nguồn
    const fromAccountResult = await pool.query({
      text: "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      values: [fromAccountId, userId],
    });
    const fromAccount = fromAccountResult.rows[0];

    // Kiểm tra tài khoản nguồn có tồn tại
    if (!fromAccount) {
      return res.status(404).json({
        status: false,
        message:
          "Tài khoản nguồn không tồn tại hoặc không thuộc về người dùng này",
      });
    }

    // Kiểm tra số dư tài khoản nguồn
    if (newAmount > fromAccount.account_balance) {
      return res.status(403).json({
        status: false,
        message: "Số dư tài khoản không đủ",
      });
    }

    // Lấy thông tin tài khoản đích
    const toAccountCheckResult = await pool.query({
      text: "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      values: [toAccountId, userId],
    });
    const toAccount = toAccountCheckResult.rows[0];

    // Kiểm tra tài khoản đích có tồn tại
    if (!toAccount) {
      return res.status(404).json({
        status: false,
        message:
          "Tài khoản đích không tồn tại hoặc không thuộc về người dùng này",
      });
    }

    // Bắt đầu transaction database
    await pool.query({ text: "BEGIN" });

    // Trừ tiền từ tài khoản nguồn
    await pool.query({
      text: "UPDATE tblaccount SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      values: [newAmount, fromAccountId],
    });

    // Cộng tiền vào tài khoản đích
    await pool.query({
      text: "UPDATE tblaccount SET account_balance = account_balance + $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      values: [newAmount, toAccountId],
    });

    // Tạo mô tả giao dịch chuyển tiền
    const description =
      "Chuyển tiền từ " +
      fromAccount.account_name +
      " sang " +
      toAccount.account_name;

    // Ghi nhận giao dịch chi (từ tài khoản nguồn)
    await pool.query({
      text: "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [
        userId,
        description,
        "expense",
        "Completed",
        newAmount,
        fromAccount.account_name,
      ],
    });

    // Tạo mô tả giao dịch nhận tiền
    const description1 =
      "Nhận tiền từ " +
      fromAccount.account_name +
      " sang " +
      toAccount.account_name;

    // Ghi nhận giao dịch thu (vào tài khoản đích)
    await pool.query({
      text: "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [
        userId,
        description1,
        "income",
        "Completed",
        newAmount,
        toAccount.account_name,
      ],
    });

    // Commit transaction
    await pool.query({ text: "COMMIT" });

    // Trả về kết quả thành công
    return res.status(200).json({
      status: true,
      message: "Chuyển tiền thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
