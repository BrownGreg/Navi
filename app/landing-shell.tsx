import { cookies } from "next/headers";
import Link from "next/link";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";

// Verifie juste la presence du cookie de session (pas sa validite - inutile
// pour une simple adaptation du CTA, /dashboard revalide de toute facon et
// renvoie vers /sign-in si le cookie est perime).
export async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("navi_session")?.value);
}

export async function LandingNav({ loggedIn }: { loggedIn: boolean }) {
  const t = getDictionary(await getLocale());
  return (
    <nav className="landing-nav">
      <Link href="/" className="landing-logo">
        <img src="/icon.png" alt="" width={24} height={24} className="landing-logo-mark" />
        {t.nav.brand}
      </Link>
      <div className="landing-nav-links">
        <Link href="/pricing">{t.nav.tarifs}</Link>
        <Link href="/faq">{t.nav.faq}</Link>
        <Link href="/aide">{t.nav.aide}</Link>
        {loggedIn ? (
          <Link href="/dashboard" className="landing-btn landing-btn-primary">{t.nav.allerEspace}</Link>
        ) : (
          <>
            <Link href="/sign-in">{t.nav.seConnecter}</Link>
            <Link href="/sign-up" className="landing-btn landing-btn-primary">{t.nav.creerCompte}</Link>
          </>
        )}
        <LanguageSwitcher />
      </div>
    </nav>
  );
}

export async function LandingFooter() {
  const t = getDictionary(await getLocale());
  return (
    <footer className="landing-footer">
      <Link href="/pricing">{t.nav.tarifs}</Link>
      <Link href="/faq">{t.nav.faq}</Link>
      <Link href="/aide">{t.nav.aide}</Link>
      <Link href="/sign-in">{t.nav.seConnecter}</Link>
      <Link href="/sign-up">{t.nav.creerCompte}</Link>
    </footer>
  );
}
