import type { CSSProperties, ReactNode } from "react";
import tokens from "../../../../design-tokens/tokens.json";
import {
  Button, Field, FilmStrip, Icon, ICON_NAMES, Print, RollCard, Scribble, Stamp,
} from "@/design-system";
import type { TokensFile } from "@/design-system/tokens/types";
import { UploadDropDemo } from "./demos";

const file: TokensFile = tokens;

/** Flat two-tone placeholder "scan" so the page needs no photo files. */
function sample(from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SCANS = [sample("#c98b5a", "#2f4b5c"), sample("#e3c07a", "#7b5a3c"), sample("#6b8f71", "#1f2d24"), sample("#d77a61", "#3b2a3f")];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 py-12">
      <h2 className="font-display text-display-l">{title}</h2>
      {children}
    </section>
  );
}

function Item({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-sans text-label uppercase text-ink-muted">{name}</h3>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

function Colours() {
  return (
    <ul className="grid grid-cols-2 gap-4 min-[600px]:grid-cols-4">
      {file.color.tokens.map((t) => (
        <li key={t.name} className="flex flex-col gap-2">
          <span className="h-12 border border-line" style={{ background: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </li>
      ))}
    </ul>
  );
}

function TypeStyles() {
  return (
    <ul className="flex flex-col gap-6">
      {file.type.groups.flatMap((g) =>
        g.styles.map((s) => {
          const style: CSSProperties = {
            fontFamily: `var(--font-${g.family})`,
            fontSize: `var(--text-${s.name})`,
            lineHeight: `var(--text-${s.name}--line-height)`,
            fontWeight: s.fontWeight,
            letterSpacing: s.letterSpacing,
            textTransform: s.name === "label" || s.name === "edge" ? "uppercase" : undefined,
          };
          return (
            <li key={s.name} className="flex flex-col gap-1">
              <span className="font-mono text-meta text-ink-muted">{s.name}</span>
              <span style={style}>{s.sample}</span>
              <span style={style}>Đà Lạt · Hội An · tấm ưng · kỷ niệm</span>
            </li>
          );
        }),
      )}
    </ul>
  );
}

function Shapes() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {file.spacing.tokens.map((t) => (
        <div key={t.name} className="flex flex-col items-start gap-2">
          <span className="bg-cobalt" style={{ width: `var(--${t.name})`, height: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </div>
      ))}
      {file.radius.tokens.map((t) => (
        <div key={t.name} className="flex flex-col items-start gap-2">
          <span className="block h-12 w-12 border-2 border-ink" style={{ borderRadius: `var(--${t.name})` }} />
          <span className="font-mono text-meta">{t.name}</span>
        </div>
      ))}
    </div>
  );
}

export function Showcase() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col">
      <Section title="Màu">
        <Colours />
      </Section>
      <Section title="Chữ">
        <TypeStyles />
      </Section>
      <Section title="Khoảng cách & bo góc">
        <Shapes />
      </Section>
      <Section title="Thành phần">
        <Item name="Button">
          <Button variant="primary" icon="upload">Tải cuộn lên</Button>
          <Button>Chia sẻ cuộn này</Button>
          <Button variant="quiet">Thêm ghi chú</Button>
          <Button variant="doodle">Bắt đầu cuộn đầu tiên</Button>
          <Button size="sm">Nhỏ</Button>
          <Button icon="share" aria-label="Chia sẻ" />
          <Button disabled>Không bấm được</Button>
        </Item>
        <Item name="Field">
          <Field label="Tên cuộn" placeholder="Đà Lạt, cuộn tháng 10" />
          <Field label="ISO" mono inputMode="numeric" defaultValue="400" hint="Số in trên hộp phim" />
          <Field label="ISO chụp" mono defaultValue="3200" error="Nhiều quá. Đẩy +3 à?" />
        </Item>
        <Item name="Icon">
          {ICON_NAMES.map((name) => (
            <span key={name} className="flex flex-col items-center gap-1">
              <Icon name={name} size={24} />
              <span className="font-mono text-meta">{name}</span>
            </span>
          ))}
        </Item>
        <Item name="Stamp">
          <Stamp>ISO 400</Stamp>
          <Stamp tone="ink">36 EXP</Stamp>
          <Stamp tone="keeper" icon="keeper" label="5 tấm ưng">5</Stamp>
          <Stamp tone="oops" icon="oops" label="3 oops">3</Stamp>
          <Stamp tone="oops" solid tilt>oops</Stamp>
        </Item>
        <Item name="Scribble">
          <Scribble arrow="right">nhìn chỗ này</Scribble>
          <Scribble tone="pin" arrow="down">hở sáng rồi :(</Scribble>
          <Scribble size="sm" arrow="left">cuộn đầu tiên!</Scribble>
        </Item>
        <Item name="Print">
          <Print src={SCANS[0]} alt="Mẫu: dải màu cam xanh" caption="đồi thông, 5:40 sáng" date="12.10.25" attach="tape" tilt="left" />
          <Print src={SCANS[1]} alt="Mẫu: dải màu vàng nâu" format="instant" caption="chớp mắt. lại." oops attach="pin" aspect="4/5" />
          <Print src={SCANS[2]} alt="Mẫu: dải màu xanh lá" format="borderless" width={200} />
        </Item>
        <Item name="FilmStrip">
          <div className="w-full">
            <FilmStrip
              labels={{ strip: "Dải phim mẫu", keeper: "Tấm ưng", oops: "Oops" }}
              edgeText="COLOR 200 · ROLL 14"
              frameWidth={180}
              frames={[
                { src: SCANS[0], alt: "Mẫu khung 1" },
                { src: SCANS[1], alt: "Mẫu khung 2", flag: "keeper" },
                { alt: "Khung 3, trống" },
                { src: SCANS[3], alt: "Mẫu khung 4", flag: "oops" },
                { src: SCANS[2], alt: "Mẫu khung 5" },
              ]}
            />
          </div>
        </Item>
        <Item name="RollCard">
          <div className="flex w-full max-w-[560px] flex-col gap-4">
            <RollCard name="Đà Lạt, cuộn tháng 10" stock="gold" iso={200} film="Gold 200" exposures={36} camera="Nikon FM2" date="12.10.25" keepers={{ count: 5, label: "5 tấm ưng" }} oops={{ count: 2, label: "2 oops" }} href="#" />
            <RollCard name="Hội An mưa" stock="mono" iso={400} film="HP5 Plus" exposures={36} camera="Olympus XA" date="03.09.25" />
          </div>
        </Item>
        <Item name="UploadDrop">
          <div className="w-full max-w-[560px]">
            <UploadDropDemo />
          </div>
        </Item>
      </Section>
    </div>
  );
}
