import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useApp();

  const [mode,     setMode]     = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [confirm,  setConfirm]  = useState("");

  const isSignup = mode === "signup";

  useEffect(() => {
    if (!showLoginModal) {
      setMode("login"); setErrors({});
      setEmail(""); setPassword(""); setName(""); setPhone(""); setConfirm("");
      setShowPass(false); setLoading(false);
    }
  }, [showLoginModal]);

  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setShowLoginModal(false); }
    if (showLoginModal) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showLoginModal, setShowLoginModal]);

  useEffect(() => {
    document.body.style.overflow = showLoginModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLoginModal]);

  function validate() {
    const e = {};
    if (isSignup && !name.trim())              e.name     = "Name is required";
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email    = "Enter a valid email";
    if (password.length < 6)                   e.password = "At least 6 characters";
    if (isSignup && password !== confirm)      e.confirm  = "Passwords do not match";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); login(); setShowLoginModal(false); }, 900);
  }

  function handleGoogle() {
    setLoading(true);
    setTimeout(() => { setLoading(false); login(); setShowLoginModal(false); }, 600);
  }

  if (!showLoginModal) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={() => setShowLoginModal(false)} />

      {/* Modal */}
      <div className="modal-wrap">
        <div className="modal-card">
          <div className="modal-body">

            {/* Close */}
            <div className="flex justify-end mb-2">
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>

            {/* Heading */}
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-sm text-gray-500">
                {isSignup ? "Start buying and selling locally" : "Log in to continue to EASY"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="modal-tab-row">
              {[{label:"Log in", signup:false},{label:"Sign up", signup:true}].map(({label, signup}) => (
                <button
                  key={label}
                  className={`modal-tab-btn${signup === isSignup ? " active" : ""}`}
                  onClick={() => { setMode(signup ? "signup" : "login"); setErrors({}); }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
              {isSignup && (
                <div className="field-row-2">
                  <ModalField id="m-name"  label="Full name" type="text" placeholder="Enter your name..."     value={name}  onChange={e => setName(e.target.value)}  error={errors.name} />
                  <ModalField id="m-phone" label="Phone"     type="tel"  placeholder="Enter your phone..." value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              )}

              <ModalField
                id="m-email" label="Email address" type="email" placeholder="Enter your email address"
                value={email} onChange={e => setEmail(e.target.value)} error={errors.email}
              />

              {isSignup ? (
                <div className="field-row-2">
                  <PasswordField id="m-password" label="Password" placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    error={errors.password} showPass={showPass} onToggle={() => setShowPass(v => !v)} />
                  <ModalField id="m-confirm" label="Confirm password" type={showPass ? "text" : "password"}
                    placeholder="Re-enter password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} error={errors.confirm} />
                </div>
              ) : (
                <PasswordField id="m-password" label="Password" placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  error={errors.password} showPass={showPass} onToggle={() => setShowPass(v => !v)}
                  forgotLink={
                    <span className="text-xs text-sky-600 cursor-pointer font-medium">Forgot password?</span>
                  }
                />
              )}
            </form>

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="submit" form="login-form"
                className="btn btn-primary btn-w-full justify-center py-2.5 text-sm"
                disabled={loading}
              >
                {loading
                  ? (isSignup ? "Creating..." : "Signing in...")
                  : (isSignup ? "Create Account →" : "Log in →")
                }
              </button>

              <div className="divider-or">
                <div className="divider-line" />
                <span className="text-xs text-gray-400">or</span>
                <div className="divider-line" />
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-w-full justify-center py-2.5 text-sm"
                onClick={handleGoogle}
                disabled={loading}
              >
                Continue with Google
              </button>

              <p className="modal-footer-link">
                {isSignup ? "Already have an account? " : "New to EASY? "}
                <span
                  className="text-sky-600 font-semibold cursor-pointer"
                  onClick={() => { setMode(isSignup ? "login" : "signup"); setErrors({}); }}
                >
                  {isSignup ? "Log in" : "Create account"}
                </span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ── Field components ── */
function ModalField({ id, label, type, placeholder, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={`input input-sm${error ? " error" : ""}`}
        required
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}

function PasswordField({ id, label, placeholder, value, onChange, error, showPass, onToggle, forgotLink }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-medium text-gray-700">{label}</label>
        {forgotLink}
      </div>
      <div className="relative">
        <input
          id={id} type={showPass ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={onChange}
          className={`input input-sm pr-9${error ? " error" : ""}`}
          required
        />
        <button type="button" className="pass-toggle" onClick={onToggle}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPass
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            }
          </svg>
        </button>
      </div>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
