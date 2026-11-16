// Localização do aparelho com mensagens claras para cada motivo de falha.
// Também evita ficar "buscando" para sempre quando a pessoa ignora o pedido de permissão do navegador.

export type MotivoFalha = "indisponivel" | "negado" | "semSinal" | "demorou" | "semResposta";

export class FalhaLocalizacao extends Error {
  constructor(public motivo: MotivoFalha) {
    super(motivo);
  }
}

export function obterLocalizacao(opcoes: PositionOptions & { esperaMaxMs?: number } = {}): Promise<GeolocationCoordinates> {
  const { esperaMaxMs = 30_000, ...pos } = opcoes;
  return new Promise((ok, falha) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator) || !window.isSecureContext) {
      falha(new FalhaLocalizacao("indisponivel"));
      return;
    }
    let terminou = false;
    const vigia = setTimeout(() => {
      if (terminou) return;
      terminou = true;
      falha(new FalhaLocalizacao("semResposta"));
    }, esperaMaxMs);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (terminou) return;
        terminou = true;
        clearTimeout(vigia);
        ok(p.coords);
      },
      (e) => {
        if (terminou) return;
        terminou = true;
        clearTimeout(vigia);
        falha(new FalhaLocalizacao(e.code === e.PERMISSION_DENIED ? "negado" : e.code === e.POSITION_UNAVAILABLE ? "semSinal" : "demorou"));
      },
      pos,
    );
  });
}

/** Mensagem para o produtor, com o que fazer em cada caso. */
export function mensagemFalha(e: unknown): { pt: string; en: string } {
  const motivo: MotivoFalha = e instanceof FalhaLocalizacao ? e.motivo : "semSinal";
  switch (motivo) {
    case "negado":
      return {
        pt: "O navegador bloqueou a localização. Para liberar, toque no cadeado ao lado do endereço do site e permita “Localização” (no iPhone: Ajustes › Privacidade › Serviços de Localização › Safari). Depois toque de novo no botão.",
        en: "The browser blocked the location. To allow it, tap the padlock next to the site address and allow “Location” (on iPhone: Settings › Privacy › Location Services › Safari). Then tap the button again.",
      };
    case "semSinal":
      return {
        pt: "O aparelho não conseguiu saber onde você está. Confira se a localização (GPS) do celular está ligada e tente de novo.",
        en: "The device could not tell where you are. Check that the phone’s location (GPS) is on and try again.",
      };
    case "demorou":
      return {
        pt: "A localização demorou demais. Tente de novo em um lugar aberto.",
        en: "The location took too long. Try again somewhere open.",
      };
    case "semResposta":
      return {
        pt: "O pedido de localização ficou sem resposta. Se o navegador perguntou, toque em “Permitir” e tente de novo.",
        en: "The location request got no answer. If the browser asked, tap “Allow” and try again.",
      };
    default:
      return {
        pt: "Este aparelho ou navegador não informa a localização.",
        en: "This device or browser does not provide a location.",
      };
  }
}
