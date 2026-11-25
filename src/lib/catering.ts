export type PackageId = "5hari" | "20hari" | "fleksibel";
export const PACKAGES: Record<PackageId, { name: string; pax: number; price: number; desc: string }> = {
  "5hari": { name: "Paket 5 Hari", pax: 5, price: 125000, desc: "Coba dulu seminggu kerja" },
  "20hari": { name: "Paket 20 Hari", pax: 20, price: 460000, desc: "Makan siang sebulan penuh, paling hemat" },
  fleksibel: { name: "Kuota Fleksibel", pax: 10, price: 260000, desc: "10 porsi, pilih tanggal dan jumlah sesuai kebutuhan" },
};

export const AREAS = ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur"];

/** Nilai lama dari daftar wilayah sebelumnya, dipetakan ke wilayah Jakarta. */
const AREA_ALIASES: Record<string, string> = {
  "Kota Pusat": "Jakarta Pusat",
  "Kota Utara": "Jakarta Utara",
  "Kota Barat": "Jakarta Barat",
  "Kota Selatan": "Jakarta Selatan",
  "Kota Timur": "Jakarta Timur",
};

/** Pastikan wilayah selalu salah satu wilayah Jakarta; nilai lama atau tak dikenal dipetakan ke pilihan yang sah. */
export function normalizeArea(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (AREAS.includes(raw)) return raw;
  const alias = AREA_ALIASES[raw];
  if (alias && AREAS.includes(alias)) return alias;
  return AREAS[0] ?? "";
}

export const ADMIN_WA = "6281234567890";
export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const LOW_QUOTA = 2;
export const SKIP_DEADLINE_HOUR = 20;

export type Menu = { day: number; title: string; desc: string; category: string; kcal: number; allergens: string[] };
export type MenuRating = { id: string; userId: string; day: number; rating: number; comment: string; createdAt: string };
export type MenuRatingSummary = { day: number; avg: number; count: number };
export type Status = "menunggu" | "aktif" | "selesai";
export type BookingStatus = "terjadwal" | "terkirim" | "batal";
export type MealBooking = { id: string; date: string; portions: number; status: BookingStatus };
export type Delivery = { date: string; portions: number };
export type Profile = { id: string; name: string; phone: string; address: string; area: string; notes: string };
export type Subscription = {
  id: string;
  code: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  notes: string;
  pkg: PackageId;
  total: number;
  remaining: number;
  price: number;
  status: Status;
  paid: boolean;
  start: string;
  skips: string[];
  delivered: Delivery[];
  bookings: MealBooking[];
  createdAt: string;
};

export const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const isWeekday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;
export const isLowQuota = (s: Subscription) => s.status === "aktif" && s.remaining <= LOW_QUOTA;
export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
export const normPhone = (p: string) => p.replace(/\D/g, "").replace(/^0/, "62");

/** Perubahan jadwal hanya boleh sebelum 20:00 pada H-1. */
export function canSkip(target: string, now: Date): boolean {
  const [y = 0, m = 1, d = 1] = target.split("-").map(Number);
  const deadline = new Date(y, m - 1, d - 1, SKIP_DEADLINE_HOUR, 0, 0);
  return now < deadline;
}

/** Paket harian tetap diantar kecuali libur; paket fleksibel hanya memakai jadwal porsi. */
export const needsMeal = (s: Subscription, date: string) =>
  s.pkg !== "fleksibel" && s.status === "aktif" && s.remaining > 0 && s.start <= date && !s.skips.includes(date) && !s.delivered.some((d) => d.date === date);

export const activeBookingFor = (s: Subscription, date: string) =>
  s.bookings.find((b) => b.date === date && b.status === "terjadwal");

/** Validasi yang sama juga diterapkan oleh database sebelum kuota dikurangi. */
export function flexibleBookingError(s: Subscription, date: string, portions: number, now: Date): string | null {
  if (s.pkg !== "fleksibel") return "Jadwal porsi hanya untuk Kuota Fleksibel.";
  if (s.status !== "aktif") return "Paket belum aktif.";
  if (!Number.isInteger(portions) || portions < 1) return "Jumlah porsi minimal 1.";
  if (portions > s.remaining) return `Sisa kuota hanya ${s.remaining} porsi.`;
  if (!isWeekday(new Date(date + "T00:00"))) return "Pengiriman hanya Senin–Jumat.";
  if (date < s.start) return "Tanggal sebelum langganan dimulai.";
  if (!canSkip(date, now)) return "Batas pemesanan jam 20:00 H-1 sudah lewat.";
  if (activeBookingFor(s, date)) return "Tanggal ini sudah memiliki jadwal.";
  return null;
}

