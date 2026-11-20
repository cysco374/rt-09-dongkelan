export type SuratType = "rapat" | "lelayu" | "jenguk" | "halalbihalal";

export interface FieldDef {
  key: string;
  label: string;
  kind: "text" | "date" | "textarea";
  placeholder?: string;
}

export interface SuratTemplate {
  id: SuratType;
  label: string;
  desc: string;
  /** Isian khusus jenis surat (di luar Hal, Kepada, Note, dan penandatangan). */
  fields: FieldDef[];
  defaults: Record<string, string>;
}

const SALAM_NOTE_RAPAT =
  "Snack dan minum jatah ronda Senin malam Selasa\nBila berhalangan hadir, mohon memberi kabar\nMohon membawa infak pembangunan";

export const TEMPLATES: SuratTemplate[] = [
  {
    id: "rapat",
    label: "Undangan Rapat",
    desc: "Rapat rutin atau rapat khusus warga",
    fields: [
      { key: "hari", label: "Hari & tanggal", kind: "date" },
      {
        key: "pukul",
        label: "Pukul",
        kind: "text",
        placeholder: "19.30 – Selesai WIB",
      },
      {
        key: "tempat",
        label: "Tempat",
        kind: "text",
        placeholder: "Balai RT 09",
      },
      {
        key: "acara",
        label: "Acara",
        kind: "text",
        placeholder: "Rapat rutin",
      },
    ],
    defaults: {
      hal: "Undangan",
      pukul: "19.30 – Selesai WIB",
      tempat: "Balai RT 09",
      acara: "Rapat rutin",
      note: SALAM_NOTE_RAPAT,
    },
  },
  {
    id: "lelayu",
    label: "Berita Lelayu",
    desc: "Kabar duka warga meninggal dunia",
    fields: [
      { key: "nama", label: "Nama almarhum/ah", kind: "text" },
      { key: "usia", label: "Usia", kind: "text", placeholder: "65 tahun" },
      { key: "alamat", label: "Alamat / rumah duka", kind: "text" },
      { key: "wafatTgl", label: "Hari & tanggal wafat", kind: "date" },
      {
        key: "wafatPukul",
        label: "Pukul wafat",
        kind: "text",
        placeholder: "04.30 WIB",
      },
      { key: "makamTgl", label: "Hari & tanggal pemakaman", kind: "date" },
      {
        key: "makamPukul",
        label: "Pukul pemakaman",
        kind: "text",
        placeholder: "13.00 WIB",
      },
      {
        key: "makamTempat",
        label: "Tempat pemakaman",
        kind: "text",
        placeholder: "Makam Dongkelan",
      },
    ],
    defaults: {
      hal: "Berita Lelayu",
      kepada: "Yth. Bapak/ Ibu/ Sdr./ Sdri Warga RT 09",
      note: "Bagi yang berkenan mohon membantu proses pemakaman dan takziah.",
    },
  },
  {
    id: "jenguk",
    label: "Jenguk Warga",
    desc: "Ajakan menjenguk warga yang sakit",
    fields: [
      { key: "nama", label: "Nama warga yang sakit", kind: "text" },
      { key: "alamat", label: "Alamat", kind: "text" },
      {
        key: "dirawat",
        label: "Dirawat di",
        kind: "text",
        placeholder: "RS / rumah",
      },
      { key: "hari", label: "Hari & tanggal menjenguk", kind: "date" },
      { key: "pukul", label: "Pukul", kind: "text", placeholder: "16.00 WIB" },
      {
        key: "kumpul",
        label: "Berkumpul di",
        kind: "text",
        placeholder: "Balai RT 09",
      },
    ],
    defaults: {
      hal: "Undangan Menjenguk Warga",
      kepada: "Yth. Bapak/ Ibu/ Sdr./ Sdri Warga RT 09",
      note: "Infak untuk bingkisan dapat diserahkan kepada bendahara.",
    },
  },
  {
    id: "halalbihalal",
    label: "Halal Bihalal",
    desc: "Undangan Halal Bihalal Idul Fitri",
    fields: [
      { key: "hari", label: "Hari & tanggal", kind: "date" },
      {
        key: "pukul",
        label: "Pukul",
        kind: "text",
        placeholder: "09.00 – Selesai WIB",
      },
      {
        key: "tempat",
        label: "Tempat",
        kind: "text",
        placeholder: "Balai RT 09",
      },
      { key: "acara", label: "Acara", kind: "text" },
    ],
    defaults: {
      hal: "Undangan Halal Bihalal",
      pukul: "09.00 – Selesai WIB",
      tempat: "Balai RT 09",
      acara: "Halal Bihalal Idul Fitri warga RT 09",
      note: "Mohon membawa makanan ringan secukupnya\nBila berhalangan hadir, mohon memberi kabar",
    },
  },
];

