import { create } from "zustand";

// Tạo store toàn cục cho ứng dụng
const useStore = create((set) => ({
  // Lưu trữ theme (sáng/tối), lấy từ localStorage hoặc mặc định là "light"
  theme: localStorage.getItem("theme") ?? "light",

  // Lưu trữ thông tin user, parse từ localStorage hoặc null nếu chưa đăng nhập
  user: JSON.parse(localStorage.getItem("user")) ?? null,

  // Hàm cập nhật theme
  setTheme: (value) => set({ theme: value }),

  // Hàm lưu thông tin đăng nhập của user
  setCredentials: (user) => set({ user }),

  // Hàm đăng xuất, set user về null
  signOut: () => set({ user: null }),
}));

export default useStore;
