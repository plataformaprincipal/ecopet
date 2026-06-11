/** Conversão simplificada para Braille Unicode (Grade 1 — latim básico). */
const BRAILLE: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
  k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
  u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵",
  "0": "⠚", "1": "⠁", "2": "⠃", "3": "⠉", "4": "⠙", "5": "⠑", "6": "⠋", "7": "⠛", "8": "⠓", "9": "⠊",
  " ": " ", ".": "⠲", ",": "⠂", "?": "⠦", "!": "⠖", "-": "⠤",
};

export function textToBraille(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => BRAILLE[ch] ?? (ch === "\n" ? "\n" : ch))
    .join("");
}

export function extractPageText(): string {
  if (typeof document === "undefined") return "";
  const main = document.getElementById("main-content");
  const root = main ?? document.body;
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style, noscript, [aria-hidden='true']").forEach((el) => el.remove());
  return clone.innerText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
