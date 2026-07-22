import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import {
  loginUser,
  googleLoginAPI,
  signupUser,
  sendOtpAPI,
  verifyOtpAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
} from "../../services/api";

// ─────────────────────────────────────────────────────────────────
// LoginModal
// Modes: "login" | "signup" | "forgot"
// Signup steps: 1 (Details) → 2 (Email OTP) → 3 (Location + Password)
// Forgot steps: 1 (Enter email) → 2 (Enter OTP) → 3 (New password)
// ─────────────────────────────────────────────────────────────────
export default function LoginModal() {
  const {
    showLoginModal, setShowLoginModal,
    login,
    loginReason, setLoginReason,
    userLocation, setShowLocationModal,
  } = useApp();

  // ── Mode & Step ─────────────────────────────────────────────────
  const [mode, setMode]           = useState("login");  // "login" | "signup" | "forgot"
  const [signupStep, setSignupStep] = useState(1);       // 1 | 2 | 3
  const [forgotStep, setForgotStep] = useState(1);       // 1 | 2 | 3

  // ── UI state ─────────────────────────────────────────────────
  const [showPass,    setShowPass]    = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  // ── Signup fields ───────────────────────────────────────────────
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  // ── Login fields ────────────────────────────────────────────────
  const [loginId,       setLoginId]       = useState("");  // email or phone
  const [loginPassword, setLoginPassword] = useState("");

  // ── Forgot password fields ──────────────────────────────────────
  const [forgotEmail,        setForgotEmail]        = useState("");
  const [resetOtp,           setResetOtp]           = useState("");
  const [newPassword,        setNewPassword]        = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // ── Dev hint ────────────────────────────────────────────────────
  const [devOtp, setDevOtp] = useState(null);

  // ── OTP Resend timer ─────────────────────────────────────────────
  const [timer,   setTimer]   = useState(0);
  const timerRef = useRef(null);

  // ── Sync location from context ──────────────────────────────────
  useEffect(() => {
    if (userLocation?.name && !location) setLocation(userLocation.name);
  }, [userLocation, location]);

  // ── Reset when modal closes ─────────────────────────────────────
  useEffect(() => {
    if (!showLoginModal) {
      setMode("login"); setSignupStep(1); setForgotStep(1);
      setErrors({}); setDevOtp(null);
      setShowPass(false); setShowNewPass(false); setLoading(false);
      setName(""); setPhone(""); setEmail(""); setEmailOtp(""); setPassword(""); setConfirm("");
      setLoginId(""); setLoginPassword("");
      setForgotEmail(""); setResetOtp(""); setNewPassword(""); setNewPasswordConfirm("");
      setLoginReason("");
      clearInterval(timerRef.current); setTimer(0);
    }
  }, [showLoginModal, setLoginReason]);

  // ── ESC key ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setShowLoginModal(false); };
    if (showLoginModal) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showLoginModal, setShowLoginModal]);

  // ── Body scroll lock ────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = showLoginModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLoginModal]);

  // ── Timer cleanup ────────────────────────────────────────────────
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────
  const clearErr = useCallback((key) => {
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const startTimer = useCallback((secs = 60) => {
    setTimer(secs);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  }, []);

  const switchMode = useCallback((m) => {
    setMode(m); setSignupStep(1); setForgotStep(1);
    setErrors({}); setDevOtp(null);
    clearInterval(timerRef.current); setTimer(0);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────
  function validateStep1() {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Enter your full name";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit phone number";
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) e.email = "Enter a valid email address";
    return e;
  }
  function validateStep3() {
    const e = {};
    if (!location.trim()) e.location = "Your location is required";
    if (!password || password.length < 6) e.password = "Password must be at least 6 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    return e;
  }
  function validateLogin() {
    const e = {};
    if (!loginId.trim()) e.loginId = "Email or phone is required";
    if (!loginPassword) e.loginPassword = "Password is required";
    return e;
  }

  // ─────────────────────────────────────────────────────────────────
  // Signup Handlers
  // ─────────────────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    if (signupStep === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setLoading(true); setErrors({}); setDevOtp(null);
    try {
      const result = await sendOtpAPI(email, phone);
      if (result?.devOtp) setDevOtp(result.devOtp);
      if (signupStep === 1) setSignupStep(2);
      setEmailOtp("");
      startTimer();
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Failed to send code. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const trimmed = emailOtp.replace(/\D/g, "");
    if (trimmed.length < 6) { setErrors({ emailOtp: "Enter the 6-digit code from your email" }); return; }
    setLoading(true); setErrors({});
    try {
      await verifyOtpAPI(email, trimmed);
      clearInterval(timerRef.current); setTimer(0);
      setSignupStep(3);
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Incorrect code. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSignup(e) {
    e.preventDefault();
    const errs = validateStep3();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const data = await signupUser(name, email, phone, password, location);
      await login(data);
      setShowLoginModal(false);
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Signup failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Login Handler
  // ─────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const data = await loginUser(loginId.trim(), loginPassword);
      await login(data);
      setShowLoginModal(false);
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Incorrect credentials. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSubmit = () => {
    // Google login disabled as requested - button click does nothing
  };

  // ─────────────────────────────────────────────────────────────────
  // Forgot Password Handlers
  // ─────────────────────────────────────────────────────────────────
  async function handleForgotSend(e) {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(forgotEmail)) {
      setErrors({ forgotEmail: "Enter a valid email address" }); return;
    }
    setLoading(true); setErrors({});
    try {
      const result = await forgotPasswordAPI(forgotEmail.trim());
      if (result?.devOtp) setDevOtp(result.devOtp);
      setForgotStep(2); setResetOtp(""); startTimer();
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Failed to send reset code." });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotResend() {
    if (timer > 0 || loading) return;
    setLoading(true); setErrors({});
    try {
      const result = await forgotPasswordAPI(forgotEmail.trim());
      if (result?.devOtp) setDevOtp(result.devOtp);
      setResetOtp(""); startTimer();
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Failed to resend." });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const errs = {};
    if (!resetOtp.replace(/\D/g, "") || resetOtp.replace(/\D/g, "").length < 6) errs.resetOtp = "Enter the 6-digit code";
    if (!newPassword || newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    if (newPassword !== newPasswordConfirm) errs.newPasswordConfirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      await resetPasswordAPI(forgotEmail.trim(), resetOtp.trim(), newPassword);
      // Return to login with success message
      setMode("login");
      setForgotStep(1);
      setErrors({ success: "Password reset! Please log in with your new password." });
    } catch (err) {
      setErrors({ global: err.data?.message || err.message || "Reset failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (!showLoginModal) return null;

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <>
      <div className="modal-overlay" onClick={() => setShowLoginModal(false)} />
      <div className="modal-wrap">
        <div className="modal-card">
          <div className="modal-body">

            {/* Close button */}
            <div className="flex justify-end mb-2">
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>

            {/* Login reason banner */}
            {loginReason && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
                {loginReason}
              </div>
            )}

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                {isForgot ? "Reset password" : isSignup ? "Create account" : "Welcome back"}
              </h2>
              <p className="text-sm text-gray-500">
                {isForgot
                  ? "Enter your email and we'll send a reset code"
                  : isSignup
                    ? "Start buying and selling locally on EASY"
                    : "Log in to continue to EASY"}
              </p>
            </div>

            {/* Mode tabs — login / signup, only on step 1 */}
            {!isForgot && (!isSignup || signupStep === 1) && (
              <div className="modal-tab-row">
                {[{ label: "Log in", m: "login" }, { label: "Sign up", m: "signup" }].map(({ label, m }) => (
                  <button key={m}
                    className={`modal-tab-btn${mode === m ? " active" : ""}`}
                    onClick={() => switchMode(m)}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Feedback banners ── */}
            {errors.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 font-semibold flex items-center gap-2">
                <span>✅</span> {errors.success}
              </div>
            )}
            {errors.global && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                {errors.global}
              </div>
            )}

            {/* Dev OTP hint — shows when no Gmail configured */}
            {devOtp && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
                <p className="text-xs font-bold text-amber-700 mb-1.5">ðŸ›  Dev Mode — No email service configured</p>
                <p className="text-xs text-amber-800 mb-2">Your code (would be emailed in production):</p>
                <p className="text-center font-mono text-2xl font-black tracking-[0.4em] text-amber-900 bg-amber-100 rounded-lg py-2">
                  {devOtp}
                </p>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â• LOGIN â•â•â•â•â•â•â•â•â•â•â•â• */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-3" noValidate>
                <ModalField
                  id="m-loginId" label="Email or Phone" type="text" placeholder="your@email.com or 9876543210"
                  value={loginId} onChange={e => { setLoginId(e.target.value); clearErr("loginId"); }}
                  error={errors.loginId} autoFocus
                />
                <PasswordField
                  id="m-loginPwd" label="Password" placeholder="Enter your password"
                  value={loginPassword} onChange={e => { setLoginPassword(e.target.value); clearErr("loginPassword"); }}
                  error={errors.loginPassword} showPass={showPass} onToggle={() => setShowPass(v => !v)}
                  forgotLink={
                    <span className="text-xs text-blue-600 cursor-pointer font-medium hover:underline"
                      onClick={() => switchMode("forgot")}>
                      Forgot password?
                    </span>
                  }
                />
                <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm mt-1" disabled={loading}>
                  {loading ? "Logging in…" : "Log in →"}
                </button>
              </form>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â• SIGNUP â•â•â•â•â•â•â•â•â•â•â•â• */}
            {mode === "signup" && (
              <div className="flex flex-col gap-3">
                {/* Progress bar */}
                <div className="flex gap-1.5 mb-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${signupStep >= s ? "bg-blue-500" : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1">
                  Step {signupStep} of 3 — {["", "Your details", "Verify email", "Set password"][signupStep]}
                </p>

                {/* Step 1: Details */}
                {signupStep === 1 && (
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-2 md:gap-3" noValidate>
                    <div className="field-row-2">
                      <ModalField id="m-name" label="Full name" type="text" placeholder="Your full name"
                        value={name} onChange={e => { setName(e.target.value); clearErr("name"); }}
                        error={errors.name} autoFocus />
                      <ModalField id="m-phone" label="Phone number" type="tel" placeholder="98765 43210"
                        value={phone} onChange={e => { setPhone(e.target.value); clearErr("phone"); }}
                        error={errors.phone} />
                    </div>
                    <ModalField id="m-email" label="Email address" type="email" placeholder="your@email.com"
                      value={email} onChange={e => { setEmail(e.target.value); clearErr("email"); }}
                      error={errors.email} />
                    <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm mt-1" disabled={loading}>
                      {loading ? "Sending code…" : "Send Verification Code →"}
                    </button>
                  </form>
                )}

                {/* Step 2: Email OTP */}
                {signupStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2 md:gap-3" noValidate>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed">
                      ðŸ“§ A 6-digit code was sent to <strong>{email}</strong>.<br />
                      Check your inbox — and spam folder if you don't see it.
                    </div>

                    {/* Big centered OTP input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Verification Code</label>
                      <input
                        id="m-email-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="· · · · · ·"
                        value={emailOtp}
                        maxLength={6}
                        autoFocus
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setEmailOtp(val);
                          clearErr("emailOtp");
                        }}
                        className={`input w-full text-center text-3xl font-black tracking-[0.6em] py-3${errors.emailOtp ? " error" : ""}`}
                        style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.5em" }}
                      />
                      {errors.emailOtp && <p className="text-xs text-red-500 mt-1">{errors.emailOtp}</p>}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <button type="button" onClick={() => { setSignupStep(1); setErrors({}); clearInterval(timerRef.current); setTimer(0); setDevOtp(null); }}
                        className="text-gray-500 hover:text-gray-800 font-medium">â† Back</button>
                      <button type="button" onClick={handleSendOtp} disabled={timer > 0 || loading}
                        className={`font-semibold ${timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 cursor-pointer"}`}>
                        {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                      </button>
                    </div>

                    <button type="submit"
                      className="btn btn-primary btn-w-full justify-center py-2.5 text-sm"
                      disabled={loading || emailOtp.replace(/\D/g,"").length < 6}>
                      {loading ? "Verifying…" : "Verify Email →"}
                    </button>
                  </form>
                )}

                {/* Step 3: Location + Password */}
                {signupStep === 3 && (
                  <form onSubmit={handleFinalSignup} className="flex flex-col gap-2 md:gap-3" noValidate>
                    <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold flex items-center gap-2">
                      <span>✅</span> Email verified! Set your location and password below.
                    </div>
                    <ModalField id="m-location" label="Your city / area" type="text"
                      placeholder="e.g. Hazratganj, Lucknow"
                      value={location} onChange={e => { setLocation(e.target.value); clearErr("location"); }}
                      error={errors.location}
                      rightElement={
                        <button type="button" className="field-icon-btn" onClick={() => setShowLocationModal(true)}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </button>
                      }
                    />
                    <div className="field-row-2">
                      <PasswordField id="m-signup-pass" label="Password" placeholder="Min. 6 characters"
                        value={password} onChange={e => { setPassword(e.target.value); clearErr("password"); }}
                        error={errors.password} showPass={showPass} onToggle={() => setShowPass(v => !v)} />
                      <ModalField id="m-confirm" label="Confirm password" type={showPass ? "text" : "password"}
                        placeholder="Repeat password"
                        value={confirm} onChange={e => { setConfirm(e.target.value); clearErr("confirm"); }}
                        error={errors.confirm} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm mt-1" disabled={loading}>
                      {loading ? "Creating account…" : "Create Account →"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ════════════ FORGOT PASSWORD ════════════ */}
            {mode === "forgot" && (
              <div className="flex flex-col gap-2 md:gap-3">
                {/* Progress bar */}
                <div className="flex gap-1.5 mb-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${forgotStep >= s ? "bg-violet-500" : "bg-gray-200"}`} />
                  ))}
                </div>

                {/* Step 1: Enter email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleForgotSend} className="flex flex-col gap-2 md:gap-3" noValidate>
                    <ModalField id="m-forgot-email" label="Your registered email" type="email"
                      placeholder="your@email.com"
                      value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); clearErr("forgotEmail"); }}
                      error={errors.forgotEmail} autoFocus />
                    <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm mt-1" disabled={loading}>
                      {loading ? "Sending…" : "Send Reset Code →"}
                    </button>
                    <button type="button" onClick={() => switchMode("login")}
                      className="text-xs text-center text-gray-500 hover:text-gray-800 font-medium mt-1">
                      â† Back to login
                    </button>
                  </form>
                )}

                {/* Step 2: Enter OTP */}
                {forgotStep === 2 && (
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed">
                      ðŸ“§ Reset code sent to <strong>{forgotEmail}</strong>.<br />
                      Check your inbox — and spam folder if you don't see it.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Reset Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="· · · · · ·"
                        value={resetOtp}
                        maxLength={6}
                        autoFocus
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setResetOtp(val);
                          clearErr("resetOtp");
                        }}
                        className={`input w-full text-center text-3xl font-black tracking-[0.6em] py-3${errors.resetOtp ? " error" : ""}`}
                        style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.5em" }}
                      />
                      {errors.resetOtp && <p className="text-xs text-red-500 mt-1">{errors.resetOtp}</p>}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <button type="button" onClick={() => { setForgotStep(1); setErrors({}); clearInterval(timerRef.current); setTimer(0); setDevOtp(null); }}
                        className="text-gray-500 hover:text-gray-800 font-medium">â† Back</button>
                      <button type="button" onClick={handleForgotResend} disabled={timer > 0 || loading}
                        className={`font-semibold ${timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 cursor-pointer"}`}>
                        {timer > 0 ? `Resend in ${timer}s` : "Resend code"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (resetOtp.replace(/\D/g, "").length < 6) { setErrors({ resetOtp: "Enter the 6-digit code" }); return; }
                        setErrors({}); setForgotStep(3);
                      }}
                      className="btn btn-primary btn-w-full justify-center py-2.5 text-sm"
                      disabled={resetOtp.replace(/\D/g, "").length < 6}>
                      Continue →
                    </button>
                  </div>
                )}

                {/* Step 3: New password */}
                {forgotStep === 3 && (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-2 md:gap-3" noValidate>
                    <PasswordField id="m-new-pass" label="New password" placeholder="Min. 6 characters"
                      value={newPassword} onChange={e => { setNewPassword(e.target.value); clearErr("newPassword"); }}
                      error={errors.newPassword} showPass={showNewPass} onToggle={() => setShowNewPass(v => !v)} />
                    <ModalField id="m-new-pass-confirm" label="Confirm new password"
                      type={showNewPass ? "text" : "password"} placeholder="Repeat new password"
                      value={newPasswordConfirm}
                      onChange={e => { setNewPasswordConfirm(e.target.value); clearErr("newPasswordConfirm"); }}
                      error={errors.newPasswordConfirm} />
                    <button type="submit" className="btn btn-primary btn-w-full justify-center py-2.5 text-sm mt-1" disabled={loading}>
                      {loading ? "Resetting…" : "Reset Password →"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Google / OR — only on step 1 of login/signup */}
            {!isForgot && (!isSignup || signupStep === 1) && (
              <>
                <div className="flex items-center gap-3 my-3 md:my-5">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">or</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
                <button type="button"
                  className="btn btn-secondary btn-w-full justify-center py-2.5 text-sm"
                  onClick={() => handleGoogleSubmit()}
                  disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2 shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// REUSABLE FIELD COMPONENTS
// ─────────────────────────────────────────────────────────────────

function ModalField({ id, label, type, placeholder, value, onChange, error, rightElement, autoFocus }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
          autoFocus={autoFocus}
          className={`input input-sm w-full${rightElement ? " pr-10" : ""}${error ? " error" : ""}`}
        />
        {rightElement}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function PasswordField({ id, label, placeholder, value, onChange, error, showPass, onToggle, forgotLink }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold text-gray-700">{label}</label>
        {forgotLink}
      </div>
      <div className="relative">
        <input
          id={id} type={showPass ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={onChange}
          className={`input input-sm w-full pr-9${error ? " error" : ""}`}
        />
        <button type="button" onClick={onToggle} aria-label="Toggle password visibility"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPass
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            }
          </svg>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}
