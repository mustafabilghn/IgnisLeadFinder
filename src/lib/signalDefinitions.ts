// Canonical Ignis signal dictionary.
// Every phrase list is checked case-insensitively against extracted website text.
// English + Turkish phrases are included since the initial target market is Istanbul.
//
// IMPORTANT: this is the ONLY place keyword lists live. The scoring engine and
// signal extractor both read from here so the "what counts as evidence" logic
// stays in one auditable spot. `label`/`description` are Turkish (UI text);
// `key`, `phrases`, and `proximity` are detection logic and unrelated to
// display language, so they stay as-is.

export interface SignalDefinition {
  key: string;
  label: string;
  phrases: string[];
  /** Shown in the UI / evidence log to explain what a VERIFIED hit means */
  description: string;
  /**
   * Optional fallback for when the exact phrase list misses a real-world
   * variant a fixed string can't enumerate — e.g. Turkish possessive/verb
   * suffixes ("bayimiz OLUN" vs "bayimizIN olun") or a near-synonym used in
   * place of the expected word ("whatsapp İLETİŞİM" for wholesale orders
   * instead of "whatsapp SİPARİŞ"). Matches when `anchor` appears within
   * `radius` characters of any `contextWords` entry. Deliberately narrow:
   * only added where real (non-mock) website text was found to genuinely
   * contain the signal but miss every literal phrase above.
   */
  proximity?: { anchor: string; contextWords: string[]; radius: number };
}

