# Plano de redesign de UI/UX — weharvest

> **Para o agente que vai implementar:** este documento contém TODAS as decisões. Não reabra decisões de design; se algo não estiver especificado, escolha a opção mais simples coerente com as seções 3 e 4 e anote no fim do PR. Siga as fases na ordem (seção 7). Ao fim de cada fase rode a verificação da seção 8.

---

## 0. Regras para o agente (leia antes de tudo)

1. **Next.js 16 não é o Next que você conhece.** Antes de escrever código, leia `AGENTS.md` e os guias relevantes em `node_modules/next/dist/docs/01-app/` (pelo menos: fontes `next/font`, metadata/viewport, Server vs Client Components). Respeite avisos de depreciação.
2. **Não altere a lógica de cálculo.** Proibido mudar: `src/lib/engine/**`, `src/lib/power.ts`, `src/lib/lugares.ts`, `src/lib/local-view.ts`, `src/lib/view-data.ts`, `src/lib/rotacoes.ts` (exceto se uma fase disser o contrário — nenhuma diz), `src/data/**`, `scripts/**`. O redesign é só de apresentação.
3. **Bilíngue sempre.** Todo texto visível passa por `t("português", "english")` (de `useT()` em `src/lib/i18n.tsx`). Nenhum texto novo só em um idioma. Os textos novos já estão definidos neste plano (seção 6) — use-os literalmente.
4. **Sem regressão de funcionalidade.** Tudo o que existe hoje continua existindo (lista na seção 9.1). Muda o lugar e o visual.
5. **Uma dependência nova permitida:** `lucide-react` (ícones). Instale com `npm install --save-exact lucide-react`. Nenhuma outra.
6. **Comandos:** o Node está em `~/.local/node/bin` (veja `.claude/launch.json`). Use `export PATH="$HOME/.local/node/bin:$PATH"` antes de `npm`. Para ver o app, use o preview `dev` de `.claude/launch.json`.
7. **Git:** nesta máquina o `git` pode falhar com "xcode-select: No developer tools were found". Se falhar, não tente consertar; apenas siga sem commits e avise no fim. Se funcionar, faça um commit por fase na branch `dev`.
8. **Acessibilidade mínima obrigatória:** alvos de toque ≥ 44 px; texto ≥ 13 px (nada de `text-[10px]`/`text-[11px]`); foco visível; cor nunca é o único sinal (sempre ícone ou texto junto); `aria-*` corretos nos controles descritos.

---

## 1. Diagnóstico da UI atual

Observado no código e rodando o app em 375 px (celular) e desktop.

| # | Problema | Onde | Efeito para o usuário |
|---|---|---|---|
| D1 | **Visual de hackathon espacial, não de ferramenta do campo.** Fundo azul-marinho escuro, ponto verde pulsando, "NASA Space Apps 2026" no topo. | `globals.css`, `layout.tsx` (`colorScheme: "dark"`), `GroundTruthApp.tsx:704-741` | No celular, ao sol, tela escura com texto cinza é difícil de ler. O agricultor não se reconhece no visual. |
| D2 | **A resposta fica abaixo da dobra no celular.** O primeiro card (município + 8 datas + baixada) ocupa a tela inteira. | `GroundTruthApp.tsx:743-832` | O usuário não vê o resultado de mudar a data sem rolar; perde a relação causa → efeito. |
| D3 | **Escolher data "às cegas".** 8 chips `20/09…30/11` em fonte mono, sem nenhum indicativo de risco. O gráfico que compara datas está escondido em "Comparar todas as datas". | `GroundTruthApp.tsx:794-817`, `1058-1082` | A pergunta principal ("qual data é melhor?") exige abrir um acordeão. |
| D4 | **Acordeões dentro de acordeões (3 níveis).** "Entender os números" › "Ver só El Niño" › "Como classificamos". O filtro de El Niño, que **muda os números**, está escondido no 2º nível. | `GroundTruthApp.tsx:861-1056` | Usuário se perde; resultado muda sem ele entender por quê. |
| D5 | **Cores com significado duplicado.** Laranja = seca **e** "atenção" **e** risco Médio **e** Alto. Verde = selecionado **e** link **e** recomendação **e** foco. "Risco: Médio" e "Risco: Alto" são quase iguais. | `Rotacoes.tsx:30-45`, tokens `gt-risk-*`, `gt-orange` | Não dá para distinguir nível de risco pela cor; a recomendação "Plantando até 20/09…" aparece marrom/laranja como se fosse um alerta. |
| D6 | **Muito texto técnico no fluxo principal** (regras com °C, percentis, GWETROOT) e rótulos muito pequenos (10–11 px, fonte mono). | `CardRisco`, `Prova2026`, `Fonte`, rótulos `font-mono text-[10px]` | Público com 40–65 anos e pouca familiaridade com estatística abandona. |
| D7 | **"4 de cada 10 anos" pode ser lido como "perco 40%".** O próprio roteiro de teste (`TESTE_COM_AGRICULTOR.md`) aponta esse risco, mas a tela não previne. | Card de resposta | Erro de interpretação grave. |
| D8 | **Rotações: causa depois do efeito.** O quadro "Para o seu campo" aparece **antes** dos controles que o alteram; restrições e prioridades usam o mesmo estilo de chip. | `Rotacoes.tsx:150-230` | O usuário não percebe que os botões mudam a recomendação. |
| D9 | **"Mais detalhes e provas" é um saco de 5 seções** de 1 só clique, todas longas. | `GroundTruthApp.tsx:1087-1107` | Ninguém encontra a previsão de 16 dias, que é a parte mais acionável ("posso plantar esta semana?"). |
| D10 | **Compartilhar só copiando texto.** O público usa WhatsApp. | `Rotacoes.tsx:146-160` | Atrito no gesto mais natural (mandar para o técnico/filho). |
| D11 | **Desktop desperdiçado:** coluna única de 1024 px; para mudar a data é preciso rolar até o topo. | layout geral | Técnico/avaliador no computador perde tempo. |
| D12 | **Código:** `GroundTruthApp.tsx` tem 1166 linhas; tokens do shadcn (`--primary`, `.dark`, etc.) estão em `globals.css` mas não são usados. | | Difícil manter; ruído. |

---

## 2. Público-alvo e princípios

### 2.1 Personas (se o app fosse lançado)

**P1 — Produtor familiar/médio do Sudoeste e Oeste do Paraná (principal)**
- 35–65 anos, 20–300 ha, soja no verão + milho safrinha. Associado de cooperativa (ex.: Coamo, C.Vale, Coopavel, Sicredi para crédito).
- Celular Android intermediário, tela 360–400 px, 4G instável na lavoura, **usa ao ar livre** (sol forte).
- Vive no WhatsApp; lê frases curtas; desconfia de "app que manda plantar"; confia no agrônomo da cooperativa.
- Pergunta que ele traz: *"Se eu plantar a soja dia 20/10, o meu milho vai pegar geada?"* e *"Qual a melhor data?"*.
- Às vezes quem usa é o **filho/filha** que ajuda na lavoura (18–30 anos), que mostra o resultado para o pai.

**P2 — Técnico/agrônomo (cooperativa, IDR-Paraná/Emater, revenda)**
- Usa no celular e no computador; quer ver **evidência** (quais anos, qual regra, fonte), confiar e repassar.
- Usa o app como argumento numa conversa com o produtor; precisa de um resumo para mandar.

**P3 — Avaliador/pesquisador (NASA Space Apps, universidade)**
- Desktop, em inglês, quer ver método, dados NASA, limitações e o teste com IBGE. Lê tudo — mas só depois de entender a proposta em 10 segundos.

### 2.2 Princípios de design (usar para decidir qualquer detalhe não previsto)

