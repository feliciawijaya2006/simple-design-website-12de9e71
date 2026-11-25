import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Filter, RotateCcw, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DAY_NAMES, filterMenus, summarizeRatings, type Menu, type MenuRating } from "@/lib/catering";
import { rateMenu } from "@/lib/catering.functions";
import { getMenuPhoto } from "@/lib/menu-photos";
import { menuQueryOptions, menuRatingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/menu")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(menuQueryOptions),
    context.queryClient.ensureQueryData(menuRatingsQueryOptions),
  ]),
  head: () => ({ meta: [
    { title: "Menu Mingguan — RantangKu" },
    { name: "description", content: "Jadwal menu harian RantangKu lengkap dengan foto hidangan, filter alergen, kalori, dan rating pelanggan." },
    { property: "og:title", content: "Menu Mingguan — RantangKu" },
    { property: "og:description", content: "Jadwal menu Senin–Jumat dengan foto, filter alergen, kalori, dan ulasan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MenuPage,
});

function MenuPage() {
  const { data: menus } = useSuspenseQuery(menuQueryOptions);
  const { data: ratings } = useSuspenseQuery(menuRatingsQueryOptions);
  const [userId, setUserId] = useState<string | null>(null);
  const [category, setCategory] = useState("Semua");
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [maxKcal, setMaxKcal] = useState<number | null>(null);
  const [openRateDay, setOpenRateDay] = useState<number | null>(null);
  const todayIdx = new Date().getDay();

  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => { if (alive) setUserId(data.user?.id ?? null); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(menus.map((m) => m.category)))], [menus]);
  const allAllergens = useMemo(() => Array.from(new Set(menus.flatMap((m) => m.allergens))).sort(), [menus]);
  const filtered = useMemo(() => filterMenus(menus, { category, excludedAllergens, maxKcal }), [menus, category, excludedAllergens, maxKcal]);
  const ratingMap = useMemo(() => summarizeRatings(ratings), [ratings]);
  const hasFilter = category !== "Semua" || excludedAllergens.length > 0 || maxKcal !== null;

  function toggleAllergen(a: string) {
    setExcludedAllergens((cur) => cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Jadwal Senin–Jumat · 10.30–12.00 WIB</p>
          <h1 className="mt-1 text-4xl font-bold">Menu minggu ini</h1>
          <p className="mt-2 text-muted-foreground">Saring berdasarkan alergen atau batas kalori, lalu lihat ulasan dari pelanggan lain.</p>
        </div>
        <Link to="/pesan" className="btn-primary">Pesan Langganan</Link>
      </div>

      <div className="card-box mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-primary" />Saring menu</p>
          {hasFilter && <button type="button" onClick={() => { setCategory("Semua"); setExcludedAllergens([]); setMaxKcal(null); }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><RotateCcw className="size-3.5" />Reset filter</button>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Kategori</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.map((c) => <button type="button" key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"}`}>{c}</button>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Hindari alergen</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allAllergens.map((a) => {
                const active = excludedAllergens.includes(a);
                return <button type="button" key={a} onClick={() => toggleAllergen(a)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? "bg-warning text-foreground" : "bg-muted text-foreground hover:bg-warning-soft"}`}>{active ? `✕ Tanpa ${a}` : `Tanpa ${a}`}</button>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Batas kalori</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {([[null, "Semua"], [600, "≤ 600 kkal"], [650, "≤ 650 kkal"]] as const).map(([val, label]) => (
                <button type="button" key={label} onClick={() => setMaxKcal(val)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${maxKcal === val ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"}`}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-box mt-8 text-center">
          <p className="font-semibold">Tidak ada menu yang cocok dengan filter Anda.</p>
          <p className="mt-1 text-sm text-muted-foreground">Coba kurangi pilihan alergen atau naikkan batas kalori.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {filtered.map((m) => (
            <MenuCard key={m.day} menu={m} isToday={m.day === todayIdx} summary={ratingMap[m.day]} dayRatings={ratings.filter((r) => r.day === m.day)} userId={userId} open={openRateDay === m.day} onToggle={() => setOpenRateDay(openRateDay === m.day ? null : m.day)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuCard({ menu, isToday, summary, dayRatings, userId, open, onToggle }: {
  menu: Menu; isToday: boolean; summary?: { avg: number; count: number }; dayRatings: MenuRating[]; userId: string | null; open: boolean; onToggle: () => void;
}) {
  const mine = userId ? dayRatings.find((r) => r.userId === userId) : undefined;
  const [stars, setStars] = useState(mine?.rating ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const queryClient = useQueryClient();
  const rateFn = useServerFn(rateMenu);

  async function submitRating(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try {
      await rateFn({ data: { day: menu.day, rating: stars, comment } });
      await queryClient.invalidateQueries({ queryKey: ["menu-ratings"] });
      setMsg("Terima kasih! Rating Anda tersimpan.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menyimpan rating.");
    } finally { setBusy(false); }
  }

  const comments = dayRatings.filter((r) => r.comment.trim()).slice(0, 2);
  return (
    <article className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition ${isToday ? "border-primary ring-2 ring-primary" : ""}`}>
      <div className="grid md:grid-cols-12">
        <div className="aspect-[4/3] bg-muted md:col-span-4 md:aspect-auto">
          <img src={getMenuPhoto(menu.day)} alt={menu.title} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-between p-5 md:col-span-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-primary">{DAY_NAMES[menu.day]}</span>
                {isToday && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Menu hari ini</span>}
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{menu.category}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-semibold">
                <Star className="size-4 fill-warning text-warning" />
                <span>{summary ? `${summary.avg} (${summary.count} ulasan)` : "Belum ada ulasan"}</span>
              </div>
            </div>
            <h2 className="mt-2 text-2xl font-bold">{menu.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{menu.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">{menu.kcal} kkal</span>
              {menu.allergens.length === 0 ? <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">Bebas alergen umum</span> : menu.allergens.map((a) => <span key={a} className="rounded-full bg-warning-soft px-2.5 py-1 font-semibold text-warning-foreground">Mengandung {a}</span>)}
            </div>
            {comments.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-2.5 text-xs text-muted-foreground">
                {comments.map((c) => <p key={c.id}>“{c.comment}” — <span className="font-semibold text-foreground">{c.rating}★</span></p>)}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            {userId ? (
              <button type="button" onClick={onToggle} className="text-sm font-semibold text-primary hover:underline">{open ? "Tutup form rating" : mine ? `Ubah rating Anda (${mine.rating}★)` : "Beri rating menu ini"}</button>
            ) : (
              <Link to="/auth" search={{ redirect: "/menu" }} className="text-sm font-semibold text-primary hover:underline">Masuk untuk memberi rating</Link>
            )}
          </div>
          {open && userId && (
            <form onSubmit={submitRating} className="mt-3 space-y-3 rounded-xl bg-muted p-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n} bintang`} onClick={() => setStars(n)} className="p-1">
                    <Star className={`size-6 ${n <= stars ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold">{stars}/5</span>
              </div>
              <input className="input-field" maxLength={240} placeholder="Tulis ulasan singkat (opsional, misal: sambalnya pas!)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy} className="btn-primary py-2 text-sm">{busy ? "Menyimpan…" : "Simpan rating"}</button>
                {msg && <span role="status" className="text-xs font-semibold text-primary">{msg}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
