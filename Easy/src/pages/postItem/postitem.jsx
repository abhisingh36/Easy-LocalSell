import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";

const CATEGORIES = ["Electronics","Furniture","Clothing","Books","Vehicles","Sports","Kitchen"];
const CONDITIONS  = ["New","Like new","Good","Fair","For parts"];
const MAX_DESC    = 500;
const MAX_PHOTOS  = 6;
const STEPS       = ["Photos & Details","Review","Publish"];

export default function PostItem() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const editListing = locationState.state?.editListing || null;

  const { showToast, userLocation, isLoggedIn, triggerLoginModal, currentUser, addListing, updateListing, setShowLocationModal } = useApp();
  const fileInputRef = useRef(null);

  const [step,        setStep]      = useState(1);
  const [category,    setCategory]  = useState(editListing?.category || "");
  const [condition,   setCondition] = useState(editListing?.condition || "");
  const [title,       setTitle]     = useState(editListing?.title || "");
  const [price,       setPrice]     = useState(editListing?.price || "");
  const [location,    setLocation]  = useState(editListing?.location || userLocation?.name || "Hazratganj, Lucknow");
  const [description, setDesc]      = useState(editListing?.description || "");
  const [errors,      setErrors]    = useState({});
  const [posted,      setPosted]    = useState(false);
  const [publishing,  setPublishing] = useState(false);
  const [photos,      setPhotos]    = useState(editListing?.thumbs ? editListing.thumbs.map(url => ({ url, file: null, name: "existing" })) : []);
  const [dragOver,    setDragOver]  = useState(false);

  const [brand,         setBrand]         = useState(editListing?.brand || "");
  const [model,         setModel]         = useState(editListing?.model || "");
  const [age,           setAge]           = useState(editListing?.age || "");
  const [colour,        setColour]        = useState(editListing?.colour || "");
  const [originalPrice, setOriginalPrice] = useState(editListing?.originalPrice ? editListing.originalPrice.replace(/[^\d]/g, "") : "");
  const [warranty,      setWarranty]      = useState(editListing?.warranty || "");

  useEffect(() => {
    // BUG-13 FIX: Only auto-update location for NEW listings, not edits.
    // Previously this would overwrite the editListing's location whenever the user
    // changed the global location modal, even if they didn't intend to.
    if (userLocation?.name && !editListing) {
      setLocation(userLocation.name);
    }
  }, [userLocation?.name, editListing]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/home");
      triggerLoginModal("Please log in to sell items.");
    }
  }, [isLoggedIn, navigate, triggerLoginModal]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 600; // Smaller = faster uploads
          let width = img.width;
          let height = img.height;

          // Scale down proportionally
          if (width > height && width > MAX_SIZE) {
            height = Math.round(height * MAX_SIZE / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round(width * MAX_SIZE / height);
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          // Fill with white background to prevent transparent PNGs from turning black
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 50% quality (good balance of size vs quality)
          resolve(canvas.toDataURL("image/jpeg", 0.5));
        };
        img.onerror = () => {
          const fallbackReader = new FileReader();
          fallbackReader.onload = () => resolve(fallbackReader.result);
          fallbackReader.readAsDataURL(file);
        };
      };
      reader.onerror = () => resolve("");
    });
  };

  // BUG-08 FIX: Converted addFiles to useCallback with setPhotos functional update
  // to avoid stale closure over the `photos` state variable.
  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f =>
      ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 5*1024*1024
    );
    setPhotos(prev => {
      if (prev.length + valid.length > MAX_PHOTOS) showToast(`Maximum ${MAX_PHOTOS} photos allowed`,"warning");
      const toAdd = valid.slice(0, MAX_PHOTOS - prev.length);
      return [...prev, ...toAdd.map(f => ({ url: URL.createObjectURL(f), file: f, name: f.name }))];
    });
  }, [showToast]);

  function removePhoto(idx) {
    setPhotos(prev => {
      const photo = prev[idx];
      // BUG-05 FIX: Only revoke blob:// URLs (from newly uploaded files).
      // Calling revokeObjectURL on regular https:// URLs (from editListing) is harmless
      // but incorrect; using file !== null as a safe guard.
      if (photo.file !== null) URL.revokeObjectURL(photo.url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function moveMain(idx) {
    setPhotos(prev => { const n=[...prev]; const [x]=n.splice(idx,1); n.unshift(x); return n; });
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files);
    // BUG-08 FIX: `addFiles` is now a stable useCallback, so handleDrop deps are correct
  }, [addFiles]);

  function validate() {
    const e = {};
    if (!title.trim())                e.title       = "Item title is required";
    else if (title.length < 5)        e.title       = "Title must be at least 5 characters";
    if (!price || Number(price) <= 0) e.price       = "Enter a valid price";
    if (!description.trim())          e.description = "Description is required";
    else if (description.length < 20) e.description = "Description must be at least 20 characters";
    if (!category)                    e.category    = "Please select a category";
    if (!condition)                   e.condition   = "Please select a condition";
    return e;
  }

  function handleNext() {
    if (step === 1) { const e = validate(); if (Object.keys(e).length) { setErrors(e); return; } setErrors({}); }
    setStep(s => Math.min(s+1, 3));
  }

  async function handlePost() {
    if (publishing) return; // Prevent double-click
    setPublishing(true);

    try {
      // Compress ALL images in PARALLEL (much faster than sequential)
      const base64Images = await Promise.all(
        photos.map(p => p.file ? compressImage(p.file) : Promise.resolve(p.url || ""))
      );

      const payload = {
        title,
        description,
        price: Number(price),
        category,
        condition,
        location,
        images: base64Images.filter(Boolean),
        seller: currentUser?._id || currentUser?.id || "609cdeefabcdef1234567890",
        sellerName: currentUser?.name || "Rahul Kumar",
        sellerInitials: currentUser?.initials || "RK",
        sellerPhone: currentUser?.phone || "+91 98765 43210",
        brand: brand.trim(),
        model: model.trim(),
        age: age.trim(),
        colour: colour.trim(),
        originalPrice: originalPrice ? `₹${Number(originalPrice).toLocaleString("en-IN")}` : "",
        warranty: warranty.trim()
      };

      let success;
      if (editListing) {
        success = await updateListing(editListing.id, payload);
      } else {
        success = await addListing(payload);
      }
      if (success) {
        setPosted(true);
        showToast(editListing ? "Listing updated successfully!" : "Listing published successfully!", "success");
        setTimeout(() => navigate("/home"), 2000);
      }
    } catch (err) {
      console.error("Failed to post listing:", err);
      showToast("Failed to upload listing. Try again.", "danger");
    } finally {
      setPublishing(false);
    }
  }

  const mainPhoto  = photos[0]?.url || null;
  const priceLabel = price ? `₹${Number(price).toLocaleString("en-IN")}` : "₹—";

  if (posted) {
    return (
      <div className="min-h-screen" style={{background:"var(--bg)"}}>
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4" style={{minHeight:"calc(100vh - 58px)"}}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
          <p className="text-2xl font-bold text-gray-900">
            {editListing ? "Listing Updated!" : "Listing Published!"}
          </p>
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
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
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
                  <span className={`text-sm ${step === num ? "block" : "hidden md:block"} ${done ? "text-green-600 font-semibold" : active ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

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
                  <p className={`text-sm font-semibold ${dragOver ? "text-blue-600" : "text-gray-600"}`}>
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
                  {photos.length < MAX_PHOTOS && (
                    <div className="photo-slot" onClick={() => fileInputRef.current?.click()}>
                      <span className="text-2xl text-gray-300 leading-none">+</span>
                    </div>
                  )}
                </div>
                {photos.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{photos.length}/{MAX_PHOTOS} photos · Click a photo to set as main · ✕ to remove</p>
                )}
              </div>

              {/* Details card */}
              <div className="card p-5">
                <p className="text-base font-bold text-gray-900 mb-4">
                  {editListing ? "Edit Item Details" : "Item Details"}
                </p>

                {/* Title */}
                <div className="mb-4">
                  <label className="input-label" htmlFor="item-title">Item title *</label>
                  <input id="item-title" className={`input${errors.title ? " error" : ""}`}
                    placeholder="e.g. Sony WH-1000XM4 Wireless Headphones" value={title}
                    maxLength={100}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      <button id="detect-location" type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium bg-transparent border-0 cursor-pointer"
                        onClick={() => setShowLocationModal(true)}>
                        Detect
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label" htmlFor="item-brand">Brand</label>
                    <input id="item-brand" className="input"
                      placeholder="e.g. Sony, Apple, Penguin" value={brand}
                      onChange={e => setBrand(e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-model">Model</label>
                    <input id="item-model" className="input"
                      placeholder="e.g. WH-1000XM4, Hardcover" value={model}
                      onChange={e => setModel(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label" htmlFor="item-age">Age</label>
                    <input id="item-age" className="input"
                      placeholder="e.g. 5 months, 1 year" value={age}
                      onChange={e => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-colour">Colour</label>
                    <input id="item-colour" className="input"
                      placeholder="e.g. Black, White, Red" value={colour}
                      onChange={e => setColour(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="input-label" htmlFor="item-original-price">Original price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                      <input id="item-original-price" className="input pl-6"
                        type="number" min="0" placeholder="e.g. 499" value={originalPrice}
                        onChange={e => setOriginalPrice(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-warranty">Warranty</label>
                    <input id="item-warranty" className="input"
                      placeholder="e.g. 6 months remaining, N/A" value={warranty}
                      onChange={e => setWarranty(e.target.value)} />
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="input-label">Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" id={`cat-${cat}`} className={`sel-cat-btn${cat===category?" active":""}`}
                        onClick={() => { setCategory(cat); if (errors.category) setErrors(p => ({...p,category:""})); }}>{cat}</button>
                    ))}
                  </div>
                  {errors.category && <p className="input-error">{errors.category}</p>}
                </div>

                {/* Condition */}
                <div className="mb-4">
                  <label className="input-label">Condition *</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(cond => (
                      <button key={cond} type="button" id={`cond-${cond}`} className={`sel-cond-btn${cond===condition?" active":""}`}
                        onClick={() => { setCondition(cond); if (errors.condition) setErrors(p => ({...p,condition:""})); }}>{cond}</button>
                    ))}
                  </div>
                  {errors.condition && <p className="input-error">{errors.condition}</p>}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="card p-6">
              <p className="text-base font-bold text-gray-900 mb-6">
                {editListing ? "Review your changes" : "Review your listing"}
              </p>
              
              <div className="flex flex-col md:flex-row gap-5 md:items-start">
                <div className="w-[128px] h-[128px] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 shadow-sm relative group">
                  {mainPhoto ? (
                    <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" fill="none" stroke="var(--gray-300)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-blue-600 tracking-tight leading-none mb-2">{priceLabel}</p>
                  <p className="text-xl font-bold text-gray-900 tracking-tight mb-3 truncate" title={title}>{title}</p>
                  <div className="flex gap-2.5 flex-wrap">
                    {category && <span className="badge badge-blue px-3 py-1.5 text-sm font-semibold">{category}</span>}
                    {condition && <span className="badge badge-amber px-3 py-1.5 text-sm font-semibold">{condition}</span>}
                    {location && (
                      <span className="badge badge-gray px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {location.split(",")[0]}
                      </span>
                    )}
                  </div>
                  {photos.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      {photos.length} photo{photos.length > 1 ? "s" : ""} uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Additional specs in Review */}
              {(brand || model || age || originalPrice || colour || warranty) && (
                <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Specifications</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                    {brand && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Brand</span>
                        <span className="font-semibold text-gray-900">{brand}</span>
                      </div>
                    )}
                    {model && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Model</span>
                        <span className="font-semibold text-gray-900">{model}</span>
                      </div>
                    )}
                    {age && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Age / Usage</span>
                        <span className="font-semibold text-gray-900">{age}</span>
                      </div>
                    )}
                    {colour && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Colour</span>
                        <span className="font-semibold text-gray-900">{colour}</span>
                      </div>
                    )}
                    {originalPrice && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Original Purchase Price</span>
                        <span className="font-semibold text-gray-900">₹{Number(originalPrice).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {warranty && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Warranty Status</span>
                        <span className="font-semibold text-gray-900">{warranty}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {description && (
                <div className="mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Description</p>
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words font-medium overflow-hidden" style={{ wordBreak: 'break-word' }}>
                    {description}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex gap-3 items-center">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-850 dark:text-blue-200 leading-snug">
                  <span className="font-bold text-blue-900 dark:text-blue-100">Location Visibility</span>: Your listing will be visible to potential buyers within <span className="font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">20 km</span> of your location.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Publish */}
          {step === 3 && (
            <div className="card p-12 text-center">
              <p className="text-xl font-bold text-gray-900 mb-2">
                {editListing ? "Ready to update!" : "Ready to go live!"}
              </p>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                {editListing 
                  ? "Your changes will be saved and visible to buyers immediately." 
                  : "Your listing will go live immediately and be visible to buyers in your area."}
              </p>
              <button id="publish-btn" className="btn btn-primary btn-lg rounded-xl" onClick={handlePost} disabled={publishing}>
                {publishing ? "Publishing..." : editListing ? "Save changes →" : "Publish listing →"}
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
              &larr; Back
            </button>
            {step < 3 && (
              <button id="next-btn" className="btn btn-primary" onClick={handleNext}>
                {step === 2 ? "Looks good →" : "Next →"}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:block w-[400px] shrink-0" style={{position:"sticky",top:"90px", height: "fit-content"}}>
          <div className="card p-4">
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
              {category && <span className="badge badge-blue">{category}</span>}
              {condition && <span className="badge badge-amber">{condition}</span>}
              {location && <span className="badge badge-gray">{location.split(",")[0]}</span>}
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tips for a quick sale</p>
              {["Use natural lighting for photos","Price 10–20% below market","Listings under 24 hrs get 3× views"].map((tip,i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <span className="text-blue-600 shrink-0 font-bold">·</span>
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