1. **Resposta primeiro, prova depois.** Primeira tela = pergunta + entrada mínima + resposta. Evidências e método ficam em uma camada abaixo, nunca em 3 níveis.
2. **Legível ao sol.** Fundo claro, texto escuro, contraste AA (≥ 4,5:1) em todo texto, números grandes.
3. **Uma cor = um significado.** Categorias (geada azul, seca marrom) separadas de níveis de risco (verde/âmbar/vermelho, sempre com ícone + palavra).
4. **Linguagem de conversa de lavoura.** Frases curtas, sem siglas no fluxo principal; termos técnicos só na camada de prova/glossário.
5. **Honestidade visível.** Manter "apoio à decisão", "a validar com técnico", "não é previsão de perda" — mas em uma linha, não em parágrafos.
6. **Celular primeiro, desktop aproveitado.** No desktop: entrada fixa à esquerda, resultado à direita.

---

## 3. Direção visual — "Caderno de campo"

Visual claro, quente, de papel e terra; verde-escuro como marca; números grandes; cartões brancos com borda suave. Nada de fundo espacial. Sem fotos, sem logos da NASA (regra do README).

### 3.1 Tokens de cor (substituem TODOS os `gt-*`)

Contrastes já conferidos (texto sobre o fundo indicado): todos ≥ 4,5:1.

| Token Tailwind | Hex | Uso |
|---|---|---|
| `paper` | `#F5F2EA` | fundo da página (`body`) |
| `surface` | `#FFFFFF` | cartões |
| `surface-2` | `#ECE7DB` | áreas internas, trilhos de barra, chips não selecionados (hover) |
| `line` | `#DDD6C8` | bordas padrão |
| `line-strong` | `#B9B09E` | bordas de controles (chips, inputs) |
| `ink` | `#1C2117` | texto principal (14,7:1) |
| `ink-muted` | `#4A5243` | texto secundário (7,3:1) |
| `ink-faint` | `#5F6657` | legendas, fontes (4,8:1) — menor cor permitida para texto |
| `brand` | `#2C6A38` | marca, botão primário, item selecionado, links |
| `brand-strong` | `#21522B` | hover do botão primário |
| `brand-soft` | `#E2EEDD` | fundo de destaque positivo/selecionado |
| `frost` | `#2563A6` | categoria geada (barras, ícone, número) |
| `frost-soft` | `#E2EDF8` | fundo de bloco de geada |
| `frost-ink` | `#1D4F86` | texto sobre `frost-soft` |
| `drought` | `#A0521A` | categoria seca (barras, ícone, número) |
| `drought-soft` | `#F7E9DB` | fundo de bloco de seca |
| `drought-ink` | `#83420F` | texto sobre `drought-soft` |
| `low` | `#1E6B3F` | nível Baixo (texto/ícone) |
| `low-soft` | `#E1F1E6` | fundo do selo Baixo |
| `mid` | `#7A5200` | nível Médio (texto/ícone) |
| `mid-soft` | `#FFF1C7` | fundo do selo Médio |
| `mid-line` | `#E8C766` | borda do selo Médio |
| `high` | `#A3231B` | nível Alto (texto/ícone) |
| `high-soft` | `#FBE2DF` | fundo do selo Alto |
| `high-strong` | `#B3261E` | borda esquerda do veredito Alto |
| `soy` | `#3F7F33` | barra da soja (texto branco sobre ela: 4,9:1) |
| `corn` | `#E2B33C` | barra do milho (texto `ink` sobre ela) |
| `wheat` | `#B98A2E` | barra do trigo (texto `ink`) |

Regras:
- **Geada = azul, seca = marrom.** Nunca use azul/marrom para nível de risco.
- **Nível de risco** só aparece via componente `NivelBadge` (ícone + palavra) ou a borda do veredito.
- **Verde `brand`** = marca/seleção/ação. O nível "Baixo" usa `low` (outro verde, sempre com ícone ✓ e a palavra).
- Avisos de cautela neutros (ex.: "poucos anos na amostra") usam `mid-soft` + ícone de alerta.

### 3.2 Tipografia

- **Uma família só: Archivo** (já carregada). Remover `IBM_Plex_Mono` de `layout.tsx` e todas as classes `font-mono`. Números com `tabular-nums`.
- Pesos carregados: `400, 500, 600, 700, 800` (remover 900).
- Escala (mobile → `sm:`):
  - `display` (número grande do risco): `text-5xl font-extrabold leading-none tabular-nums` (48 px)
  - `h1`: `text-[26px] sm:text-4xl font-extrabold leading-tight tracking-tight`
  - `h2` (título de seção): `text-xl sm:text-2xl font-extrabold tracking-tight`
  - `h3`: `text-lg font-bold`
  - corpo: `text-base leading-relaxed` (16 px)
  - secundário: `text-sm` (14 px) `text-ink-muted`
  - legenda/fonte: `text-[13px] text-ink-faint` — **mínimo absoluto**
  - rótulo de seção ("eyebrow"): `text-[13px] font-semibold uppercase tracking-wide text-ink-faint`

### 3.3 Forma, espaçamento, elevação, movimento

- Raios: cartões `rounded-2xl` (16 px); blocos internos `rounded-xl` (12 px); chips/botões `rounded-full`.
- Cartão padrão: `bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-[0_1px_2px_rgba(28,33,23,0.06)]`.
- Espaço vertical entre seções: `gap-6` (mobile) / `gap-8` (desktop).
- Gutter lateral da página: `px-4` mobile, `sm:px-6`. Largura máxima `max-w-6xl`.
- Movimento: só transições de 150–200 ms em cor/altura de barras (`motion-safe:`). **Remover** `gt-pulse` e `gt-rise`. Manter o bloco `prefers-reduced-motion`.
- Foco: `outline: 2px solid var(--color-brand); outline-offset: 2px`.

### 3.4 Ícones (`lucide-react`)

Tamanho 20 px no corpo (`size-5`), 16 px em selos (`size-4`), `aria-hidden="true"` sempre (o texto ao lado dá o significado). Mapeamento fixo:

| Conceito | Ícone lucide |
|---|---|
| Geada | `Snowflake` |
| Seca | `SunDim` |
| Município | `MapPin` |
| Data/calendário | `CalendarDays` |
| Baixada | `Mountain` |
| Nível Baixo | `CircleCheck` |
| Nível Médio | `TriangleAlert` |
| Nível Alto | `OctagonAlert` |
| Não calculado | `CircleMinus` |
| Dica/melhor data | `Lightbulb` |
| Buscar | `Search` |
| Localização GPS | `LocateFixed` |
| WhatsApp/compartilhar | `Share2` |
| Copiar | `Copy` / `Check` (após copiar) |
| Acordeão | `ChevronDown` (gira 180° aberto) |
| Fechar | `X` |
| Previsão | `CloudSun` |
| Info | `Info` |
| Marca (logo) | `Sprout` |

---

## 4. Nova arquitetura de informação

### 4.1 Ordem da página

