import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, Clock, MapPin, ShieldCheck, Star, UtensilsCrossed } from "lucide-react";
import hero from "@/assets/hero-rantang.jpg";
import { AREAS, PACKAGES, DAY_NAMES, rupiah, summarizeRatings, type PackageId } from "@/lib/catering";
import { getMenuPhoto } from "@/lib/menu-photos";
import { menuQueryOptions, menuRatingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(menuQueryOptions),
    context.queryClient.ensureQueryData(menuRatingsQueryOptions),
  ]),
  head: () => ({ meta: [
    { title: "RantangKu — Katering Rantangan Harian Jakarta" },
    { name: "description", content: "Makan siang rumahan diantar tiap hari kerja ke seluruh Jakarta. Lihat menu, gizi, rating, dan atur jadwal sendiri." },
    { property: "og:title", content: "RantangKu — Katering Rantangan Harian" },
    { property: "og:description", content: "Makan siang rumahan diantar tiap hari kerja, atur jadwal dan kuota sendiri." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const PACKAGE_FEATURES: Record<PackageId, string[]> = {
  "5hari": ["5 porsi makan siang Senin–Jumat", "Bebas atur libur sebelum 20:00 H-1", "Info kalori & alergen lengkap"],
  "20hari": ["20 porsi makan siang hemat Rp23rb/porsi", "Libur makan tidak memotong kuota", "Pengingat otomatis saat kuota ≤ 2"],
  fleksibel: ["10 porsi dipakai di tanggal pilihan Anda", "Bisa pesan lebih dari 1 porsi per hari", "Batal sebelum 20:00 H-1, kuota kembali"],
};

const TESTIMONIALS = [
  { name: "Nadia Putri", role: "Karyawan · Jakarta Selatan", quote: "Enak banget karena kalau mendadak dinas luar kota tinggal klik Libur sebelum jam 8 malam, kuota tidak hangus." },
  { name: "Raka Pratama", role: "Wiraswasta · Jakarta Pusat", quote: "Kuota Fleksibel cocok buat tim kecil di kantor. Kadang pesan 3 porsi sekaligus untuk rapat siang." },
  { name: "Sinta Dewi", role: "Ibu Rumah Tangga · Jakarta Barat", quote: "Informasi alergennya jelas, jadi saya tenang memilih menu untuk keluarga tanpa khawatir udang atau kacang." },
];

const FAQS = [
  { q: "Kapan batas waktu mengubah jadwal libur atau kuota fleksibel?", a: "Perubahan jadwal libur maupun pemesanan/pembatalan Kuota Fleksibel bisa dilakukan langsung di Portal Saya paling lambat pukul 20.00 WIB sehari sebelumnya (H-1)." },
  { q: "Apakah libur makan mengurangi jatah porsi paket harian?", a: "Tidak. Untuk Paket 5 Hari dan Paket 20 Hari, hari libur yang Anda tandai sebelum batas waktu tidak mengurangi sisa kuota." },
  { q: "Wilayah mana saja yang dijangkau pengantaran RantangKu?", a: "Saat ini kami mengantar ke seluruh 5 wilayah DKI Jakarta: Jakarta Pusat, Jakarta Utara, Jakarta Barat, Jakarta Selatan, dan Jakarta Timur setiap Senin–Jumat pukul 10.30–12.00 WIB." },
  { q: "Bagaimana cara pembayaran dan aktivasi langganan?", a: "Setelah mengisi formulir di halaman Pesan, Anda mendapatkan kode pesanan dan instruksi transfer BCA/QRIS. Kirim bukti bayar via WhatsApp dan admin akan mengaktifkan paket Anda." },
];

function Index() {
  const { data: menus } = useSuspenseQuery(menuQueryOptions);
  const { data: ratings } = useSuspenseQuery(menuRatingsQueryOptions);
  const ratingMap = summarizeRatings(ratings);

  return <div>
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 md:grid-cols-12 md:py-20">
      <div className="md:col-span-6">
        <span className="inline-block rounded-full bg-accent px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">Katering Rantangan Jakarta · Senin–Jumat</span>
        <h1 className="mt-5 text-4xl font-bold leading-[1.08] md:text-6xl">Makan siang teratur, <span className="text-primary">tanpa ribet</span> pesan tiap hari.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Masakan rumahan segar diantar hangat ke kantor dan rumah di seluruh Jakarta. Atur hari libur atau pilih tanggal Kuota Fleksibel langsung dari Portal Saya.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/pesan" className="btn-primary">Pesan Langganan</Link>
          <Link to="/menu" className="btn-outline">Lihat Menu & Gizi</Link>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6">
          <div><p className="font-display text-2xl font-bold text-foreground">5 Wilayah</p><p className="text-xs text-muted-foreground">Seluruh DKI Jakarta</p></div>
          <div><p className="font-display text-2xl font-bold text-foreground">20:00 H-1</p><p className="text-xs text-muted-foreground">Batas ubah jadwal</p></div>
          <div><p className="font-display text-2xl font-bold text-foreground">10.30–12.00</p><p className="text-xs text-muted-foreground">Jam antar makan siang</p></div>
        </div>
      </div>
      <div className="md:col-span-6">
        <img src={hero} width={1600} height={1104} alt="Rantang berisi nasi, ayam bakar, sayur, sambal dan tempe" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-border" />
      </div>
    </section>

    <section className="border-y bg-card py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Menu minggu ini</h2>
            <p className="mt-2 text-muted-foreground">Berganti setiap hari kerja, lengkap dengan kalori, info alergen, dan ulasan pelanggan.</p>
          </div>
          <Link to="/menu" className="btn-outline text-sm">Filter alergen & beri rating →</Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {menus.map((m) => {
            const summary = ratingMap[m.day];
            return (
              <Link key={m.day} to="/menu" className="group overflow-hidden rounded-2xl border bg-background transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={getMenuPhoto(m.day)} alt={m.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="uppercase text-primary">{DAY_NAMES[m.day]}</span>
                    <span className="text-muted-foreground">{m.kcal} kkal</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-bold leading-snug">{m.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.desc}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{m.category}</span>
                    {summary ? <span className="inline-flex items-center gap-1 font-semibold text-warning-foreground"><Star className="size-3.5 fill-warning text-warning" />{summary.avg} ({summary.count})</span> : <span className="text-muted-foreground">Baru</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-3xl font-bold md:text-4xl">Kenapa berlangganan di RantangKu?</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          [UtensilsCrossed, "1. Pilih paket sesuai ritme", "Mulai dari 5 hari untuk coba, 20 hari paling hemat, atau Kuota Fleksibel untuk tanggal pilihan sendiri."],
          [ShieldCheck, "2. Verifikasi & nota transparan", "Setiap pesanan punya kode unik, instruksi transfer jelas, dan nota pesanan yang bisa dicetak kapan saja."],
          [CalendarCheck, "3. Kendali penuh di Portal Saya", "Tandai libur makan tanpa hangus kuota, atau jadwalkan beberapa porsi sekaligus sebelum jam 20.00 H-1."],
        ].map(([Icon, title, desc]) => {
          const I = Icon as typeof UtensilsCrossed;
          return <div key={title as string} className="card-box">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><I className="size-5" /></div>
            <h3 className="mt-4 text-xl font-bold">{title as string}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc as string}</p>
          </div>;
        })}
      </div>
    </section>

    <section className="bg-primary-soft py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold md:text-4xl">Pilih paket langganan</h2>
          <p className="mt-2 text-muted-foreground">Harga transparan tanpa biaya tersembunyi, sudah termasuk pengantaran ke 5 wilayah Jakarta.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {(Object.entries(PACKAGES) as [PackageId, (typeof PACKAGES)[PackageId]][]).map(([id, p]) => (
            <div key={id} className={`card-box flex flex-col ${id === "20hari" ? "border-primary ring-2 ring-primary" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-2xl font-bold">{p.name}</h3>
                {id === "20hari" && <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning-foreground">Paling hemat</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-5 font-display text-4xl font-bold">{rupiah(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.pax} porsi · {rupiah(Math.round(p.price / p.pax))}/porsi</p>
              <ul className="mt-5 flex-1 space-y-2 border-t pt-4 text-sm">
                {PACKAGE_FEATURES[id].map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{f}</span></li>)}
              </ul>
              <Link to="/pesan" search={{ paket: id }} className="btn-primary mt-6 w-full">Pilih {p.name}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-3xl font-bold">Jangkauan & kata pelanggan</h2>
          <p className="mt-2 text-muted-foreground">Dipercaya pekerja kantoran dan keluarga di seluruh wilayah Jakarta.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {AREAS.map((area) => <span key={area} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold"><MapPin className="size-3.5 text-primary" />{area}</span>)}
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 text-primary" /><span>Pengiriman rutin Senin–Jumat, 10.30–12.00 WIB</span></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card-box flex flex-col justify-between">
              <p className="text-sm leading-relaxed text-foreground">“{t.quote}”</p>
              <div className="mt-4 border-t pt-3">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-4 pb-8">
      <h2 className="text-center text-3xl font-bold">Pertanyaan yang sering diajukan</h2>
      <div className="mt-6 space-y-3">
        {FAQS.map((item) => (
          <details key={item.q} className="card-box group">
            <summary className="cursor-pointer list-none font-semibold text-foreground">{item.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  </div>;
}
