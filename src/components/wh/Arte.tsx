// Desenhos da identidade weharvest (copiados do artefato "weharvest – nova identidade").
import { useId } from "react";

type P = { size?: number; className?: string; style?: React.CSSProperties };

/** Logo completo (céu, lavoura, órbita, satélite opcional e broto). */
export function Logo({ size = 38, satelite = false, estrelas = false, borda = true }: P & { satelite?: boolean; estrelas?: boolean; borda?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg role="img" aria-label="weharvest" width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <clipPath id={`wh-${id}`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#0A1424" stroke={borda ? "#22344F" : "none"} strokeWidth={borda ? 2 : 0} />
      <g clipPath={`url(#wh-${id})`}>
        <path d="M-2 40 L66 40 L66 66 L-2 66 Z" fill="#2E7D4A" />
        <path d="M24 40 L29 40 L18 66 L4 66 Z" fill="#C9A23A" />
        <path d="M35 40 L40 40 L60 66 L46 66 Z" fill="#C9A23A" />
        {satelite && <path d="M29.5 40 L34.5 40 L38 66 L26 66 Z" fill="#3F9A55" />}
        {estrelas && (
          <>
            <circle cx="14" cy="14" r="1" fill="#F2F5EE" opacity=".7" />
            <circle cx="22" cy="9" r=".8" fill="#F2F5EE" opacity=".6" />
          </>
        )}
      </g>
      <path d="M8 26 C 18 6, 50 4, 58 22" fill="none" stroke="#7FB3F0" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.5 3.5" />
      {satelite && (
        <g transform="translate(51 13) rotate(30)">
          <rect x="-2.5" y="-2" width="5" height="4" rx="1" fill="#F2F5EE" />
          <rect x="-8" y="-1.4" width="4.6" height="2.8" fill="#3E6EA8" />
          <rect x="3.4" y="-1.4" width="4.6" height="2.8" fill="#3E6EA8" />
        </g>
      )}
      <path d="M32 41 V27" stroke="#9BE36B" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M32 33 C 31 27, 26 24, 21 25 C 22 30, 27 33, 32 33 Z" fill="#9BE36B" />
      <path d="M32 30 C 33 24, 38 21, 43 22 C 42 27, 37 30, 32 30 Z" fill="#9BE36B" />
    </svg>
  );
}

/** Mascote "Broto". */
export function Broto({ size = 64, bob = true, className = "", style }: P & { bob?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 56 56" className={`${bob ? "wh-bob" : ""} ${className}`} style={style}>
      <path d="M28 18v-3" stroke="#3F9A55" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M28 16c-1-6-6-9-12-8 1 6 6 9 12 8z" fill="#3F9A55" />
      <path d="M28 16c1-6 6-9 12-8-1 6-6 9-12 8z" fill="#5FB86A" />
      <circle cx="28" cy="35" r="17" fill="#9BE36B" />
      <circle cx="22" cy="33" r="2.3" fill="#14231A" />
      <circle cx="34" cy="33" r="2.3" fill="#14231A" />
      <circle cx="18.5" cy="38.5" r="2.6" fill="#F4A7A0" opacity=".8" />
      <circle cx="37.5" cy="38.5" r="2.6" fill="#F4A7A0" opacity=".8" />
      <path d="M23.5 39.5q4.5 4 9 0" stroke="#14231A" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Céu do cabeçalho: estrelas piscando, órbita e satélite passando. */
export function CeuAnimado() {
  return (
    <svg aria-hidden="true" width="100%" height="170" viewBox="0 0 390 170" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute left-0 top-0">
      <circle className="wh-tw" cx="40" cy="24" r="1.3" fill="#F2F5EE" />
      <circle className="wh-tw" cx="150" cy="16" r="1" fill="#F2F5EE" style={{ animationDelay: "1s" }} />
      <circle className="wh-tw" cx="250" cy="44" r="1.2" fill="#F2F5EE" style={{ animationDelay: ".4s" }} />
      <circle className="wh-tw" cx="340" cy="22" r="1" fill="#F2F5EE" style={{ animationDelay: "1.8s" }} />
      <path d="M-20 70 C 100 30, 290 30, 410 80" fill="none" stroke="#7FB3F0" strokeWidth="1" strokeDasharray="3 6" opacity=".6" />
      <g className="wh-fly">
        <g transform="translate(0 52) rotate(18)">
          <rect x="-3" y="-2.5" width="6" height="5" rx="1" fill="#F2F5EE" />
          <rect x="-10" y="-1.8" width="6" height="3.6" fill="#3E6EA8" />
          <rect x="4" y="-1.8" width="6" height="3.6" fill="#3E6EA8" />
        </g>
      </g>
    </svg>
  );
}

export function IcSoja({ size = 28 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <ellipse cx="14" cy="14" rx="10" ry="5" fill="#8BCB6B" transform="rotate(-35 14 14)" />
      <circle cx="9.5" cy="17.2" r="2.4" fill="#4E9A43" />
      <circle cx="14" cy="14" r="2.4" fill="#4E9A43" />
      <circle cx="18.5" cy="10.8" r="2.4" fill="#4E9A43" />
    </svg>
  );
}

export function IcMilho({ size = 28, linhas = true }: P & { linhas?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <path d="M9 25c-3-5-3-9 0-12M19 25c3-5 3-9 0-12" stroke="#5FB86A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="14" cy="13" rx="4.8" ry="9" fill="#F2C94C" />
      {linhas && <path d="M11.5 9h5M11 13h6M11.5 17h5" stroke="#D9A92C" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  );
}

export function IcColheita({ size = 28 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <path d="M5 22h18" stroke="#C9A23A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 22c0-5 2.5-8 6-8s6 3 6 8" fill="#F2C94C" />
      <path d="M14 6v3M8 8.5l1.6 2.2M20 8.5l-1.6 2.2" stroke="#E0A33A" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IcFlor({ size = 28 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <g fill="#E07A3E">
        <circle cx="14" cy="8" r="4" />
        <circle cx="8.5" cy="12.5" r="4" />
        <circle cx="19.5" cy="12.5" r="4" />
        <circle cx="10.5" cy="18.5" r="4" />
        <circle cx="17.5" cy="18.5" r="4" />
      </g>
      <circle cx="14" cy="14" r="3.4" fill="#FFD36B" />
    </svg>
  );
}

export function IcTrigo({ size = 26 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <path d="M14 26V5" stroke="#A8862C" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 9l-4-3M14 9l4-3M14 14l-4-3M14 14l4-3M14 19l-4-3M14 19l4-3" stroke="#C9A23A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IcMilhoCapim({ size = 28 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <ellipse cx="14" cy="11" rx="4.5" ry="8" fill="#F2C94C" />
      <path d="M3 26c3-6 6-8 8-8M25 26c-3-6-6-8-8-8M9 26c1-5 3-7 5-7s4 2 5 7" stroke="#3F9A55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IcGeada({ size = 24, cor = "#3E6EA8", ponta = true, traco = 2.2 }: P & { cor?: string; ponta?: boolean; traco?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <g stroke={cor} strokeWidth={traco} strokeLinecap="round" fill="none">
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
        {ponta && <path d="M9.5 4.5 12 6.5l2.5-2M9.5 19.5 12 17.5l2.5 2" />}
      </g>
    </svg>
  );
}

export function IcSol({ size = 38 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 38 38">
      <circle cx="19" cy="19" r="19" fill="#FBE3A8" />
      <circle cx="19" cy="19" r="6" fill="#F2B53A" />
      <g stroke="#F2B53A" strokeWidth="2.4" strokeLinecap="round">
        <path d="M19 6v3M19 29v3M6 19h3M29 19h3M9.8 9.8l2 2M26.2 26.2l2 2M9.8 28.2l2-2M26.2 11.8l2-2" />
      </g>
    </svg>
  );
}

export function IcSolPequeno({ size = 18 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none", marginTop: 1 }}>
      <circle cx="12" cy="12" r="5" fill="#F2B53A" />
      <g stroke="#F2B53A" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2" />
      </g>
    </svg>
  );
}

export function IcEscudo({ size = 38, fundo = "#C6E5C2" }: P & { fundo?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 38 38">
      <circle cx="19" cy="19" r="19" fill={fundo} />
      <path d="M19 8l-9 3.5v6.5c0 5.5 3.8 9.6 9 11 5.2-1.4 9-5.5 9-11v-6.5z" fill="#2E7D4A" />
      <path d="m14.5 19 3.2 3.2 6-6.4" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcEscudoPequeno({ size = 24 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2.5 4 5.6v5.9c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5.6z" fill="#2E7D4A" />
      <path d="m8.2 12 2.8 2.8 5-5.6" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcRelogio({ size = 24 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2E7D4A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </svg>
  );
}

export function IcSino({ size = 44 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 44 44" style={{ flex: "none" }}>
      <circle cx="22" cy="22" r="22" fill="#15233A" />
      <path d="M22 12a7 7 0 0 0-7 7v5l-2.5 4h19L29 24v-5a7 7 0 0 0-7-7z" fill="#9BE36B" />
      <path d="M19.5 31a2.5 2.5 0 0 0 5 0" stroke="#9BE36B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IcMenu() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2F5EE" strokeWidth="2.4" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IcVoltar() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2F5EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IcPin() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#2E7D4A">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export function IcBaixada() {
  return (
    <svg aria-hidden="true" width="34" height="34" viewBox="0 0 34 34" style={{ flex: "none" }}>
      <circle cx="17" cy="17" r="17" fill="#D3E4F7" />
      <path d="M5 22c4-6 8-6 12 0s8 6 12 0" stroke="#3E6EA8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M10 13h4M20 11h4" stroke="#7FB3F0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IcSatelite({ size = 22, cor = "#0A1424" }: P & { cor?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <g transform="rotate(30 12 12)">
        <rect x="9" y="9.5" width="6" height="5" rx="1" fill={cor} />
        <rect x="2" y="10.3" width="6" height="3.4" fill="#3E6EA8" />
        <rect x="16" y="10.3" width="6" height="3.4" fill="#3E6EA8" />
      </g>
    </svg>
  );
}

export function IcWhatsApp() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

export function IcAgenda() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14231A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IcCheck({ size = 20 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function IcAlerta({ size = 44 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 44 44" style={{ flex: "none" }}>
      <circle cx="22" cy="22" r="22" fill="#F7C9AE" />
      <g stroke="#9A3D0B" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M22 11v22M12.5 16.5l19 11M12.5 27.5l19-11" />
      </g>
    </svg>
  );
}

export function IcExclamacao({ size = 28 }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="11" fill="#F7C9AE" />
      <path d="M12 7v6M12 16.5v.5" stroke="#9A3D0B" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function SetaRotacao() {
  return <path d="M46 20h10m-4-4 4 4-4 4" stroke="#4A5A50" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/** Carinha de avaliação: bom / atenção / ruim. */
export type Avaliacao = "bom" | "atencao" | "ruim";
export const COR_AVALIACAO: Record<Avaliacao, { fundo: string; cor: string }> = {
  bom: { fundo: "#DDF0DC", cor: "#2E7D4A" },
  atencao: { fundo: "#FBEBC8", cor: "#B7791F" },
  ruim: { fundo: "#FBDCCB", cor: "#B4480E" },
};
export function Carinha({ a, size = 30 }: { a: Avaliacao; size?: number }) {
  const { fundo, cor } = COR_AVALIACAO[a];
  const boca = a === "bom" ? "M8 14.5q4 3.5 8 0" : a === "atencao" ? "M8.5 15.5h7" : "M8 16.5q4-3.5 8 0";
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill={fundo} />
      <circle cx="8.7" cy="9.8" r="1.5" fill={cor} />
      <circle cx="15.3" cy="9.8" r="1.5" fill={cor} />
      <path d={boca} stroke={cor} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Ícones de tempo para "Esta semana na lavoura". */
export function IcTempo({ tipo, size = 24 }: { tipo: "sol" | "nuvem" | "chuva"; size?: number }) {
  if (tipo === "sol")
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" fill="#F2B53A" />
        <g stroke="#F2B53A" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
      </svg>
    );
  if (tipo === "nuvem")
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
        <circle cx="9" cy="9" r="4" fill="#F2B53A" />
        <path d="M7 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 19z" fill="#DCE3EC" />
      </svg>
    );
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">
      <path d="M6 14h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 6 14z" fill="#B8C6D8" />
      <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="#6FA8E6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Interruptor visual (o controle real é o <button role="switch"> que o envolve). */
export function Chave({ ligada, escuro = false }: { ligada: boolean; escuro?: boolean }) {
  const trilho = ligada ? (escuro ? "#9BE36B" : "#2E7D4A") : "#C9D3DF";
  const bola = ligada && escuro ? "#0A1424" : "#FFFFFF";
  return (
    <span aria-hidden="true" className="relative flex-none rounded-full transition-colors" style={{ width: escuro ? 54 : 50, height: escuro ? 32 : 30, background: trilho }}>
      <span
        className="absolute top-[3px] rounded-full transition-all"
        style={{
          width: escuro ? 26 : 24,
          height: escuro ? 26 : 24,
          background: bola,
          left: ligada ? undefined : 3,
          right: ligada ? 3 : undefined,
          boxShadow: ligada ? undefined : "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </span>
  );
}
