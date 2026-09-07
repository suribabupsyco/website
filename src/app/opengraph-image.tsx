import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Chetana Psychological Counselling Centre — professional counselling and guidance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(path.join(process.cwd(), "src", "app", "icon.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#f7f5f0",
        color: "#123f45",
        padding: "72px 82px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: "linear-gradient(135deg, rgba(18,63,69,0.08), transparent 58%)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 64 }}>
        <div
          style={{
            width: 250,
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 125,
            overflow: "hidden",
            background: "white",
            boxShadow: "0 20px 60px rgba(18,63,69,0.16)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={250} height={250} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 680 }}>
          <div style={{ display: "flex", fontSize: 25, letterSpacing: 5, textTransform: "uppercase", color: "#5d817b", fontWeight: 700 }}>
            Atchutapuram · Anakapalli
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 59, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2 }}>
            Chetana Psychological Counselling Centre
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 27, lineHeight: 1.35, color: "#506266" }}>
            Professional counselling, career guidance and personal development support.
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
