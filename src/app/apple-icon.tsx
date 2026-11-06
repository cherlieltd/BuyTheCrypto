import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3772FF",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <div style={{ color: "white", fontSize: 96, fontWeight: 700, lineHeight: 1, fontFamily: "sans-serif" }}>B</div>
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "#16C784",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          +
        </div>
      </div>
    ),
    size,
  );
}
