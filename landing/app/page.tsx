import { API_BASE, fetchLandingContent } from "@/lib/api";
import { Wave } from "@/components/Wave";
import type { LandingHighlight } from "@/lib/types";

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
        <a href={googlePlayUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Google Play
        </a>
      )}
      {bazaarUrl && (
        <a href={bazaarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          کافه بازار
        </a>
      )}
    </div>
  );
}

function HighlightIcon({ highlight, seed }: { highlight: LandingHighlight; seed: number }) {
  if (highlight.icon) {
    return <span className="highlight-icon emoji">{highlight.icon}</span>;
  }
  return <Wave className="highlight-icon wave-anim" bars={9} seed={seed} width={56} height={28} />;
}

export default async function HomePage() {
  const { sections, settings, highlights, faqs } = await fetchLandingContent();
  const hasDownloadLinks = !!(settings.google_play_url || settings.bazaar_url);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="navpill">
            <div className="brand">
              <span className="brand-dot" />
              LingoFlow
            </div>
            <nav className="tabnav">
              <a href="#why">چرا LingoFlow؟</a>
              <a href="#how">چطور کار می‌کنه</a>
              <a href="#faq">سوالات متداول</a>
            </nav>
            {hasDownloadLinks && (
              <a href="#download" className="btn btn-accent btn-sm">
                دانلود
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-content">
            <span className="eyebrow">روش شدوئینگ (Shadowing)</span>
            <h1 className="echo-h1">
              <span className="ghost" aria-hidden="true">
                {settings.hero_title || "یادگیری زبان انگلیسی با شدوئینگ"}
              </span>
              {settings.hero_title || "یادگیری زبان انگلیسی با شدوئینگ"}
            </h1>
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
              <div className="glow" />
              <div className="ghost-phone" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="phone" src={resolveUrl(settings.hero_image_url)} alt={settings.hero_title} />
            </div>
          )}
        </div>
      </section>

      {(highlights.features.length > 0 || highlights.steps.length > 0) && (
        <div className="wrap wave-divider">
          <Wave className="wave-anim" bars={60} seed={5} width={760} height={22} />
        </div>
      )}

      {highlights.features.length > 0 && (
        <section id="why">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">چرا LingoFlow؟</span>
              <h2>تمرینی که به گوش و دهنت هم‌زمان کار می‌ده</h2>
            </div>
            <div className="highlights-inner">
              {highlights.features.map((f, i) => (
                <div key={f.id} className="highlight-card">
                  <HighlightIcon highlight={f} seed={i + 1} />
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {highlights.steps.length > 0 && (
        <section id="how">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">مسیر تمرین</span>
              <h2>چطور کار می‌کنه</h2>
            </div>
            <div className="steps-inner">
              {highlights.steps.map((s, i) => (
                <div key={s.id} className="step-card">
                  <span className="step-number">{i + 1}</span>
                  {s.icon && <span className="highlight-icon emoji">{s.icon}</span>}
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.map((s) => (
        <section key={s.id} id={`section-${s.id}`}>
          <div className="wrap section-inner">
            <div className="section-content">
              <span className="eyebrow">{s.tab_label}</span>
              <h2>{s.title}</h2>
              {s.description && <p className="desc">{s.description}</p>}
            </div>
            {s.images.length > 0 && (
              <div className="section-media">
                {s.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} className="phone" src={resolveUrl(img.url)} alt={s.title} />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {faqs.length > 0 && (
        <>
          <div className="wrap wave-divider">
            <Wave className="wave-anim" bars={60} seed={8} width={760} height={22} />
          </div>
          <section id="faq">
            <div className="wrap">
              <div className="section-head center">
                <span className="eyebrow">سوالات متداول</span>
                <h2>چیزهایی که معمولاً می‌پرسن</h2>
              </div>
              <div className="faq-wrap">
                {faqs.map((f) => (
                  <details key={f.id}>
                    <summary>
                      {f.question}
                      <span className="faq-plus" />
                    </summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {(settings.cta_title || settings.cta_subtitle) && (
        <section>
          <div className="wrap">
            <div className="cta-banner">
              <div className="wave-bg">
                <Wave className="wave-anim" bars={80} seed={30} width={1160} height={60} />
              </div>
              <div className="cta-inner">
                {settings.cta_title && (
                  <h2 className="echo-h2">
                    <span className="ghost" aria-hidden="true">
                      {settings.cta_title}
                    </span>
                    {settings.cta_title}
                  </h2>
                )}
                {settings.cta_subtitle && <p>{settings.cta_subtitle}</p>}
                <DownloadButtons googlePlayUrl={settings.google_play_url} bazaarUrl={settings.bazaar_url} />
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="brand">
              <span className="brand-dot" />
              LingoFlow
            </div>
            <nav className="footer-nav">
              {highlights.features.length > 0 && <a href="#why">چرا LingoFlow؟</a>}
              {highlights.steps.length > 0 && <a href="#how">چطور کار می‌کنه</a>}
              {faqs.length > 0 && <a href="#faq">سوالات متداول</a>}
            </nav>
            <DownloadButtons
              googlePlayUrl={settings.google_play_url}
              bazaarUrl={settings.bazaar_url}
              className="download-buttons footer-downloads"
            />
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} LingoFlow</span>
            <span>www.lingoflow.ir</span>
          </div>
        </div>
      </footer>
    </>
  );
}
