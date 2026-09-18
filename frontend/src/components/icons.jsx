// Simple original stroke-style icon set (24x24, currentColor)
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 }

export const Icon = {
  leaf: (p) => <svg {...base} strokeLinecap="round" {...p}><path d="M4 20c8-1 13-6 15-15-9 1-14 6-15 15Z"/><path d="M6 18c2-4 5-7 9-9"/></svg>,
  target: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>,
  droplet: (p) => <svg {...base} {...p}><path d="M12 3c4 5 7 8.5 7 12a7 7 0 1 1-14 0c0-3.5 3-7 7-12Z"/></svg>,
  box: (p) => <svg {...base} strokeLinejoin="round" {...p}><path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>,
  heart: (p) => <svg {...base} {...p}><path d="M12 20s-7-4.4-9.5-9C.8 7.2 3 4 6.4 4 8.6 4 10.6 5.3 12 7c1.4-1.7 3.4-3 5.6-3 3.4 0 5.6 3.2 3.9 7-2.5 4.6-9.5 9-9.5 9Z"/></svg>,
  activity: (p) => <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12h4l2 8 4-16 2 8h6"/></svg>,
  search: (p) => <svg {...base} {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5"/></svg>,
  cart: (p) => <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/></svg>,
  check: (p) => <svg {...base} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12l5 5L20 6"/></svg>,
  arrowLeft: (p) => <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  truck: (p) => <svg {...base} strokeLinejoin="round" {...p}><path d="M2 7h11v9H2z"/><path d="M13 10h4l4 3v3h-8z"/><circle cx="6.5" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg>,
  package: (p) => <svg {...base} strokeLinejoin="round" {...p}><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M3 7l9-4 9 4M12 3v4"/></svg>,
  pin: (p) => <svg {...base} {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.4"/></svg>,
  user: (p) => <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>,
  grain: (p) => <svg {...base} {...p}><path d="M12 2c3 3 3 8 0 11-3-3-3-8 0-11Z"/><path d="M12 13v9M9 22h6"/></svg>,
  nut: (p) => <svg {...base} {...p}><path d="M12 3c4 0 6 3.5 6 8s-2 10-6 10-6-5.5-6-10 2-8 6-8Z"/><path d="M12 3v18"/></svg>,
}
