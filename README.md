<div align="center">

# 🛍️ ShopVerse — Full-Stack E-Commerce Platform

A modern, full-featured e-commerce web application built with **React 19**, **Node.js**, **Express**, and **MongoDB**. Featuring a sleek dark-mode UI, complete admin dashboard, Razorpay payment integration, and real-time order tracking.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)

</div>

---

## ✨ Features

### 🛒 Customer-Facing Storefront
- **Product Browsing** — Browse products by categories (Men / Women) with advanced filtering & sorting
- **Search** — Real-time search with instant results
- **Product Details** — Detailed product pages with image galleries, size selection & reviews
- **Shopping Cart** — Add/remove items, adjust quantities, apply coupon codes
- **Wishlist** — Save favorite products for later
- **Checkout** — Streamlined checkout with address management & Razorpay payment gateway
- **Order Tracking** — Real-time order status tracking with timeline visualization
- **User Profiles** — Manage personal info, addresses, and view order history
- **Reviews & Ratings** — Leave reviews with star ratings on purchased products
- **Dark Mode** — Full dark/light theme toggle with smooth transitions

### 🔐 Authentication & Security
- **JWT-based Authentication** — Secure login/signup with token-based sessions
- **Password Hashing** — bcrypt encryption for user passwords
- **Protected Routes** — Role-based access control for admin routes
- **Auth Modal** — Elegant login/register modal with form validation

### 📊 Admin Dashboard
- **Dashboard Analytics** — Revenue charts, order stats, and key metrics via Recharts
- **Product Management** — Full CRUD operations for products with image upload
- **Order Management** — View, update status, and manage all customer orders
- **Inventory Tracking** — Monitor stock levels and low-stock alerts
- **User Management** — View and manage registered users
- **Review Moderation** — Approve, respond to, or remove customer reviews
- **Coupon System** — Create and manage discount coupons with expiry dates

### 📧 Notifications
- **Email Notifications** — Automated order confirmation and status update emails via Nodemailer

---

## 🛠️ Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| **Frontend** | React 19, React Router 7, Vite 7, TailwindCSS 3            |
| **Backend**  | Node.js, Express 4, Mongoose 9                              |
| **Database** | MongoDB Atlas                                               |
| **Auth**     | JWT (jsonwebtoken), bcryptjs                                |
| **Payments** | Razorpay                                                    |
| **Email**    | Nodemailer                                                  |
| **Charts**   | Recharts                                                    |
| **Toasts**   | react-hot-toast                                             |

---

## 📁 Project Structure

```
ecommerce/
├── client/                     # React Frontend (Vite)
│   ├── public/                 # Static assets & images
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── AuthModal.jsx   # Login/Register modal
│   │   │   ├── FilterSidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ReviewModal.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── ...
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx # Authentication state
│   │   │   └── StoreContext.jsx# Cart, wishlist & store state
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useProductFilter.js
│   │   │   └── useProducts.js
│   │   ├── pages/              # Route page components
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── OrderList.jsx
│   │   │   │   ├── Inventory.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── Reviews.jsx
│   │   │   │   └── Coupons.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Men.jsx / Women.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Tracking.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── ...
│   │   ├── sections/           # Homepage sections
│   │   │   ├── Hero.jsx
│   │   │   ├── FeaturedProducts.jsx
│   │   │   └── NewArrivals.jsx
│   │   ├── App.jsx             # Root component & routing
│   │   └── main.jsx            # Entry point
│   └── package.json
│
├── server/                     # Node.js Backend (Express)
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── emailService.js     # Nodemailer setup
│   ├── controllers/            # Route handlers / business logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── couponController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── productController.js
│   │   ├── reviewController.js
│   │   └── wishlistController.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification & role check
│   ├── models/                 # Mongoose schemas
│   │   ├── Cart.js
│   │   ├── Coupon.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Review.js
│   │   ├── User.js
│   │   └── Wishlist.js
│   ├── routes/                 # Express route definitions
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── couponRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── productRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── wishlistRoutes.js
│   ├── seed/                   # Database seed scripts
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB Atlas** account — [Sign up](https://www.mongodb.com/cloud/atlas)
- **Razorpay** account (for payments) — [Sign up](https://razorpay.com)

### 1. Clone the Repository

```bash
git clone https://github.com/PriyankaGouri123/Ecommerce.git
cd Ecommerce
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Start the server:

```bash
npm run dev      # Development (with nodemon)
# or
npm start        # Production
```

### 3. Set Up the Frontend

```bash
cd client
npm install
npm run dev
```

The client will start at `http://localhost:5173` and the server at `http://localhost:5001`.

---

## 🔗 API Endpoints

| Method   | Endpoint                 | Description                    | Auth     |
| -------- | ------------------------ | ------------------------------ | -------- |
| `POST`   | `/api/auth/register`     | Register a new user            | —        |
| `POST`   | `/api/auth/login`        | Login & receive JWT            | —        |
| `GET`    | `/api/products`          | Get all products               | —        |
| `GET`    | `/api/products/:id`      | Get product by ID              | —        |
| `GET`    | `/api/orders`            | Get user's orders              | JWT      |
| `POST`   | `/api/orders`            | Create a new order             | JWT      |
| `GET`    | `/api/wishlist`          | Get user's wishlist            | JWT      |
| `POST`   | `/api/wishlist`          | Add item to wishlist           | JWT      |
| `GET`    | `/api/reviews/:productId`| Get reviews for a product      | —        |
| `POST`   | `/api/reviews`           | Submit a review                | JWT      |
| `POST`   | `/api/coupons/validate`  | Validate a coupon code         | JWT      |
| `POST`   | `/api/payments/create`   | Create Razorpay payment order  | JWT      |
| `GET`    | `/api/admin/*`           | Admin management endpoints     | JWT+Admin|

---

## ⚙️ Environment Variables

| Variable     | Description                          |
| ------------ | ------------------------------------ |
| `MONGO_URI`  | MongoDB Atlas connection string      |
| `PORT`       | Server port (default: `5001`)        |
| `JWT_SECRET` | Secret key for JWT token signing     |
| `EMAIL_USER` | Gmail address for sending emails     |
| `EMAIL_PASS` | Gmail App Password for Nodemailer    |

---

## 🧑‍💻 Author

**Priyanka Gouri**  
GitHub: [@PriyankaGouri123](https://github.com/PriyankaGouri123)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