export const templateById = (id: string) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** "2026-10-21" -> "21 Oktober 2026" (tanpa bergantung pada locale browser) */
export function tglPanjang(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "";
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
}
/** "2026-10-21" -> "Rabu, 21 Oktober 2026" */
export function hariTanggal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `${HARI[d.getUTCDay()]}, ${tglPanjang(iso)}`;
}

export interface Row {
  label: string;
  value: string;
}
export interface LetterModel {
  opening: string;
  rows: Row[];
  /** Blok kedua (mis. pemakaman pada surat lelayu) */
  middle?: string;
  rows2?: Row[];
  closing: string;
  hal: string;
  kepada: string;
  note: string[];
}

const v = (f: Record<string, string>, k: string) => (f[k] ?? "").trim();
const dots = (s: string) => s || "……………";

export function buildLetter(
  type: SuratType,
  f: Record<string, string>,
): LetterModel {
  const base = {
    hal: v(f, "hal"),
    kepada: v(f, "kepada") || "Yth. Bpk/ Ibu/ Sdr./ Sdri",
    note: v(f, "note")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  switch (type) {
    case "lelayu":
      return {
        ...base,
        opening:
          "Innalillahi wa inna ilaihi roji'un. Telah berpulang ke rahmatullah, warga kita:",
        rows: [
          { label: "Nama", value: dots(v(f, "nama")) },
          { label: "Usia", value: dots(v(f, "usia")) },
          { label: "Alamat", value: dots(v(f, "alamat")) },
          {
            label: "Wafat",
            value: dots(
              [
                hariTanggal(v(f, "wafatTgl")),
                v(f, "wafatPukul") && `pukul ${v(f, "wafatPukul")}`,
              ]
                .filter(Boolean)
                .join(", "),
            ),
          },
        ],
        middle: "Jenazah insya Allah akan dimakamkan pada:",
        rows2: [
          {
            label: "Hari, tanggal",
            value: dots(hariTanggal(v(f, "makamTgl"))),
          },
          { label: "Pukul", value: dots(v(f, "makamPukul")) },
          { label: "Tempat", value: dots(v(f, "makamTempat")) },
        ],
        closing:
          "Demikian kabar duka ini kami sampaikan. Semoga amal ibadah almarhum/ah diterima Allah SWT dan keluarga yang ditinggalkan diberi ketabahan. Aamiin.",
      };
    case "jenguk":
      return {
        ...base,
        opening:
          "Sehubungan dengan salah satu warga kita yang sedang sakit, kami mengajak Bapak/ Ibu untuk bersama-sama menjenguk:",
        rows: [
          { label: "Nama", value: dots(v(f, "nama")) },
          { label: "Alamat", value: dots(v(f, "alamat")) },
          { label: "Dirawat di", value: dots(v(f, "dirawat")) },
          { label: "Hari, tanggal", value: dots(hariTanggal(v(f, "hari"))) },
          { label: "Pukul", value: dots(v(f, "pukul")) },
          { label: "Berkumpul di", value: dots(v(f, "kumpul")) },
        ],
        closing:
          "Demikian informasi ini kami sampaikan. Semoga yang sakit segera diberi kesembuhan. Atas perhatian dan kehadirannya diucapkan terima kasih.",
      };
    case "halalbihalal":
      return {
        ...base,
        opening:
          "Dalam rangka mempererat tali silaturahmi di suasana Idul Fitri, kami mengundang Bapak/ Ibu dalam acara Halal Bihalal warga RT 09 Pedukuhan Dongkelan yang akan dilaksanakan, Insya Allah pada:",
        rows: [
          { label: "Hari, tanggal", value: dots(hariTanggal(v(f, "hari"))) },
          { label: "Pukul", value: dots(v(f, "pukul")) },
          { label: "Tempat", value: dots(v(f, "tempat")) },
          { label: "Acara", value: dots(v(f, "acara")) },
        ],
        closing:
          "Demikian undangan kami, atas perkenan hadir diucapkan terima kasih. Taqabbalallahu minna wa minkum, mohon maaf lahir dan batin.",
      };
    default:
      return {
        ...base,
        opening:
          "Mengharap kehadiran Bapak/ Ibu dalam rapat warga RT 09 Pedukuhan Dongkelan yang akan dilaksanakan, Insya Allah pada:",
        rows: [
          { label: "Hari, tanggal", value: dots(hariTanggal(v(f, "hari"))) },
          { label: "Pukul", value: dots(v(f, "pukul")) },
          { label: "Tempat", value: dots(v(f, "tempat")) },
          { label: "Acara", value: dots(v(f, "acara")) },
        ],
        closing:
          "Demikian undangan kami, atas perkenan hadir diucapkan terima kasih.",
      };
  }
}
