export const DESTINATION_GRADIENTS: Record<string, string> = {
  malta:      "linear-gradient(135deg, #4a8fb8 0%, #1f5378 60%, #122d44 100%)",
  milano:     "linear-gradient(135deg, #b8a890 0%, #6b5a48 100%)",
  cappadocia: "linear-gradient(135deg, #d4865a 0%, #864a26 60%, #4a2814 100%)",
  istanbul:   "linear-gradient(135deg, #5a7da8 0%, #2a4870 60%, #182e4c 100%)",
  salalah:    "linear-gradient(135deg, #6ea069 0%, #355c34 60%, #1d3a1c 100%)",
  petra:      "linear-gradient(135deg, #c89a5a 0%, #8a6334 100%)",
  sardinia:   "linear-gradient(135deg, #6fbcbd 0%, #2c7274 60%, #143a3a 100%)",
  marrakech:  "linear-gradient(135deg, #c46a44 0%, #7a3a22 100%)",
  umrah:      "linear-gradient(135deg, #d4c79a 0%, #8a7644 100%)",
  dubai:      "linear-gradient(135deg, #e8d5a0 0%, #a07830 60%, #603a10 100%)",
  bali:       "linear-gradient(135deg, #4a9a6a 0%, #1f5a38 60%, #103020 100%)",
  maldives:   "linear-gradient(135deg, #4ac8d8 0%, #1a7888 60%, #0a3844 100%)",
  paris:      "linear-gradient(135deg, #8a9ab8 0%, #4a5a78 100%)",
  rome:       "linear-gradient(135deg, #c8a870 0%, #886038 100%)",
  hurghada:   "linear-gradient(135deg, #4ec5f0 0%, #2a8ec0 60%, #d4a050 100%)",
  wadi_rum:   "linear-gradient(135deg, #c89a5a 0%, #8a6334 100%)",
  default:    "linear-gradient(135deg, #5a6e9a 0%, #2a3a5e 100%)",
};

export function guessDestinationKind(destination: string): string {
  const d = destination.toLowerCase();
  if (d.includes("malta"))                                                    return "malta";
  if (d.includes("milan") || d.includes("milano"))                           return "milano";
  if (d.includes("cappadoci") || d.includes("kapadok") || d.includes("كابادوكيا")) return "cappadocia";
  if (d.includes("istanbul") || d.includes("turkey") || d.includes("türk") || d.includes("إسطنبول")) return "istanbul";
  if (d.includes("sardini") || d.includes("sardegna"))                       return "sardinia";
  if (d.includes("marrakech") || d.includes("morocco") || d.includes("مراكش")) return "marrakech";
  if (d.includes("petra") || (d.includes("jordan") && !d.includes("istanbul"))) return "petra";
  if (d.includes("salalah") || d.includes("oman") || d.includes("سلالة"))   return "salalah";
  if (d.includes("umrah") || d.includes("mecca") || d.includes("makkah") || d.includes("saudi") || d.includes("مكة") || d.includes("عمرة") || d.includes("حج")) return "umrah";
  if (d.includes("dubai") || d.includes("دبي"))                              return "dubai";
  if (d.includes("bali"))                                                     return "bali";
  if (d.includes("maldive") || d.includes("مالديف"))                         return "maldives";
  if (d.includes("paris") || d.includes("باريس"))                            return "paris";
  if (d.includes("rome") || d.includes("roma") || d.includes("روما"))       return "rome";
  if (d.includes("hurghada") || d.includes("الغردقة"))                       return "hurghada";
  if (d.includes("wadi rum") || d.includes("وادي رم"))                       return "wadi_rum";
  return "default";
}
