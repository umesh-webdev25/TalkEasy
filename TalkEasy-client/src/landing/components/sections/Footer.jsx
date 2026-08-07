import { memo } from 'react';
import { X, Mail } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z" />
  </svg>
);

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Showcase', href: '#showcase' },
      { label: 'Capabilities', href: '#capabilities' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#why' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
];

export const Footer = memo(function Footer() {
  return (
    <footer className="relative border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/40">
      <div className="mx-auto max-w-[1400px] px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <a href="#hero" className="flex items-center gap-2.5" aria-label="TalkEasy home">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--text-primary)] text-[var(--bg-app)] text-sm font-bold">
                T
              </span>
              <span className="text-[16px] font-bold tracking-tight text-app-text">TalkEasy</span>
            </a>
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-app-text-secondary">
              The AI assistant that listens, thinks & speaks naturally.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {[
                { icon: X, label: 'Twitter / X', href: '#' },
                { icon: GithubIcon, label: 'GitHub', href: '#' },
                { icon: LinkedinIcon, label: 'LinkedIn', href: '#' },
                { icon: Mail, label: 'Email', href: 'mailto:talkeasyofficial100@gmail.com' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] text-app-text-muted transition-colors duration-300 hover:border-[var(--text-primary)] hover:text-app-text"
                >
                  <Icon size={15} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-app-text-muted">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13.5px] font-medium text-app-text-secondary transition-colors duration-200 hover:text-app-text"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-7 sm:flex-row">
          <p className="text-[12px] text-app-text-muted">© {new Date().getFullYear()} TalkEasy AI. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-[12px] text-app-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
});