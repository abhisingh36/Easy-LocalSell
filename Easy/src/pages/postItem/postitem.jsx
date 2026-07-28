import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp } from "../../context/AppContext";

const CATEGORIES = ["Electronics","Furniture","Clothing","Books","Vehicles","Sports","Kitchen"];
const CONDITIONS  = ["New","Like new","Good","Fair","For parts"];
const MAX_DESC    = 500;
const MAX_PHOTOS  = 6;
const STEPS       = ["Photos & Details","Review","Publish"];

// Helper to render an input field cleanly
const Field = ({ id, label, placeholder, value, setter }) => (
  <div>
    <label className="input-label" htmlFor={id}>{label}</label>
    <input id={id} className="input" placeholder={placeholder} value={value} onChange={e => setter(e.target.value)} />
  </div>
);

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

  // New Dynamic Fields
  const [storage,       setStorage]       = useState(editListing?.storage || "");
  const [ram,           setRam]           = useState(editListing?.ram || "");
  const [os,            setOs]            = useState(editListing?.os || "");
  const [mileage,       setMileage]       = useState(editListing?.mileage || "");
  const [fuelType,      setFuelType]      = useState(editListing?.fuelType || "");
  const [transmission,  setTransmission]  = useState(editListing?.transmission || "");
  const [owners,        setOwners]        = useState(editListing?.owners || "");
  const [size,          setSize]          = useState(editListing?.size || "");
  const [material,      setMaterial]      = useState(editListing?.material || "");
  const [gender,        setGender]        = useState(editListing?.gender || "");
  const [dimensions,    setDimensions]    = useState(editListing?.dimensions || "");
  const [author,        setAuthor]        = useState(editListing?.author || "");
  const [language,      setLanguage]      = useState(editListing?.language || "");
  const [genre,         setGenre]         = useState(editListing?.genre || "");
  const [sportType,     setSportType]     = useState(editListing?.sportType || "");
  const [power,         setPower]         = useState(editListing?.power || "");

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
        warranty: warranty.trim(),
        storage: storage.trim(),
        ram: ram.trim(),
        os: os.trim(),
        mileage: mileage.trim(),
        fuelType: fuelType.trim(),
        transmission: transmission.trim(),
        owners: owners.trim(),
        size: size.trim(),
        material: material.trim(),
        gender: gender.trim(),
        dimensions: dimensions.trim(),
        author: author.trim(),
        language: language.trim(),
        genre: genre.trim(),
        sportType: sportType.trim(),
        power: power.trim()
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
                <p className="text-base font-bold text-gray-900 dark:text-white mb-4">
                  {editListing ? "Edit Item Details" : "Item Details"}
                </p>

                {/* Category (Moved to top) */}
                <div className={`mb-6 ${category ? 'border-b border-gray-100 dark:border-gray-800 pb-6' : ''}`}>
                  <label className="input-label">Category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CATEGORIES.map(cat => {
                      const icons = {
                        "Electronics": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
                        "Furniture": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 13h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z"/><path d="M4 17v4"/><path d="M20 17v4"/><path d="M4 13V9h16v4"/></svg>,
                        "Clothing": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a8.5 8.5 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>,
                        "Books": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
                        "Vehicles": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>,
                        "Sports": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 12h.01"/><path d="M11.99 12 11 16"/><path d="M11 16 8 19"/><path d="M11 16 14 19"/><path d="M11.99 12 14.5 9.5"/><path d="M14.5 9.5 14 5"/><path d="M14.5 9.5 19 10"/></svg>,
                        "Kitchen": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/></svg>
                      };
                      return (
                        <button key={cat} type="button" id={`cat-${cat}`} 
                          className={`flex items-center justify-center px-3 py-1.5 gap-1.5 transition-all rounded-lg border font-medium 
                            ${cat===category 
                              ? "border-blue-600 bg-blue-50 text-blue-600" 
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                          onClick={() => { setCategory(cat); if (errors.category) setErrors(p => ({...p,category:""})); }}>
                          <span className={`flex items-center justify-center ${cat===category ? "text-blue-600" : "text-gray-500"}`}>
                            {icons[cat] || <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/></svg>}
                          </span>
                          <span className="text-[13px]">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && <p className="input-error">{errors.category}</p>}
                </div>

                {category ? (
                  <div className="animate-fade-in">
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
                          <input id="item-price" className={`input ${errors.price ? "error" : ""}`} style={{ paddingLeft: '30px' }}
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

                    {/* Dynamic Additional Details */}
                    {(() => {
                      const isElectronics = category === "Electronics";
                      const isVehicles = category === "Vehicles";
                      const isClothing = category === "Clothing";
                      const isFurniture = category === "Furniture";
                      const isBooks = category === "Books";
                      const isSports = category === "Sports";
                      const isKitchen = category === "Kitchen";

                      const showBrand = isElectronics || isFurniture || isClothing || isVehicles || isSports || isKitchen;
                      const showModel = isElectronics || isVehicles;
                      const showAge = isElectronics || isFurniture || isVehicles || isBooks || isSports || isKitchen;
                      const showColour = isElectronics || isFurniture || isClothing || isVehicles;
                      const showWarranty = isElectronics || isKitchen;

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {showBrand && <Field id="item-brand" label={isVehicles ? "Make / Brand" : "Brand"} placeholder="e.g. Sony, Apple, Honda" value={brand} setter={setBrand} />}
                            {showModel && <Field id="item-model" label="Model" placeholder="e.g. WH-1000XM4, Civic" value={model} setter={setModel} />}
                            {showAge && <Field id="item-age" label="Age" placeholder="e.g. 5 months, 1 year" value={age} setter={setAge} />}
                            {showColour && <Field id="item-colour" label="Colour" placeholder="e.g. Black, White, Red" value={colour} setter={setColour} />}
                            
                            {isElectronics && (
                              <>
                                <Field id="item-storage" label="Storage" placeholder="e.g. 128GB, 256GB" value={storage} setter={setStorage} />
                                <Field id="item-ram" label="RAM" placeholder="e.g. 4GB, 8GB" value={ram} setter={setRam} />
                                <Field id="item-os" label="Operating System" placeholder="e.g. iOS, Android, Windows" value={os} setter={setOs} />
                              </>
                            )}
                            
                            {isVehicles && (
                              <>
                                <Field id="item-mileage" label="KMs Driven (Mileage)" placeholder="e.g. 15,000 km" value={mileage} setter={setMileage} />
                                <Field id="item-fuel" label="Fuel Type" placeholder="e.g. Petrol, Diesel, EV" value={fuelType} setter={setFuelType} />
                                <Field id="item-trans" label="Transmission" placeholder="e.g. Manual, Automatic" value={transmission} setter={setTransmission} />
                                <Field id="item-owners" label="No. of Owners" placeholder="e.g. 1st, 2nd" value={owners} setter={setOwners} />
                              </>
                            )}
                            
                            {isClothing && (
                              <>
                                <Field id="item-size" label="Size" placeholder="e.g. S, M, L, XL, 42" value={size} setter={setSize} />
                                <Field id="item-material" label="Material" placeholder="e.g. Cotton, Denim" value={material} setter={setMaterial} />
                                <Field id="item-gender" label="Gender" placeholder="e.g. Men, Women, Unisex" value={gender} setter={setGender} />
                              </>
                            )}
                            
                            {isFurniture && (
                              <>
                                <Field id="item-material" label="Material" placeholder="e.g. Wood, Metal, Glass" value={material} setter={setMaterial} />
                                <Field id="item-dimensions" label="Dimensions (L x W x H)" placeholder="e.g. 120 x 60 x 75 cm" value={dimensions} setter={setDimensions} />
                              </>
                            )}
                            
                            {isBooks && (
                              <>
                                <Field id="item-author" label="Author" placeholder="e.g. J.K. Rowling" value={author} setter={setAuthor} />
                                <Field id="item-language" label="Language" placeholder="e.g. English, Hindi" value={language} setter={setLanguage} />
                                <Field id="item-genre" label="Genre" placeholder="e.g. Fiction, Educational" value={genre} setter={setGenre} />
                              </>
                            )}
                            
                            {isSports && (
                              <Field id="item-sport" label="Sport Type" placeholder="e.g. Cricket, Football, Gym" value={sportType} setter={setSportType} />
                            )}
                            
                            {isKitchen && (
                              <Field id="item-power" label="Power (W)" placeholder="e.g. 500W, 1000W" value={power} setter={setPower} />
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="input-label" htmlFor="item-original-price">Original price (₹)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                                <input id="item-original-price" className="input" style={{ paddingLeft: '30px' }}
                                  type="number" min="0" placeholder="e.g. 499" value={originalPrice}
                                  onChange={e => setOriginalPrice(e.target.value)} />
                              </div>
                            </div>
                            {showWarranty && (
                              <Field id="item-warranty" label="Warranty" placeholder="e.g. 6 months remaining, N/A" value={warranty} setter={setWarranty} />
                            )}
                          </div>
                        </>
                      );
                    })()}

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
                ) : (
                  <div className="py-8 px-4 text-center bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p className="text-gray-500 font-medium">Please select a category above to fill out item details.</p>
                  </div>
                )}
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
              {(brand || model || age || originalPrice || colour || warranty ||
                storage || ram || os || mileage || fuelType || transmission || owners ||
                size || material || gender || dimensions ||
                author || language || genre || sportType || power) && (
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
                    {/* Electronics */}
                    {storage && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Storage</span>
                        <span className="font-semibold text-gray-900">{storage}</span>
                      </div>
                    )}
                    {ram && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">RAM</span>
                        <span className="font-semibold text-gray-900">{ram}</span>
                      </div>
                    )}
                    {os && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Operating System</span>
                        <span className="font-semibold text-gray-900">{os}</span>
                      </div>
                    )}
                    {/* Vehicles */}
                    {mileage && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Mileage</span>
                        <span className="font-semibold text-gray-900">{mileage}</span>
                      </div>
                    )}
                    {fuelType && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Fuel Type</span>
                        <span className="font-semibold text-gray-900">{fuelType}</span>
                      </div>
                    )}
                    {transmission && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Transmission</span>
                        <span className="font-semibold text-gray-900">{transmission}</span>
                      </div>
                    )}
                    {owners && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">No. of Owners</span>
                        <span className="font-semibold text-gray-900">{owners}</span>
                      </div>
                    )}
                    {/* Clothing */}
                    {size && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Size</span>
                        <span className="font-semibold text-gray-900">{size}</span>
                      </div>
                    )}
                    {material && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Material</span>
                        <span className="font-semibold text-gray-900">{material}</span>
                      </div>
                    )}
                    {gender && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Gender</span>
                        <span className="font-semibold text-gray-900">{gender}</span>
                      </div>
                    )}
                    {/* Furniture */}
                    {dimensions && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Dimensions</span>
                        <span className="font-semibold text-gray-900">{dimensions}</span>
                      </div>
                    )}
                    {/* Books */}
                    {author && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Author</span>
                        <span className="font-semibold text-gray-900">{author}</span>
                      </div>
                    )}
                    {language && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Language</span>
                        <span className="font-semibold text-gray-900">{language}</span>
                      </div>
                    )}
                    {genre && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Genre</span>
                        <span className="font-semibold text-gray-900">{genre}</span>
                      </div>
                    )}
                    {/* Sports */}
                    {sportType && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Sport Type</span>
                        <span className="font-semibold text-gray-900">{sportType}</span>
                      </div>
                    )}
                    {/* Kitchen / Appliances */}
                    {power && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Power</span>
                        <span className="font-semibold text-gray-900">{power}</span>
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
