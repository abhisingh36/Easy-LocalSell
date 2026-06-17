import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";

const CATEGORIES = ["Electronics","Furniture","Clothing","Books","Vehicles","Sports","Kitchen"];
const CONDITIONS  = ["New","Like new","Good","Fair","For parts"];
const MAX_DESC    = 500;
const MAX_PHOTOS  = 6;
const STEPS       = ["Photos & Details","Review","Publish"];

export default function PostItem() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const fileInputRef = useRef(null);

  const [step,        setStep]      = useState(1);
  const [category,    setCategory]  = useState("Electronics");
  const [condition,   setCondition] = useState("Like new");
  const [title,       setTitle]     = useState("");
  const [price,       setPrice]     = useState("");
  const [location,    setLocation]  = useState("Hazratganj, Lucknow");
  const [description, setDesc]      = useState("");
  const [errors,      setErrors]    = useState({});
  const [posted,      setPosted]    = useState(false);
  const [photos,      setPhotos]    = useState([]);
  const [dragOver,    setDragOver]  = useState(false);

  function addFiles(files) {
    const valid = Array.from(files).filter(f =>
      ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 5*1024*1024
    );
    if (photos.length + valid.length > MAX_PHOTOS) showToast(`Maximum ${MAX_PHOTOS} photos allowed`,"warning");
    const toAdd = valid.slice(0, MAX_PHOTOS - photos.length);
    setPhotos(prev => [...prev, ...toAdd.map(f => ({ url: URL.createObjectURL(f), file: f, name: f.name }))]);
  }

  function removePhoto(idx) {
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_,i) => i !== idx); });
  }

  function moveMain(idx) {
    setPhotos(prev => { const n=[...prev]; const [x]=n.splice(idx,1); n.unshift(x); return n; });
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files);
  }, [photos]);

  function validate() {
    const e = {};
    if (!title.trim())                e.title       = "Item title is required";
    else if (title.length < 5)        e.title       = "Title must be at least 5 characters";
    if (!price || Number(price) <= 0) e.price       = "Enter a valid price";
    if (!description.trim())          e.description = "Description is required";
    else if (description.length < 20) e.description = "Description must be at least 20 characters";
    return e;
  }

  function handleNext() {
    if (step === 1) { const e = validate(); if (Object.keys(e).length) { setErrors(e); return; } setErrors({}); }
    setStep(s => Math.min(s+1, 3));
  }

  function handlePost() {
    setPosted(true);
    showToast("Listing published successfully!", "success");
    setTimeout(() => navigate("/home"), 2000);
  }

  const mainPhoto  = photos[0]?.url || null;
  const priceLabel = price ? `₹${Number(price).toLocaleString("en-IN")}` : "₹—";

  if (posted) {
    return (
      <div className="min-h-screen" style={{background:"var(--bg)"}}>
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4" style={{minHeight:"calc(100vh - 58px)"}}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
          <p className="text-2xl font-bold text-gray-900">Listing Published!</p>
          <p className="text-sm text-gray-500">Taking you to the home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen" style={{background:"var(--bg)"}}>
      <Navbar />

      {/* Step bar */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1300px] mx-auto px-8 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const num    = i + 1;
            const done   = step > num;
            const active = step >= num;
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={done ? "step-circle-done" : active ? "step-circle-active" : "step-circle-idle"}>
                    {done ? "✓" : num}
                  </div>
                  <span className={`text-sm ${done ? "text-green-600 font-semibold" : active ? "text-sky-600 font-semibold" : "text-gray-400"}`}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={done ? "step-line-done" : "step-line-idle"} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body: two columns */}
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex gap-10 items-start">

        {/* Left: main content */}
        <div className="flex-1 min-w-0">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Photos card */}
              <div className="card p-5 mb-4">
                <p className="text-base font-bold text-gray-900 mb-3.5">Photos</p>
                <input ref={fileInputRef} type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                  onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />

                <div id="dropzone" className={`dropzone${dragOver ? " drag-over" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}>
                  <p className={`text-sm font-semibold ${dragOver ? "text-sky-600" : "text-gray-600"}`}>
                    {dragOver ? "Drop photos here!" : "Drag photos here or click to upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Up to {MAX_PHOTOS} photos · JPG, PNG, WebP · Max 5MB each</p>
                </div>

                {/* Thumbnail row */}
                <div className="flex gap-2.5 mt-3.5 flex-wrap">
                  {photos.map((photo, i) => (
                    <div key={i} className="photo-thumb-wrap">
                      <div className={`photo-thumb-box ${i === 0 ? "is-main" : "not-main"}`}
                        onClick={() => i !== 0 && moveMain(i)}
                        title={i !== 0 ? "Click to set as main" : "Main photo"}>
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <span className="photo-main-label">MAIN</span>}
                      </div>
                      <button className="photo-remove-btn" onClick={() => removePhoto(i)}>×</button>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length) }).map((_,i) => (
                    <div key={`e-${i}`} className="photo-slot" onClick={() => fileInputRef.current?.click()}>
                      <span className="text-2xl text-gray-300 leading-none">+</span>
                    </div>
                  ))}
                </div>
                {photos.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{photos.length}/{MAX_PHOTOS} photos · Click a photo to set as main · ✕ to remove</p>
                )}
              </div>

              {/* Details card */}
              <div className="card p-5">
                <p className="text-base font-bold text-gray-900 mb-4">Item Details</p>

                {/* Title */}
                <div className="mb-4">
                  <label className="input-label" htmlFor="item-title">Item title *</label>
                  <input id="item-title" className={`input${errors.title ? " error" : ""}`}
                    placeholder="e.g. Sony WH-1000XM4 Wireless Headphones" value={title}
                    onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(p => ({...p,title:""})); }} />
                  {errors.title && <p className="input-error">{errors.title}</p>}
                  <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="input-label" htmlFor="item-desc">Description *</label>
                  <textarea id="item-desc" className={`input${errors.description ? " error" : ""}`}
                    placeholder="Describe your item — brand, age, reason for selling..." rows={4}
                    maxLength={MAX_DESC} value={description}
                    style={{resize:"none", lineHeight:1.6}}
                    onChange={e => { setDesc(e.target.value); if (errors.description) setErrors(p => ({...p,description:""})); }} />
                  {errors.description && <p className="input-error">{errors.description}</p>}
                  <p className={`text-xs mt-1 ${description.length > MAX_DESC*0.9 ? "text-amber-600" : "text-gray-400"}`}>
                    {description.length}/{MAX_DESC} characters
                  </p>
                </div>

                {/* Price & Location */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label" htmlFor="item-price">Price (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                      <input id="item-price" className={`input pl-6${errors.price ? " error" : ""}`}
                        type="number" min="0" placeholder="0" value={price}
                        onChange={e => { setPrice(e.target.value); if (errors.price) setErrors(p => ({...p,price:""})); }} />
                    </div>
                    {errors.price && <p className="input-error">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-location">Location</label>
                    <div className="relative">
                      <input id="item-location" className="input pr-16" value={location}
                        onChange={e => setLocation(e.target.value)} />
                      <button id="detect-location"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-600 font-medium bg-transparent border-0 cursor-pointer"
                        onClick={() => { setLocation("Hazratganj, Lucknow"); showToast("Location detected!","success"); }}>
                        Detect
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="input-label">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} id={`cat-${cat}`} className={`sel-cat-btn${cat===category?" active":""}`}
                        onClick={() => setCategory(cat)}>{cat}</button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="input-label">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(cond => (
                      <button key={cond} id={`cond-${cond}`} className={`sel-cond-btn${cond===condition?" active":""}`}
                        onClick={() => setCondition(cond)}>{cond}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="card p-6">
              <p className="text-base font-bold text-gray-900 mb-4">Review your listing</p>
              <div className="flex gap-4 mb-4">
                <div className="w-[120px] h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {mainPhoto
                    ? <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <svg width="28" height="28" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                  }
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-sky-600 mb-1.5">{priceLabel}</p>
                  <p className="text-lg font-semibold text-gray-900 mb-2.5">{title}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="badge badge-blue">{category}</span>
                    <span className="badge badge-amber">{condition}</span>
                    <span className="badge badge-gray">{location.split(",")[0]}</span>
                  </div>
                  {photos.length > 0 && <p className="text-xs text-gray-400 mt-2">{photos.length} photo{photos.length>1?"s":""} uploaded</p>}
                </div>
              </div>
              {description && (
                <div className="p-3.5 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1.5">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
              )}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                Your listing will be visible to buyers within 5 km of your location.
              </div>
            </div>
          )}

          {/* STEP 3: Publish */}
          {step === 3 && (
            <div className="card p-12 text-center">
              <p className="text-xl font-bold text-gray-900 mb-2">Ready to go live!</p>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Your listing will go live immediately and be visible to buyers in your area.
              </p>
              <button id="publish-btn" className="btn btn-primary btn-lg rounded-xl" onClick={handlePost}>
                Publish listing →
              </button>
              <div className="mt-3">
                <button className="text-sm text-gray-400 bg-transparent border-0 cursor-pointer"
                  onClick={() => navigate("/home")}>Save as draft instead</button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-5">
            <button id="back-btn" className="btn btn-secondary"
              onClick={() => setStep(s => Math.max(s-1, 1))}
              disabled={step === 1}
              style={step === 1 ? {opacity:0.4,cursor:"not-allowed"} : {}}>
              ← Back
            </button>
            {step < 3 && (
              <button id="next-btn" className="btn btn-primary" onClick={handleNext}>
                {step === 2 ? "Looks good →" : "Next →"}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-[400px] shrink-0">
          <div className="card p-4" style={{position:"sticky",top:"70px"}}>
            <p className="section-title mb-3">Live preview</p>
            <div className="h-[250px] bg-gray-100 rounded-lg overflow-hidden mb-2.5 flex items-center justify-center">
              {mainPhoto
                ? <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                : <p className="text-xs text-gray-300 font-medium">Please upload images</p>
              }
            </div>
            <p className="text-xl font-bold text-gray-900 mb-0.5">{priceLabel}</p>
            <p className="text-sm text-gray-500 mb-2.5 truncate">{title || "Your item title"}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="badge badge-blue">{category}</span>
              <span className="badge badge-amber">{condition}</span>
              {location && <span className="badge badge-gray">{location.split(",")[0]}</span>}
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tips for a quick sale</p>
              {["Use natural lighting for photos","Price 10–20% below market","Listings under 24 hrs get 3× views"].map((tip,i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <span className="text-sky-600 shrink-0 font-bold">·</span>
                  <p className="text-xs text-gray-500 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}