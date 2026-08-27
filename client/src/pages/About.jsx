import React from "react";

const About = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">

      {/* TOP BAR */}
      <header className="bg-black text-white text-center text-sm py-2">
        Don’t miss our holiday offer – 20% OFF!
      </header>

      {/* NAVBAR */}
      {/* <nav className="flex justify-between items-center px-10 py-4 bg-white dark:bg-gray-800 shadow">
        <div className="text-2xl font-bold">Mystore</div>

        <ul className="flex gap-6 items-center">
          <li><a href="/" className="hover:text-red-500">Home</a></li>
          <li><a href="/men" className="hover:text-red-500">Men</a></li>
          <li><a href="/women" className="hover:text-red-500">Women</a></li>
          <li><a href="/about" className="text-red-500">About</a></li>
          <li>
            <a href="/cart">
              Cart (<span id="cart-count">0</span>)
            </a>
          </li>
        </ul>

        <input
          type="text"
          placeholder="Search products..."
          className="border px-3 py-1 rounded"
        />
      </nav> */}

      {/* ABOUT SECTION */}
      <div className="max-w-4xl mx-auto my-20 bg-white dark:bg-gray-800 p-12 rounded-xl shadow">
        <h1 className="text-4xl font-bold mb-5">About Mystore</h1>

        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Mystore is a modern ecommerce platform focused on delivering
          high-quality fashion and lifestyle products with a seamless
          and enjoyable shopping experience.
        </p>

        <h3 className="mt-8 text-xl font-semibold">Our Mission</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
          To provide premium products with secure payment systems,
          fast delivery, and reliable customer support.
        </p>

        <h3 className="mt-8 text-xl font-semibold">Why Choose Us?</h3>
        <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
          <li>✔ Trusted & Verified Products</li>
          <li>✔ Secure Payments</li>
          <li>✔ Easy Returns</li>
          <li>✔ Fast Delivery</li>
          <li>✔ 24/7 Support</li>
        </ul>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-5 bg-black text-white mt-16">
        © 2026 Mystore. All Rights Reserved.
      </footer>

    </div>
  );
};

export default About;