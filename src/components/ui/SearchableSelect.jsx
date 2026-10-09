import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { ChevronDown, Search, Loader2, X, Plus } from "lucide-react";
// We don't have ThemeContext in this project, so we'll mock it or just omit it safely
const ThemeContext = React.createContext({ theme: { name: "dark" } });

export default function SearchableSelect({
  label,
  value,
  onChange,
  fetchFn,
  placeholder = "Search...",
  disabled = false,
  theme = {},
  onAddNew,
  displayKey = "name",
  selectedDisplayKey,
  extraInfo,
  initialItem = null,
  valueKey = "_id",
  isMulti = false,
  listMaxHeight = "240px",
  hideSelectedPills = false,
}) {
  const contextTheme = useContext(ThemeContext)?.theme;
  const activeTheme =
    theme && Object.keys(theme).length > 0 ? theme : contextTheme;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [selectedItem, setSelectedItem] = useState(isMulti ? [] : null);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const currentSearch = useRef("");
  const currentPage = useRef(1);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const loadItems = useCallback(
    async (searchVal, pageNum, append = false) => {
      if (!fetchFn || disabled) return;
      setLoading(true);
      try {
        const res = await fetchFn(searchVal, pageNum);
        if (res?.success) {
          const newData = res.data || [];
          setItems((prev) => {
            if (!append) return newData;
            const existingIds = new Set(
              prev.map((i) => i._id || i.id || i[valueKey]),
            );
            const uniqueNewData = newData.filter(
              (i) => !existingIds.has(i._id || i.id || i[valueKey]),
            );
            return [...prev, ...uniqueNewData];
          });
          setHasMore(res.pagination?.hasMore ?? false);
          currentPage.current = pageNum;
        }
      } catch (err) {
        console.error("[SearchableSelect] fetchFn error:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, disabled],
  );

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setPage(1);
      currentSearch.current = "";
      loadItems("", 1, false);
    } else {
      setItems([]);
    }
  }, [isOpen, loadItems]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (search !== currentSearch.current) {
      setLoading(true);
    }

    debounceRef.current = setTimeout(() => {
      currentSearch.current = search;
      setPage(1);
      loadItems(search, 1, false);
    }, 320);
    return () => clearTimeout(debounceRef.current);
  }, [search, isOpen, loadItems]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      const nextPage = currentPage.current + 1;
      loadItems(currentSearch.current, nextPage, true);
    }
  };

  const handleSelect = (item) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const itemKey = item[valueKey] || item.id;
      if (currentValues.includes(itemKey)) {
        const newValues = currentValues.filter((v) => v !== itemKey);
        const newSelected = selectedItem.filter(
          (i) => (i[valueKey] || i.id) !== itemKey,
        );
        setSelectedItem(newSelected);
        onChange(newValues, newSelected);
      } else {
        const newValues = [...currentValues, itemKey];
        const newSelected = [...(selectedItem || []), item];
        setSelectedItem(newSelected);
        onChange(newValues, newSelected);
      }
    } else {
      setSelectedItem(item);
      onChange(item[valueKey] || item.id, item);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItem(isMulti ? [] : null);
    onChange(isMulti ? [] : "", isMulti ? [] : null);
  };

  const handleRemovePill = (e, itemToRemove) => {
    e.stopPropagation();
    if (!isMulti) return;
    const itemKey = itemToRemove[valueKey] || itemToRemove.id;
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.filter((v) => v !== itemKey);
    const newSelected = selectedItem.filter(
      (i) => (i[valueKey] || i.id) !== itemKey,
    );
    setSelectedItem(newSelected);
    onChange(newValues, newSelected);
  };

  useEffect(() => {
    if (isMulti) {
      if (!value || !Array.isArray(value) || value.length === 0) {
        setSelectedItem([]);
        return;
      }
      const newSelected = value.map((val) => {
        const existing = selectedItem?.find(
          (i) => (i[valueKey] || i.id) === val,
        );
        if (existing) return existing;
        const found = items.find((i) => (i[valueKey] || i.id) === val);
        if (found) return found;
        return { [valueKey]: val, [displayKey]: val };
      });
      if (JSON.stringify(newSelected) !== JSON.stringify(selectedItem)) {
        setSelectedItem(newSelected);
      }
    } else {
      if (!value) {
        setSelectedItem(null);
        return;
      }
      const currentId = selectedItem?.[valueKey] || selectedItem?.id;
      if (currentId === value) return;
      const found = items.find((i) => (i[valueKey] || i.id) === value);
      if (found) setSelectedItem(found);
      else if (
        initialItem &&
        (initialItem[valueKey] || initialItem.id) === value
      )
        setSelectedItem(initialItem);
    }
  }, [value, items, initialItem]);

  const handleAddNew = async () => {
    if (!onAddNew || !search.trim() || addingNew) return;
    setAddingNew(true);
    try {
      let item = await onAddNew(search.trim());
      if (item && item.success && item.data) {
        item = item.data;
      }
      if (item) {
        if (isMulti) {
          const itemKey = item[valueKey] || item.id;
          const currentValues = Array.isArray(value) ? value : [];
          if (!currentValues.includes(itemKey)) {
            const newValues = [...currentValues, itemKey];
            const newSelected = [...(selectedItem || []), item];
            setSelectedItem(newSelected);
            onChange(newValues, newSelected);
          }
          setSearch("");
        } else {
          setSelectedItem(item);
          onChange(item[valueKey] || item.id, item);
          setIsOpen(false);
        }
      }
    } catch (err) {
      console.error("[SearchableSelect] onAddNew error:", err);
    } finally {
      setAddingNew(false);
    }
  };

  const isLight =
    activeTheme?.name === "light" ||
    activeTheme?.text === "#0F172A" ||
    activeTheme?.text === "#0f172a" ||
    activeTheme?.text === "#000000";
  const borderColor =
    activeTheme?.card?.border ||
    activeTheme?.navbar?.border ||
    (isLight ? "#E2E8F0" : "rgba(255,255,255,0.12)");
  const cardBg =
    activeTheme?.card?.bg ||
    activeTheme?.cardBg ||
    (isLight ? "#FFFFFF" : "#131b2e");
  const text = activeTheme?.text || (isLight ? "#0F172A" : "#ffffff");

  const hasExactMatch = items.some(
    (i) => i[displayKey]?.toLowerCase() === search.trim().toLowerCase(),
  );

  return (
    <div
      className="space-y-2"
      ref={containerRef}
      style={{ position: "relative", zIndex: isOpen ? 50 : "auto" }}
    >
      {label && (
        <label
          className="text-xs font-medium uppercase tracking-[0.14em] text-cream-400 block truncate"
          style={{ color: text }}
        >
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={`
          relative flex items-center w-full rounded-sm border px-3 py-2 text-sm bg-black/[0.03] border-border-strong text-cream-100 placeholder:text-cream-400
          cursor-pointer transition-all select-none min-h-[42px]
          ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-cream-400"}
        `}
      >
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {isMulti ? (
            selectedItem && selectedItem.length > 0 && !hideSelectedPills ? (
              selectedItem.map((item, idx) => (
                <span
                  key={item[valueKey] || item.id || idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border bg-white/10 border-white/10`}
                >
                  {item.flag && <span className="text-sm">{item.flag}</span>}
                  {item[displayKey]}
                  <button
                    type="button"
                    onClick={(e) => handleRemovePill(e, item)}
                    className="opacity-50 hover:opacity-100 ml-1"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            ) : (
              <span className="opacity-40 text-sm">
                {selectedItem && selectedItem.length > 0
                  ? `${selectedItem.length} items selected`
                  : placeholder}
              </span>
            )
          ) : selectedItem ? (
            <span className="text-sm font-medium truncate flex items-center gap-2">
              {selectedItem?.flag && (
                <span className="text-base leading-none">
                  {selectedItem.flag}
                </span>
              )}
              <span className="truncate">
                {selectedItem[selectedDisplayKey || displayKey]}
              </span>
              {selectedItem.isVerified === false && (
                <span
                  className="ml-1 text-yellow-400 text-xs font-bold"
                  title="Unverified peer-added metadata"
                >
                  ⚠️
                </span>
              )}
            </span>
          ) : (
            <span className="opacity-40 text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {((isMulti && selectedItem?.length > 0) ||
            (!isMulti && selectedItem)) &&
            !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="opacity-40 hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={12} />
              </button>
            )}
          <ChevronDown
            size={14}
            className={`opacity-40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute z-[9999] min-w-[260px] sm:min-w-[300px] w-full max-w-[95vw] rounded-sm shadow-xl border border-border-strong overflow-hidden bg-[#1a1b1e]"
          style={{ top: "calc(100% + 4px)", left: 0 }}
        >
          <div className="p-2 border-b border-border-strong bg-[#25262b]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-black/20">
              <Search
                size={13}
                className="opacity-40 shrink-0 text-cream-100"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter..."
                className="flex-1 bg-transparent outline-none text-sm text-cream-100 placeholder:opacity-40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="opacity-40 hover:opacity-80 transition-opacity"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ maxHeight: listMaxHeight }}
          >
            {loading && items.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={20}
                  className="animate-spin opacity-40 text-cream-100"
                />
              </div>
            )}
            {!loading && items.length === 0 && !onAddNew && (
              <div className="py-6 text-center text-sm opacity-40 text-cream-100">
                No results found
              </div>
            )}
            {onAddNew && search.trim() && !hasExactMatch && (
              <div
                onClick={handleAddNew}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 text-emerald-400 font-medium"
              >
                <Plus size={16} className="shrink-0" />
                <div className="text-sm truncate">
                  {addingNew ? "Adding..." : `Add "${search.trim()}"`}
                </div>
              </div>
            )}
            {items.map((item, index) => {
              const itemValue = item[valueKey] || item._id || item.id;
              const reactKey = item._id || item.id || itemValue || index;
              const isSelected = isMulti
                ? Array.isArray(value) && value.includes(itemValue)
                : value === itemValue;
              return (
                <div
                  key={reactKey}
                  onClick={() => handleSelect(item)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${isSelected ? "bg-white/15 text-cream-50" : "hover:bg-white/5 text-cream-100"}
                  `}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate leading-snug flex items-center gap-2">
                      <span className="truncate">{item[displayKey]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && items.length > 0 && (
              <div className="flex items-center justify-center py-3">
                <Loader2 size={16} className="animate-spin opacity-40" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
