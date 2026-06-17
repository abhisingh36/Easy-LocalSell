import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";
import { useApp, ALL_LISTINGS } from "../../context/AppContext";

const REVIEWS = [
  { id:1, reviewer:"Priya Sharma", initials:"PS", rating:5, text:"Super smooth transaction! Item was exactly as described. Would definitely buy from again.", time:"2 weeks ago", item:"Sony Headphones" },
  { id:2, reviewer:"Amit Verma",   initials:"AV", rating:5, text:"Very responsive and honest seller. Quick handover.", time:"1 month ago", item:"NCERT Books" },
  { id:3, reviewer:"Sneha G.",     initials:"SG", rating:4, text:"Good experience overall. Item was clean and as described.", time:"2 months ago", item:"Study Chair" },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="12" height="12" fill={s <= count ? "#f59e0b" : "#fde68a"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, wishlist, toggleWishlist } = useApp();
  const [activeTab, setActiveTab] = useState("listings");

  const myListings = ALL_LISTINGS.slice(0, 5);
  const myWishlist = ALL_LISTINGS.filter(l => wishlist.includes(l.id));

  return (
    <div className="page-enter min-h-screen" style={{background:"var(--bg)"}}>
      <Navbar />

      {/* Hero */}
      <div className="profile-hero">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center gap-6">
            <div className="profile-avatar-lg">{currentUser.initials}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentUser.name}</h1>
              <p className="text-sm text-gray-600 mb-3">{currentUser.location} · Member since {currentUser.joinedYear}</p>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-lg font-bold text-gray-900">{currentUser.sold}</p>
                  <p className="text-xs text-gray-500 font-medium">Items sold</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{currentUser.active}</p>
                  <p className="text-xs text-gray-500 font-medium">Active listings</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-lg font-bold text-gray-900">4.8★</p>
                  <p className="text-xs text-gray-500 font-medium">Avg rating</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{currentUser.response}</p>
                  <p className="text-xs text-gray-500 font-medium">Response rate</p>
                </div>
              </div>
            </div>
            <button className="btn btn-primary shrink-0" onClick={() => navigate("/home")}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1400px] mx-auto px-8 py-6">

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 mb-6">
          {[
            { id:"listings", label:`My listings (${myListings.length})`},
            { id:"wishlist", label:`Wishlist (${myWishlist.length})`   },
            { id:"reviews",  label:`Reviews (${REVIEWS.length})`       },
          ].map(tab => (
            <button key={tab.id}
              className={`tab-btn${activeTab===tab.id?" active":""}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === "listings" && (
          <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
            {myListings.map(item => (
              <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/listing?id=${item.id}`)}>
                <div className="h-[130px] bg-gray-100 overflow-hidden">
                  <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy"/>
                </div>
                <div className="p-3">
                  <p className="text-base font-bold text-gray-900 mb-0.5">{item.priceLabel}</p>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.title}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{item.distLabel}</span>
                    <span className={`badge text-xs ${item.condition==="Like new"?"badge-blue":"badge-amber"}`}>{item.condition}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="card border-dashed border-2 border-gray-200 overflow-hidden hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center min-h-[160px]" onClick={() => navigate("/post")}>
              <div className="text-center">
                <span className="text-3xl text-gray-300 mb-1.5 block">+</span>
                <p className="text-xs font-semibold text-gray-600">Add listing</p>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist tab */}
        {activeTab === "wishlist" && (
          myWishlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">No saved items</p>
              <p className="text-sm text-gray-500 mb-4">Browse listings and save your favorites!</p>
              <button className="btn btn-primary" onClick={() => navigate("/home")}>Browse listings</button>
            </div>
          ) : (
            <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
              {myWishlist.map(item => (
                <div key={item.id} className="card overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/listing?id=${item.id}`)}>
                  <button className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow" onClick={ev => { ev.stopPropagation(); toggleWishlist(item.id); }}>
                    <svg width="14" height="14" fill="#ef4444" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <div className="h-[130px] bg-gray-100 overflow-hidden">
                    <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy"/>
                  </div>
                  <div className="p-3">
                    <p className="text-base font-bold text-gray-900 mb-0.5">{item.priceLabel}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-3">
            {REVIEWS.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                      {r.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.reviewer}</p>
                      <p className="text-xs text-gray-500">For: {r.item}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Stars count={r.rating}/>
                    <p className="text-xs text-gray-400 mt-0.5">{r.time}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
