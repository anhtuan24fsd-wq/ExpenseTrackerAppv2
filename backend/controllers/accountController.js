import pool from "../libs/database.js";

// Hàm lấy danh sách tài khoản của người dùng
export const getAccounts = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Truy vấn database để lấy tất cả tài khoản của user
    const accounts = await pool.query({
      text: "SELECT * FROM tblaccount WHERE user_id = $1",
      values: [userId],
    });

    // Trả về danh sách tài khoản thành công
    res.status(200).json({ status: true, data: accounts.rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm tạo tài khoản mới cho người dùng
export const createAccount = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Lấy thông tin tài khoản từ request body
    const { name, amount, account_number } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !account_number || amount === undefined) {
      return res.status(400).json({
        status: false,
        message: "Tên tài khoản, số tài khoản và số tiền đều bắt buộc",
      });
    }

    // Kiểm tra amount phải là số dương
    if (isNaN(amount) || Number(amount) < 0) {
      return res.status(400).json({
        status: false,
        message: "Số tiền phải là số dương",
      });
    }

    // Kiểm tra xem tài khoản với tên này đã tồn tại chưa
    const accountExistResult = await pool.query({
      text: "SELECT * FROM tblaccount WHERE account_name = $1 AND user_id = $2",
      values: [name, userId],
    });
    const accountsExist = accountExistResult.rows[0];

    // Nếu tài khoản đã tồn tại, trả về lỗi 409 (Conflict)
    if (accountsExist) {
      return res
        .status(409)
        .json({ status: false, message: "Tài khoản đã tồn tại" });
    }

    // Tạo tài khoản mới trong database
    const createAccountResult = await pool.query({
      text: "INSERT INTO tblaccount (user_id, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *",
      values: [userId, name, account_number, amount],
    });
    const account = createAccountResult.rows[0];

    // Chuyển đổi tên tài khoản thành mảng (nếu chưa phải mảng)
    const userAccounts = Array.isArray(name) ? name : [name];

    // Cập nhật danh sách tài khoản của user trong bảng tbluser
    await pool.query({
      text: "UPDATE tbluser SET accounts = array_cat(COALESCE(accounts, ARRAY[]::text[]), $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      values: [userAccounts, userId],
    });

    // Tạo mô tả cho giao dịch nạp tiền ban đầu
    const description = account.account_name + " (Nạp tiền ban đầu)";

    // Tạo giao dịch nạp tiền ban đầu vào bảng tbltransaction
    await pool.query({
      text: "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [
        userId,
        description,
        "income",
        "Completed",
        amount,
        account.account_name,
      ],
    });

    // Trả về thông tin tài khoản đã tạo thành công
    res.status(201).json({
      status: true,
      message: account.account_name + " - Tạo tài khoản thành công",
      data: account,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm thêm tiền vào tài khoản
export const addMoneyToAccount = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Lấy id tài khoản từ URL params
    const { id } = req.params;

    // Lấy số tiền cần thêm từ request body
    const { amount } = req.body;

    // Kiểm tra amount có tồn tại không
    if (amount === undefined || amount === null) {
      return res.status(400).json({
        status: false,
        message: "Số tiền là bắt buộc",
      });
    }

    // Chuyển đổi amount sang kiểu Number
    const newAmount = Number(amount);

    // Kiểm tra amount phải là số dương
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Số tiền phải là số dương",
      });
    }

    // Kiểm tra tài khoản có tồn tại và thuộc về user không
    const checkAccount = await pool.query({
      text: "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      values: [id, userId],
    });

    if (checkAccount.rows.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy tài khoản hoặc bạn không có quyền truy cập",
      });
    }

    // Cập nhật số dư tài khoản bằng cách cộng thêm số tiền mới
    const result = await pool.query({
      text: "UPDATE tblaccount SET account_balance = (account_balance + $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      values: [newAmount, id],
    });
    const accountInformation = result.rows[0];

    // Tạo mô tả cho giao dịch nạp tiền
    const description = accountInformation.account_name + " (Nạp tiền)";

    // Tạo giao dịch nạp tiền vào bảng tbltransaction với trạng thái Completed
    await pool.query({
      text: "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      values: [
        userId,
        description,
        "income",
        "Completed",
        newAmount,
        accountInformation.account_name,
      ],
    });

    // Trả về thông tin tài khoản sau khi nạp tiền thành công
    return res.status(200).json({
      status: true,
      message: "Thêm tiền vào tài khoản thành công",
      data: accountInformation,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
