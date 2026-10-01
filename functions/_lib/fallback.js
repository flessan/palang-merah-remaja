// Server-side view of the bundled PMR fallback dataset.
//
// The dataset itself lives in `shared/fallback.js` so the browser bundle and
// the Pages Functions adapter can never drift apart.
export {
  FALLBACK_CONTACT,
  FALLBACK_EMERGENCY,
  fallbackContent,
  fallbackDocuments,
} from "../../shared/fallback.js";
