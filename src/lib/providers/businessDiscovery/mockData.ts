// Hand-authored mock businesses for the three scenarios named in the spec
// (Beylikdüzü/Aluminum, İkitelli/Industrial Distributor, Esenyurt/Metal),
// plus a procedural generator so arbitrary location/category input still
// returns *something* — never hard-coded to only these three industries.
//
// Every mock website "page" below is fabricated for demo purposes only.
// Nothing here is presented as real business data (see MockBusinessProvider).

export interface MockPage {
  path: string;
  title: string;
  paragraphs: string[];
}

export interface MockBusinessSeed {
  id: string;
  name: string;
  category: string;
  tags: string[];
  district: string;
  city: string;
  country: string;
  phone: string;
  /** null = no website on file. ".invalid" domain = website present but unreachable (demo of error handling). */
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  homepage?: MockPage;
  extraPage?: MockPage;
}

function html(title: string, paragraphs: string[]): string {
  return `<html><head><title>${title}</title></head><body>${paragraphs
    .map((p) => `<p>${p}</p>`)
    .join("\n")}</body></html>`;
}

export function pageToHtml(page: MockPage): string {
  return html(page.title, page.paragraphs);
}

export function findMockSeedById(id: string): MockBusinessSeed | undefined {
  return MOCK_BUSINESS_SEEDS.find((s) => s.id === id);
}

/** Deterministically rebuilds plausible homepage HTML for a procedurally-generated
 * lead at rescan time, keyed off its own stable id so repeated rescans agree. */
export function regenerateProceduralHtml(providerId: string, name: string, category: string): string {
  const seedBase = hashToInt(providerId);
  const signalCount = 2 + (seedBase % 5);
  const phrases = pick(SIGNAL_PHRASE_POOL, signalCount, seedBase);
  return html(name, [`${name} olarak ${category.toLowerCase()} alanında faaliyet gösteriyoruz.`, ...phrases]);
}

