import type { CSSProperties } from "react";
import { type SuratType, buildLetter, tglPanjang } from "../lib/suratTemplates";

export interface PreviewProps {
  type: SuratType;
  fields: Record<string, string>;
  nomor: string;
  /** ISO yyyy-mm-dd */
  tanggal: string;
  signerTitle: string;
  signerName: string;
  signatureUrl?: string;
  logoUrl: string;
}

// Semua gaya inline agar sama persis di layar dan saat dicetak lewat iframe terpisah.
const page: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  padding: "14mm 20mm 16mm",
  background: "#fff",
  color: "#000",
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "12pt",
  lineHeight: 1.35,
};

export default function SuratPreview(p: PreviewProps) {
  const m = buildLetter(p.type, p.fields);
  const Block = ({ rows }: { rows: { label: string; value: string }[] }) => (
    <table style={{ borderCollapse: "collapse", margin: "6pt 0 6pt 14mm" }}>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td style={{ padding: 0, width: "36mm", verticalAlign: "top" }}>
              {r.label}
            </td>
            <td style={{ padding: "0 4pt", verticalAlign: "top" }}>:</td>
            <td style={{ padding: 0, verticalAlign: "top" }}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={page} id="surat-print">
      {/* Kop */}
      <div style={{ display: "flex", alignItems: "center", gap: "4mm" }}>
        <img src={p.logoUrl} alt="" style={{ width: "20mm", height: "auto" }} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: 700,
            fontSize: "15pt",
            lineHeight: 1.2,
            paddingRight: "20mm",
          }}
        >
          PENGURUS RT 09 PEDUKUHAN
          <br />
          DONGKELAN PANGGUNGHARJO SEWON
          <br />
          BANTUL DIY 55188
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "11pt",
          borderBottom: "2px solid #000",
          paddingBottom: "1pt",
        }}
      >
        Sekretariat : Balai RT 09 Dongkelan
      </div>

      {/* Nomor / tanggal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "4pt",
        }}
      >
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: 0, width: "22mm" }}>Nomor</td>
              <td style={{ padding: "0 4pt" }}>:</td>
              <td style={{ padding: 0 }}>{p.nomor}</td>
            </tr>
            <tr>
              <td style={{ padding: 0 }}>Hal</td>
              <td style={{ padding: "0 4pt" }}>:</td>
              <td style={{ padding: 0, fontWeight: 700 }}>{m.hal}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ paddingRight: "6mm" }}>
          Dongkelan, {tglPanjang(p.tanggal)}
        </div>
      </div>

      <div style={{ marginTop: "14pt" }}>
        Kepada
        <br />
        {m.kepada}
        <br />
        Di Tempat
      </div>

      <div style={{ marginTop: "14pt" }}>
        Assalamu'alaikum Wr Wb
        <br />
        Dengan hormat,
        <br />
        <span style={{ textAlign: "justify" }}>{m.opening}</span>
      </div>
      <Block rows={m.rows} />
      {m.middle && (
        <div style={{ marginTop: "6pt" }}>
          {m.middle}
          <Block rows={m.rows2 ?? []} />
        </div>
      )}
      <div style={{ marginTop: "10pt", textAlign: "justify" }}>
        {m.closing}
        <br />
        Wassalamu'alaikum Wr Wb
      </div>

      {/* Tanda tangan */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "12pt",
        }}
      >
        <div style={{ width: "60mm", textAlign: "center" }}>
          {p.signerTitle}
          <div style={{ height: "22mm", position: "relative" }}>
            {p.signatureUrl && (
              <img
                src={p.signatureUrl}
                alt=""
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  maxHeight: "22mm",
                  maxWidth: "60mm",
                }}
              />
            )}
          </div>
          {p.signerName}
        </div>
      </div>

      {m.note.length > 0 && (
        <div style={{ marginTop: "10pt", fontSize: "10pt", lineHeight: 1.3 }}>
          <b>Note:</b>
          {m.note.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}
