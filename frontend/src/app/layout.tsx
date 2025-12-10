import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career GENAI Mentor",
  description: "AI-powered role fit analysis and learning roadmap",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload CV" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="app-root">
          <div className="app-content-layer">
            <header className="app-header">
              <div className="app-header-inner">
                <Link href="/" className="app-brand">
                  <div className="app-brand-logo">AI</div>
                  <div>
                    <div className="app-brand-title">Career GENAI Mentor</div>
                    <div className="app-brand-subtitle">
                      Role intelligence for ML / Data / AI careers
                    </div>
                  </div>
                </Link>

                <nav className="app-nav">
                  {navLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="app-nav-link"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <Link href="/upload" className="btn btn-primary">
                  Analyze my CV
                </Link>
              </div>
            </header>

            <main className="app-main">{children}</main>

            <footer className="app-footer">
              <div className="app-footer-inner">
                <span>Career GENAI Mentor · Portfolio project</span>
                <span>Next.js · FastAPI · Postgres · LLM · Docker</span>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
