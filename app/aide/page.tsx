import Link from "next/link";
import { getLocale, getDictionary } from "@/lib/i18n/server";

export default async function AidePage() {
  const t = getDictionary(await getLocale());
  const a = t.aide;

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/">{a.back}</Link>
      </div>

      <h1>{a.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 16 }}>
        {a.introBefore} <Link href="/faq">{a.introLink}</Link>{a.introAfter}
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.account.h2}</h2>
      <p className="secondary-text">
        {a.account.before} <Link href="/sign-up">{a.account.link}</Link> {a.account.after}
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.dictaphone.h2}</h2>
      <p className="secondary-text">{a.dictaphone.body}</p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.visio.h2}</h2>
      <p className="secondary-text">{a.visio.body}</p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.calendar.h2}</h2>
      <p className="secondary-text">
        {a.calendar.before} <Link href="/settings/calendar">{a.calendar.link}</Link>{a.calendar.after}
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.consult.h2}</h2>
      <p className="secondary-text">{a.consult.body}</p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>{a.rights.h2}</h2>
      <p className="secondary-text">
        {a.rights.before} <Link href="/rgpd">{a.rights.link}</Link> {a.rights.mid}{" "}
        <Link href="/settings/rgpd">{a.rights.link2}</Link>{a.rights.after}
      </p>
    </div>
  );
}
