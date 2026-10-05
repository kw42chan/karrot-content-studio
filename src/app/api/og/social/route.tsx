import { ImageResponse } from "next/og";
import { KarrotSocialImage } from "@/lib/social/karrot-social-image";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Karrot Digital";
  const keyPoint = searchParams.get("keyPoint") ?? "";
  const format = searchParams.get("format") ?? "square";
  const width = format === "portrait" ? 1080 : 1080;
  const height = format === "portrait" ? 1350 : 1080;

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
          data: await loadGoogleFont("Anton"),
          weight: 400,
          style: "normal",
        },
        {
          name: "Roboto",
          data: await loadGoogleFont("Roboto"),
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}

async function loadGoogleFont(family: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent("KARROT DIGITAL")}`;
  const css = await fetch(url).then((r) => r.text());
  const match = css.match(/src: url\((.+?)\)/);
  if (!match) {
    throw new Error(`Could not load font ${family}`);
  }
  return fetch(match[1]).then((r) => r.arrayBuffer());
}
