import { useEffect, useState } from "react";
import { PLACEHOLDER_PHOTO, altText, resolveMedia, srcSetFor } from "../../lib/media.js";
import { cn } from "../../lib/utils.js";

/**
 * Image with a deterministic fallback.
 *
 * Content may point at Telegraph Cloud public URLs or at bundled `/gudang/…`
 * assets; if either fails to load (offline preview, deleted object) the frame
 * still renders a real PMR photo instead of a broken icon.
 */
export function SmartImage({
  src,
  alt = "",
  className = "",
  fallback = PLACEHOLDER_PHOTO,
  loading = "lazy",
  sizes,
  priority = false,
  ...rest
}) {
  const resolved = resolveMedia(src, fallback);
  const [current, setCurrent] = useState(resolved);

  useEffect(() => {
    setCurrent(resolveMedia(src, fallback));
  }, [src, fallback]);

  return (
    <img
      src={current}
      alt={altText(alt)}
      className={cn(className)}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      sizes={sizes}
      srcSet={srcSetFor(current)}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      {...rest}
    />
  );
}

export default SmartImage;
