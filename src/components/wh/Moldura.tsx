"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Broto, CeuAnimado, IcAgenda, IcMenu, IcVoltar, IcWhatsApp, Logo } from "@/components/wh/Arte";
import { useT } from "@/lib/i18n";

const BTN_REDONDO =
  "flex size-11 items-center justify-center rounded-full border border-ceu-line bg-transparent cursor-pointer";

/** Cabeçalho escuro da tela inicial: logo, menu, saudação e o Broto. */
export function CabecalhoInicio({
  saudacao,
  titulo,
  onMenu,
  ceu = true,
}: {
  saudacao: string;
  titulo: string;
  onMenu: () => void;
  ceu?: boolean;
}) {
  const t = useT();
  return (
    <header className={`relative overflow-hidden bg-ceu px-5 pt-5 lg:pb-12 lg:pt-6 ${CABECALHO_LARGO} ${ceu ? "pb-[34px]" : "pb-10"}`}>
      {ceu && <CeuAnimado />}
      <div className="relative flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size={38} />
          <span className="text-[21px] font-black tracking-[-0.03em] text-claro">weharvest</span>
        </div>
        <button type="button" aria-label={t("Menu", "Menu")} onClick={onMenu} className={BTN_REDONDO}>
          <IcMenu />
        </button>
      </div>
      <div className={`relative flex items-end justify-between lg:mt-0 ${ceu ? "mt-[18px]" : "mt-4"}`}>
        <div className="flex flex-col gap-1">
          <span className={`${ceu ? "text-sm" : "text-[15px]"} font-bold text-broto`}>{saudacao}</span>
          <h1 className={`m-0 ${ceu ? "max-w-[250px]" : "max-w-[260px]"} text-[23px] font-black leading-[1.1] tracking-normal text-claro lg:max-w-none lg:text-[34px]`}>
            {titulo}
          </h1>
        </div>
        <Broto size={ceu ? 64 : 62} />
      </div>
    </header>
  );
}

/** Cabeçalho escuro das telas internas: voltar, etiqueta opcional, título e subtítulo. */
export function CabecalhoInterno({
  titulo,
  subtitulo,
  etiqueta,
  onVoltar,
  onMenu,
}: {
  titulo: string;
  subtitulo: string;
  etiqueta?: string;
  /** Menu "Mais" no canto superior direito (telas das abas). */
  onMenu?: () => void;
  /** Sem `onVoltar` (telas das abas), mostra a marca no lugar do botão de voltar. */
  onVoltar?: () => void;
}) {
  const t = useT();
  return (
    <header className={`flex flex-col gap-3.5 bg-ceu px-5 pb-10 pt-5 lg:gap-2 lg:pb-12 lg:pt-8 ${CABECALHO_LARGO}`}>
      <div className="flex min-h-11 items-center justify-between lg:hidden">
        {onVoltar ? (
          <button type="button" aria-label={t("Voltar", "Back")} onClick={onVoltar} className={BTN_REDONDO}>
            <IcVoltar />
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <Logo size={30} />
            <span className="text-[17px] font-black tracking-[-0.03em] text-claro">weharvest</span>
          </span>
        )}
        {etiqueta && <span className="font-mono text-xs tracking-[0.14em] text-broto">{etiqueta}</span>}
        {onMenu ? (
          <button type="button" aria-label={t("Mais: sua lavoura, idioma e detalhes", "More: your field, language and details")} onClick={onMenu} className={BTN_REDONDO}>
            <IcMenu />
          </button>
        ) : (
          onVoltar && <span className="w-11" />
        )}
      </div>
      <h1 className="m-0 text-[27px] font-black leading-[1.1] tracking-[-0.02em] text-claro lg:text-[34px]">{titulo}</h1>
      <p className={`m-0 ${etiqueta ? "text-sm" : "text-[15px]"} text-claro-2`}>{subtitulo}</p>
    </header>
  );
}

