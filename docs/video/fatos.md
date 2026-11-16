# Fatos: weharvest (Houston, We Have a Harvest)

## O produto em uma frase
Para o agricultor do Sul do Brasil que planta soja e depois milho safrinha: diz, com 45 anos de dados da NASA, em quantas safras o milho teria pegado geada ou seca na fase crítica para cada data de plantio da soja. [README, "O que é"]

## Recursos que podem entrar
| # | Recurso | Nome na tela | Fonte |
|---|---|---|---|
| 1 | Resposta "X em 10 anos" por data de plantio | resposta em destaque + seletor de data | README "Como o risco é calculado" 1-5 |
| 2 | Compara 3 rotações (soja→milho, soja→trigo, soja→milho+braquiária) | rotações | README "O que é" |
| 3 | "Para o seu campo": prioridades e restrições reordenam as rotações com o motivo | Para o seu campo | README item 6 |
| 4 | Qualquer município do Sul: busca por nome ou localização, baixa dados da NASA no navegador (~2 s) | busca de município | README "O que os dados da NASA fazem" |
| 5 | Teste de 2026 (seca de abril, geada de maio, Deral) | prova de 2026 | README "Teste de 2026" |
| 6 | Checagem de 16 dias antes de plantar ("Não plante esta semana") | posso plantar agora? | README "16-day check" |
| 7 | Campo sem cultura ao longo do ano (erosão) | — | README "Bare field" |
| 8 | PT/EN com um clique | EN \| PT | README |

## Números (com fonte)
| Número | Fonte |
|---|---|
| 45 safras / dados NASA POWER 1981–2026 | README |
| ~2 s e 1,3 MB para baixar um município | README |
| Pato Branco, soja em 20/out: geada em 19 de 45 safras | README (El Niño) |
| 48 testes automatizados | README "Run locally" |

## Marca
Fonte Archivo; ícones Lucide; sem logo da NASA nem fotos de pessoas (README "Technology"). Cores: ver `src/app` (tema claro "Caderno de campo"). [[CONFIRMAR: hex exatos]]

## Onde o vídeo vai passar
**Envio ao NASA Space Apps 2026: vídeo de 30 s com legendas em inglês (ou até 7 slides em inglês).** [SUBMISSION_FIELDS.md, "Link to Project Demo"] Chamada final: https://houston-we-have-a-harvest.vercel.app

## Restrições
- Não dizer que prevê produtividade: o teste com IBGE foi inconclusivo; os níveis são frequência de evento, não perda esperada. [README]
- Não é previsão do tempo; é frequência histórica. Apoia o agricultor, não o substitui. [README]
- Só calcula ao sul de 22°S. [README]
- Sem agricultor real na tela sem autorização.

## Lacunas
- [[CONFIRMAR: voz em inglês? narração, só texto, ou voz da equipe]]
- [[CONFIRMAR: gravação de tela do app (existe?) e conta/município de demonstração]]
