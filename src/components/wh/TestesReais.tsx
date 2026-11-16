"use client";

import estacoesRes from "@/data/validacao_estacoes.json";
import ibgeRes from "@/data/validacao_ibge_sul.json";
import previsaoRes from "@/data/validacao_previsao.json";
import { fmtNum, useLang, useT } from "@/lib/i18n";

type Tab = { n: number; acerto: number | null; alarmeFalso: number | null; concordancia?: number | null; kappa?: number };
type TesteIbge = { d: number; nMarc: number; nNao: number; mMarc: number; mNao: number; p: number };
type TesteAnos = { anos: number; efeitoTodosMarcados: number; correlacao: number; p: number };

const E = estacoesRes as unknown as {
  meta: { estacoes: number; anos: [number, number]; limiteGeadaC: number };
  diario: { dias: number; vies: number; erroMedio: number; correlacao: number; viesDiasFrios: number; geada: Tab };
  safra: { principal: { geada: Tab; seca: Tab }; todasAsDatas: { geada: Tab } };
  relevo: { estacoes: number; regraBaixadaTpiM: number; inclinacaoCPor10m: number; correlacao: number; p: number; baixadas: number; outras: number; diferencaBaixadaC: number | null };
};
const I = ibgeRes as unknown as {
  meta: { municipios: number; anosMunicipio: number; minAreaHa: number; minAnos: number };
  principal: Record<"geada" | "seca" | "qualquer", { A: TesteIbge; B: TesteIbge; C: TesteAnos }>;
  porData: Record<string, Record<"geada" | "seca" | "qualquer", { A: TesteIbge }>>;
};
const F = previsaoRes as unknown as {
  meta: { periodo: [string, string]; estacoes: number };
  geadaPorAntecedencia: (Tab & { dias: number; viesMinimaC: number })[];
  regraDaSemana: Tab;
};

type Tom = "bom" | "misto" | "ruim";
function Bloco({ titulo, pergunta, veredito, tom, children }: { titulo: string; pergunta: string; veredito: string; tom: Tom; children: React.ReactNode }) {
  const cor = tom === "bom" ? { f: "#E3F2E1", t: "#1F5A34" } : tom === "misto" ? { f: "#FFF4DC", t: "#5C3D07" } : { f: "#FDE3D3", t: "#6B2C08" };
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl bg-campo p-3.5">
      <span className="font-mono text-[11px] tracking-[0.14em] text-texto-2">{titulo}</span>
      <h3 className="m-0 text-base font-extrabold">{pergunta}</h3>
      <p className="m-0 rounded-xl p-3 text-[15px] font-bold leading-[1.4]" style={{ background: cor.f, color: cor.t }}>
        {veredito}
      </p>
      <div className="flex flex-col gap-1.5 text-sm leading-[1.45] text-texto-2">{children}</div>
    </section>
  );
}

