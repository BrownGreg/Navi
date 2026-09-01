import { cookies } from "next/headers";
import Link from "next/link";

// Verifie juste la presence du cookie de session (pas sa validite - inutile
// pour une simple adaptation du CTA, /dashboard revalide de toute facon et
// renvoie vers /sign-in si le cookie est perime).
export async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("navi_session")?.value);
}

export function LandingNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav className="landing-nav">
      <Link href="/" className="landing-logo">
        <img src="/icon.png" alt="" width={24} height={24} className="landing-logo-mark" />
        Navi
      </Link>
      <div className="landing-nav-links">
        <Link href="/pricing">Tarifs</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/aide">Aide</Link>
        {loggedIn ? (
          <Link href="/dashboard" className="landing-btn landing-btn-primary">Aller a mon espace</Link>
        ) : (
          <>
            <Link href="/sign-in">Connexion</Link>
            <Link href="/sign-up" className="landing-btn landing-btn-primary">Creer un compte</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <Link href="/pricing">Tarifs</Link>
      <Link href="/faq">FAQ</Link>
      <Link href="/aide">Aide</Link>
      <Link href="/sign-in">Connexion</Link>
      <Link href="/sign-up">Creer un compte</Link>
    </footer>
  );
}
