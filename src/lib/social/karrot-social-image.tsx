import type { ReactNode } from "react";

export type SocialImageProps = {
  title: string;
  keyPoint: string;
  width: number;
  height: number;
};

export function KarrotSocialImage({
  title,
  keyPoint,
  width,
  height,
}: SocialImageProps): ReactNode {
  const headerPct = height === 1080 ? 0.15 : 0.16;
  const headerH = Math.round(height * headerPct);
  const titleSize = height === 1080 ? 104 : 112;
  const keySize = height === 1080 ? 30 : 32;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: "#FBF3EB",
        fontFamily: "Roboto",
      }}
    >
      <div
        style={{
          height: headerH,
          background: "#a89081",
          color: "#FBF3EB",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "#FBF3EB",
              color: "#a89081",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Anton",
              fontSize: 28,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Anton",
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              KARROT DIGITAL
            </div>
            <div style={{ fontSize: 13, fontFamily: "Roboto" }}>
              Automating Business with Intelligent Tech
            </div>
          </div>
        </div>
        <div
          style={{
            height: 3,
            width: 48,
            background: "#d18e63",
            marginTop: 8,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Anton",
            fontSize: titleSize,
            lineHeight: 1.05,
            color: "#000",
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            height: 4,
            width: 56,
            background: "#d18e63",
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontFamily: "Roboto",
            fontSize: keySize,
            lineHeight: 1.45,
            color: "#000",
            display: "flex",
          }}
        >
          {keyPoint}
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(0,0,0,0.08)",
          padding: "16px 14px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          fontFamily: "Roboto",
          fontWeight: 700,
        }}
      >
        <span>karrotdigital.com</span>
        <span style={{ color: "#d18e63", fontWeight: 600 }}>Darwin Chan</span>
      </div>
    </div>
  );
}
