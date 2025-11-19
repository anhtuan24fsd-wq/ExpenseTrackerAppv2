import JWT from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // Lấy header authorization từ request
  const authHeader = req.headers?.authorization;

  // Kiểm tra xem header có tồn tại và có bắt đầu bằng "Bearer " không
  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: false, message: "Xác thực thất bại" });
  }

  // Tách token từ header (bỏ phần "Bearer ")
  const token = authHeader?.split(" ")[1];

  try {
    // Xác thực token với secret key - Sửa từ jwt thành JWT (phải khớp với import)
    const userToken = JWT.verify(token, process.env.JWT_SECRET);

    // Gắn thông tin user vào req.user thay vì req.body.user
    req.user = { userId: userToken.userId };

    // Chuyển sang middleware tiếp theo
    next();
  } catch (error) {
    // Log lỗi ra console
    console.log(error);

    // Trả về lỗi xác thực
    return res
      .status(401)
      .json({ status: false, message: "Xác thực thất bại" });
  }
};

export default authMiddleware;