/** "Testes com dados reais": satélite × estações, baixada × relevo, anos marcados × produtividade, previsão × medido. */
export function TestesReais() {
  const t = useT();
  const lang = useLang();
  const n0 = (x: number) => fmtNum(x, 0, lang);
  const n1 = (x: number) => fmtNum(x, 1, lang);
  const n2 = (x: number) => fmtNum(x, 2, lang);
  /** "p < 0,001" ou "p = 0,03" */
  const fp = (x: number) => (x < 0.001 ? `p < ${fmtNum(0.001, 3, lang)}` : `p = ${fmtNum(x, x < 0.01 ? 3 : 2, lang)}`);
  const pctx = (x: number | null | undefined) => (x === null || x === undefined ? "–" : `${n0(x)}%`);
  const pp = (x: number) => `${x > 0 ? "+" : ""}${n1(x * 100)}%`;

  const g = E.safra.principal.geada;
  const gt = E.safra.todasAsDatas.geada;
  const s = E.safra.principal.seca;
  const rel = E.relevo;
  const { seca, geada } = I.principal;
  const tarde = I.porData["11-20"]?.geada.A;
  const temPrevisao = F.meta.estacoes > 0 && F.regraDaSemana.n > 0;
  const sem = F.regraDaSemana;
  const ant1 = F.geadaPorAntecedencia[0];
  const ant7 = F.geadaPorAntecedencia[F.geadaPorAntecedencia.length - 1];

  return (
    <section id="testes-reais" aria-labelledby="wh-testes" className="flex flex-col gap-3 rounded-3xl bg-white p-4">
      <h2 id="wh-testes" className="m-0 text-lg font-black tracking-normal">
        {t("Testes com dados reais", "Tests with real-world data")}
      </h2>
      <p className="m-0 text-sm leading-[1.45] text-texto-2">
        {t(
          "Comparamos o app com o que foi medido no chão e na colheita. As regras de cada teste foram fixadas antes de ver o resultado, e o resultado aparece aqui como saiu, bom ou ruim.",
          "We compared the app with what was measured on the ground and at harvest. Each test’s rules were fixed before seeing the result, and the result is shown here as it came out, good or bad.",
        )}
      </p>

      <Bloco
        titulo={t("TESTE 1 · SATÉLITE × ESTAÇÕES", "TEST 1 · SATELLITE × STATIONS")}
        pergunta={t("O satélite da NASA enxerga a geada que a estação mediu?", "Does the NASA data see the frost the station measured?")}
        tom={(g.kappa ?? 0) >= 0.6 ? "bom" : "misto"}
        veredito={t(
          `Na maior parte, sim. Na flor do milho (soja em 20/10), app e estação concordaram em ${pctx(g.concordancia)} das ${n0(g.n)} safras. O app pegou ${pctx(g.acerto)} das safras com geada medida e ${pctx(g.alarmeFalso)} das marcações dele não apareceram na estação. Somando todas as datas de plantio: pegou ${pctx(gt.acerto)}, alarme falso ${pctx(gt.alarmeFalso)}.`,
          `Mostly, yes. In corn flowering (soybeans on Oct 20), app and station agreed in ${pctx(g.concordancia)} of ${n0(g.n)} seasons. The app caught ${pctx(g.acerto)} of seasons with measured frost and ${pctx(g.alarmeFalso)} of its flags did not show up at the station. Across all planting dates: caught ${pctx(gt.acerto)}, false alarms ${pctx(gt.alarmeFalso)}.`,
        )}
      >
        <span>
          {t(
            `${n0(E.meta.estacoes)} estações automáticas do INMET no Sul, ${E.meta.anos[0]}–${E.meta.anos[1]}, ${n0(E.diario.dias)} dias. A mínima da NASA acompanha a medida (correlação ${n2(E.diario.correlacao)}, erro médio ${n1(E.diario.erroMedio)} °C), mas nos dias frios fica ${n1(E.diario.viesDiasFrios)} °C mais quente: por isso parte das geadas fracas passa batido.`,
            `${n0(E.meta.estacoes)} INMET automatic stations in southern Brazil, ${E.meta.anos[0]}–${E.meta.anos[1]}, ${n0(E.diario.dias)} days. The NASA minimum tracks the measured one (correlation ${n2(E.diario.correlacao)}, mean error ${n1(E.diario.erroMedio)} °C), but on cold days it runs ${n1(E.diario.viesDiasFrios)} °C warmer, so some light frosts are missed.`,
          )}
        </span>
        <span>
          {t(
            `Seca: só ${n0(s.n)} safras tinham a chuva medida completa na estação. É pouco para concluir.`,
            `Drought: only ${n0(s.n)} seasons had complete rain records at the station. Too few to conclude.`,
          )}
        </span>
      </Bloco>

      <Bloco
        titulo={t("TESTE 2 · BAIXADA × RELEVO", "TEST 2 · LOWLAND × TERRAIN")}
        pergunta={t("Lugar mais baixo que o entorno é mais frio?", "Is a spot lower than its surroundings colder?")}
        tom={rel.p < 0.05 ? "misto" : "ruim"}
        veredito={
          rel.diferencaBaixadaC === null
            ? t("Poucas estações em baixada para concluir.", "Too few lowland stations to conclude.")
            : t(
                `Sim, o relevo pesa, mas menos do que o app supõe. Nas noites frias, as ${n0(rel.baixadas)} estações em baixada ficaram ${n1(Math.abs(rel.diferencaBaixadaC))} °C mais frias que as outras ${n0(rel.outras)}. O app usa +1 °C: o teste indica que isso exagera um pouco.`,
                `Yes, terrain matters, but less than the app assumes. On cold nights the ${n0(rel.baixadas)} lowland stations were ${n1(Math.abs(rel.diferencaBaixadaC))} °C colder than the other ${n0(rel.outras)}. The app uses +1 °C: the test suggests that overstates it a little.`,
              )
        }
      >
        <span>
          {t(
            `Cada 10 m abaixo da média do terreno em 1,5 km deixa a noite ${n2(rel.inclinacaoCPor10m)} °C mais fria (correlação ${n2(rel.correlacao)}, ${fp(rel.p)}, ${n0(rel.estacoes)} estações), já descontada a altitude. Baixada = ${n0(-rel.regraBaixadaTpiM)} m ou mais abaixo do entorno. Use “Medir o relevo da minha lavoura” para ver o seu talhão.`,
            `Each 10 m below the average terrain within 1.5 km makes the night ${n2(rel.inclinacaoCPor10m)} °C colder (correlation ${n2(rel.correlacao)}, ${fp(rel.p)}, ${n0(rel.estacoes)} stations), after accounting for altitude. Lowland = ${n0(-rel.regraBaixadaTpiM)} m or more below the surroundings. Use “Measure my field’s terrain” to check your plot.`,
          )}
        </span>
      </Bloco>

      <Bloco
        titulo={t("TESTE 3 · ANOS MARCADOS × PRODUTIVIDADE", "TEST 3 · FLAGGED YEARS × YIELD")}
        pergunta={t("Nos anos que o app marca, o milho safrinha rendeu menos?", "In the years the app flags, did second-crop corn yield less?")}
        tom="misto"
        veredito={t(
          `Com seca, sim: nos anos marcados o milho rendeu ${pp(seca.A.d)} em relação aos outros anos do mesmo município (${fp(seca.A.p)}). Mas a seca pega a região inteira junto; contando cada ano uma vez (${n0(seca.C.anos)} safras), a direção se mantém (${pp(seca.C.efeitoTodosMarcados)} num ano todo marcado) e ainda pode ser acaso (p = ${n2(seca.C.p)}).`,
          `For drought, yes: in flagged years corn yielded ${pp(seca.A.d)} versus other years in the same municipality (${fp(seca.A.p)}). But drought hits the whole region at once; counting each year once (${n0(seca.C.anos)} seasons), the direction holds (${pp(seca.C.efeitoTodosMarcados)} in a fully flagged year) but could still be chance (p = ${n2(seca.C.p)}).`,
        )}
      >
        <span>
          {t(
            `Geada com soja em 20/10: ${pp(geada.A.d)} (p = ${n2(geada.A.p)}), sem diferença; nessa data ela é rara na maior parte do PR. Com soja mais tarde (20/11) a geada pega a flor mais vezes e os anos marcados renderam ${tarde ? pp(tarde.d) : "–"}.`,
            `Frost with soybeans on Oct 20: ${pp(geada.A.d)} (p = ${n2(geada.A.p)}), no difference; at that date it is rare in most of Paraná. With later soybeans (Nov 20) frost hits flowering more often and flagged years yielded ${tarde ? pp(tarde.d) : "–"}.`,
          )}
        </span>
        <span>
          {t(
            `${n0(I.meta.municipios)} municípios do PR e SC, ${n0(I.meta.anosMunicipio)} anos-município (IBGE PAM, safrinha ≥ ${n0(I.meta.minAreaHa)} ha, ≥ ${n0(I.meta.minAnos)} anos). Comparando municípios dentro do mesmo ano, a diferença some (seca ${pp(seca.B.d)}, p = ${n2(seca.B.p)}). Os níveis do app medem quantas vezes o clima apertou, não uma perda garantida.`,
            `${n0(I.meta.municipios)} municipalities in PR and SC, ${n0(I.meta.anosMunicipio)} municipality-years (IBGE PAM, second crop ≥ ${n0(I.meta.minAreaHa)} ha, ≥ ${n0(I.meta.minAnos)} years). Comparing municipalities within the same year, the difference disappears (drought ${pp(seca.B.d)}, p = ${n2(seca.B.p)}). The app’s levels measure how often weather got tight, not a guaranteed loss.`,
          )}
        </span>
      </Bloco>

      <Bloco
        titulo={t("TESTE 5 · PREVISÃO × MEDIDO", "TEST 5 · FORECAST × MEASURED")}
        pergunta={t("O “Posso plantar esta semana?” acerta?", "Does “Can I plant this week?” get it right?")}
        tom={!temPrevisao ? "misto" : (sem.acerto ?? 0) >= 70 && (sem.alarmeFalso ?? 100) <= 40 ? "bom" : (sem.acerto ?? 0) >= 40 ? "misto" : "ruim"}
        veredito={
          temPrevisao
            ? t(
                `Para a semana inteira, pouco: das semanas com geada ou chuva forte medidas na estação, o aviso pegou ${pctx(sem.acerto)}; ${pctx(sem.alarmeFalso)} dos avisos foram alarme falso (${n0(sem.n)} semanas). Chuva forte num ponto é quase impossível de prever; por isso o cartão agora diz “sem alerta na previsão” em vez de “pode plantar”.`,
                `For the whole week, not much: of the weeks with frost or heavy rain measured at the station, the warning caught ${pctx(sem.acerto)}; ${pctx(sem.alarmeFalso)} of warnings were false alarms (${n0(sem.n)} weeks). Heavy rain at a single point is nearly impossible to forecast, so the card now says “no alert in the forecast” instead of “good to plant”.`,
              )
            : t("Teste ainda sem dados suficientes.", "Not enough data for this test yet.")
        }
      >
        {temPrevisao && (
          <span>
            {t(
              `Geada prevista 1 dia antes: pegou ${pctx(ant1.acerto)} (alarme falso ${pctx(ant1.alarmeFalso)}); ${ant7.dias} dias antes: ${pctx(ant7.acerto)} (alarme falso ${pctx(ant7.alarmeFalso)}). Previsões que o Open-Meteo de fato publicou, ${F.meta.periodo[0].slice(0, 4)}–${F.meta.periodo[1].slice(0, 4)}, ${n0(F.meta.estacoes)} estações. A previsão vale para a semana; o resto do app é histórico, não previsão.`,
              `Frost forecast 1 day ahead: caught ${pctx(ant1.acerto)} (false alarms ${pctx(ant1.alarmeFalso)}); ${ant7.dias} days ahead: ${pctx(ant7.acerto)} (false alarms ${pctx(ant7.alarmeFalso)}). Forecasts Open-Meteo actually published, ${F.meta.periodo[0].slice(0, 4)}–${F.meta.periodo[1].slice(0, 4)}, ${n0(F.meta.estacoes)} stations. The forecast covers the week; the rest of the app is history, not a forecast.`,
            )}
          </span>
        )}
      </Bloco>

      <p className="m-0 text-xs leading-[1.45] text-texto-2">
        {t(
          "Estações: INMET (cópia NOAA/NCEI GSOD). Produtividade: IBGE PAM, tabela 839. Relevo: Copernicus DEM 90 m. Os scripts em scripts/validacao/ refazem tudo do zero.",
          "Stations: INMET (NOAA/NCEI GSOD copy). Yield: IBGE PAM, table 839. Terrain: Copernicus DEM 90 m. Scripts in scripts/validacao/ redo everything from scratch.",
        )}
      </p>
    </section>
  );
}
