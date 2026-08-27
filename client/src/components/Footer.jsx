
import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="bg-black text-white mt-16">

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-4 gap-10">

        <div>
          <h3 className="font-bold mb-3">Mystore</h3>
          <p className="text-sm text-gray-400">
            Premium fashion for men & women.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-3">Quick Links</h3>
          <p><Link to="/">Home</Link></p>
          <p><Link to="/men">Men</Link></p>
          <p><Link to="/women">Women</Link></p>
         
        </div>

        <div>
          <h3 className="font-bold mb-3">Support</h3>
          <p className="text-sm">24/7 Support</p>
          <p className="text-sm">Easy Returns</p>
          <p className="text-sm">Secure Payment</p>
        </div>

        <div>
          <h3 className="font-bold mb-3">Contact</h3>
          <p className="text-sm">support@mystore.com</p>
          <p className="text-sm">+91 98765 43210</p>
        </div>

      </div>

      <div className="text-center text-gray-400 text-sm pb-6">
        © 2026 Mystore. All rights reserved.
      </div>

    </footer>
  );
}