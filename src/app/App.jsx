import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "../components/Header.jsx";
import { Footer } from "../components/Footer.jsx";
import { MobileDrawer } from "../components/MobileDrawer.jsx";
import { Toast } from "../components/Toast.jsx";
import { IconButton } from "../components/ui/Button.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { HomePage } from "../features/home/HomePage.jsx";
import { ProfilePage } from "../features/profile/ProfilePage.jsx";
import { HistoryPage } from "../features/history/HistoryPage.jsx";
import { EducationPage } from "../features/education/EducationPage.jsx";
import { GuideModal } from "../features/education/GuideModal.jsx";
import { GalleryPage } from "../features/gallery/GalleryPage.jsx";
import { UksPage } from "../features/uks/UksPage.jsx";
import { ContactPage } from "../features/contact/ContactPage.jsx";
import { AdminApp } from "../features/admin/AdminApp.jsx";
import { PAGE_TITLES, FALLBACK_CONTENT, mergeContent, tabFromLocation } from "../lib/content.js";
import { fetchContent } from "../lib/api.js";
import { useLocalStorage } from "../lib/hooks.js";

const DEFAULT_BRANDING = FALLBACK_CONTENT.settings.branding;

export function App() {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabFromLocation);
  const [theme, setTheme] = useLocalStorage("pmr_theme", "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [guide, setGuide] = useState(null);
  const [toast, setToast] = useState(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const toastTimer = useRef(null);

  /* ----------------------------- theming ---------------------------- */
  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#17161d" : "#ef4444");
  }, [theme]);

  /* ---------------------------- document ---------------------------- */
  useEffect(() => {
    document.title = PAGE_TITLES[activeTab] || PAGE_TITLES.beranda;
  }, [activeTab]);

  /* ------------------------------ data ------------------------------ */
  const load = useCallback(async () => {
    try {
      const payload = await fetchContent();
      setContent(mergeContent(payload, FALLBACK_CONTENT));
    } catch {
      // Never blank the page: the bundled fallback keeps the site readable.
      setContent(FALLBACK_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------------------- routing ----------------------------- */
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((tab, anchor) => {
    const target = PAGE_TITLES[tab] ? tab : "beranda";
    setActiveTab(target);
    setMenuOpen(false);
    const url = target === "beranda" ? window.location.pathname : `${window.location.pathname}?tab=${target}`;
    window.history.pushState({ tab: target }, "", url);
    if (target !== "admin") load();
    window.setTimeout(() => {
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 20);
  }, [load]);

  /* ----------------------------- chrome ----------------------------- */
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 720);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1120) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const branding = content.settings?.branding || DEFAULT_BRANDING;
  const emergencyNumber = content.settings?.emergency?.number || "119";

  const page = useMemo(() => {
    switch (activeTab) {
      case "profil":
        return <ProfilePage content={content} onNavigate={navigate} />;
      case "sejarah":
        return <HistoryPage content={content} onNavigate={navigate} />;
      case "edukasi":
        return <EducationPage content={content} onOpenGuide={setGuide} />;
      case "galeri":
        return <GalleryPage albums={content.gallery} />;
      case "uks":
        return <UksPage content={content} onNavigate={navigate} />;
      case "kontak":
        return <ContactPage content={content} onNavigate={navigate} />;
      case "admin":
        return (
          <AdminApp
            showToast={showToast}
            onExit={() => navigate("beranda")}
            onPublicRefresh={(data) => data && setContent(mergeContent({ ...data }, FALLBACK_CONTENT))}
          />
        );
      default:
        return <HomePage content={content} onNavigate={navigate} onOpenGuide={setGuide} />;
    }
  }, [activeTab, content, navigate, showToast]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Lewati ke konten utama</a>

      <div className="notice-bar" role="status" aria-label="Informasi singkat">
        <div className="notice-track">
          <span><Icon name="circle-alert" size={14} /> Untuk keadaan darurat, hubungi {emergencyNumber}</span>
          <span><Icon name="calendar" size={14} /> Latihan rutin setiap Kamis, 15.00–17.00 WITA</span>
          <span><Icon name="heart-handshake" size={14} /> {branding.tagline}</span>
          <span><Icon name="heart-pulse" size={14} /> Ruang UKS melayani Senin–Jumat</span>
          <span><Icon name="circle-alert" size={14} /> Untuk keadaan darurat, hubungi {emergencyNumber}</span>
          <span><Icon name="calendar" size={14} /> Latihan rutin setiap Kamis, 15.00–17.00 WITA</span>
          <span><Icon name="heart-handshake" size={14} /> {branding.tagline}</span>
          <span><Icon name="heart-pulse" size={14} /> Ruang UKS melayani Senin–Jumat</span>
        </div>
      </div>

      <Header
        activeTab={activeTab}
        onNavigate={navigate}
        onOpenMenu={() => setMenuOpen((open) => !open)}
        menuOpen={menuOpen}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        branding={branding}
      />

      <MobileDrawer
        open={menuOpen}
        activeTab={activeTab}
        onNavigate={navigate}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        contact={content.contact}
      />

      <main id="main-content" aria-busy={loading || undefined}>
        {page}
      </main>

      <Footer
        onNavigate={navigate}
        branding={branding}
        contact={content.contact}
        source={content.source}
      />

      <GuideModal guide={guide} onClose={() => setGuide(null)} emergencyNumber={emergencyNumber} />

      <IconButton
        icon="arrow-up"
        label="Kembali ke atas halaman"
        className={`back-to-top ${showBackTop ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        tabIndex={showBackTop ? 0 : -1}
      />

      {toast ? <Toast toast={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}

export default App;
