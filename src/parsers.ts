import type { Frame, JsonAtlas } from "./global";

export function parseMeta(text: string): Frame[] {
  try {
    const j: JsonAtlas = JSON.parse(text);
    return parseJsonAtlas(j);
  } catch {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    if (xml.getElementsByTagName("parsererror").length) {
      throw new Error("Could not parse as JSON or XML");
    }
    return parseXmlAtlas(xml);
  }
}

export function parseJsonAtlas(j: JsonAtlas): Frame[] {
  const out: Frame[] = [];

  if (Array.isArray(j)) {
    for (const fr of j) {
      out.push({
        name: fr.name ?? "(noname)",
        x: fr.x | 0,
        y: fr.y | 0,
        w: fr.w | 0,
        h: fr.h | 0,
        rotated: !!fr.rotated,
      });
    }
    return out;
  }

  if ("frames" in j && j.frames) {
    if (Array.isArray(j.frames)) {
      for (const fr of j.frames) {
        const rect = fr.frame ?? fr;
        out.push({
          name: fr.filename ?? fr.name ?? fr.n ?? "(noname)",
          x: (rect.x ?? 0) | 0,
          y: (rect.y ?? 0) | 0,
          w: (rect.w ?? 0) | 0,
          h: (rect.h ?? 0) | 0,
          rotated: !!fr.rotated,
        });
      }
    } else {
      for (const [name, fr] of Object.entries(j.frames)) {
        const rect = fr.frame ?? fr;
        out.push({
          name,
          x: (rect.x ?? 0) | 0,
          y: (rect.y ?? 0) | 0,
          w: (rect.w ?? 0) | 0,
          h: (rect.h ?? 0) | 0,
          rotated: !!fr.rotated,
        });
      }
    }
    return out;
  }

  throw new Error("Unknown JSON atlas format");
}

export function parseXmlAtlas(xml: Document): Frame[] {
  const out: Frame[] = [];
  const subs = xml.getElementsByTagName("SubTexture");

  if (!subs.length) {
    throw new Error("Unknown XML atlas format");
  }

  for (const el of Array.from(subs)) {
    const name = el.getAttribute("name") ?? "(noname)";
    const x = +(el.getAttribute("x") ?? 0);
    const y = +(el.getAttribute("y") ?? 0);
    const w = +(el.getAttribute("width") ?? 0);
    const h = +(el.getAttribute("height") ?? 0);
    const rotated =
      el.getAttribute("rotated") === "true" ||
      el.getAttribute("rotation") === "90";

    out.push({ name, x, y, w, h, rotated });
  }

  return out;
}
