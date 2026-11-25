import heroRantang from "@/assets/hero-rantang.jpg";
import menuSenin from "@/assets/menu-senin.jpg";
import menuSelasa from "@/assets/menu-selasa.jpg";
import menuRabu from "@/assets/menu-rabu.jpg";
import menuKamis from "@/assets/menu-kamis.jpg";
import menuJumat from "@/assets/menu-jumat.jpg";

export const MENU_PHOTOS: Record<number, string> = {
  1: menuSenin,
  2: menuSelasa,
  3: menuRabu,
  4: menuKamis,
  5: menuJumat,
};

export function getMenuPhoto(day: number): string {
  return MENU_PHOTOS[day] ?? heroRantang;
}