export const MOCK_BUSINESS_SEEDS: MockBusinessSeed[] = [
  // ── Beylikdüzü — Aluminum / PVC / Glass ────────────────────────────────
  {
    id: "mock-alu-001",
    name: "Beylik Alüminyum San. ve Tic. A.Ş.",
    category: "Aluminum Manufacturer",
    tags: ["aluminum", "alüminyum", "pvc", "glass", "cam", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 01 12",
    website: "https://beylikaluminyum.ignis-mock.local",
    rating: 4.5,
    reviewCount: 89,
    homepage: {
      path: "/",
      title: "Beylik Alüminyum | B2B Alüminyum Doğrama ve Cephe Sistemleri",
      paragraphs: [
        "Beylik Alüminyum, 1998'den bu yana B2B müşterilerine ve bayilerimize alüminyum doğrama, cephe ve pencere sistemleri üretmektedir.",
        "Türkiye genelinde geniş bir bayi ağı ile çalışıyoruz. Bayilik başvurusu için bizimle iletişime geçebilirsiniz.",
        "Tüm ürünlerimiz projeye özel ölçü ve teknik şartname doğrultusunda özel üretim olarak hazırlanır.",
        "Siparişleriniz için WhatsApp destek hattımızdan bize ulaşabilir, WhatsApp üzerinden sipariş oluşturabilirsiniz.",
        "Üretim planlama ve sipariş süreçlerimiz Logo Yazılım ERP sistemimize entegre şekilde yürütülmektedir.",
        "Toptan satış ve yetkili distribütör kanalımızla, online konfigüratör aracımızdan ölçülerinizi girip online sipariş oluşturabilirsiniz.",
        "Ürün kataloğumuzu inceleyebilir, şubelerimiz ve satış destek ekibimizle iletişime geçebilirsiniz.",
      ],
    },
    extraPage: {
      path: "/bayilik",
      title: "Bayilik | Beylik Alüminyum",
      paragraphs: [
        "Bayi ağımıza katılmak isteyen kurumsal müşteriler için bayilik başvurusu formu aşağıdadır.",
        "Bayi girişi paneli üzerinden sipariş takibi ve fiyat teklifi alabilirsiniz.",
      ],
    },
  },
  {
    id: "mock-alu-002",
    name: "Marmara PVC Sistemleri Ltd. Şti.",
    category: "PVC Manufacturer",
    tags: ["aluminum", "pvc", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 02 44",
    website: "https://marmarapvc.ignis-mock.local",
    rating: 4.2,
    reviewCount: 54,
    homepage: {
      path: "/",
      title: "Marmara PVC Sistemleri",
      paragraphs: [
        "Marmara PVC, toptan satış ve distribütörlük kanalıyla PVC pencere/kapı sistemleri sunar.",
        "Online konfigüratör aracımızla ölçülerinizi girip anında fiyat teklifi alabilirsiniz.",
        "Bayi paneli üzerinden sipariş oluşturan kurumsal müşterilerimize öncelikli üretim planlama uygulanır.",
        "Fiyat teklifi için teklif formu doldurabilir veya satış temsilcimizle görüşebilirsiniz.",
      ],
    },
  },
  {
    id: "mock-alu-003",
    name: "Cam Dünyası Beylikdüzü",
    category: "Glass Manufacturer",
    tags: ["glass", "cam", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 03 19",
    website: "https://camdunyasi.ignis-mock.local",
    rating: 4.0,
    reviewCount: 31,
    homepage: {
      path: "/",
      title: "Cam Dünyası | Cephe ve Temperli Cam Çözümleri",
      paragraphs: [
        "Cam Dünyası, B2B inşaat firmalarına özel ölçü temperli cam üretimi yapmaktadır.",
        "Cephe projeleri için proje bazlı üretim ve anahtar teslim çözümler sunuyoruz.",
        "Kurumsal müşterilerimiz teknik çizim ve teknik şartname paylaşarak sipariş verebilir.",
      ],
    },
  },
  {
    id: "mock-alu-004",
    name: "Elit Alüminyum Doğrama",
    category: "Aluminum Manufacturer",
    tags: ["aluminum", "alüminyum", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 04 77",
    website: "https://elitaluminyum.ignis-mock.local",
    rating: 3.8,
    reviewCount: 22,
    homepage: {
      path: "/",
      title: "Elit Alüminyum Doğrama",
      paragraphs: [
        "Elit Alüminyum, mahalle esnafına ve bireysel müşterilere kapı-pencere doğrama hizmeti sunar.",
        "Toptan satış seçeneklerimiz için bizi arayabilirsiniz.",
        "Adresimize gelerek showroom'umuzu ziyaret edebilirsiniz.",
      ],
    },
  },
  {
    id: "mock-alu-005",
    name: "Beylikdüzü Cephe Sistemleri",
    category: "Facade Systems Manufacturer",
    tags: ["aluminum", "glass", "facade", "cephe", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 05 88",
    website: "https://beylikducephe.ignis-mock.local",
    rating: 4.6,
    reviewCount: 47,
    homepage: {
      path: "/",
      title: "Beylikdüzü Cephe Sistemleri | Kurumsal Cephe Çözümleri",
      paragraphs: [
        "20 yıllık tecrübemizle kurumsal müşterilere ve inşaat distribütörlerine anahtar teslim cephe projeleri sunuyoruz.",
        "Her proje, mimari teknik şartname ve özel ölçü gereksinimlerine göre projeye özel olarak planlanır.",
        "Bayi ağımız ve şubelerimiz aracılığıyla Türkiye genelinde üretim koordinasyon sağlıyoruz.",
        "Sipariş ve üretim planlama süreçlerimiz kurumsal ERP altyapımızla senkronize çalışır.",
        "Ürün kataloğumuzu indirmek için tıklayın.",
      ],
    },
  },
  {
    id: "mock-alu-006",
    name: "Star Alüminyum",
    category: "Aluminum Manufacturer",
    tags: ["aluminum", "alüminyum", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 06 33",
    // Deliberately unreachable — exercises the live-fetch error path even in a mock-heavy demo.
    website: "https://star-aluminyum-beylikduzu.invalid",
    rating: 3.5,
    reviewCount: 12,
  },
  {
    id: "mock-alu-007",
    name: "Beylikdüzü Doğrama Atölyesi",
    category: "Aluminum Manufacturer",
    tags: ["aluminum", "alüminyum", "beylikduzu", "beylikdüzü"],
    district: "Beylikdüzü",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 555 07 21",
    website: null,
    rating: 3.3,
    reviewCount: 6,
  },

  // ── İkitelli — Industrial Distributor ──────────────────────────────────
  {
    id: "mock-ind-001",
    name: "İkitelli Endüstriyel Malzeme Dağıtım A.Ş.",
    category: "Industrial Distributor",
    tags: ["industrial", "distributor", "endüstriyel", "dağıtım", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 11 01",
    website: "https://ikitelliendustriyel.ignis-mock.local",
    rating: 4.4,
    reviewCount: 112,
    homepage: {
      path: "/",
      title: "İkitelli Endüstriyel Malzeme Dağıtım A.Ş.",
      paragraphs: [
        "Türkiye'nin önde gelen endüstriyel malzeme distribütörü olarak B2B müşterilerimize ve bayilerimize hizmet veriyoruz.",
        "10.000'in üzerinde teknik ürünü kapsayan ürün kataloğumuzu indirebilirsiniz; her ürün için datasheet mevcuttur.",
        "Bayi girişi panelimiz ve WhatsApp sipariş hattımız üzerinden 7/24 sipariş verebilirsiniz.",
        "Kurumsal müşteri temsilcilerimiz teklif formunuzu aldıktan sonra 24 saat içinde fiyat teklifi sunar.",
        "Tüm siparişler Netsis ERP sistemimize otomatik olarak aktarılır.",
        "Özel üretim ve projeye özel konfigüratör seçenekleriyle, üretim planlama sürecinizi baştan sona destekliyoruz.",
        "Satış destek ekibimiz ve online sipariş sistemimizle 7/24 yanınızdayız.",
      ],
    },
    extraPage: {
      path: "/bayilik",
      title: "Bayilik Başvurusu",
      paragraphs: ["Bayimiz olun: bölge bayileri ağımıza katılarak avantajlı toptan fiyatlardan yararlanın."],
    },
  },
  {
    id: "mock-ind-002",
    name: "Teknik Hırdavat Toptan",
    category: "Industrial Distributor",
    tags: ["industrial", "distributor", "hırdavat", "hardware", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 12 55",
    website: "https://teknikhirdavat.ignis-mock.local",
    rating: 4.1,
    reviewCount: 76,
    homepage: {
      path: "/",
      title: "Teknik Hırdavat Toptan Satış",
      paragraphs: [
        "Teknik Hırdavat, B2B toptan satış ile inşaat ve sanayi firmalarına hırdavat malzemesi tedarik eder.",
        "Geniş ürün kataloğumuzdan seçim yaparak teklif al butonuyla anında fiyat teklifi alabilirsiniz.",
        "Satış destek ekibimiz kurumsal müşteri taleplerinizi hızlıca yanıtlar.",
      ],
    },
  },
  {
    id: "mock-ind-003",
    name: "Sanayi Bağlantı Elemanları Ltd.",
    category: "Industrial Distributor",
    tags: ["industrial", "distributor", "fastener", "bağlantı", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 13 09",
    website: "https://sanayibaglanti.ignis-mock.local",
    rating: 4.3,
    reviewCount: 58,
    homepage: {
      path: "/",
      title: "Sanayi Bağlantı Elemanları",
      paragraphs: [
        "Cıvata, somun ve bağlantı elemanlarında yetkili distribütör olarak hizmet veriyoruz.",
        "Online sipariş sistemimizden teknik özellik ve ölçüye göre ürün seçimi yapabilirsiniz.",
        "Her ürün için teknik çizim ve teknik şartname dokümanları sitede mevcuttur.",
      ],
    },
  },
  {
    id: "mock-ind-004",
    name: "İkitelli Elektrik Malzemeleri",
    category: "Electrical Distributor",
    tags: ["industrial", "electrical", "elektrik", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 14 62",
    website: "https://ikitellielektrik.ignis-mock.local",
    rating: 3.9,
    reviewCount: 40,
    homepage: {
      path: "/",
      title: "İkitelli Elektrik Malzemeleri",
      paragraphs: [
        "B2B elektrik malzemesi toptan satışı yapıyoruz.",
        "Sorularınız için WhatsApp üzerinden bize ulaşabilirsiniz.",
      ],
    },
  },
  {
    id: "mock-ind-005",
    name: "Hızlı Endüstri Ürünleri",
    category: "Industrial Distributor",
    tags: ["industrial", "endüstri", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 15 30",
    website: "https://hizliendustri.ignis-mock.local",
    rating: 3.6,
    reviewCount: 15,
    homepage: {
      path: "/",
      title: "Hızlı Endüstri Ürünleri",
      paragraphs: ["Endüstriyel ürünler satıyoruz. Adresimize uğrayabilirsiniz."],
    },
  },
  {
    id: "mock-ind-006",
    name: "Metal İş Güvenliği Ekipmanları",
    category: "Industrial Distributor",
    tags: ["industrial", "safety", "iş güvenliği", "ikitelli", "i̇kitelli"],
    district: "İkitelli",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 444 16 84",
    website: "https://metalisguvenligi.ignis-mock.local",
    rating: 4.0,
    reviewCount: 29,
    homepage: {
      path: "/",
      title: "Metal İş Güvenliği Ekipmanları",
      paragraphs: [
        "Fabrikalara toplu iş güvenliği ekipmanı tedariki için kurumsal müşteri çözümleri sunuyoruz.",
        "Proje bazlı teklif için satış temsilcimizle iletişime geçin.",
      ],
    },
  },

  // ── Esenyurt — Metal Manufacturer ──────────────────────────────────────
  {
    id: "mock-met-001",
    name: "Esenyurt Metal Sanayi ve Döküm A.Ş.",
    category: "Metal Manufacturer",
    tags: ["metal", "sanayi", "döküm", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 21 01",
    website: "https://esenyurtmetal.ignis-mock.local",
    rating: 4.5,
    reviewCount: 95,
    homepage: {
      path: "/",
      title: "Esenyurt Metal Sanayi ve Döküm A.Ş.",
      paragraphs: [
        "1985'ten beri B2B müşterilerimize ve bayi ağımıza metal döküm ve işleme hizmeti veriyoruz.",
        "Tüm parçalar müşteriden alınan teknik çizim ve teknik şartnameye göre özel üretim olarak imal edilir.",
        "Kurumsal müşterilerimiz proje bazlı anahtar teslim üretim taleplerini iletebilir.",
        "Üretim planlama ve sipariş takibi ERP sistemimiz üzerinden yürütülür; WhatsApp destek hattımızdan da sipariş oluşturabilirsiniz.",
        "Toptan satış yapan yetkili distribütör ve bayilerimiz, konfigüratör aracımızla online sipariş verebilir.",
      ],
    },
    extraPage: {
      path: "/hakkimizda",
      title: "Hakkımızda",
      paragraphs: [
        "Şubelerimiz ve yetkili bayilerimiz aracılığıyla yurt genelinde hizmet veriyoruz.",
        "Satış destek ekibimiz ve müşteri temsilcisi ekibimiz teklif formunuzu değerlendirip hızlıca dönüş yapar.",
        "Ürün kataloğumuzu inceleyerek özel ölçü taleplerinizi iletebilirsiniz.",
      ],
    },
  },
  {
    id: "mock-met-002",
    name: "Çelik Konstrüksiyon Esenyurt",
    category: "Metal Manufacturer",
    tags: ["metal", "steel", "çelik", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 22 45",
    website: "https://celikkonstruksiyon.ignis-mock.local",
    rating: 4.3,
    reviewCount: 61,
    homepage: {
      path: "/",
      title: "Çelik Konstrüksiyon Esenyurt",
      paragraphs: [
        "Endüstriyel tesisler için anahtar teslim çelik konstrüksiyon projeleri üretiyoruz.",
        "Her proje için teknik şartname inceleyip fiyat teklifi hazırlıyoruz — teklif formu üzerinden başvurabilirsiniz.",
        "Üretim koordinasyon ekibimiz saha teslim sürecini uçtan uca yönetir.",
      ],
    },
  },
  {
    id: "mock-met-003",
    name: "Metal Kesim ve İşleme Ltd.",
    category: "Metal Manufacturer",
    tags: ["metal", "kesim", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 23 19",
    website: "https://metalkesim.ignis-mock.local",
    rating: 4.1,
    reviewCount: 38,
    homepage: {
      path: "/",
      title: "Metal Kesim ve İşleme",
      paragraphs: [
        "Lazer kesim hizmetimizde özel ölçü ve konfigüratör aracımızla dosyanızı yükleyip online sipariş verebilirsiniz.",
        "B2B atölyelere ve imalatçılara toptan fiyatlarla hizmet veriyoruz.",
      ],
    },
  },
  {
    id: "mock-met-004",
    name: "Esenyurt Hırdavat ve Metal",
    category: "Metal Manufacturer",
    tags: ["metal", "hırdavat", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 24 77",
    website: "https://esenyurthirdavat.ignis-mock.local",
    rating: 3.7,
    reviewCount: 19,
    homepage: {
      path: "/",
      title: "Esenyurt Hırdavat ve Metal",
      paragraphs: ["Mahallemizin güvenilir hırdavatçısı. Perakende ve küçük çaplı satış yapılır."],
    },
  },
  {
    id: "mock-met-005",
    name: "Paslanmaz Çelik Ürünleri",
    category: "Metal Manufacturer",
    tags: ["metal", "steel", "paslanmaz", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 25 62",
    website: "https://paslanmazcelik.ignis-mock.local",
    rating: 3.9,
    reviewCount: 26,
    homepage: {
      path: "/",
      title: "Paslanmaz Çelik Ürünleri",
      paragraphs: [
        "Paslanmaz çelik mutfak ekipmanlarında toptan satış yapıyoruz.",
        "Sorularınız için WhatsApp'tan bize yazabilirsiniz.",
      ],
    },
  },
  {
    id: "mock-met-006",
    name: "Demir Doğrama Atölyesi",
    category: "Metal Manufacturer",
    tags: ["metal", "demir", "esenyurt"],
    district: "Esenyurt",
    city: "Istanbul",
    country: "Turkey",
    phone: "+90 212 333 26 08",
    website: null,
    rating: 3.4,
    reviewCount: 8,
  },
];

// ── Procedural fallback for any location/category not covered above ──────

const GENERIC_SUFFIXES = ["Ltd. Şti.", "A.Ş.", "San. ve Tic.", "Endüstri"];

const SIGNAL_PHRASE_POOL: string[] = [
  "B2B müşterilerimize hizmet veriyoruz",
  "toptan satış seçeneklerimiz mevcuttur",
  "yetkili distribütör olarak çalışıyoruz",
  "bayi ağımız Türkiye genelinde hizmet verir",
  "bayilik başvurusu için bize ulaşın",
  "kurumsal müşteri çözümleri sunuyoruz",
  "özel ölçü ve özel üretim yapılmaktadır",
  "teknik özellik ve teknik şartname paylaşılabilir",
  "konfigüratör ile ürününüzü yapılandırabilirsiniz",
  "proje bazlı anahtar teslim çözümler sunuyoruz",
  "fiyat teklifi için teklif formu doldurabilirsiniz",
  "online sipariş verebilirsiniz",
  "WhatsApp destek hattımızdan ulaşabilirsiniz",
  "şubelerimiz aracılığıyla hizmet veriyoruz",
  "satış destek ekibimiz size yardımcı olur",
  "üretim planlama süreçlerimiz düzenlidir",
  "ürün kataloğumuzu inceleyebilirsiniz",
];

function hashToInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(arr: T[], n: number, seedOffset: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  let seed = seedOffset || 1;
  while (result.length < n && copy.length > 0) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const idx = seed % copy.length;
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export function generateProceduralBusinesses(
  city: string,
  district: string | undefined,
  category: string,
  count: number,
): MockBusinessSeed[] {
  const location = district || city;
  const businesses: MockBusinessSeed[] = [];

  for (let i = 0; i < count; i++) {
    const seedBase = hashToInt(`${city}|${district ?? ""}|${category}|${i}`);
    const suffix = GENERIC_SUFFIXES[seedBase % GENERIC_SUFFIXES.length];
    const name = `${location} ${category} ${suffix}`;
    const signalCount = 2 + (seedBase % 5); // 2–6 signal phrases → varied fit levels
    const phrases = pick(SIGNAL_PHRASE_POOL, signalCount, seedBase);
    const rating = Math.round((3.3 + ((seedBase % 150) / 100)) * 10) / 10;
    const reviewCount = 5 + (seedBase % 140);

    const websiteRoll = seedBase % 10;
    let website: string | null;
    if (websiteRoll === 0) {
      website = null; // ~10% no website
    } else if (websiteRoll === 1) {
      website = `https://${slugify(name)}-${i}.invalid`; // ~10% unreachable
    } else {
      website = `https://${slugify(name)}-${i}.ignis-mock.local`;
    }

    businesses.push({
      id: `mock-gen-${seedBase}-${i}`,
      name,
      category,
      tags: [],
      district: district || "",
      city,
      country: "Turkey",
      phone: `+90 21${(seedBase % 3) + 2} ${String(500 + (seedBase % 400)).padStart(3, "0")} ${String(
        seedBase % 100,
      ).padStart(2, "0")} ${String((seedBase >> 3) % 100).padStart(2, "0")}`,
      website,
      rating,
      reviewCount,
      homepage:
        website && !website.endsWith(".invalid")
          ? {
              path: "/",
              title: name,
              paragraphs: [`${name} olarak ${category.toLowerCase()} alanında faaliyet gösteriyoruz.`, ...phrases],
            }
          : undefined,
    });
  }

  return businesses;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[şŞ]/g, "s")
    .replace(/[ığĞçÇöÖüÜİ]/g, (c) => ({ ı: "i", ğ: "g", ç: "c", ö: "o", ü: "u", İ: "i" })[c] || c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
