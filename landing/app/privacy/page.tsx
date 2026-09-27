import type { Metadata } from "next";

const SUPPORT_EMAIL = "rezaabaskhanian1367kash@gmail.com";

export const metadata: Metadata = {
  title: "سیاست حریم خصوصی — LingoFlow",
  description: "اطلاعاتی که اپلیکیشن LingoFlow جمع‌آوری می‌کند و نحوه‌ی استفاده از آن",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="navpill">
            <a href="/" className="brand">
              <span className="brand-dot" />
              LingoFlow
            </a>
          </div>
        </div>
      </header>

      <main className="wrap privacy">
        <span className="eyebrow">حریم خصوصی</span>
        <h1>سیاست حریم خصوصی لینگوفلو</h1>
        <p className="privacy-updated">آخرین به‌روزرسانی: مهر ۱۴۰۵</p>

        <h2>اطلاعاتی که جمع‌آوری می‌کنیم</h2>
        <ul>
          <li>
            <strong>شماره‌ی موبایل:</strong> برای ثبت‌نام و ورود با کد تأیید پیامکی.
          </li>
          <li>
            <strong>صدای ضبط‌شده:</strong> فقط وقتی دکمه‌ی ضبط را می‌زنید، صدای شما برای بررسی تلفظ
            و گفتگو با هوش مصنوعی به سرور فرستاده می‌شود و برای نمایش در بخش «ضبط‌های من» نگهداری
            می‌شود.
          </li>
          <li>
            <strong>متن گفتگوها و پیشرفت یادگیری:</strong> برای نمایش پیشرفت، امتیاز، مرور لغت‌ها و
            پیشنهاد تمرین مناسب.
          </li>
          <li>
            <strong>شناسه‌ی اعلان دستگاه:</strong> برای فرستادن یادآور تمرین. یادآورها را می‌توانید از
            تنظیمات اپ خاموش کنید.
          </li>
        </ul>

        <h2>استفاده از سرویس‌های هوش مصنوعی</h2>
        <p>
          برای تبدیل صدا به متن و تولید پاسخ‌های هوش مصنوعی، صدای ضبط‌شده یا متن آن ممکن است برای
          پردازش به ارائه‌دهندگان سرویس هوش مصنوعی فرستاده شود. این اطلاعات فقط برای ارائه‌ی همان
          خدمت استفاده می‌شود.
        </p>

        <h2>پرداخت</h2>
        <p>
          پرداخت‌ها از طریق کافه‌بازار انجام می‌شود و ما به اطلاعات کارت بانکی شما دسترسی نداریم.
        </p>

        <h2>اشتراک‌گذاری اطلاعات</h2>
        <p>ما اطلاعات شما را نمی‌فروشیم و برای تبلیغات در اختیار دیگران قرار نمی‌دهیم.</p>

        <h2>حذف حساب</h2>
        <p>
          برای حذف حساب و همه‌ی اطلاعاتتان، از همان شماره‌ای که با آن ثبت‌نام کرده‌اید به{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> پیام بدهید.
        </p>

        <h2>تماس با ما</h2>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} LingoFlow</span>
            <a href="/">www.lingoflow.ir</a>
          </div>
        </div>
      </footer>
    </>
  );
}
