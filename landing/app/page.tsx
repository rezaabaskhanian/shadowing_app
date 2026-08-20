import { API_BASE, fetchLandingSections } from "@/lib/api";

export default async function HomePage() {
  const sections = await fetchLandingSections();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-badge">🎙️</span>
            LingoFlow
          </div>
          {sections.length > 0 && (
            <nav className="tabnav">
              {sections.map((s) => (
                <a key={s.id} href={`#section-${s.id}`}>
                  {s.tab_label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <section className="hero">
        <h1>یادگیری زبان انگلیسی با شدوئینگ</h1>
        <p>
          با LingoFlow، تلفظ و مکالمه‌ی انگلیسی رو با تکرار همزمان (Shadowing)
          روی صحنه‌های واقعی تمرین کن.
        </p>
      </section>

      {sections.length === 0 ? (
        <p className="empty-state">به‌زودی محتوای این صفحه تکمیل می‌شود.</p>
      ) : (
        sections.map((s) => (
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
                    <img
                      key={img.id}
                      src={img.url.startsWith("http") ? img.url : `${API_BASE}${img.url}`}
                      alt={s.title}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}

      <footer className="footer">© {new Date().getFullYear()} LingoFlow — www.lingoflow.ir</footer>
    </>
  );
}