```
TopBar (fixa)                                   [Sprout] weharvest        [EN|PT]
(banner "Ver em português", se aplicável)
Hero curto (h1 + 1 linha)
┌─ Painel "Sua lavoura" ───────────────┐   ← desktop: coluna esquerda fixa (sticky)
│ 1 Onde fica sua lavoura? (chips)     │
│ 2 Quando vai plantar a soja?         │
│   [Seletor de data com barras]       │
│ [switch] Lavoura em baixada          │
│ ▸ Ajuste avançado: El Niño/La Niña   │
└──────────────────────────────────────┘
BarraContexto (só mobile, aparece quando o painel sai da tela)
┌─ Resposta ───────────────────────────┐   ← desktop: coluna direita
│ eyebrow: Pato Branco · soja 20/10    │
│ VEREDITO (borda colorida por nível)  │
│ [Geada 4 em 10]  [Seca 3 em 10]      │
│ "não é o tamanho da perda"           │
│ Calendário da safra (linha do tempo) │
│ [💡 Melhor data p/ geada] [Usar]     │
└──────────────────────────────────────┘
┌─ Posso plantar esta semana? ─────────┐  (previsão 16 dias, carrega ao tocar)
└──────────────────────────────────────┘
┌─ O que plantar depois da soja? ──────┐
│ Ajuste: prioridade + "não consigo"   │
│ 1º, 2º, 3º (cartões ranqueados)      │
│ [Enviar no WhatsApp] [Copiar]        │
└──────────────────────────────────────┘
┌─ Provas e detalhes ──────────────────┐
│ grade de 6 blocos → painel abaixo    │
└──────────────────────────────────────┘
Rodapé: fontes e limitações · crédito NASA Space Apps
```

### 4.2 Wireframe mobile (375 px) — primeira tela

```
┌───────────────────────────────────┐
│ 🌱 weharvest              EN [PT] │ 56px, fixa
├───────────────────────────────────┤
│ Quando plantar a soja para        │
│ proteger o milho safrinha?        │ h1 26px
│ Em quantos dos últimos 45 anos o  │
│ milho pegou geada ou seca.        │
│ ┌───────────────────────────────┐ │
│ │ 📍 Onde fica sua lavoura?     │ │
│ │ (Pato Branco)(Cascavel)       │ │
│ │ (Francisco Beltrão)(🔍 Outro) │ │
│ │ 📅 Quando vai plantar a soja? │ │
│ │ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮      │ │ barras azul/marrom
│ │ 20/9 1/10 ... [20/10] ... 30/11│ │
│ │ ■ geada ■ seca                │ │
│ │ [⏻] Lavoura em baixada        │ │
│ │ ▸ El Niño / La Niña           │ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │ ← o topo da Resposta já aparece
│ │▌Risco alto para o milho...    │ │
```

O painel deve caber em ~520 px de altura em 375 px de largura (chips menores: `min-h-11 px-3 text-[15px]`).

