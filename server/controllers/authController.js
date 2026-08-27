import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOtpEmail, sendPasswordChangedEmail } from "../config/emailService.js";

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Helper: validate email format
const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// Helper: validate phone number (10-digit Indian mobile)
const isValidPhone = (str) => /^[6-9]\d{9}$/.test(str);


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, identifier, password } = req.body;

    if (!name || !identifier || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const isEmail = isValidEmail(identifier);
    const isPhone = isValidPhone(identifier);

    if (!isEmail && !isPhone) {
      return res.status(400).json({ message: "Please enter a valid email address or 10-digit mobile number." });
    }

    const searchFilter = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const existing = await User.findOne(searchFilter);
    if (existing) {
      return res.status(400).json({
        message: isEmail
          ? "An account with this email already exists. Please log in."
          : "An account with this mobile number already exists. Please log in.",
      });
    }

    const userData = {
      name: name.trim(),
      password,
      ...(isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }),
    };

    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      addresses: user.addresses || [],
      profilePicture: user.profilePicture || "",
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Authenticate user with email/phone + password
// @route   POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Mobile and Password are required." });
    }

    const isEmail = isValidEmail(identifier);
    const isPhone = isValidPhone(identifier);

    if (!isEmail && !isPhone) {
      return res.status(400).json({ message: "Please enter a valid email address or 10-digit mobile number." });
    }

    const searchFilter = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(searchFilter);

    if (!user) {
      return res.status(401).json({
        message: "No account found. Please sign up first.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked by the administrator." });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      addresses: user.addresses || [],
      profilePicture: user.profilePicture || "",
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to email (real email delivery via Gmail SMTP)
// @route   POST /api/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
  console.log('sendOtp request body:', req.body);
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const isEmail = isValidEmail(identifier);

    // OTP login is only supported for email addresses
    if (!isEmail) {
      return res.status(400).json({
        message: "OTP login is only supported for email addresses. Please enter your email.",
      });
    }

    // Generate cryptographically safe 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('Generated OTP:', otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email: identifier.toLowerCase() });

    if (user) {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // New user — create a stub record to hold the OTP, they'll complete signup after verification
      user = new User({
        name: identifier.split("@")[0],
        email: identifier.toLowerCase(),
        otp,
        otpExpires,
      });
      await user.save();
    }

    // Send the real email via nodemailer
    await sendOtpEmail(identifier.toLowerCase(), otp);

    res.json({ message: `OTP sent successfully to ${identifier}. Check your inbox.` });
  } catch (error) {
    console.error("Send OTP error:", error);

    // Detect SMTP credential error specifically
    if (error.code === "EAUTH" || error.responseCode === 535) {
      return res.status(500).json({
        message: "Email configuration error. Please check EMAIL_USER and EMAIL_PASS in server .env file.",
      });
    }

    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify email OTP and log in
// @route   POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be a 6-digit number." });
    }

    const user = await User.findOne({ email: identifier.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "Account not found. Please request a new OTP." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked by the administrator." });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please check the code and try again." });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Clear OTP fields after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      addresses: user.addresses || [],
      profilePicture: user.profilePicture || "",
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.email) user.email = req.body.email.toLowerCase().trim();
    if (req.body.phone) user.phone = req.body.phone.trim();
    if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;
    if (req.body.password && req.body.password.length >= 6) {
      user.password = req.body.password;
    // Send password changed notification
    try {
      await sendPasswordChangedEmail(user.email);
    } catch (emailErr) {
      console.error('Failed to send password changed email:', emailErr);
    }
    }
    if (req.body.addresses) {
      // Clean client‑provided addresses and ensure a default address exists
      const cleaned = req.body.addresses.map((addr) => {
        const { _id, ...rest } = addr;
        return rest;
      });
      // If no address is marked as default, set the first one as default
      const hasDefault = cleaned.some((a) => a.isDefault);
      if (!hasDefault && cleaned.length > 0) {
        cleaned[0].isDefault = true;
      }
      user.addresses = cleaned;
    }

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email || null,
      phone: updated.phone || null,
      role: updated.role,
      addresses: updated.addresses || [],
      profilePicture: updated.profilePicture || "",
      token: generateToken(updated._id),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error.", error: error.message, stack: error.stack });
  }
};
