import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Navbar from "@components/layouts/Navbar";

const Layout = () => {
  // Routes où on cache le footer
  const noFooterRoutes = ['/vote','/auth/register','/auth/login','/checkout'];

  const showFooter = !noFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      {/* <Header /> */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
export default Layout;