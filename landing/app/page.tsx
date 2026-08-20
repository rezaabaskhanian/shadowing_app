import { API_BASE, fetchLandingContent } from "@/lib/api";

function resolveUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function DownloadButtons({
  googlePlayUrl,
  bazaarUrl,
  className = "download-buttons",
}: {
  googlePlayUrl: string;
  bazaarUrl: string;
  className?: string;
}) {
  if (!googlePlayUrl && !bazaarUrl) return null;
  return (
    <div className={className}>
      {googlePlayUrl && (
        <a href={googlePlayUrl} target="_blank" rel="noopener noreferrer" className="btn-download">
          Google Play
        </a>
      )}
      {bazaarUrl && (
        <a href={bazaarUrl} target="_blank" rel="noopener noreferrer" className="btn-download outline">
          کافه بازار
        </a>
      )}
    </div>
  );
}

export default async function HomePage() {
  const { sections, settings, highlights, faqs } = await fetchLandingContent();
  const hasDownloadLinks = !!(settings.google_play_url || settings.bazaar_url);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-badge">🎙️</span>
            LingoFlow
          </div>
          <nav className="tabnav">
            <a href="#why">چرا LingoFlow؟</a>
            <a href="#how">چطور کار می‌کنه</a>
            <a href="#faq">سوالات متداول</a>
          </nav>
          {hasDownloadLinks && (
            <a href="#download" className="btn-download-nav">
              دانلود
            </a>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1>{settings.hero_title || "یادگیری زبان انگلیسی با شدوئینگ"}</h1>
            <p>
              {settings.hero_subtitle ||
                "با LingoFlow، تلفظ و مکالمه‌ی انگلیسی رو با تکرار همزمان (Shadowing) روی صحنه‌های واقعی تمرین کن."}
            </p>
            <div id="download">
              <DownloadButtons googlePlayUrl={settings.google_play_url} bazaarUrl={settings.bazaar_url} />
            </div>
          </div>
          {settings.hero_image_url && (
            <div className="hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveUrl(settings.hero_image_url)} alt={settings.hero_title} />
            </div>
          )}
        </div>
      </section>

      {highlights.features.length > 0 && (
        <section id="why" className="highlights">
          <div className="highlights-inner">
            {highlights.features.map((f) => (
              <div key={f.id} className="highlight-card">
                {f.icon && <span className="highlight-icon">{f.icon}</span>}
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {highlights.steps.length > 0 && (
        <section id="how" className="steps">
          <div className="steps-inner">
            {highlights.steps.map((s, i) => (
              <div key={s.id} className="step-card">
                <span className="step-number">{i + 1}</span>
                {s.icon && <span className="highlight-icon">{s.icon}</span>}
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.map((s) => (
        <section key={s.id} id={`section-${s.id}`} className="section">
          <div className="section-inner">
            <div className="section-content">
              <span className="section-label">{s.tab_label}</span>
              <h2>{s.title}</h2>
              {s.description && <p className="desc">{s.description}</p>}
            </div>
            {s.images.length > 0 && (
              <div className="section-media">
                {s.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={resolveUrl(img.url)} alt={s.title} />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {faqs.length > 0 && (
        <section id="faq" className="faq">
          <h2>سوالات متداول</h2>
          {faqs.map((f) => (
            <details key={f.id}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      )}

      {(settings.cta_title || settings.cta_subtitle) && (
        <section className="cta-banner">
          {settings.cta_title && <h2>{settings.cta_title}</h2>}
          {settings.cta_subtitle && <p>{settings.cta_subtitle}</p>}
          <DownloadButtons googlePlayUrl={settings.google_play_url} bazaarUrl={settings.bazaar_url} />
        </section>
      )}

      <footer className="footer">
        <div className="brand">
          <span className="brand-badge">🎙️</span>
          LingoFlow
        </div>
        <nav className="footer-nav">
          {highlights.features.length > 0 && <a href="#why">چرا LingoFlow؟</a>}
          {highlights.steps.length > 0 && <a href="#how">چطور کار می‌کنه</a>}
          {faqs.length > 0 && <a href="#faq">سوالات متداول</a>}
        </nav>
        <DownloadButtons googlePlayUrl={settings.google_play_url} bazaarUrl={settings.bazaar_url} className="footer-downloads" />
        <p>© {new Date().getFullYear()} LingoFlow — www.lingoflow.ir</p>
      </footer>
    </>
  );
}
