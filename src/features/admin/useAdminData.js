import { useCallback, useState } from "react";
import {
  ApiError,
  adminData,
  adminDeleteItem,
  adminSaveItem,
  adminSaveSingleton,
} from "../../lib/api.js";
import { mergeContent } from "../../lib/content.js";

const ITEM_KEYS = ["announcements", "events", "gallery", "guides", "members"];

/**
 * Admin data store.
 *
 * Mutations are optimistic: the table updates immediately, then the server
 * response replaces the row. On failure the previous state is restored and the
 * error is surfaced — never a silent loss.
 */
export function useAdminData() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [dataset, setDataset] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = await adminData();
      const data = payload?.data || payload;
      setDataset({ ...data, collections: data.collections || {} });
      setStatus("ready");
      return data;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : String(cause?.message || cause));
      setStatus("error");
      return null;
    }
  }, []);

  const applyItem = useCallback((collection, item) => {
    setDataset((current) => {
      if (!current) return current;
      const list = current.collections?.[collection] || [];
      const index = list.findIndex((entry) => String(entry.id) === String(item.id));
      const nextList = index >= 0
        ? list.map((entry, position) => (position === index ? { ...entry, ...item } : entry))
        : [{ ...item }, ...list];
      return { ...current, collections: { ...current.collections, [collection]: nextList } };
    });
  }, []);

  const removeItem = useCallback((collection, id) => {
    setDataset((current) => {
      if (!current) return current;
      const list = current.collections?.[collection] || [];
      return {
        ...current,
        collections: { ...current.collections, [collection]: list.filter((entry) => String(entry.id) !== String(id)) },
      };
    });
  }, []);

  const saveItem = useCallback(
    async (collection, item) => {
      const list = dataset?.collections?.[collection] || [];
      const existing = item.id ? list.find((entry) => String(entry.id) === String(item.id)) : null;
      const optimisticId = item.id || `optimistic-${Date.now()}`;
      const optimistic = { ...item, id: optimisticId };

      // Optimistic insert/update, so the table reacts instantly.
      setDataset((current) => {
        if (!current) return current;
        const currentList = current.collections?.[collection] || [];
        const index = currentList.findIndex((entry) => String(entry.id) === String(optimisticId));
        const nextList = index >= 0
          ? currentList.map((entry, position) => (position === index ? optimistic : entry))
          : [optimistic, ...currentList];
        return { ...current, collections: { ...current.collections, [collection]: nextList } };
      });

      try {
        const payload = await adminSaveItem(collection, item);
        const saved = payload?.item ? { ...item, ...payload.item, id: payload.item.id || payload.id || optimisticId } : optimistic;
        if (optimisticId !== saved.id) removeItem(collection, optimisticId);
        applyItem(collection, saved);
        return { ok: true, item: saved };
      } catch (cause) {
        if (existing) applyItem(collection, existing);
        else removeItem(collection, optimisticId);
        const message = cause instanceof ApiError ? cause.message : String(cause?.message || cause);
        return { ok: false, error: message };
      }
    },
    [dataset, applyItem, removeItem],
  );

  const deleteItem = useCallback(
    async (collection, id) => {
      const list = dataset?.collections?.[collection] || [];
      const snapshot = list.find((entry) => String(entry.id) === String(id));
      removeItem(collection, id);
      try {
        await adminDeleteItem(collection, id);
        return { ok: true };
      } catch (cause) {
        if (snapshot) applyItem(collection, snapshot);
        const message = cause instanceof ApiError ? cause.message : String(cause?.message || cause);
        return { ok: false, error: message };
      }
    },
    [dataset, applyItem, removeItem],
  );

  const saveSingleton = useCallback(async (collection, value) => {
    const key = collection === "site_settings" ? "settings" : collection === "organization" ? "org" : collection === "uks" ? "uks" : "roster";
    const previous = dataset?.[key];
    setDataset((current) => (current ? { ...current, [key]: value } : current));
    try {
      const payload = await adminSaveSingleton(collection, value);
      const saved = payload?.item;
      if (saved) {
        setDataset((current) => (current ? { ...current, [key]: { ...value, ...saved } } : current));
      }
      return { ok: true };
    } catch (cause) {
      setDataset((current) => (current ? { ...current, [key]: previous } : current));
      const message = cause instanceof ApiError ? cause.message : String(cause?.message || cause);
      return { ok: false, error: message };
    }
  }, [dataset]);

  /** Publishes/unpublishes an item with optimistic feedback. */
  const togglePublished = useCallback(
    (collection, item) => saveItem(collection, { ...item, published: !item.published, is_published: !item.published }),
    [saveItem],
  );

  const publicContent = dataset ? mergeContent(dataset, dataset) : null;

  return {
    status,
    error,
    dataset,
    collections: dataset?.collections || {},
    publicContent,
    itemKeys: ITEM_KEYS,
    load,
    saveItem,
    deleteItem,
    saveSingleton,
    togglePublished,
    setDataset,
  };
}
