import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp, ALL_LISTINGS, PRODUCTS_DETAIL } from "../../context/AppContext";

function condBadge(cond) {
  if (cond === "Like new") return "badge-blue";
  if (cond === "Good")     return "badge-amber";
  return "badge-gray";
}

function Stars({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" fill={s <= 4 ? "#f59e0b" : "#fde68a"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function Listing() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { wishlist, toggleWishlist, startChat, showToast } = useApp();

  const productId = parseInt(searchParams.get("id")) || 1;
  const base      = ALL_LISTINGS.find(x => x.id === productId) || ALL_LISTINGS[0];
  const detail    = PRODUCTS_DETAIL[base.id] || PRODUCTS_DETAIL[1];
  const p         = { ...base, ...detail };

  const [activeThumb, setActiveThumb] = useState(0);
  const [showPhone,   setShowPhone]   = useState(false);
  const [reported,    setReported]    = useState(false);

  const thumbs    = [p.img, p.thumb2, p.thumb3].filter(Boolean);
  const totalThumbs = thumbs.length;
  const activeImg = thumbs[activeThumb] || p.img;
  const isWished  = wishlist.includes(p.id);
  const related   = ALL_LISTINGS.filter(l => l.category === p.category && l.id !== p.id).slice(0, 4);

  function handleMessageSeller() {
    const convId = startChat(base);
    navigate(`/messages?conv=${convId}`);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast("Link copied to clipboard!","success"));
  }

  function handleReport() {
    setReported(true);
    showToast("Listing reported. We'll review it shortly.","warning");
  }

  return (
    <div className="page-enter min-h-screen" style={{background:"var(--bg)"}}>
      <Navbar />

      {/* Page body */}
      <div className="max-w-[1440px] mx-auto px-4 py-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <span onClick={() => navigate("/home")} className="cursor-pointer text-sky-600 font-medium">Browse</span>
          <span className="text-gray-300">›</span>
          <span onClick={() => navigate("/home")} className="cursor-pointer">{p.category}</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900 font-semibold">{p.title.split("—")[0].trim()}</span>
        </div>

        {/* Main two-column layout */}
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* Main image */}
            <div className="rounded-xl overflow-hidden mb-2.5 relative" style={{height:360, background:"#111"}}>

              {/* Blurred background — fills side gaps */}
              <img
                src={activeImg}
                aria-hidden="true"
                style={{
                  position:"absolute", inset:0, width:"100%", height:"100%",
                  objectFit:"cover", filter:"blur(22px)", transform:"scale(1.08)",
                  opacity:0.75,
                }}
              />

              {/* Actual image — full, uncropped */}
              <img
                src={activeImg}
                alt={p.title}
                style={{
                  position:"relative", width:"100%", height:"100%",
                  objectFit:"contain", display:"block", zIndex:1,
                }}
              />

              {activeThumb > 0 && (
                <button className="listing-nav-btn left-2.5" onClick={() => setActiveThumb(t => t-1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              {activeThumb < totalThumbs - 1 && (
                <button className="listing-nav-btn right-2.5" onClick={() => setActiveThumb(t => t+1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              )}

              <div className="absolute top-2.5 right-2.5 flex gap-1.5" style={{zIndex:2}}>
                <button className="listing-action-btn" onClick={handleShare} title="Share">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                </button>
                <button className="listing-action-btn" onClick={handleReport} disabled={reported}
                  style={reported ? {background:"rgba(220,252,231,0.90)"} : {}}>
                  <svg width="14" height="14" fill="none" stroke={reported ? "#16a34a" : "currentColor"} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H11.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mb-5">
              {thumbs.map((img, i) => (
                <button key={i} id={`thumb-${i}`} onClick={() => img && setActiveThumb(i)}
                  className={`flex-1 h-[72px] rounded-lg overflow-hidden flex items-center justify-center p-0 transition-colors border-[1.5px] ${i===activeThumb ? "border-sky-600 bg-sky-50" : "border-gray-200 bg-gray-50"} ${img ? "cursor-pointer" : "cursor-default"}`}>
                  {img
                    ? <img src={img} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-gray-300 text-xl">+</span>
                  }
                </button>
              ))}
            </div>

            {/* Price & Title */}
            <div className="mb-3.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-3xl font-extrabold text-gray-900">{p.priceLabel}</span>
                <span className="text-sm text-gray-400 line-through">{p.originalPrice}</span>
                <span className={`badge ${condBadge(p.condition)}`}>{p.condition}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2.5 leading-snug">{p.title}</h1>
              <div className="flex gap-1.5 flex-wrap">
                {[p.category, p.location, p.distLabel, p.listedAgo].map(tag => (
                  <span key={tag} className="badge badge-gray text-xs">{tag}</span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card px-4 py-3.5 mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
            </div>

            {/* Details table */}
            <div className="card px-4 py-4 mb-6">
              <p className="text-sm font-bold text-gray-700 mb-3.5">Item details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                {[["Brand",p.brand],["Model",p.model],["Age",p.age],["Original price",p.originalPrice],["Colour",p.colour],["Warranty",p.warranty]].map(([label,value]) => (
                  <div key={label} className="detail-cell">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: Seller Card + Related ── */}
          <div className="w-[400px] shrink-0" style={{position:"sticky", top:"70px", alignSelf:"start"}}>
            <div className="card p-5 mb-4">

              {/* Seller */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sm font-bold text-sky-600 shrink-0">
                    {p.sellerInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.seller}</p>
                    <p className="text-xs text-gray-400">Member since Jan 2024</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/profile")}>View</button>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                <Stars count={4}/>
                <span className="text-sm font-semibold text-gray-900 ml-1">4.8</span>
                <span className="text-xs text-gray-400">· 23 reviews</span>
              </div>

              {/* Stats */}
              <div className="seller-stats-grid">
                {[["18","sold"],["5","active"],["98%","response"]].map(([val,label]) => (
                  <div key={label}>
                    <p className={`text-lg font-bold ${label==="response" ? "text-sky-600" : "text-gray-900"}`}>{val}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                <button id="message-seller-btn" className="btn btn-primary btn-w-full rounded-lg justify-center" onClick={handleMessageSeller}>
                  Message seller
                </button>
                <button id="call-seller-btn"
                  className={`btn btn-secondary btn-w-full rounded-lg justify-center${showPhone ? " border-sky-600 text-sky-600" : ""}`}
                  onClick={() => setShowPhone(v => !v)}>
                  {showPhone ? p.phone : "Show number"}
                </button>
                <button id="wishlist-btn"
                  className={`btn btn-w-full rounded-lg justify-center${isWished ? " btn-danger" : " btn-secondary"}`}
                  onClick={() => toggleWishlist(p.id)}>
                  {isWished ? "Saved to wishlist" : "Save to wishlist"}
                </button>
              </div>

              <div className="safety-tip">
                Meet in a public place. Inspect before paying. Never share OTPs or bank details.
              </div>
            </div>

            {/* Related listings — below seller card */}
            {related.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">More in {p.category}</p>
                <div className="flex flex-col gap-3">
                  {related.map(item => (
                    <div key={item.id} className="listing-card" onClick={() => navigate(`/listing?id=${item.id}`)}>
                      <div className="flex gap-3 p-2.5 items-center">
                        <div className="w-[72px] h-[56px] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-0.5">{item.priceLabel}</p>
                          <p className="text-xs text-gray-500 truncate">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}