### 4.3 Wireframe desktop (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🌱 weharvest   Dados diários da NASA desde 1981                EN|PT │
├──────────────────────────────────────────────────────────────────────┤
│ h1 (largura total)                                                   │
│ ┌──────────── 380px ───────┐ ┌──────────── 1fr ─────────────────────┐│
│ │ Sua lavoura (sticky      │ │ Resposta                              ││
│ │ top-20)                  │ │ Posso plantar esta semana?            ││
│ │                          │ │ O que plantar depois da soja?         ││
│ │                          │ │ Provas e detalhes                     ││
│ └──────────────────────────┘ └───────────────────────────────────────┘│
│ Rodapé                                                               │
└──────────────────────────────────────────────────────────────────────┘
```
Classes: contêiner `lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-8 lg:items-start`; painel `lg:sticky lg:top-20`.

---

## 5. Componentes base (novo diretório `src/components/ui/`)

Todos `"use client"` apenas se tiverem estado/handlers. Tipos TypeScript estritos. Cada um em seu arquivo.

### 5.1 `Card.tsx`
```tsx
export function Card({ as = "section", className = "", children, ...rest }: { as?: "section" | "div" | "article"; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>)
```
Classe base da seção 3.3. Também exporte `CardHeader({ eyebrow?, title, titleId?, action? })` que renderiza eyebrow (estilo 3.2) + `h2` + slot à direita.

### 5.2 `Chip.tsx` — `ChipGroup` + `Chip`
- `ChipGroup({ label, type: "radio" | "toggle", children })` → `div role="radiogroup"` (radio) ou `role="group"` (toggle), `aria-label={label}`, `flex flex-wrap gap-2`.
- `Chip({ selected, onClick, icon?, children, role })`:
  - não selecionado: `min-h-11 rounded-full border border-line-strong bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-surface-2`
  - selecionado: `border-brand bg-brand text-white` + ícone `Check size-4` à esquerda.
  - `role="radio" aria-checked` ou `aria-pressed` conforme o grupo.
  - **Navegação por setas** no grupo radio: roving tabindex (só o selecionado tem `tabIndex=0`; ←/→ movem e selecionam).

### 5.3 `Segmented.tsx`
Controle segmentado (2–4 opções, largura total): `div role="radiogroup"` com `grid grid-cols-N rounded-full bg-surface-2 p-1`; opção selecionada `bg-surface shadow text-ink font-bold`, demais `text-ink-muted`. `min-h-11`. Setas ←/→. Props: `{ label, options: {id, label, sub?}[], value, onChange }` (`sub` = texto pequeno embaixo, ex.: "(12)").

### 5.4 `Switch.tsx`
`<button role="switch" aria-checked>` com trilho 44×26 px (`bg-line-strong` → `bg-brand` ligado) e bolinha branca; texto clicável ao lado (o botão inteiro é a linha, `min-h-11`). Props: `{ checked, onChange, label, hint? }`. `hint` vai abaixo em `text-sm text-ink-muted`.

### 5.5 `NivelBadge.tsx` (substitui `SeloNivel`)
Props: `{ nivel: "Baixo" | "Médio" | "Alto" | "Não calculado"; prefixo?: string; tamanho?: "sm" | "md" }`.
- Baixo: `bg-low-soft text-low border-low/30` + `CircleCheck`
- Médio: `bg-mid-soft text-mid border-mid-line` + `TriangleAlert`
- Alto: `bg-high-soft text-high border-high/30` + `OctagonAlert`
- Não calculado: `bg-surface-2 text-ink-muted border-line` + `CircleMinus`
- Texto: sem prefixo → PT "Risco baixo/médio/alto/Não calculado", EN "Low/Medium/High risk", "Not calculated". Com prefixo (ex.: "Geada") → `"{prefixo}: baixo|médio|alto|não calculado"` / EN `"{prefix}: low|medium|high|not calculated"`.
- Classe: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-semibold` (`md`: `px-3 text-sm`).
- Exporte também `nivelPorFreq(f)` e o tipo `Nivel` (mover de `Rotacoes.tsx`, mesma lógica).

### 5.6 `DotArray.tsx` (pictograma "X em 10")
Props `{ preenchidos: number; cor: "frost" | "drought"; rotulo: string }`. 10 círculos `size-3.5 sm:size-4` em linha (`flex gap-1.5`); os `preenchidos` primeiros com `bg-frost`/`bg-drought`, demais `bg-surface-2 border border-line`. `role="img" aria-label={rotulo}`. `preenchidos = Math.round(frequencia*10)` (0 se nenhum).

### 5.7 `Disclosure.tsx` (acordeão)
`<details>` nativo: `rounded-xl border border-line bg-surface`; `<summary>` `flex min-h-11 items-center justify-between gap-3 px-4 py-3 font-semibold text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden` com `ChevronDown` que gira (`group-open:rotate-180`, `details` com `className="group"`). Conteúdo `px-4 pb-4`. Props `{ titulo, subtitulo?, defaultOpen?, children, onToggle? }`.
**Regra: nunca colocar um `Disclosure` dentro de outro.**

### 5.8 `Button.tsx`
Variantes: `primary` (`bg-brand text-white hover:bg-brand-strong`), `secondary` (`bg-surface border border-line-strong text-ink hover:bg-surface-2`), `ghost` (`text-brand underline-offset-2 hover:underline`). Todos `min-h-11 rounded-full px-5 font-semibold inline-flex items-center gap-2`. Aceita `href` (renderiza `<a>`) ou `onClick`.

### 5.9 `Callout.tsx`
Props `{ tom: "info" | "positivo" | "cautela" | "frost" | "drought"; icone?: LucideIcon; children }`.
- info: `bg-surface-2 text-ink`; positivo: `bg-brand-soft text-ink`; cautela: `bg-mid-soft text-ink border-mid-line`; frost: `bg-frost-soft text-frost-ink`; drought: `bg-drought-soft text-drought-ink`.
- `rounded-xl border p-4 flex gap-3`, ícone `size-5 shrink-0 mt-0.5`.

### 5.10 `Fonte.tsx`
`<p className="text-[13px] leading-relaxed text-ink-faint">`. Links dentro: `underline underline-offset-2 hover:text-ink`.

---

## 6. Especificação de cada parte (com textos)

Formato dos textos: **PT** / **EN**. Use exatamente.

### 6.1 `layout.tsx`
- Remover `IBM_Plex_Mono`; Archivo com pesos `["400","500","600","700","800"]`.
- `viewport`: `themeColor: "#F5F2EA"`, `colorScheme: "light"`.
- `body`: `min-h-full bg-paper text-ink font-sans`.
- Metadata: manter.

### 6.2 `globals.css`
Substituir o arquivo inteiro pelo bloco abaixo (remove tokens shadcn, `.dark`, `gt-*`, `gt-rise`, `gt-pulse`):
```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-archivo), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --color-paper: #F5F2EA;
  --color-surface: #FFFFFF;
  --color-surface-2: #ECE7DB;
  --color-line: #DDD6C8;
  --color-line-strong: #B9B09E;
  --color-ink: #1C2117;
  --color-ink-muted: #4A5243;
  --color-ink-faint: #5F6657;
  --color-brand: #2C6A38;
  --color-brand-strong: #21522B;
  --color-brand-soft: #E2EEDD;
  --color-frost: #2563A6;
  --color-frost-soft: #E2EDF8;
  --color-frost-ink: #1D4F86;
  --color-drought: #A0521A;
  --color-drought-soft: #F7E9DB;
  --color-drought-ink: #83420F;
  --color-low: #1E6B3F;
  --color-low-soft: #E1F1E6;
  --color-mid: #7A5200;
  --color-mid-soft: #FFF1C7;
  --color-mid-line: #E8C766;
  --color-high: #A3231B;
  --color-high-soft: #FBE2DF;
  --color-high-strong: #B3261E;
  --color-soy: #3F7F33;
  --color-corn: #E2B33C;
  --color-wheat: #B98A2E;
}

body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

h1, h2, h3 { letter-spacing: -0.02em; }

html { scroll-padding-top: 72px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
```
(Confira no guia do Tailwind v4 / Next 16 que `@theme inline` com `--color-*` gera `bg-paper`, `text-ink`, etc. Se `components.json` reclamar no build, ignore — não é usado.)

### 6.3 `TopBar` (`src/components/gt/TopBar.tsx`)
- `header` fixo: `sticky top-0 z-30 h-14 border-b border-line bg-paper/90 backdrop-blur`. Conteúdo em `max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between`.
- Esquerda: `Sprout` (cor `brand`, `size-6`) + "weharvest" (`text-lg font-extrabold`). Em `sm:` e acima, ao lado, `text-sm text-ink-muted`: **"Dados diários da NASA desde 1981"** / **"NASA daily data since 1981"**.
- Direita: seletor de idioma = `Segmented` compacto com opções `EN`, `PT` (largura fixa ~112 px, `aria-label` "Idioma"/"Language"); cada botão com `lang="en"`/`lang="pt"`.
- Banner "Ver em português" (quando `sugerirPt`): logo abaixo da TopBar, `Callout tom="info"` com texto bilíngue fixo **"This app is in English. / Este app está em inglês."** e `Button variant="primary"` **"Ver em português"** (`lang="pt"`).

### 6.4 Hero
```
h1: PT "Quando plantar a soja para proteger o milho safrinha?"
    EN "When should I plant soybeans to protect my second-crop corn?"
p (text-ink-muted, max-w-2xl):
    PT `Veja em quantos dos últimos ${totalAnos} anos o milho safrinha pegou geada ou seca, conforme a data da soja. Dados diários da NASA desde 1981.`
    EN `See in how many of the last ${totalAnos} years second-crop corn met frost or drought, depending on the soybean date. NASA daily data since 1981.`
```
Hero ocupa largura total acima do grid de 2 colunas. `pt-6 pb-4`.

### 6.5 Painel "Sua lavoura" (`src/components/gt/PainelLavoura.tsx`)
Props: `{ locais, localId, onLocal, onAdicionarLocal, datas (DataView[] já com filtro ENSO aplicado), idx, onIdx, baixada, onBaixada, fase, onFase, d (data selecionada, todos os anos), ensoInfo, params, indiceEnso, local }`. `id="sua-lavoura"`.

Card com eyebrow **"Sua lavoura"** / **"Your field"** e 4 blocos separados por `border-t border-line pt-4 mt-4`:

**(1) Município**
- Rótulo com ícone `MapPin`: **"1. Onde fica sua lavoura?"** / **"1. Where is your field?"** (`text-base font-bold`).
- `ChipGroup type="radio"` com os locais (padrão + extras). Último chip (não-radio, `variant` tracejada `border-dashed text-brand`, ícone `Search`): **"Outro município"** / **"Another municipality"** com `aria-expanded`.
- Ao abrir: `EscolherLugar` restilizado (seção 6.11) logo abaixo.
- Se `local.personalizado`: `Fonte` com o texto atual (`GroundTruthApp.tsx:786-789`).

**(2) Data — `SeletorData` (`src/components/gt/SeletorData.tsx`)** — substitui os chips de data **e** o `GraficoDatas`.
- Rótulo com `CalendarDays`: **"2. Quando vai plantar a soja?"** / **"2. When will you plant soybeans?"**
- `div role="radiogroup" aria-label` = **"Data de plantio da soja"** / **"Soybean planting date"**; `grid grid-cols-8 gap-1` (se a largura do contêiner < 340 px, `overflow-x-auto` com `min-w-11` por célula — use `grid-flow-col auto-cols-[minmax(44px,1fr)]`).
- Cada célula = `button role="radio" aria-checked tabIndex(roving)`:
  - altura total `h-24`; parte de cima `h-14 flex items-end justify-center gap-1` com 2 barras `w-2 rounded-t-sm` (`bg-frost`, `bg-drought`), altura `(freq/max)*100%`, `min-height: 3px`; `max` igual ao código atual (`GraficoDatas`: máximo entre geada/seca de todas as datas, mínimo 0,1). Geada usa `geadaBaixada` quando `baixada`.
  - embaixo: data `text-[13px] tabular-nums` (PT `20/10`, EN `Oct 20` → em EN use 2 linhas: `Oct` / `20` para caber).
  - não selecionada: `rounded-lg hover:bg-surface-2`; selecionada: `rounded-lg bg-brand-soft ring-2 ring-brand` e data em `font-bold text-brand`.
  - `aria-label`: reutilizar exatamente o de `GraficoDatas` (`GroundTruthApp.tsx:367-370`).
  - setas ←/→ mudam a data.
- Legenda abaixo (`Fonte` com 2 quadradinhos coloridos `size-3 rounded-sm`): **"geada"** · **"seca"** — e o texto **"Barras: em quantos anos o milho pegou cada evento."** / **"Bars: in how many years the corn met each event."**
- Se `fase !== "todos"`: `Fonte` com o texto atual "Gráfico e recomendação calculados só com os…" (`GroundTruthApp.tsx:1066-1069`).

**(3) Baixada** — `Switch` com ícone `Mountain`:
- label **"Lavoura em baixada"** / **"Field in a lowland"**
- hint **"Fundo de vale, onde o ar frio se acumula. Aumenta o risco de geada."** / **"Valley floor where cold air pools. Raises frost risk."**

**(4) Ajuste avançado (ENSO)** — um único `Disclosure` (abre automaticamente se `fase !== "todos"`):
- titulo **"Ver só anos de El Niño ou La Niña"** / **"See only El Niño or La Niña years"**; subtitulo = `fase === "todos"` ? **"Usando todos os anos"** / **"Using all years"** : `Usando só ${fraseFase} (${n})` / `Using only ${fraseFase} (${n})`.
- Dentro, em ordem: texto explicativo atual (`GroundTruthApp.tsx:890-893`); `Segmented` 2×2 (em mobile use `grid-cols-2`) com as 4 opções de `FILTROS_ENSO` e `sub="(n)"`; lista "Anos contados" se filtrado; `Callout tom="cautela"` "Poucos anos…" se `< AMOSTRA_MINIMA`; parágrafo NOAA atual com link; `Fonte` com o texto técnico "Fase de cada safra = RONI…" (**sem** outro details — vira texto direto, depois de um `<p className="font-semibold">` **"Como classificamos (técnico)"** / **"How we classify (technical)"**).

### 6.6 `BarraContexto` (mobile, `src/components/gt/BarraContexto.tsx`)
- Visível só `< lg` e só quando o painel `#sua-lavoura` **não** está na tela (use `IntersectionObserver` no painel; `useEffect` com cleanup).
- `fixed top-14 inset-x-0 z-20 border-b border-line bg-surface/95 backdrop-blur px-4 h-12 flex items-center justify-between text-sm`.
- Conteúdo: `MapPin` + nome · `CalendarDays` + data · (se baixada) "baixada"/"lowland" · (se filtro) nome curto do filtro. Botão `ghost` **"Alterar"** / **"Change"** → `document.getElementById("sua-lavoura")?.scrollIntoView({ behavior: "smooth", block: "start" })`.
- `aria-hidden` não; é um `nav aria-label="Resumo da escolha"/"Current selection"`.

### 6.7 Resposta (`src/components/gt/Resposta.tsx`)
Props: `{ local, d (todos os anos), dEf (com filtro), datasEf, idx, onIdx, baixada, filtroTexto, params }`. `id="resposta"`, `aria-live="polite"` no bloco do veredito (só no `h2`/veredito, não no card inteiro).

Ordem dentro do Card:
1. **Eyebrow**: `${local.nome} · ${t("soja em","soybean on")} ${dia}` + (baixada ? ` · baixada/lowland`) + (filtro ? ` · ${filtroTexto}`).
2. **Veredito** — bloco `rounded-xl border-l-[6px] p-4` com fundo/borda pelo **pior** nível entre geada e seca (Alto → `border-high-strong bg-high-soft`; Médio → `border-mid-line bg-mid-soft`; Baixo → `border-low bg-low-soft`), ícone do nível `size-6` e:
   - `h2` (`text-2xl font-extrabold`):
     - Alto: **"Risco alto para o milho safrinha"** / **"High risk for second-crop corn"**
     - Médio: **"Risco moderado para o milho safrinha"** / **"Moderate risk for second-crop corn"**
     - Baixo: **"Risco baixo para o milho safrinha"** / **"Low risk for second-crop corn"**
   - `p` (`text-base`): PT `Nos últimos ${total} anos, com a soja em ${dia}, o milho pegou geada em ${fraseGeada} e seca em ${fraseSeca}.` EN `Over the last ${total} years, with soybeans on ${dia}, the corn met frost in ${fraseGeada} and drought in ${fraseSeca}.` (`frase*` = `deCada10(r).frase`, ex.: "4 de cada 10 anos").
   - Use `nivelPorFreq` para o nível (mesmo critério dos selos).
3. **Dois `MetricTile`** (`grid gap-3 sm:grid-cols-2`; componente local no mesmo arquivo):
   - Cabeçalho: ícone (`Snowflake` cor `frost` / `SunDim` cor `drought`) + **"Geada no milho"** / **"Frost on the corn"** ou **"Seca no milho"** / **"Drought on the corn"**. Se baixada, título da geada: **"Geada no milho (baixada)"** / **"Frost on the corn (lowland)"**.
   - Número `display` na cor da categoria: `deCada10(r).grande` sem "/10" → mostre `"4"` grande + `" em 10 anos"` / `" in 10 years"` em `text-lg font-semibold text-ink-muted`. Casos especiais: `<1` → `"<1"`; 0 → `"0"`.
   - `DotArray`.
   - `text-sm text-ink-muted`: PT `${anosComEvento} de ${totalAnos} safras (${periodo})` / EN `${n} of ${total} seasons (${periodo})`.
   - `NivelBadge`.
   - Bloco: `rounded-xl border border-line bg-surface p-4 flex flex-col gap-3`.
4. **Nota anti-erro** (`Callout tom="info"`, ícone `Info`, `text-sm`): **"É quantas vezes o evento aconteceu nos anos passados — não é quanto da lavoura você perde."** / **"This is how often the event happened in past years — not how much of the crop you would lose."**
5. **Calendário da safra** (`LinhaDoTempo` restilizada; mover para `src/components/gt/LinhaDoTempo.tsx`):
   - Título `h3`: **"Calendário da safra"** / **"Crop calendar"**.
   - Mesma geometria do código atual, cores novas: soja `bg-soy text-white`, milho `bg-corn text-ink`, fase crítica = `border-2 border-ink` (sem pulsar), época de geada `bg-frost-soft border-dashed border-frost` com rótulo `Snowflake` + "geada"/"frost" em `text-frost-ink text-[13px]`. Eixo de meses em `text-[13px] text-ink-faint` (em 375 px mostre só meses pares se não couber: `sm:` mostra todos; abaixo use `[&>span:nth-child(even)]:invisible`).
   - Lista `dl` com os 4 itens atuais (`text-sm`), "Floração e enchimento" com marcador `border-2 border-ink` e "Época de geada" em `text-frost-ink`.
6. **Melhor data** (substitui `Recomendacao`; mesma lógica de `minG`/`ate`/`ok`):
   - `Callout tom={ok ? "positivo" : "info"}` com ícone `Lightbulb`.
   - Se `ok`: PT `Pensando só na geada, ${dia(sel)} já está entre as melhores datas: ${frase} (${n} de ${total} safras).` EN `Looking at frost only, ${dia} is already among the best dates: ${frase} (${n} of ${total} seasons).`
   - Se não `ok`: PT `Pensando só na geada, plantar a soja até ${dia(alvo)} reduz o risco para ${frase(alvo)} (${n} de ${total} safras). Na data escolhida foram ${nSel} de ${total}.` EN `Looking at frost only, planting soybeans by ${dia(alvo)} lowers the risk to ${frase} (${n} of ${total} seasons). On the chosen date it was ${nSel} of ${total}.` + `Button variant="secondary"` **`Ver com ${dia(alvo)}`** / **`Show ${dia(alvo)}`** → `onIdx(ate)` e depois `document.getElementById("resposta")?.scrollIntoView({block:"start"})`.
   - Linha abaixo (`Fonte`): **"Confira também a seca e a janela do ZARC do seu município (exigida para crédito e seguro). A decisão final é sua, com o técnico."** / **"Also check drought and your municipality’s ZARC window (required for credit and insurance). The final decision is yours, with your agronomist."**

### 6.8 Previsão — "Posso plantar esta semana?" (`Previsao.tsx` restilizado)
- Agora é um card próprio na coluna principal, **logo após a Resposta**.
- `CardHeader` eyebrow **"Próximos 16 dias"** / **"Next 16 days"** · título **"Posso plantar a soja esta semana?"** / **"Can I plant soybeans this week?"**, ícone `CloudSun`.
- **Carregamento sob demanda (manter privacidade do README):** o card mostra 1 frase **"Consulta a previsão do tempo para {nome}. Só as coordenadas públicas do município são enviadas."** / **"Checks the weather forecast for {name}. Only the municipality’s public coordinates are sent."** e `Button primary` **"Ver previsão"** / **"Show forecast"**. Só ao clicar o componente que faz `fetch` é montado (separe em `PrevisaoConteudo` interno com o `useEffect` atual; `key={local.id}` mantém o reset ao trocar município; trocar município volta ao estado "não carregado").
- Resultado: veredito em `Callout` (`nao-plantar` → classes do nível Alto + `OctagonAlert`; `atencao` → `cautela` + `TriangleAlert`; ok → `positivo` + `CircleCheck`), **sem emojis**.
- Faixa diária: `flex gap-1.5 overflow-x-auto snap-x` de cartões `min-w-16 rounded-xl border p-2 text-center`; primeiros 7 dias `border-line-strong bg-surface`, demais `border-line bg-surface-2`; dia frio `bg-frost-soft text-frost-ink` + `Snowflake size-4`; chuva forte `text-drought font-bold`. Textos 13 px (não 10–11).
- Legenda e regras atuais em `Fonte` (textos atuais de `Previsao.tsx:121-140`, trocando "Azul = …" e "Os 7 primeiros dias têm borda mais clara" por **"Azul com ❄ = mínima ≤ {limite} °C. Os 7 primeiros dias têm fundo branco."** / **"Blue with ❄ = minimum ≤ {limit} °C. The first 7 days have a white background."** — use o ícone `Snowflake`, não o caractere).

### 6.9 Rotações (`Rotacoes.tsx` restilizado; **lógica de ordenação idêntica**)
Ordem nova dentro do Card:
1. `CardHeader` título **"O que plantar depois da soja?"** / **"What to plant after soybeans?"**; subtítulo `text-ink-muted`: **"Compare 3 opções para o seu campo. Diga o que importa e o que você não consegue fazer."** / **"Compare 3 options for your field. Tell us what matters and what you can’t do."**
2. **Ajustes** (`rounded-xl bg-surface-2 p-4 grid gap-4 md:grid-cols-2`):
   - **"O que pesa mais para você?"** / **"What matters most to you?"** → `Segmented` com `FOCOS` (3 opções).
   - **"Não consigo…"** / **"I can’t…"** → lista de 3 checkboxes estilizados (cada linha `label min-h-11 flex items-center gap-3`, `input type="checkbox" className="size-5 accent-[#2C6A38]"`), textos de `RESTRICOES`. Mesmo estado `restricoes`.
3. **Lista ranqueada** `ol` (`grid gap-3`; **não** usar 3 colunas — cada cartão em largura total; em `xl:` pode ser `grid-cols-3`? **Não**: manter 1 coluna para leitura). Cada `li` = `RotacaoCard`:
   - Esquerda: círculo do rank `size-8 rounded-full bg-surface-2 font-bold` (o 1º: `bg-brand text-white`).
   - Título `h3` = `x.nome`; abaixo `text-sm text-ink-muted` = `x.rotulo`.
   - 1º e não bloqueado: faixa `inline-flex rounded-full bg-brand-soft text-brand text-[13px] font-semibold px-2.5 py-1` **"Mais indicada para você"** / **"Best fit for you"**, e abaixo o `motivo + climaMilho` atual (`text-sm`).
   - Selos: `NivelBadge` com prefixo (Geada/Seca/Erosão) — mesma lógica atual (trigo: geada do trigo + seca "Não calculado").
   - `x.justificativa` (`text-sm`).
   - Bloqueado: cartão `bg-surface-2 opacity-80`, rank cinza, `Callout tom="cautela"` **"Não se aplica a você: {motivo}."** / **"Not applicable to you: {reason}."**
   - `Disclosure` **"Ver detalhes"** / **"See details"** com o conteúdo atual do details (`Rotacoes.tsx:274-357`), restilizado: blocos `Lista` com títulos coloridos por tipo (Evidência `text-frost-ink`, Benefícios `text-low`, Riscos `text-high`, Lacunas `text-ink-faint`); `Pontos` com `bg-brand` / `bg-line`.
   - Cartão: `rounded-xl border p-4 flex gap-4` (1º não bloqueado: `border-brand border-2`).
4. **Compartilhar** (`flex flex-wrap gap-2`, abaixo da lista):
   - Extraia a montagem do texto de `copiar()` para uma função pura no mesmo arquivo `montarResumo(...) : string` (mesmo conteúdo de `linhas`).
   - `Button primary` com `Share2`: **"Enviar no WhatsApp"** / **"Send on WhatsApp"** → `href={"https://wa.me/?text=" + encodeURIComponent(resumo)}` `target="_blank" rel="noreferrer"`.
   - `Button secondary` com `Copy`/`Check`: **"Copiar texto"** / **"Copy text"** → comportamento atual (`✓ Copiado` vira ícone `Check` + **"Copiado"** / **"Copied"**), mantendo o `span role="status" sr-only`.
5. `Disclosure` final **"Como ordenamos e o que precisa de técnico"** / **"How we rank them and what needs an agronomist"** com o conteúdo atual (`Rotacoes.tsx:362-386`), o aviso como `Callout tom="cautela"`.

### 6.10 Provas e detalhes (`src/components/gt/Evidencias.tsx`)
Substitui `MaisEvidencias` e o acordeão "Entender os números" / "Comparar todas as datas".
- `CardHeader` eyebrow **"Para quem quer conferir"** / **"For those who want to check"**, título **"Provas e detalhes"** / **"Evidence and details"**.
- Grade de botões `grid grid-cols-2 gap-2 lg:grid-cols-3`. Cada botão: `rounded-xl border border-line bg-surface p-3 text-left min-h-16 hover:bg-surface-2`, título `font-bold` + 1 linha `text-sm text-ink-muted`; selecionado: `border-brand ring-1 ring-brand bg-brand-soft`. `aria-expanded` + `aria-controls="painel-evidencia"`. Clicar no selecionado fecha.
- Nenhum selecionado no início. O painel aparece **abaixo da grade** (largura total) e só monta o conteúdo do item ativo. Ao abrir, `scrollIntoView({block:"nearest"})` no painel. Botão `X` **"Fechar"** / **"Close"** no canto do painel.

| id | Título PT / EN | Linha PT / EN | Conteúdo | Mostrar se |
|---|---|---|---|---|
| `anos` | Em quais anos aconteceu / Which years it happened | Ano a ano, desde 1981 / Year by year since 1981 | os 2 `CardRisco` restilizados (seção 6.10.1) + "Fase do milho contada" + "Risco: Baixo = …" (texto atual 866-877) | sempre |
| `safra2026` | Safrinha 2026 / 2026 second crop | O que o satélite viu este ano / What the satellite saw this year | `Prova2026` restilizado | `!local.personalizado` |
| `solo` | Solo descoberto / Bare soil | Quando o campo fica sem cultura / When the field has no crop | `CampoDescoberto` restilizado | sempre |
| `relevo` | Relevo / Relief | Altitude e baixadas (NASA SRTM) / Elevation and lowlands (NASA SRTM) | `BlocoRelevo` restilizado | `local.relevo?.pontoM != null` |
| `ibge` | Teste com o IBGE / IBGE check | Os anos marcados produziram menos? / Did flagged years yield less? | `ConfrontoIbge` restilizado | sempre |
| `metodo` | Glossário e método / Glossary and method | Palavras e hipóteses usadas / Terms and assumptions | glossário atual (`dl` 1007-1053) + texto de hipóteses (1076-1079) | sempre |

**6.10.1 `CardRisco` restilizado** (mover para `src/components/gt/CardRisco.tsx`): sem o número gigante (já está na Resposta). Cabeçalho com ícone da categoria + título + `NivelBadge`; **faixa de anos** = `div flex gap-[2px]` com um quadradinho por ano (`h-6 flex-1 rounded-[2px]`), anos com evento em `bg-frost`/`bg-drought`, demais `bg-surface-2`; abaixo, eixo com o primeiro e o último ano (`text-[13px] text-ink-faint flex justify-between`); depois lista de anos, geada forte, detalhe da seca (bloco `bg-surface-2 rounded-xl p-3`), a `regra` e o rodapé de confiança. Mantém `role="img"` + `aria-label`.

**6.10.2 Seções movidas para o painel** (`Prova2026`, `BlocoRelevo` → arquivos próprios `src/components/gt/Prova2026.tsx`, `src/components/gt/BlocoRelevo.tsx`): dentro do painel **não** usar `Card` (o painel já é o contêiner); trocar `gt-*` pelos tokens novos (blocos NASA → `frost-soft/frost-ink`; Deral → `drought-soft/drought-ink`; neutros → `surface-2`); títulos `h3`.

**6.10.3 `CampoDescoberto`**: cores de `FUNDO` → `soja: var(--color-soy)`, `milho: var(--color-corn)`, `trigo: var(--color-wheat)`, `cobertura: repeating-linear-gradient(135deg, var(--color-soy) 0 5px, var(--color-brand-soft) 5px 10px)`, `descoberto: repeating-linear-gradient(135deg, var(--color-drought) 0 4px, var(--color-drought-soft) 4px 10px)`. Texto sobre soja `text-white`, sobre milho/trigo `text-ink`, sobre hachuras `text-ink` com `bg-surface/80 rounded px-1`. Remover `font-mono`.

**6.10.4 `ConfrontoIbge`**: resultado principal em `Callout tom="cautela"`; resto igual com tokens novos.

### 6.11 `EscolherLugar` restilizado
- Contêiner `rounded-xl border border-line bg-surface-2 p-3`.
- Input `min-h-11 rounded-full border border-line-strong bg-surface px-4 text-base` com `Search` à esquerda (posicionado absoluto, `pl-10`).
- Botões: **Buscar** `primary`; **Usar minha localização** `secondary` com `LocateFixed`.
- Estados: "Buscando…"/"Baixando 45 anos…" com um spinner simples (`size-4 animate-spin rounded-full border-2 border-brand border-t-transparent`, `motion-safe:`); avisos de erro em `Callout cautela`, info em `Callout info`.
- Resultados: cartões `rounded-xl border bg-surface` com nome `font-bold` e estado/coord `text-[13px] text-ink-faint` (sem mono).
- Texto de privacidade em `Fonte`.

### 6.12 Rodapé (`src/components/gt/Rodape.tsx`)
- `footer border-t border-line mt-8 pt-6 pb-10 text-sm`.
- `Disclosure` **"Fontes e limitações"** / **"Sources and limitations"** com os 2 `Fonte` atuais (1114-1160).
- Linha final `Fonte`: **"Ferramenta de apoio à decisão: não substitui o agricultor nem o agrônomo. Feito para o NASA Space Apps Challenge 2026."** / **"Decision-support tool: it does not replace the farmer or the agronomist. Built for the NASA Space Apps Challenge 2026."**

### 6.13 O que sai da tela
- O bloco "Resposta" antigo (cartão com borda verde e os 2 mini-cartões) — substituído por 6.7.
- `GraficoDatas` — substituído por `SeletorData`.
- O acordeão "Entender os números" (3 níveis) — conteúdo redistribuído: ENSO → painel (6.5-4); CardRisco + definições de risco → Evidências `anos`; glossário → Evidências `metodo`.
- O acordeão "Comparar todas as datas e ver a linha do tempo" — gráfico vira `SeletorData`, linha do tempo vai para a Resposta.
- `MaisEvidencias` — substituído por `Evidencias`.
- Ponto verde pulsando e "NASA Space Apps 2026" do topo — crédito vai para o rodapé.

---

## 7. Fases de implementação

Cada fase termina com o app **compilando e funcionando**. Rode a verificação (seção 8) ao fim de cada uma.

### Fase 1 — Fundação (tokens, fonte, ícones, UI kit)
1. `npm install --save-exact lucide-react`.
2. Substituir `src/app/globals.css` pelo bloco 6.2.
3. Editar `src/app/layout.tsx` conforme 6.1.
4. Criar `src/components/ui/`: `Card.tsx`, `Chip.tsx`, `Segmented.tsx`, `Switch.tsx`, `NivelBadge.tsx`, `DotArray.tsx`, `Disclosure.tsx`, `Button.tsx`, `Callout.tsx`, `Fonte.tsx` (seção 5).
5. **Migração mecânica temporária** para o app não quebrar: em todos os `.tsx` de `src/components/gt/`, troque classes `gt-*` pelo mapa da seção 10 (busca e substituição). Troque `SeloNivel` por `NivelBadge` (re-exporte `SeloNivel = NivelBadge` de `Rotacoes.tsx` só se ajudar durante a fase; remova na fase 5).
6. Remover todas as classes `font-mono` e tamanhos `text-[10px]`/`text-[11px]` (→ `text-[13px]`).
- **Aceite:** `npm run build` passa; a página abre clara, legível, sem nenhuma classe `gt-` (`grep -rn "gt-" src/components src/app` → só nada, ou apenas em comentários).

### Fase 2 — Estrutura e layout
1. Criar `src/lib/useIdioma.ts` (hook client) movendo a lógica de idioma de `GroundTruthApp.tsx:36-47, 631-648` (retorna `{ lang, setLang, sugerirPt }`). Comportamento idêntico.
2. Criar `TopBar.tsx` (6.3) e `Rodape.tsx` (6.12).
3. Reescrever o JSX de `GroundTruthApp.tsx`: TopBar → banner → Hero (6.4) → grid de 2 colunas (4.3) com painel à esquerda e coluna de resultados à direita. Por enquanto a coluna da direita pode reutilizar os blocos atuais.
4. Mover `LinhaDoTempo`, `BlocoRelevo`, `CardRisco`, `Prova2026` para arquivos próprios em `src/components/gt/` (sem mudar comportamento ainda).
- **Aceite:** em 1280 px, painel fica fixo à esquerda ao rolar; em 375 px tudo em uma coluna; sem rolagem horizontal. `GroundTruthApp.tsx` < 350 linhas.

### Fase 3 — Painel "Sua lavoura"
1. Criar `SeletorData.tsx` (6.5-2) e `PainelLavoura.tsx` (6.5) com `Chip`, `Switch`, `Disclosure` do ENSO.
2. Restilizar `EscolherLugar.tsx` (6.11) — **não** mudar handlers, timeouts nem textos de erro.
3. Criar `BarraContexto.tsx` (6.6).
4. Remover `GraficoDatas` e os chips de data antigos.
- **Aceite:** trocar data no seletor muda a Resposta; setas do teclado funcionam no seletor e nos chips; com filtro ENSO ativo o disclosure abre sozinho e o subtítulo mostra o filtro; em 375 px o painel tem ≤ 560 px de altura com o ENSO fechado; a barra de contexto aparece ao rolar e "Alterar" volta ao painel.

### Fase 4 — Resposta + Previsão
1. Criar `Resposta.tsx` (6.7) com veredito, `MetricTile`, nota anti-erro, `LinhaDoTempo` restilizada, melhor data com botão.
2. Restilizar `Previsao.tsx` (6.8) com carregamento por botão.
3. Remover do `GroundTruthApp` o cartão de resposta antigo, `Recomendacao` e o acordeão "Entender os números"/"Comparar".
- **Aceite:** Pato Branco + 20/10: veredito "Risco alto…", geada "4 em 10 anos" (19 de 45), seca "3 em 10 anos" (15 de 45) — **números idênticos aos de antes**; botão "Ver com 20/09" aparece e, ao clicar, seleciona 20/09; a rede **não** chama `api.open-meteo.com` até clicar "Ver previsão" (confira com `read_network_requests`).

### Fase 5 — Rotações
1. Reestruturar `Rotacoes.tsx` (6.9): ajustes primeiro, cartões ranqueados, compartilhar, disclosure final. Extrair `montarResumo`.
2. Remover `SeloNivel` (todos usam `NivelBadge`).
- **Aceite:** com "Plantar trigo" marcado, o trigo vai para o fim com "Não se aplica a você…"; a ordem das 3 rotações para cada combinação de foco/restrição é **a mesma de antes** (compare antes/depois manualmente nas 3 opções de foco); o link do WhatsApp contém o mesmo texto do "Copiar"; `npm test` passa.

### Fase 6 — Provas e detalhes
1. Criar `Evidencias.tsx` (6.10) com a grade e o painel.
2. Restilizar `CardRisco`, `Prova2026`, `BlocoRelevo`, `CampoDescoberto`, `ConfrontoIbge` (6.10.1–6.10.4).
3. Mover glossário e hipóteses para o item `metodo`.
4. Apagar `MaisEvidencias`.
- **Aceite:** cada um dos 6 itens abre e fecha; `safra2026` e `relevo` somem para um município buscado (ex.: Guarapuava); não existe nenhum `<details>` dentro de outro `<details>` (verifique com `document.querySelectorAll("details details").length === 0`).

### Fase 7 — Acabamento, acessibilidade e documentação
1. Revisar EN e PT em todas as telas (trocar idioma e percorrer tudo).
2. Conferir alvos ≥ 44 px (`[...document.querySelectorAll("button, a, summary, [role=radio], [role=switch]")].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height < 44 })` — só links dentro de texto corrido podem aparecer).
3. Remover código morto (`components.json` pode ficar; tokens shadcn já saíram).
4. Atualizar no `README.md` (EN e PT) a linha **Technology/Tecnologia**: fontes → "Archivo (Google Fonts, SIL OFL)" e ícones "Lucide (ISC)". Atualizar a seção "O que já medimos" de `TESTE_COM_AGRICULTOR.md` para refletir a nova tela (ex.: "resposta visível sem rolar no desktop; seletor de data mostra o risco de cada data").
- **Aceite:** checklist completo da seção 8.

---

## 8. Verificação (rodar ao fim de cada fase)

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm test
npm run lint
npm run build
```
Todos devem passar (o `npm test` cobre o motor e as rotações — se falhar, você mexeu em lógica que não devia).

No navegador (preview `dev`), em **375×812** e **1280×800**, nos dois idiomas (`?lang=pt` e `?lang=en`):
- [ ] Sem rolagem horizontal (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] Console sem erros.
- [ ] Pato Branco, 20/10: geada 19 de 45, seca 15 de 45 (antes = depois). Marcar baixada aumenta a geada (anote o valor e compare com o app antigo, se possível pelo deploy https://houston-we-have-a-harvest.vercel.app/?lang=pt).
- [ ] Filtro La Niña: números mudam, aviso de amostra aparece quando < 12.
- [ ] "Outro município" → buscar "Guarapuava" → escolher → dados baixam e a Resposta atualiza.
- [ ] Previsão só busca a API após clicar.
- [ ] Rotação: restrição de trigo, foco "Renda", copiar e WhatsApp.
- [ ] Provas: os 6 itens abrem.
- [ ] Navegação só com teclado (Tab, setas, Enter/Espaço) em: idioma, municípios, datas, switch, ENSO, foco, restrições, evidências.
- [ ] Screenshot final de 375 px (primeira tela) e de 1280 px para o PR.

---

## 9. Escopo e decisões fechadas

### 9.1 Funcionalidades que devem continuar existindo
Idioma EN/PT + `?lang=` + sugestão PT + `localStorage`; 3 municípios + busca + GPS (só Sul do Brasil); 8 datas; baixada; filtro ENSO com contagem, aviso de amostra pequena, leitura NOAA e texto técnico; geada/seca com anos, geada forte, detalhe da seca, regra e confiança; melhor data; linha do tempo; 3 rotações com foco, restrições, ordem, motivo, detalhes, copiar; previsão 16 dias sob demanda; prova 2026; relevo; campo descoberto; teste IBGE; glossário; fontes e limitações.

### 9.2 Fora do escopo (não fazer)
Modo escuro; mapa interativo; PWA/offline; mudar textos agronômicos de `rotacoes.ts`; novas fontes de dados; animações elaboradas; testes de componente (não há infraestrutura; não crie).

### 9.3 Decisões e o porquê (não reabrir)
- **Tema claro** — uso ao ar livre e público 40+; contraste.
- **Seletor de data com barras** — a pergunta central é comparar datas; mostrar o risco no próprio seletor elimina um acordeão.
- **Pictograma de 10 pontos + nota "não é perda"** — reduz o erro de leitura apontado no roteiro de teste.
- **ENSO como "ajuste avançado" no painel** — altera os números, então fica junto das entradas, mas fechado por padrão.
- **WhatsApp** — canal dominante do público; usa `wa.me` (sem API, sem dados pessoais; o texto é o mesmo do copiar).
- **Previsão por botão** — mantém a promessa do README de só chamar o Open-Meteo quando o usuário pede.
- **Uma família tipográfica, sem mono** — mono pequena prejudica a leitura e não acrescenta.
- **lucide-react** — já previsto em `components.json`; ícones consistentes sem desenhar SVG à mão.

---

## 10. Mapa de migração de classes (Fase 1, passo 5)

| Antigo | Novo |
|---|---|
| `bg-gt-bg` | `bg-paper` |
| `bg-gt-card` | `bg-surface` |
| `bg-gt-card2`, `bg-gt-nav` | `bg-surface-2` |
| `border-gt-line` | `border-line` |
| `border-gt-btn-line` | `border-line-strong` |
| `text-gt-text` | `text-ink` |
| `text-gt-muted` | `text-ink-muted` |
| `text-gt-faint` | `text-ink-faint` |
| `*-gt-green`, `*-gt-green-light` | `*-brand` |
| `text-gt-bg` (texto sobre verde) | `text-white` |
| `bg-gt-soy`, `bg-gt-soy-dark` | `bg-soy` |
| `bg-gt-gold` | `bg-corn` |
| `bg-gt-gold-dark` | `bg-wheat` |
| `*-gt-frost` | `*-frost` |
| `bg-gt-frost-bg` | `bg-frost-soft` |
| `border-gt-frost-line` | `border-frost/40` |
| `text-gt-frost-text` | `text-frost-ink` |
| `*-gt-orange` | `*-drought` (se for seca) ou `*-high` (se for risco/alerta) — decida pelo contexto |
| `bg-gt-risk-bg` | `bg-mid-soft` (aviso) |
| `border-gt-risk-line` | `border-mid-line` |
| `text-gt-risk-text` | `text-ink` |
| `bg-gt-safe-bg` | `bg-brand-soft` |
| `border-gt-safe-line` | `border-brand/40` |
| `text-gt-safe-text` | `text-ink` |
| `accent-[#9BE36B]` | `accent-[#2C6A38]` |
| `rounded-[22px]` | `rounded-2xl` |
| `rounded-[18px]` | `rounded-xl` |
| `gt-rise`, `gt-pulse` | remover |
| `font-mono` | remover (use `tabular-nums` em números) |
| `text-[10px]`, `text-[11px]` | `text-[13px]` |
