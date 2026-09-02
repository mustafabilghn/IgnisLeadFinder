// Canonical Ignis signal dictionary.
// Every phrase list is checked case-insensitively against extracted website text.
// English + Turkish phrases are included since the initial target market is Istanbul.
//
// IMPORTANT: this is the ONLY place keyword lists live. The scoring engine and
// signal extractor both read from here so the "what counts as evidence" logic
// stays in one auditable spot.

export interface SignalDefinition {
  key: string;
  label: string;
  phrases: string[];
  /** Shown in the UI / evidence log to explain what a VERIFIED hit means */
  description: string;
}

export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    key: "b2b_explicit",
    label: "B2B explicitly stated",
    phrases: ["b2b", "business to business", "b2b müşteri", "b2b çözüm", "b2b platform"],
    description: "The site explicitly describes B2B operations.",
  },
  {
    key: "wholesale",
    label: "Wholesale",
    phrases: ["wholesale", "toptan satış", "toptan fiyat", "toptan"],
    description: "The site mentions wholesale selling.",
  },
  {
    key: "distributor",
    label: "Distributor",
    phrases: ["distributor", "distribütör", "distribütörlük", "yetkili distribütör"],
    description: "The site identifies the company as a distributor.",
  },
  {
    key: "dealer_network",
    label: "Dealer network",
    phrases: [
      "dealer network",
      "bayi ağı",
      "bayilik ağı",
      "bayilerimiz",
      "yetkili bayi",
      "bayi listesi",
    ],
    description: "The site references an existing dealer network.",
  },
  {
    key: "become_dealer",
    label: "Recruiting dealers",
    phrases: [
      "become a dealer",
      "become our dealer",
      "bayilik başvurusu",
      "bayi ol",
      "bayimiz olun",
      "bayilik için başvurun",
    ],
    description: "The site actively recruits new dealers.",
  },
  {
    key: "dealer_portal",
    label: "Dealer portal",
    phrases: ["dealer portal", "dealer login", "bayi girişi", "bayi paneli", "bayi girisi"],
    description: "A dedicated login/portal exists for dealers.",
  },
  {
    key: "corporate_customers",
    label: "Corporate customer focus",
    phrases: ["corporate customer", "kurumsal müşteri", "kurumsal çözümler", "kurumsal satış"],
    description: "The site addresses corporate/institutional customers.",
  },
  {
    key: "custom_production",
    label: "Custom-sized / custom production",
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
    description: "Products are made or sized to customer specification.",
  },
  {
    key: "technical_specs",
    label: "Technical specifications",
    phrases: [
      "technical specification",
      "datasheet",
      "teknik özellik",
      "teknik şartname",
      "teknik çizim",
      "teknik döküman",
    ],
    description: "Technical specs/datasheets are published for products.",
  },
  {
    key: "configurable_products",
    label: "Configurable products",
    phrases: ["configurator", "configurable", "konfigüratör", "yapılandırma seçenekleri"],
    description: "Products can be configured with options/variants.",
  },
  {
    key: "project_based",
    label: "Project-based work",
    phrases: [
      "project based",
      "project-based",
      "proje bazlı",
      "projeye özel",
      "anahtar teslim",
      "turnkey project",
    ],
    description: "Work is delivered as customer-specific projects.",
  },
  {
    key: "quotation_process",
    label: "Quotation process",
    phrases: [
      "request a quote",
      "get a quote",
      "quote request",
      "fiyat teklifi",
      "teklif al",
      "teklif isteyin",
      "teklif formu",
    ],
    description: "A formal request-a-quote flow exists.",
  },
  {
    key: "online_order",
    label: "Online ordering",
    phrases: [
      "place an order",
      "online order",
      "online sipariş",
      "sipariş ver",
      "add to cart",
      "sepete ekle",
    ],
    description: "Orders can be placed directly online.",
  },
  {
    key: "whatsapp_present",
    label: "WhatsApp channel available",
    phrases: ["whatsapp"],
    description: "A WhatsApp contact link/icon is present.",
  },
  {
    key: "whatsapp_orders",
    label: "Orders taken via WhatsApp",
    phrases: [
      "whatsapp üzerinden sipariş",
      "whatsapp'tan sipariş",
      "whatsapp ile sipariş",
      "orders via whatsapp",
      "order via whatsapp",
      "whatsapp destek hattı",
      "whatsapp sipariş hattı",
    ],
    description: "The site explicitly states orders are accepted via WhatsApp.",
  },
  {
    key: "erp_mentioned",
    label: "ERP / business software",
    phrases: [" erp", "erp ", "enterprise resource planning", "logo yazılım", "netsis", " sap "],
    description: "The site references an ERP or named business software system.",
  },
  {
    key: "multiple_locations",
    label: "Multiple locations",
    phrases: ["şubelerimiz", "our branches", "bölge bayileri", "fabrika ve şubeler", "showroom"],
    description: "More than one physical location is referenced.",
  },
  {
    key: "sales_support",
    label: "Dedicated sales support",
    phrases: ["satış destek", "sales support", "müşteri temsilcisi", "satış temsilcisi"],
    description: "A dedicated sales/account support function is mentioned.",
  },
  {
    key: "production_coordination",
    label: "Production coordination",
    phrases: [
      "üretim planlama",
      "production planning",
      "production coordination",
      "üretim koordinasyon",
    ],
    description: "Production planning/coordination is referenced.",
  },
  {
    key: "large_catalog_hint",
    label: "Product catalog",
    phrases: ["ürün kataloğu", "product catalog", "katalog indir", "download catalog"],
    description: "A formal product catalog is published.",
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