/** Botões WhatsApp e Agenda (no fim das telas). */
export function BotoesCompartilhar({ hrefWhatsApp, onAgenda }: { hrefWhatsApp: string; onAgenda?: () => void }) {
  const t = useT();
  return (
    <div className={`grid gap-2.5 ${onAgenda ? "grid-cols-[1fr_auto]" : "grid-cols-1"}`}>
      <a
        href={hrefWhatsApp}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-whatsapp text-base font-extrabold text-white no-underline shadow-[0_6px_16px_rgba(37,165,95,.35)]"
      >
        <IcWhatsApp />
        {t("Enviar no WhatsApp", "Send on WhatsApp")}
      </a>
      {onAgenda && (
        <button
          type="button"
          onClick={onAgenda}
          className="flex min-h-14 cursor-pointer items-center gap-2 rounded-full border-none bg-white px-4 text-[15px] font-extrabold text-texto"
        >
          <IcAgenda />
          {t("Agenda", "Calendar")}
        </button>
      )}
    </div>
  );
}

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Instalar o app": no Android usa o convite do navegador; no iPhone explica o caminho; some quando já está instalado. */
export function InstalarApp() {
  const t = useT();
  const [convite, setConvite] = useState<EventoInstalar | null>(null);
  const [estado, setEstado] = useState<"android" | "iphone" | "instalado" | "outro">("outro");
  useEffect(() => {
    const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const quando = (e: Event) => {
      e.preventDefault();
      setConvite(e as EventoInstalar);
      setEstado("android");
    };
    const feito = () => setEstado("instalado");
    window.addEventListener("beforeinstallprompt", quando);
    window.addEventListener("appinstalled", feito);
    // estado inicial lido do navegador depois de montar
    queueMicrotask(() => setEstado((s) => (instalado ? "instalado" : iphone ? "iphone" : s)));
    return () => {
      window.removeEventListener("beforeinstallprompt", quando);
      window.removeEventListener("appinstalled", feito);
    };
  }, []);
  if (estado === "instalado" || estado === "outro") return null;
  return (
    <section className="flex items-center gap-3 rounded-3xl bg-ceu p-4 text-claro">
      <Logo size={44} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[17px] font-extrabold">{t("Instale o app no celular", "Install the app on your phone")}</span>
        <span className="text-sm text-claro-2">
          {estado === "iphone"
            ? t("Toque em Compartilhar e depois em “Adicionar à Tela de Início”.", "Tap Share, then “Add to Home Screen”.")
            : t("Abre direto da tela inicial, mesmo com sinal fraco.", "Opens straight from your home screen, even with weak signal.")}
        </span>
      </div>
      {estado === "android" && convite && (
        <button
          type="button"
          onClick={async () => {
            await convite.prompt();
            const r = await convite.userChoice;
            if (r.outcome === "accepted") setEstado("instalado");
            setConvite(null);
          }}
          className="min-h-11 flex-none cursor-pointer rounded-full border-none bg-broto px-4 text-[15px] font-extrabold text-ceu"
        >
          {t("Instalar", "Install")}
        </button>
      )}
    </section>
  );
}

export type Aba = "risco" | "calendario" | "depois" | "safra" | "mais";

