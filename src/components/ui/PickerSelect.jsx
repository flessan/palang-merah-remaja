import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { cn } from "../../lib/utils.js";

/**
 * Searchable dropdown (combobox) — the standard way to pick a class, role,
 * division, weekday or member inside the admin panel.
 *
 * Why not a plain <select>: the lists (classes, roles, 40+ members) are long,
 * the office only has a keyboard or a thumb, and admins need to type three
 * letters instead of scrolling. Keyboard: ↑ ↓ Home End Enter Escape Tab.
 */
export function PickerSelect({
  id,
  label,
  hint,
  value,
  onChange,
  options = [],
  placeholder = "Cari atau pilih…",
  allowCustom = false,
  customLabel = "Pakai",
  emptyLabel = "Tidak ada pilihan yang cocok.",
  icon = "search",
  clearable = true,
  className = "",
  name,
  disabled = false,
}) {
  const generatedId = useId();
  const fieldId = id || `picker-${generatedId}`;
  const listId = `${fieldId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const normalised = useMemo(
    () => options
      .map((option) => (typeof option === "string" ? { value: option, label: option } : option))
      .filter((option) => option && String(option.value ?? option.label ?? "").length),
    [options],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return normalised;
    return normalised.filter((option) => {
      const haystack = `${option.label ?? option.value} ${option.meta ?? ""} ${option.keywords ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [normalised, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, query]);

  const commit = (option) => {
    if (!option) return;
    onChange?.(option.value ?? option.label);
    setQuery("");
    setOpen(false);
  };

  const commitCustom = () => {
    const typed = query.trim();
    if (!typed) return;
    onChange?.(typed);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && filtered[activeIndex]) commit(filtered[activeIndex]);
      else if (allowCustom && query.trim()) commitCustom();
      else setOpen(true);
      return;
    }
    if (event.key === "Escape") {
      event.stopPropagation();
      if (open) setOpen(false);
      else if (query) setQuery("");
      else inputRef.current?.blur();
      return;
    }
    if (event.key === "Tab" && open) setOpen(false);
  };

  const selectedLabel = normalised.find((option) => String(option.value) === String(value))?.label || value || "";

  return (
    <div className={cn("picker", className)} ref={rootRef}>
      <div className="picker__control">
        <Icon name={icon} size={17} className="picker__icon" />
        <input
          id={fieldId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[activeIndex] ? `${fieldId}-opt-${activeIndex}` : undefined}
          aria-labelledby={label ? `${fieldId}-label` : undefined}
          aria-label={label ? undefined : placeholder}
          autoComplete="off"
          disabled={disabled}
          placeholder={value ? String(selectedLabel) : placeholder}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          data-picker-input={name || fieldId}
        />
        {value && clearable && !disabled ? (
          <button
            type="button"
            className="picker__clear"
            aria-label={`Kosongkan ${label || placeholder}`}
            onClick={() => { onChange?.(""); setQuery(""); }}
          >
            <Icon name="x" size={14} />
          </button>
        ) : null}
        <button
          type="button"
          className="picker__toggle"
          tabIndex={-1}
          aria-label={open ? "Tutup daftar pilihan" : "Buka daftar pilihan"}
          onClick={() => { setOpen((current) => !current); inputRef.current?.focus(); }}
          disabled={disabled}
        >
          <Icon name={open ? "chevron-up" : "chevron-down"} size={16} />
        </button>
      </div>

      {open ? (
        <ul className="picker__list" id={listId} role="listbox" aria-labelledby={label ? `${fieldId}-label` : undefined}>
          {allowCustom && query.trim() && !filtered.some((option) => String(option.value).toLowerCase() === query.trim().toLowerCase()) ? (
            <li role="option" aria-selected="false">
              <button type="button" className="picker__option" onClick={commitCustom} data-picker-custom>
                <Icon name="plus" size={15} />
                <span>
                  {customLabel} “{query.trim()}”
                  <small>Nilai baru, bukan pilihan bawaan</small>
                </span>
              </button>
            </li>
          ) : null}

          {filtered.length ? filtered.map((option, index) => (
            <li key={`${option.value}-${index}`} role="option" aria-selected={String(option.value) === String(value)} id={`${fieldId}-opt-${index}`}>
              <button
                type="button"
                className={cn("picker__option", index === activeIndex && "is-active")}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option)}
              >
                {option.icon ? <Icon name={option.icon} size={15} /> : null}
                <span>
                  {option.label ?? option.value}
                  {option.meta ? <small>{option.meta}</small> : null}
                </span>
              </button>
            </li>
          )) : (
            <li>
              <p className="picker__empty">{emptyLabel}</p>
            </li>
          )}
        </ul>
      ) : null}

      {hint ? (
        <span className="picker__hint">
          <Icon name="info" size={13} />
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default PickerSelect;
