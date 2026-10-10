import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { KarrotSocialImage } from "@/lib/social/karrot-social-image";

export const runtime = "nodejs";

let fontCache: { anton: ArrayBuffer; roboto: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const base = join(process.cwd(), "public", "fonts");
  const [anton, roboto] = await Promise.all([
    readFile(join(base, "Anton-Regular.ttf")),
    readFile(join(base, "Roboto-Regular.ttf")),
  ]);
  fontCache = {
    anton: anton.buffer.slice(anton.byteOffset, anton.byteOffset + anton.byteLength),
    roboto: roboto.buffer.slice(roboto.byteOffset, roboto.byteOffset + roboto.byteLength),
  };
  return fontCache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Karrot Digital";
  const keyPoint = searchParams.get("keyPoint") ?? "";
  const format = searchParams.get("format") ?? "square";
  const width = 1080;
  const height = format === "portrait" ? 1350 : 1080;

  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <KarrotSocialImage
        title={title}
        keyPoint={keyPoint}
        width={width}
        height={height}
      />
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Anton",
          data: fonts.anton,
          weight: 400,
          style: "normal",
        },
        {
          name: "Roboto",
          data: fonts.roboto,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
