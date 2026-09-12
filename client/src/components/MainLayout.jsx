import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Spacer to offset the fixed navbar (announcement bar ~32px + main nav ~60px) */}
      <div className="pt-[100px]" />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
