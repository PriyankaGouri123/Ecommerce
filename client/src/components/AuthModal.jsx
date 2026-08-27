import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    loginWithPassword,
    sendOtp,
    verifyOtp,
    register,
  } = useContext(AuthContext);

  const [mode, setMode] = useState(authModalMode || "login"); // 'login' | 'signup' | 'otp'
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [useOtp, setUseOtp] = useState(true); // Default to OTP like Flipkart
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalMode || "login");
    setOtpSent(false);
    setIdentifier("");
    setPassword("");
    setName("");
    setOtpCode(["", "", "", "", "", ""]);
  }, [authModalMode, isAuthModalOpen]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  if (!isAuthModalOpen) return null;

  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setSubmitting(true);
    if (useOtp) {
      const res = await sendOtp(identifier.trim());
      if (res.success) {
        setOtpSent(true);
        setTimer(60);
        setCanResend(false);
      }
    } else {
      // Password submit
      await loginWithPassword(identifier.trim(), password);
    }
    setSubmitting(false);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpCode.join("");
    if (fullOtp.length < 6) return;

    setSubmitting(true);
    await verifyOtp(identifier.trim(), fullOtp);
    setSubmitting(false);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setSubmitting(true);
    const res = await sendOtp(identifier.trim());
    if (res.success) {
      setTimer(60);
      setCanResend(false);
      setOtpCode(["", "", "", "", "", ""]);
    }
    setSubmitting(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name || !identifier || !password) return;

    setSubmitting(true);
    await register(name.trim(), identifier.trim(), password);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-gray-800 transition-all transform scale-100">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl font-bold bg-white/80 dark:bg-gray-800/80 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
        >
          ✕
        </button>

        {/* Left Side Banner (Flipkart Style) */}
        <div className="w-full md:w-2/5 bg-gradient-to-b from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              {mode === "signup"
                ? "Looks like you're new here!"
                : otpSent
                ? "Verify OTP"
                : "Login"}
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              {mode === "signup"
                ? "Sign up with your mobile number or email to get started."
                : otpSent
                ? `Please enter the 6-digit code sent to ${identifier}`
                : "Get access to your Orders, Wishlist, Saved Addresses, and Recommendations."}
            </p>
          </div>

          {/* Flipkart Visual Decorative element */}
          <div className="my-8 z-10 flex justify-center">
            <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-6xl">{mode === "signup" ? "🎁" : otpSent ? "🔐" : "🛍️"}</span>
            </div>
          </div>

          <div className="z-10 text-xs text-blue-200">
            <span>⚡ Fast Checkout</span> • <span>🔒 100% Safe & Secure</span>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
        </div>

        {/* Right Side Form Area */}
        <div className="w-full md:w-3/5 p-8 flex flex-col justify-between bg-white dark:bg-gray-900">
          
          {/* LOGIN FORM */}
          {mode === "login" && !otpSent && (
            <form onSubmit={handleIdentifierSubmit} className="space-y-6 flex-grow flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                    {useOtp ? "Enter Your Email Address" : "Enter Email or Mobile Number"}
                  </label>
                  <input
                    type={useOtp ? "email" : "text"}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={useOtp ? "e.g. user@example.com" : "e.g. 9876543210 or user@example.com"}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                  {useOtp && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">📧 A real OTP will be sent to this email address.</p>
                  )}
                </div>

                {!useOtp && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Enter Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to MyStore's{" "}
                  <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Terms of Use</span> and{" "}
                  <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Privacy Policy</span>.
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50"
                >
                  {submitting
                    ? "Processing..."
                    : useOtp
                    ? "REQUEST OTP"
                    : "LOG IN"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setUseOtp(!useOtp)}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {useOtp ? "Use Password" : "Request OTP instead"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-semibold"
                  >
                    New to MyStore? <span className="text-blue-600 font-bold">Create account</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* OTP VERIFICATION STEP */}
          {mode === "login" && otpSent && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 flex-grow flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    OTP sent to <strong className="text-gray-900 dark:text-white">{identifier}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-300">
                  📧 A 6-digit code has been sent to <strong>{identifier}</strong>. Please check your inbox (and spam folder).
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Enter 6-Digit OTP
                  </label>
                  <div className="flex justify-between gap-2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {timer > 0
                      ? `Resend in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`
                      : "Didn't receive the code?"}
                  </span>
                  <button
                    type="button"
                    disabled={!canResend || submitting}
                    onClick={handleResendOtp}
                    className={`font-semibold ${
                      canResend
                        ? "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || otpCode.join("").length < 6}
                  className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Verifying..." : "VERIFY & LOG IN"}
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-5 flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or user@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Set Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Creating Account..." : "CONTINUE & SIGN UP"}
                </button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Existing User? Log in
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
