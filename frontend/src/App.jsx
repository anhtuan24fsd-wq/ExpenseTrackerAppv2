import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import AccountPage from "./pages/AccountPage";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import useStore from "./store";

// Component layout gốc để bảo vệ các route yêu cầu đăng nhập
const RootLayout = () => {
  // Lấy thông tin user từ store toàn cục
  const { user } = useStore((state) => state);
  console.log(user);

  // Nếu chưa đăng nhập (user = null), chuyển hướng đến trang đăng nhập
  // Ngược lại, render các route con thông qua Outlet
  return !user ? (
    <Navigate to="/sign-in" replace={true} />
  ) : (
    <>
      <div>
        <Outlet />
      </div>
    </>
  );
};

function App() {
  return (
    <div>
      <Routes>
        <Route>
          <Route path="/" element={<Navigate to="/overview" />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </div>
  );
}

export default App;
