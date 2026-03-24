import { Link } from "react-router-dom";

function Header() {
  return (
    <>
      {/* Top Bar */}
      <header className="bg-black text-white text-center py-2 text-sm">
        Don’t miss our holiday offer – 20% OFF!
      </header>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 shadow-md">

        <div className="text-2xl font-bold">
          Mystore
        </div>

        <ul className="flex gap-6 font-medium">
          <li><Link to="/" className="hover:text-blue-500">Home</Link></li>
          <li><Link to="/men" className="hover:text-blue-500">Men</Link></li>
          <li><Link to="/women" className="hover:text-blue-500">Women</Link></li>
          <li><Link to="/about" className="hover:text-blue-500">About</Link></li>

          <li>
            <Link to="/cart">
              Cart (<span>0</span>)
            </Link>
          </li>

          <li>
            <Link to="/wishlist">
              ❤️ Wishlist (<span>0</span>)
            </Link>
          </li>
        </ul>

        <input
          type="text"
          placeholder="Search products..."
          className="border px-3 py-1 rounded-md"
        />

      </nav>
    </>
  );
}

export default Header;