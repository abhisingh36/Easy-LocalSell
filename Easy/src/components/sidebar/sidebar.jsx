import { useApp } from "../../context/AppContext";

const CATEGORIES = [
  { name:"All listings", count:248 },
  { name:"Electronics",  count:64  },
  { name:"Furniture",    count:38  },
  { name:"Clothing",     count:52  },
  { name:"Books",        count:41  },
  { name:"Vehicles",     count:19  },
  { name:"Sports",       count:22  },
  { name:"Kitchen",      count:12  },
];
const RADIUS_OPTIONS    = ["1 km","2 km","5 km","10 km","20 km"];
const CONDITION_OPTIONS = ["Like new","Good","Fair"];

export default function Sidebar() {
  const { filters, setFilters } = useApp();

  function toggleCondition(c) {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c]
    }));
  }

  function reset() {
    setFilters({ category:"All listings", radius:"5 km", conditions:["Like new","Good","Fair"], priceMax:250000 });
  }

  const pct = (filters.priceMax / 250000) * 100;

  return (
    <aside className="sidebar">

      {/* Categories */}
      <p className="section-title px-5 mb-2">Categories</p>
      {CATEGORIES.map(cat => {
        const active = cat.name === filters.category;
        return (
          <button
            key={cat.name}
            id={`sidebar-cat-${cat.name.toLowerCase().replace(/\s+/g,"-")}`}
            className={`sidebar-cat-btn${active ? " active" : ""}`}
            onClick={() => setFilters(p => ({ ...p, category:cat.name }))}
          >
            <span>{cat.name}</span>
            <span className={`text-xs ${active ? "font-bold text-sky-600" : "text-gray-400"}`}>{cat.count}</span>
          </button>
        );
      })}

      <div className="divider my-3.5" />

      {/* Price */}
      <div className="px-5 mb-1">
        <div className="flex justify-between items-center mb-2">
          <p className="section-title">Price Range</p>
          <span className="text-xs font-bold text-sky-600">₹{filters.priceMax.toLocaleString("en-IN")}</span>
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

      <div className="divider mb-3.5" />

      {/* Radius */}
      <div className="px-5 mb-1">
        <p className="section-title mb-2.5">Radius</p>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map(r => (
            <button key={r} id={`radius-${r.replace(" ","")}`}
              className={`sidebar-radius-btn${r===filters.radius?" active":""}`}
              onClick={() => setFilters(p => ({ ...p, radius:r }))}>{r}</button>
          ))}
        </div>
      </div>

      <div className="divider mb-3.5" />

      {/* Condition */}
      <div className="px-5 mb-1">
        <p className="section-title mb-2.5">Condition</p>
        {CONDITION_OPTIONS.map(c => (
          <label key={c} className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer font-medium">
            <input type="checkbox" className="accent-sky-600"
              checked={filters.conditions.includes(c)}
              onChange={() => toggleCondition(c)} />
            {c}
          </label>
        ))}
      </div>

      <div className="divider mb-3.5" />

      {/* Reset */}
      <div className="px-5">
        <button id="reset-filters-btn" className="reset-btn" onClick={reset}>
          ↺ Reset all filters
        </button>
      </div>

    </aside>
  );
}