export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    key: "b2b_explicit",
    label: "B2B açıkça belirtilmiş",
    phrases: ["b2b", "business to business", "b2b müşteri", "b2b çözüm", "b2b platform"],
    description: "Site B2B operasyonlarını açıkça tanımlıyor.",
  },
  {
    key: "wholesale",
    label: "Toptan satış",
    phrases: ["wholesale", "toptan satış", "toptan fiyat", "toptan"],
    description: "Site toptan satıştan bahsediyor.",
  },
  {
    key: "distributor",
    label: "Distribütör",
    phrases: ["distributor", "distribütör", "distribütörlük", "yetkili distribütör"],
    description: "Site şirketi distribütör olarak tanımlıyor.",
  },
  {
    key: "dealer_network",
    label: "Bayi ağı",
    phrases: [
      "dealer network",
      "bayi ağı",
      "bayilik ağı",
      "bayilerimiz",
      "yetkili bayi",
      "bayi listesi",
    ],
    description: "Site mevcut bir bayi ağına referans veriyor.",
  },
  {
    key: "become_dealer",
    label: "Bayi arıyor",
    phrases: [
      "become a dealer",
      "become our dealer",
      "bayilik başvurusu",
      "bayi ol",
      "bayimiz olun",
      "bayilik için başvurun",
    ],
    // Real example: "Bayimizin Olun" (a common e-commerce marketing-badge
    // variant with a possessive suffix) doesn't match "bayimiz olun" above.
    proximity: { anchor: "bayi", contextWords: ["olun", "katılın", "katilin"], radius: 20 },
    description: "Site aktif olarak yeni bayi arıyor.",
  },
  {
    key: "dealer_portal",
    label: "Bayi portalı",
    phrases: ["dealer portal", "dealer login", "bayi girişi", "bayi paneli", "bayi girisi"],
    description: "Bayiler için özel bir giriş/portal mevcut.",
  },
  {
    key: "corporate_customers",
    label: "Kurumsal müşteri odağı",
    phrases: ["corporate customer", "kurumsal müşteri", "kurumsal çözümler", "kurumsal satış"],
    description: "Site kurumsal/resmi müşterilere hitap ediyor.",
  },
  {
    key: "custom_production",
    label: "Özel ölçü / özel üretim",
    phrases: [
      "custom size",
      "custom production",
      "custom-made",
      "made to order",
      "özel ölçü",
      "özel üretim",
      "ölçüye özel",
      "size özel üretim",
    ],
    description: "Ürünler müşteri talebine göre üretiliyor veya ölçüleniyor.",
  },
  {
    key: "technical_specs",
    label: "Teknik özellikler",
    phrases: [
      "technical specification",
      "datasheet",
      "teknik özellik",
      "teknik şartname",
      "teknik çizim",
      "teknik döküman",
    ],
    description: "Ürünler için teknik özellik/döküman yayınlanmış.",
  },
  {
    key: "configurable_products",
    label: "Konfigüre edilebilir ürünler",
    phrases: ["configurator", "configurable", "konfigüratör", "yapılandırma seçenekleri"],
    description: "Ürünler seçenek/varyantlarla yapılandırılabiliyor.",
  },
  {
    key: "project_based",
    label: "Proje bazlı çalışma",
    phrases: [
      "project based",
      "project-based",
      "proje bazlı",
      "projeye özel",
      "anahtar teslim",
      "turnkey project",
    ],
    description: "Çalışmalar müşteriye özel projeler olarak yürütülüyor.",
  },
  {
    key: "quotation_process",
    label: "Teklif süreci",
    phrases: [
      "request a quote",
      "get a quote",
      "quote request",
      "fiyat teklifi",
      "teklif al",
      "teklif isteyin",
      "teklif formu",
    ],
    description: "Resmi bir teklif alma akışı mevcut.",
  },
  {
    key: "online_order",
    label: "Online sipariş",
    phrases: [
      "place an order",
      "online order",
      "online sipariş",
      "sipariş ver",
      "add to cart",
      "sepete ekle",
    ],
    description: "Siparişler doğrudan online verilebiliyor.",
  },
  {
    key: "whatsapp_present",
    label: "WhatsApp kanalı mevcut",
    phrases: ["whatsapp"],
    description: "Bir WhatsApp iletişim linki/ikonu mevcut.",
  },
  {
    key: "whatsapp_orders",
    label: "Siparişler WhatsApp üzerinden alınıyor",
    phrases: [
      "whatsapp üzerinden sipariş",
      "whatsapp'tan sipariş",
      "whatsapp ile sipariş",
      "orders via whatsapp",
      "order via whatsapp",
      "whatsapp destek hattı",
      "whatsapp sipariş hattı",
    ],
    // Real example: "Toptan Alımlar İçin Whatsapp İletişim" (WhatsApp contact
    // for wholesale purchases) is a genuine ordering channel but says
    // "İletişim" (contact), not "Sipariş" (order) — no fixed phrase above
    // can enumerate every such near-synonym, so also match by proximity to
    // any purchase/order-context word.
    proximity: {
      anchor: "whatsapp",
      contextWords: ["sipariş", "siparis", "alım", "alim", "satış", "satis", "toptan", "teklif", "order", "purchase"],
      radius: 50,
    },
    description: "Site siparişlerin WhatsApp üzerinden kabul edildiğini açıkça belirtiyor.",
  },
  {
    key: "erp_mentioned",
    label: "ERP / işletme yazılımı",
    phrases: [" erp", "erp ", "enterprise resource planning", "logo yazılım", "netsis", " sap "],
    description: "Site bir ERP veya isimlendirilmiş işletme yazılımına referans veriyor.",
  },
  {
    key: "multiple_locations",
    label: "Birden fazla lokasyon",
    phrases: ["şubelerimiz", "our branches", "bölge bayileri", "fabrika ve şubeler", "showroom"],
    description: "Birden fazla fiziksel lokasyona referans veriliyor.",
  },
  {
    key: "sales_support",
    label: "Özel satış desteği",
    phrases: ["satış destek", "sales support", "müşteri temsilcisi", "satış temsilcisi"],
    description: "Özel bir satış/müşteri destek fonksiyonu belirtiliyor.",
  },
  {
    key: "production_coordination",
    label: "Üretim koordinasyonu",
    phrases: [
      "üretim planlama",
      "production planning",
      "production coordination",
      "üretim koordinasyon",
    ],
    description: "Üretim planlama/koordinasyonuna referans veriliyor.",
  },
  {
    key: "large_catalog_hint",
    label: "Ürün kataloğu",
    phrases: ["ürün kataloğu", "product catalog", "katalog indir", "download catalog"],
    description: "Resmi bir ürün kataloğu yayınlanmış.",
  },
];

export const SIGNAL_MAP: Record<string, SignalDefinition> = Object.fromEntries(
  SIGNAL_DEFINITIONS.map((s) => [s.key, s]),
);

/** Keywords used to decide which extra same-domain pages are worth a lightweight fetch. */
export const RELEVANT_LINK_KEYWORDS = [
  "dealer",
  "bayi",
  "wholesale",
  "toptan",
  "distributor",
  "distribütör",
  "b2b",
  "about",
  "hakkımızda",
  "hakkimizda",
  "corporate",
  "kurumsal",
  "contact",
  "iletişim",
  "iletisim",
  "product",
  "ürün",
  "urun",
  "catalog",
  "katalog",
  "quote",
  "teklif",
];

/** Link-text keywords used as a structural proxy for "large product catalog". */
export const PRODUCT_LINK_KEYWORDS = [
  "product",
  "ürün",
  "urun",
  "katalog",
  "catalog",
  "collection",
  "koleksiyon",
];
