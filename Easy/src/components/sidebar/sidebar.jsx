import { useApp } from "../../context/AppContext";

const CATEGORIES = [
  "All listings",
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Vehicles",
  "Sports",
  "Kitchen",
];
const RADIUS_OPTIONS    = ["1 km","2 km","5 km","10 km","20 km"];
const CONDITION_OPTIONS = ["New","Like new","Good","Fair","For parts"];

export default function Sidebar({ mobileOpen = false }) {
  const { filters, setFilters, listings } = useApp();

  function toggleCondition(c) {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c]
    }));
  }

  function reset() {
    setFilters({ category:"All listings", radius:"5 km", conditions:["New","Like new","Good","Fair","For parts"], priceMax:250000 });
  }

  const pct = (filters.priceMax / 250000) * 100;

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div style={{ flex: 1 }}>
        {/* Categories */}
        <p className="section-title px-5 mb-1.5">Categories</p>
        {CATEGORIES.map(catName => {
          const active = catName === filters.category;
          const count = catName === "All listings" 
            ? listings.length 
            : listings.filter(l => l.category === catName).length;

          return (
            <button
              key={catName}
              id={`sidebar-cat-${catName.toLowerCase().replace(/\s+/g,"-")}`}
              className={`sidebar-cat-btn${active ? " active" : ""}`}
              onClick={() => setFilters(p => ({ ...p, category:catName }))}
            >
              <span>{catName}</span>
              <span className={`text-xs ${active ? "font-bold text-blue-600" : "text-gray-400"}`}>{count}</span>
            </button>
          );
        })}

        <div className="divider my-3" />

        {/* Price */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-1.5">
            <p className="section-title">Price Range</p>
            <span className="text-xs font-bold text-blue-600">₹{filters.priceMax.toLocaleString("en-IN")}</span>
          </div>
          <input id="price-range" type="range" min="0" max="250000" value={filters.priceMax}
            onChange={e => setFilters(p => ({ ...p, priceMax:Number(e.target.value) }))}
            style={{ background:`linear-gradient(to right, var(--blue-600) 0%, var(--blue-600) ${pct}%, var(--gray-200) ${pct}%, var(--gray-200) 100%)` }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1.5 font-medium">
            <span>₹0</span>
            <span>₹2,50,000</span>
          </div>
        </div>

        <div className="divider my-3" />

        {/* Radius */}
        <div className="px-5">
          <p className="section-title mb-2">Radius</p>
          <div className="flex flex-wrap gap-1.5">
            {RADIUS_OPTIONS.map(r => (
              <button key={r} id={`radius-${r.replace(" ","")}`}
                className={`sidebar-radius-btn${r===filters.radius?" active":""}`}
                onClick={() => setFilters(p => ({ ...p, radius:r }))}>{r}</button>
            ))}
          </div>
        </div>

        <div className="divider my-3" />

        {/* Condition */}
        <div className="px-5">
          <p className="section-title mb-2">Condition</p>
          <div className="grid grid-cols-2 gap-x-2">
            <div className="flex flex-col">
              {CONDITION_OPTIONS.slice(0, 3).map(c => (
                <label key={c} className="custom-checkbox">
                  <input type="checkbox"
                    checked={filters.conditions.includes(c)}
                    onChange={() => toggleCondition(c)} />
                  <span className="checkbox-box">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-col">
              {CONDITION_OPTIONS.slice(3).map(c => (
                <label key={c} className="custom-checkbox">
                  <input type="checkbox"
                    checked={filters.conditions.includes(c)}
                    onChange={() => toggleCondition(c)} />
                  <span className="checkbox-box">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="divider my-3" />

      {/* Reset */}
      <div className="flex justify-center pb-3">
        <button id="reset-filters-btn" className="reset-btn" onClick={reset}>
          ↻ Reset all filters
        </button>
      </div>

    </aside>
  );
}
