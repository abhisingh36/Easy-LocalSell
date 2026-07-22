import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { changePasswordAPI } from "../../services/api";

const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

function FieldInput({ label, id, type = "text", value, onChange, placeholder, rightElement }) {
  return (
    <div className="edit-profile-field">
      <label htmlFor={id} className="edit-profile-label">{label}</label>
      <div className="edit-profile-input-wrap">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="edit-profile-input"
          autoComplete="off"
        />
        {rightElement && (
          <div className="edit-profile-input-right">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onSave }) {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Password fields
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setLocation(currentUser.location || "");
      setProfileImage(currentUser.profileImage || "");
      setActiveTab("profile");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "danger");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ name, location, profileImage });
    setIsSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");

    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }

    setIsChangingPwd(true);
    try {
      const userId = currentUser?._id || currentUser?.id;
      await changePasswordAPI(userId, currentPwd, newPwd);
      showToast("Password changed successfully!", "success");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      onClose();
    } catch (err) {
      setPwdError(err.data?.message || err.message || "Something went wrong. Try again.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const pwdStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (s <= 1) return { strength: s, label: "Weak", color: "#ef4444" };
    if (s <= 3) return { strength: s, label: "Fair", color: "#f59e0b" };
    return { strength: s, label: "Strong", color: "#22c55e" };
  };

  const strength = pwdStrength(newPwd);
  const initials = currentUser?.initials || currentUser?.name?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="edit-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-modal-container">
        
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-header-left">
            <div className="edit-modal-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="edit-modal-title">Account Settings</h2>
              <p className="edit-modal-subtitle">Manage your profile and security</p>
            </div>
          </div>
          <button className="edit-modal-close" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="edit-modal-tabs">
          <button
            className={`edit-modal-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Info
          </button>
          <button
            className={`edit-modal-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security
          </button>
        </div>

        {/* Body */}
        <div className="edit-modal-body">

          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="edit-modal-form">
              
              {/* Avatar Section */}
              <div className="edit-avatar-section">
                <div className="edit-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
                  <div className="edit-avatar">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="edit-avatar-initials">{initials}</span>
                    )}
                    <div className="edit-avatar-overlay">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <p className="edit-avatar-hint">Click to change · Max 5MB</p>
                {profileImage && (
                  <button type="button" className="edit-avatar-remove" onClick={() => setProfileImage("")}>
                    Remove photo
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="edit-fields-stack">
                <FieldInput
                  label="Full Name"
                  id="edit-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
                <FieldInput
                  label="Location"
                  id="edit-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, State"
                />
              </div>

              <div className="edit-modal-footer">
                <button type="button" className="edit-btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="edit-btn-save" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="edit-modal-form">
              <div className="edit-security-banner">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Choose a strong password with a mix of letters, numbers, and symbols.</p>
              </div>

              <div className="edit-fields-stack">
                <div className="edit-profile-field">
                  <label htmlFor="cur-pwd" className="edit-profile-label">Current Password</label>
                  <div className="edit-profile-input-wrap">
                    <input
                      id="cur-pwd"
                      type={showCurrentPwd ? "text" : "password"}
                      value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="edit-profile-input"
                      required
                    />
                    <button type="button" className="edit-profile-input-right" onClick={() => setShowCurrentPwd(p => !p)}>
                      <EyeIcon open={showCurrentPwd} />
                    </button>
                  </div>
                </div>

                <div className="edit-profile-field">
                  <label htmlFor="new-pwd" className="edit-profile-label">New Password</label>
                  <div className="edit-profile-input-wrap">
                    <input
                      id="new-pwd"
                      type={showNewPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      placeholder="Enter new password"
                      className="edit-profile-input"
                      required
                    />
                    <button type="button" className="edit-profile-input-right" onClick={() => setShowNewPwd(p => !p)}>
                      <EyeIcon open={showNewPwd} />
                    </button>
                  </div>
                  {newPwd && (
                    <div className="pwd-strength-bar">
                      <div className="pwd-strength-segments">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className="pwd-strength-seg"
                            style={{ background: i <= strength.strength ? strength.color : "var(--gray-200)" }}
                          />
                        ))}
                      </div>
                      <span className="pwd-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="edit-profile-field">
                  <label htmlFor="confirm-pwd" className="edit-profile-label">Confirm New Password</label>
                  <div className="edit-profile-input-wrap">
                    <input
                      id="confirm-pwd"
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="Confirm new password"
                      className="edit-profile-input"
                      required
                    />
                    <button type="button" className="edit-profile-input-right" onClick={() => setShowConfirmPwd(p => !p)}>
                      <EyeIcon open={showConfirmPwd} />
                    </button>
                  </div>
                  {confirmPwd && newPwd && (
                    <div className="pwd-match-indicator">
                      {newPwd === confirmPwd ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span style={{ color: "#22c55e" }}>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          <span style={{ color: "#f87171" }}>Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {pwdError && (
                <div className="pwd-error-box">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {pwdError}
                </div>
              )}

              <div className="edit-modal-footer">
                <button type="button" className="edit-btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="edit-btn-save edit-btn-danger" disabled={isChangingPwd}>
                  {isChangingPwd ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Changing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
