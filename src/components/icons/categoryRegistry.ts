/**
 * Ícones de entidade (contas, cartões, categorias, ativos) escolhidos pelo
 * usuário no IconPicker — conjunto separado do registry.ts (ícones de UI/chrome).
 */
export const CATEGORY_ICONS = {
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="9" width="17" height="8" rx="4" transform="rotate(-35 12 13)"/><path d="M11 9.5l4 6.5"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6"/><path d="M3 18v2M21 18v2M3 12V7M9 12V9a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>',
  wall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 11h18M7 16v2M17 16v2"/><circle cx="7.5" cy="18.5" r="1"/><circle cx="16.5" cy="18.5" r="1"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2-3 2-3 .6-3 2 1.3 2.5 3 2.5 3-1.1 3-2.5"/></svg>',
  piggybank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-3.9 3.6-7 8-7 3 0 5.6 1.4 7 3.5h2l-1 3 1 2h-2c-.6 1.7-1.9 3-3.5 3.7V19h-3v-1.2c-.7.1-1.3.2-2 .2s-1.3-.1-2-.2V19H6v-2.5C4.8 15.7 4 14 4 12z"/><circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/></svg>',
  wallet2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h13a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M16 12.5a1.5 1.5 0 100 0"/><path d="M18 10v-.5a2 2 0 00-2-2H6"/></svg>',
  game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="4"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="13" r="1" fill="currentColor" stroke="none"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8M5 2v5a2 2 0 004 0V2M17 2c-2 2-2 5-2 7 0 1.5 1 2 2 2v11M7 10v11"/></svg>',
  coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z"/><path d="M17 9h1.5a2.5 2.5 0 010 5H17"/><path d="M8 2c-.5 1 .5 1.5 0 3M12 2c-.5 1 .5 1.5 0 3"/></svg>',
  burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10c0-3 4-5 9-5s9 2 9 5"/><path d="M2.5 10h19M3 14h18M4 18h16"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-3.5 0-6 2.8-6 6.5S8.5 21 11 21c1 0 1.3-.5 2-.5s1 .5 2 .5c2.2 0 5-2.8 5-6.5-.2-3-2.2-5-4.5-5-1 0-1.7.5-2.5.5S13 8 12 8z"/><path d="M12 8c0-2 1-3.5 2.5-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 5c-2.5 4.5-9.5 9-9.5 9z"/><path d="M6 12h2.5l1.5-2.5L11.5 15l1.5-3H18"/></svg>',
  hospital: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/><path d="M3 21h18"/><path d="M12 7v5M9.5 9.5h5"/><path d="M9 21v-4h6v4"/></svg>',
  stethoscope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v6a4 4 0 008 0V3"/><path d="M10 13v2a6 6 0 006 6 6 6 0 006-6v-1.5"/><circle cx="22" cy="12.5" r="1.5"/></svg>',
  dental: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 6 5 6 8.5c0 3 1 5 1.5 8 .3 1.7 1 3.5 2.2 3.5.9 0 1-1.5 1.3-3 .3-1.3.6-2.5 1-2.5s.7 1.2 1 2.5c.3 1.5.4 3 1.3 3 1.2 0 1.9-1.8 2.2-3.5.5-3 1.5-5 1.5-8C18 5 16 2 12 2z"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16V9l2-4h12l2 4v7"/><path d="M4 16h16M6 16v2M18 16v2"/><circle cx="7.5" cy="18.5" r="1.3"/><circle cx="16.5" cy="18.5" r="1.3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></svg>',
  health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>',
  education: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-4 9 4-9 4-9-4z"/><path d="M7 11v5c2 2 8 2 10 0v-5"/></svg>',
  leisure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="9" rx="4"/><path d="M8 12.5h-3M6.5 11v3"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/></svg>',
  clothes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z"/></svg>',
  salary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.5 9.8c0-1-1-1.6-2.5-1.6-1.6 0-2.6.8-2.6 1.9 0 2.7 5.5 1.3 5.5 4 0 1.2-1.2 2-2.9 2-1.6 0-2.8-.7-3-1.9"/></svg>',
  investment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l5-6 4 3 6-8"/><path d="M14 6h5v5"/></svg>',
  bills: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 3L5 13h6l-1 8 8-11h-6z"/></svg>',
  pet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="1.6"/><circle cx="15.5" cy="7" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/><circle cx="5.5" cy="12.5" r="1.6"/><path d="M12 21c-3 0-5-1.6-5-3.8 0-2 1.8-3.4 3-4.7 1-1 1-2 2-2s1 1 2 2c1.2 1.3 3 2.7 3 4.7 0 2.2-2 3.8-5 3.8z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="4"/><rect x="5" y="13" width="14" height="7"/><path d="M12 9v11M12 9c-1.8 0-3-1-3-2.5S10 4 12 6c0-2 1.5-2.5 3-2.5S18 4.7 15 6.5c0 0 0 2.5-3 2.5z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.2h2"/></svg>',
  sport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6.2c2 2 10 2 12 0M6 17.8c2-2 10-2 12 0"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2A2 2 0 009.3 17H18a2 2 0 002-1.6L21.5 8H6"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/></svg>',
  fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V6a2 2 0 012-2h5a2 2 0 012 2v15"/><path d="M5 13h9M14 9l3 2v6a1.5 1.5 0 003 0v-4l-2.5-2.5"/><path d="M4 21h11"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 14h5"/></svg>',
  bandeiraMastercard: '<svg viewBox="0 0 24 24"><circle cx="9" cy="12" r="6.5" fill="#EB001B"/><circle cx="15" cy="12" r="6.5" fill="#F79E1B" fill-opacity="0.9"/></svg>',
  bandeiraVisa: '<svg viewBox="0 0 24 24"><text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="800" font-family="Arial,sans-serif" fill="#1A1F71" font-style="italic">VISA</text></svg>',
  bandeiraOutros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/></svg>',
  bandeiraMastercardMono: '<svg viewBox="0 0 24 24"><circle cx="9" cy="12" r="6.5" fill="currentColor" opacity="0.9"/><circle cx="15" cy="12" r="6.5" fill="currentColor" opacity="0.55"/></svg>',
  bandeiraVisaMono: '<svg viewBox="0 0 24 24"><text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="800" font-family="Arial,sans-serif" fill="currentColor" font-style="italic">VISA</text></svg>',
  bandeiraOutrosMono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/></svg>',
  tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h9l3 3v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 01-5.4 5.4L4 17l3 3 5.1-5.1a4 4 0 015.4-5.4l-2.5 2.5-2-2z"/></svg>',
  books: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5c2-1 5-1 7 0v15c-2-1-5-1-7 0z"/><path d="M20 4.5c-2-1-5-1-7 0v15c2-1 5-1 7 0z"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="16" r="2.2"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5V5a1.5 1.5 0 011.5-1.5h4A1.5 1.5 0 0115.5 5v2.5M3 12.5h18"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5"/><path d="M5 9v10M9.5 9v10M14.5 9v10M19 9v10"/><path d="M3 19h18M3 9h18"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 10h14a3 3 0 013 3v1a3 3 0 01-3 3H3"/><circle cx="16" cy="13.5" r="1" fill="currentColor" stroke="none"/></svg>',
  piggy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a6 6 0 016-6h4a5 5 0 015 5v.5l2 1-1 2h-1v2h-3v-2H9v2H6v-3a4 4 0 01-2-3.5z"/><circle cx="8.5" cy="11" r=".6" fill="currentColor" stroke="none"/><path d="M9 7V5.5M14 7l1-2"/></svg>',
  certificate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M10 16.5L9 21l3-1.5 3 1.5-1-4.5"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 1.8-2.5 3.8"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 7v10M17.5 7v10M2.5 10v4M21.5 10v4M6.5 12h11"/></svg>',
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16l7-2 4 5 2-1-2-6 6-4c1-.7 1-2 0-2.5-.7-.4-1.5-.3-2 .2l-6 4-6-2-2 1 5 4-7 2z"/></svg>',
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7l3.5 2.5-1.3 4.2H9.8L8.5 9.5z"/><path d="M12 3v4M3.5 9l3.8 1.2M20.5 9l-3.8 1.2M6 20l1.3-5M18 20l-1.3-5"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9.5a15 15 0 0119 0"/><path d="M5.7 13a10.5 10.5 0 0112.6 0"/><path d="M9 16.5a5.8 5.8 0 016 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></svg>',
  water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s7 7.5 7 12.5a7 7 0 01-14 0C5 10.5 12 3 12 3z"/></svg>',
  electricity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  streaming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="13" rx="2"/><path d="M9 22h6M12 17.5V22"/><path d="M10.5 8.3v4.4l3.8-2.2z" fill="currentColor" stroke="none"/></svg>',
  subscription: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
} as const;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export const CATEGORY_ICON_KEYS = (Object.keys(CATEGORY_ICONS) as CategoryIconName[]).filter(
  (k) => !k.toLowerCase().startsWith("bandeira"),
);

/** Mapeia emojis usados em versões antigas do app para as chaves de ícone atuais. */
const LEGACY_EMOJI_ICON_MAP: Record<string, CategoryIconName> = {
  "🍔": "food", "🚗": "car", "🏠": "home", "💊": "health", "🎓": "education", "🎮": "leisure", "👕": "clothes",
  "✈️": "plane", "💰": "salary", "📈": "investment", "💡": "bills", "🐾": "pet", "🎁": "gift", "📱": "phone",
  "⚽": "sport", "🛒": "cart", "⛽": "fuel", "💳": "card", "🧾": "tax", "🔧": "tools", "📚": "books", "🎵": "music",
  "💼": "briefcase", "❓": "other",
};

export function resolveIconKey(icone: string | null | undefined): CategoryIconName | "" {
  if (!icone) return "";
  if (icone in CATEGORY_ICONS) return icone as CategoryIconName;
  if (LEGACY_EMOJI_ICON_MAP[icone]) return LEGACY_EMOJI_ICON_MAP[icone];
  return "";
}