export function reservedPortions(s: Subscription): number {
  return s.bookings.filter((b) => b.status === "terjadwal").reduce((sum, b) => sum + b.portions, 0);
}

export function waInvoiceLink(s: Subscription) {
  const p = PACKAGES[s.pkg];
  const msg = `Halo ${s.name}, sisa porsi RantangKu Anda tinggal ${s.remaining}. Yuk perpanjang ${p.name} (${rupiah(p.price)}).\nTransfer BCA 1234567890 a.n. RantangKu atau QRIS. Kirim bukti bayar ke nomor ini ya. Terima kasih!`;
  return `https://wa.me/${normPhone(s.phone)}?text=${encodeURIComponent(msg)}`;
}

/** Saring menu berdasarkan kategori, alergen yang dihindari, dan batas kalori. */
export function filterMenus(
  menus: Menu[],
  opts: { category?: string; excludedAllergens?: string[]; maxKcal?: number | null },
): Menu[] {
  const excluded = (opts.excludedAllergens ?? []).map((a) => a.toLowerCase());
  return menus.filter((m) => {
    if (opts.category && opts.category !== "Semua" && m.category !== opts.category) return false;
    if (opts.maxKcal != null && m.kcal > opts.maxKcal) return false;
    if (excluded.length > 0 && m.allergens.some((a) => excluded.includes(a.toLowerCase()))) return false;
    return true;
  });
}

/** Ringkasan rata-rata rating per hari menu. */
export function summarizeRatings(ratings: MenuRating[]): Record<number, MenuRatingSummary> {
  const map: Record<number, { sum: number; count: number }> = {};
  for (const r of ratings) {
    const cur = map[r.day] ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    map[r.day] = cur;
  }
  const out: Record<number, MenuRatingSummary> = {};
  for (const [dayStr, v] of Object.entries(map)) {
    const day = Number(dayStr);
    out[day] = { day, avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
  }
  return out;
}

/** Ringkasan analitik operasional dan pendapatan untuk Dashboard Admin. */
export function computeAdminAnalytics(subs: Subscription[], ratings: MenuRating[]) {
  const paidSubs = subs.filter((s) => s.paid || s.status === "aktif" || s.status === "selesai");
  const pendingSubs = subs.filter((s) => s.status === "menunggu");
  const activeSubs = subs.filter((s) => s.status === "aktif");
  const verifiedRevenue = paidSubs.reduce((sum, s) => sum + s.price, 0);
  const pendingRevenue = pendingSubs.reduce((sum, s) => sum + s.price, 0);
  const totalDeliveredPortions = subs.reduce((sum, s) => sum + s.delivered.reduce((a, d) => a + d.portions, 0), 0);

  const byPackage = (Object.keys(PACKAGES) as PackageId[]).map((pkg) => {
    const matching = paidSubs.filter((s) => s.pkg === pkg);
    return { pkg, name: PACKAGES[pkg].name, orders: matching.length, revenue: matching.reduce((sum, s) => sum + s.price, 0) };
  });

  const byArea = AREAS.map((area) => {
    const matching = subs.filter((s) => normalizeArea(s.area) === area);
    const portions = matching.reduce((sum, s) => sum + s.delivered.reduce((a, d) => a + d.portions, 0), 0);
    return { area: area.replace("Jakarta ", "Jak"), fullArea: area, orders: matching.length, portions };
  });

  const dayTotals = new Map<string, number>();
  for (const s of subs) {
    for (const d of s.delivered) dayTotals.set(d.date, (dayTotals.get(d.date) ?? 0) + d.portions);
  }
  const dailyDeliveries = [...dayTotals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, portions]) => ({ date, label: date.slice(5), portions }));

  const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10 : 0;

  return { verifiedRevenue, pendingRevenue, activeCount: activeSubs.length, totalOrders: subs.length, totalDeliveredPortions, avgRating, totalRatings: ratings.length, byPackage, byArea, dailyDeliveries };
}
