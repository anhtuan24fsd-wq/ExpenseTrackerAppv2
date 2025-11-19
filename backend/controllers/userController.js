import pool from "../libs/database.js";
import { comparePassword, hashPassword } from "../libs/index.js";

// Hàm lấy thông tin người dùng
export const getUser = async (req, res) => {
  try {
    // Lấy userId từ req.user (được gắn bởi authMiddleware)
    const { userId } = req.user;

    // Truy vấn thông tin user từ database
    const userExist = await pool.query({
      text: "SELECT * FROM tbluser WHERE id = $1",
      values: [userId],
    });

    const user = userExist.rows[0];

    // Kiểm tra xem user có tồn tại không
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    // Ẩn mật khẩu trước khi trả về
    user.password = undefined;

    return res
      .status(200)
      .json({ status: true, message: "Lấy thông tin user thành công", user });
  } catch (error) {
    console.log("Error in getUser:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    // Lấy userId từ req.user
    const { userId } = req.user;

    // Lấy thông tin mật khẩu từ request body
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Vui lòng cung cấp đầy đủ thông tin mật khẩu",
      });
    }

    // Truy vấn thông tin user từ database
    const userExist = await pool.query({
      text: "SELECT * FROM tbluser WHERE id = $1",
      values: [userId],
    });

    const user = userExist.rows[0];

    // Kiểm tra xem user có tồn tại không
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    // Kiểm tra mật khẩu mới và mật khẩu xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu mới và mật khẩu xác nhận không khớp",
      });
    }

    // So sánh mật khẩu hiện tại với mật khẩu trong database
    const isMatch = await comparePassword(currentPassword, user?.password);

    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await hashPassword(newPassword);

    // Cập nhật mật khẩu mới vào database
    await pool.query({
      text: "UPDATE tbluser SET password = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
      values: [hashedPassword, userId],
    });

    return res
      .status(200)
      .json({ status: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.log("Error in changePassword:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  try {
    // Lấy userId từ req.user và id từ params
    const { userId } = req.user;
    const { id } = req.params;

    // Kiểm tra quyền: chỉ cho phép user cập nhật thông tin của chính mình
    if (userId !== parseInt(id)) {
      return res.status(403).json({
        status: false,
        message: "Bạn không có quyền cập nhật thông tin người dùng này",
      });
    }

    // Lấy thông tin cần cập nhật từ request body
    const { firstName, lastName, country, currency, contact } = req.body;

    // Truy vấn thông tin user từ database
    const userExist = await pool.query({
      text: "SELECT * FROM tbluser WHERE id = $1",
      values: [userId],
    });

    const user = userExist.rows[0];

    // Kiểm tra xem user có tồn tại không
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    // Cập nhật thông tin user vào database
    const updatedUser = await pool.query({
      text: "UPDATE tbluser SET firstname = $1, lastname = $2, country = $3, currency = $4, contact = $5, updatedAt = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      values: [firstName, lastName, country, currency, contact, userId],
    });

    // Ẩn mật khẩu trước khi trả về
    updatedUser.rows[0].password = undefined;

    return res.status(200).json({
      status: true,
      message: "Cập nhật thông tin user thành công",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.log("Error in updateUser:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