function IconeAba({ aba }: { aba: Aba }) {
  const p = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (aba === "risco")
    return (
      <svg {...p}>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      </svg>
    );
  if (aba === "calendario")
    return (
      <svg {...p}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  if (aba === "depois")
    return (
      <svg {...p}>
        <path d="M12 21V6M12 9l-4-3M12 9l4-3M12 14l-4-3M12 14l4-3M12 19l-4-3M12 19l4-3" />
      </svg>
    );
  if (aba === "safra")
    return (
      <svg {...p}>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h7M9 17h7" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/**
 * No computador, o `<main>` das telas vira uma grade: coluna principal larga + coluna lateral.
 * No celular nada muda (continua uma coluna só).
 */
const GRADE_BASE = "lg:grid lg:gap-6 lg:mx-auto lg:w-full lg:max-w-[1180px] lg:px-10 lg:pb-12";
export const MAIN_LARGO = `${GRADE_BASE} lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] lg:items-start`;

/** Variante em grade de 3 colunas iguais (cartões do mesmo tipo, lado a lado). */
export const MAIN_GRADE3 = `${GRADE_BASE} lg:grid-cols-3`;

/** Recuo lateral dos cabeçalhos no computador, alinhado com o conteúdo de `MAIN_LARGO`. */
const CABECALHO_LARGO = "lg:px-[max(2.5rem,calc((100%-1100px)/2))]";

/**
 * Coluna da grade do computador. No celular ela "some" (display: contents) e os cartões
 * seguem na ordem de sempre; use `Grupo` com `ordem` quando a ordem do celular intercala as colunas.
 */
export function Coluna({ lado = false, children }: { lado?: boolean; children: React.ReactNode }) {
  return (
    <div className={`contents lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-5 ${lado ? "lg:col-start-2" : "lg:col-start-1"}`}>{children}</div>
  );
}

/** Bloco de cartões com posição fixa na ordem do celular (`ordem` 1, 2, 3…). */
export function Grupo({ ordem, children }: { ordem: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 lg:gap-5" style={{ order: ordem }}>
      {children}
    </div>
  );
}

/** Navegação do app: abas fixas no rodapé (celular) ou barra lateral (computador). */
export function BarraAbas({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const t = useT();
  const itens: [Aba, string][] = [
    ["risco", t("Início", "Home")],
    ["calendario", t("Calendário", "Calendar")],
    ["depois", t("Rotação", "Rotation")],
    ["safra", t("Safra", "Season")],
    ["mais", t("Mais", "More")],
  ];
  return (
    <nav
      aria-label={t("Seções do app", "App sections")}
      className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[440px] -translate-x-1/2 grid-cols-4 gap-1 border-t border-borda bg-white/95 px-2 pb-[max(14px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:inset-y-0 lg:left-0 lg:w-[232px] lg:max-w-none lg:translate-x-0 lg:grid-cols-1 lg:content-start lg:gap-1.5 lg:border-r lg:border-t-0 lg:bg-ceu lg:px-4 lg:pt-6"
    >
      <span className="mb-6 hidden items-center gap-2.5 px-2 lg:flex">
        <Logo size={36} />
        <span className="text-xl font-black tracking-[-0.03em] text-claro">weharvest</span>
      </span>
      {itens.map(([id, rotulo]) => {
        const ativa = aba === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={ativa ? "page" : undefined}
            onClick={() => onAba(id)}
            className={`${id === "mais" ? "hidden lg:flex" : "flex"} min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-none text-[13px] font-extrabold lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-base ${
              ativa ? "bg-[#E3F2E1] text-lavoura-escura" : "bg-transparent text-texto-2 lg:text-claro-2 lg:hover:bg-ceu-2"
            }`}
          >
            <IconeAba aba={id} />
            {rotulo}
          </button>
        );
      })}
    </nav>
  );
}

/** Folha que sobe do rodapé (menu, município, data). Fecha com Esc ou tocando fora.
 *  Vai para o <body> por portal: uma folha aberta de dentro de outra (o calendário dentro da escolha da data)
 *  não fica presa nem cortada pela folha de baixo. Esc fecha só a folha de cima. */
export function Folha({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: React.ReactNode }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  }, [onFechar]);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, a, input")?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const folhas = document.querySelectorAll('[data-wh-folha="1"]');
      if (folhas[folhas.length - 1] === ref.current) fechar.current();
    };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ceu/50 lg:items-center lg:p-8" onClick={() => fechar.current()}>
      <div
        ref={ref}
        data-wh-folha="1"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="wh-sheet flex max-h-[85vh] w-full max-w-[440px] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-palha px-4 pb-8 lg:max-w-[520px] lg:rounded-[28px] lg:px-6 lg:pb-6 lg:shadow-[0_24px_60px_rgba(10,20,36,.35)]"
      >
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-palha px-4 pb-1 pt-4 lg:-mx-6 lg:px-6 lg:pt-5">
          <h2 className="m-0 text-xl font-black">{titulo}</h2>
          <button
            type="button"
            onClick={() => fechar.current()}
            className="min-h-11 flex-none cursor-pointer rounded-full bg-campo px-4 text-[15px] font-bold text-texto"
          >
            {t("Fechar", "Close")}
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Abas "Vou plantar" / "Já plantei". */
export function AbasModo({ modo, onModo }: { modo: "vou" | "ja"; onModo: (m: "vou" | "ja") => void }) {
  const t = useT();
  const aba = (m: "vou" | "ja", rotulo: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={modo === m}
      onClick={() => onModo(m)}
      className={`min-h-[46px] cursor-pointer rounded-full border-none text-[15px] font-extrabold ${
        modo === m ? "bg-texto text-white" : "bg-transparent text-texto"
      }`}
    >
      {rotulo}
    </button>
  );
  return (
    <div role="tablist" aria-label={t("Momento da safra", "Season stage")} className="grid grid-cols-2 gap-1 rounded-full bg-campo p-1">
      {aba("vou", t("Vou plantar", "Planning"))}
      {aba("ja", t("Já plantei", "Already planted"))}
    </div>
  );
}

/** Linha clicável dentro do cartão (município / data). */
export function LinhaEscolha({
  icone,
  rotulo,
  valor,
  acao,
  onClick,
  alto = 52,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  acao: string;
  onClick: () => void;
  alto?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border-none bg-campo px-3.5 text-left"
      style={{ minHeight: alto }}
    >
      {icone}
      <span className="flex flex-1 flex-col">
        <span className="text-[13px] text-texto-2">{rotulo}</span>
        <span className={`${alto > 52 ? "text-lg" : "text-[17px]"} font-extrabold text-texto`}>{valor}</span>
      </span>
      <span className={`${alto > 52 ? "text-[15px]" : "text-sm"} font-bold text-lavoura`}>{acao}</span>
    </button>
  );
}
