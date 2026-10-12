# Revisión de plantillas brasileñas — 2026

**Última revisión:** 11 de octubre de 2026  
**Estado:** fuentes y base de nuevas carreras identificadas; conciliación de
plantillas pendiente; no se cambiaron plantillas.

## Fuente de plantillas nuevas

Las carreras nuevas generan sus plantillas con `buildSquad()` en
`src/lib/game/squads.ts`, usando las semillas de `src/lib/game/names.ts`.
`createCareer()` en `src/lib/game/world.ts` instancia esas plantillas al crear
la partida. Las plantillas guardadas en carreras existentes no se deben
reescribir al actualizar las semillas.

La cobertura inicial encontrada en `names.ts` es:

- **Série A:** 20 clubes, con 16 entradas por club en `STARS`.
- **Série B:** 20 clubes, con entre 16 y 19 entradas por club en `STARS`.
- **Série C:** 20 clubes sin semillas de futbolistas por club; el motor completa
  sus plantillas con jugadores generados.

Las semillas guardan nombre, posición, GRL, edad, nacionalidad y potencial.
El valor se calcula con la economía del juego y el contrato se genera al crear
la partida; no son campos importados de Transfermarkt.

## Resultado de la consulta de fuentes

Se consultaron las páginas de las competiciones 2026 de Transfermarkt para
Série A (`BRA1`), Série B (`BRA2`) y Série C (`BRA3`), además de fichas de
plantilla de clubes:

- `https://www.transfermarkt.com/campeonato-brasileiro-serie-a/startseite/wettbewerb/BRA1/plus/?saison_id=2026`
- `https://www.transfermarkt.com/campeonato-brasileiro-serie-b/startseite/wettbewerb/BRA2/saison_id/2026`
- `https://www.transfermarkt.com/campeonato-brasileiro-serie-c/startseite/wettbewerb/BRA3/saison_id/2026`
- `https://www.transfermarkt.com/flamengo-rio-de-janeiro/kader/verein/614/saison_id/2026`

Las páginas de competición solo expusieron información general, sin los
listados de jugadores. También se consultaron estas fichas de clubes de Série A
y B:

- `https://www.transfermarkt.com/flamengo-rio-de-janeiro/kader/verein/614/saison_id/2026`
- `https://www.transfermarkt.com/palmeiras-sao-paulo/kader/verein/1023/saison_id/2026`
- `https://www.transfermarkt.com/fortaleza-esporte-clube/kader/verein/10870/saison_id/2026`

Las URLs `kader/.../saison_id/2026` seleccionan la temporada 2027 en las fichas
de clubes consultadas. Esa consulta de temporada fue incorrecta para el
calendario brasileño y produjo **“No information”**; no se usaron sus metadatos
como prueba. Al quitar `saison_id`, la ficha actual de Flamengo muestra la
plantilla detallada (por ejemplo, Agustín Rossi: 31 años, portero, Argentina,
contrato hasta 31/12/2027, valor €10m:
`https://www.transfermarkt.com/cr-flamengo/kader/verein/614`). Esto confirmó
que Transfermarkt sí expone las columnas individuales en la página de temporada
actual; aún no se verificaron los 60 clubes individualmente, así que no se
hicieron cambios basados en una muestra parcial.

Una consulta de Série C con un ID de club no validado resolvió a Portmore
United FC. Se descartó esa ficha y no se considera fuente para ningún club
brasileño.

### Fuente oficial complementaria: CBF

La CBF publica listados de atletas por temporada y división, con una API JSON
paginada. Los endpoints y totales observados el 11 de octubre de 2026 son:

| División | Página oficial | Endpoint JSON | Atletas reportados |
|---|---|---|---:|
| Série A | `https://www.cbf.com.br/futebol-brasileiro/atletas/campeonato-brasileiro/serie-a/2026` | `https://www.cbf.com.br/api/cbf/atletas/campeonato/1260611/pagina/{n}` | 835 |
| Série B | `https://www.cbf.com.br/futebol-brasileiro/atletas/campeonato-brasileiro/serie-b/2026` | `https://www.cbf.com.br/api/cbf/atletas/campeonato/1260612/pagina/{n}` | 814 |
| Série C | `https://www.cbf.com.br/futebol-brasileiro/atletas/campeonato-brasileiro/serie-c/2026` | `https://www.cbf.com.br/api/cbf/atletas/campeonato/1260613/pagina/{n}` | 589 |

Las filas consultadas contienen ID CBF, nombre, apodo, año y club asociado.
El endpoint individual `https://www.cbf.com.br/api/cbf/atletas/{id}` aporta
fecha de nacimiento; calcular la edad desde esa fecha, porque la edad mostrada
en un perfil puede estar desactualizada. Estos registros no exponen posición,
nacionalidad, contrato, vigencia del registro ni historial de traspasos o
cesiones. Por tanto, el club asociado en CBF no basta para confirmar por sí
solo el estado contractual o una cesión.

Se recorrieron todas las páginas y las cantidades obtenidas coincidieron con
los totales de CBF: **835/835** en Série A (34 páginas), **814/814** en Série B
(33 páginas) y **589/589** en Série C (24 páginas). Las filas se compararon
preliminarmente con las semillas existentes. Como CBF entrega el nombre
registrado o apodo, pero no posición, nacionalidad ni historial de movimientos,
y puede incluir homónimos o alias, el cotejo por nombre no basta para retirar
o trasladar una semilla con seguridad. La descarga completa no quedó guardada
como datos del juego.

## Clubes pendientes

Todos los clubes de estas competiciones quedan pendientes de conciliación
individual entre las semillas existentes, las inscripciones CBF y las fichas
de Transfermarkt de temporada correcta. La lista identifica la cobertura
del juego inspeccionada, no una confirmación de sus plantillas reales:

| División | Clubes pendientes |
|---|---|
| Série A | Flamengo, Palmeiras, Botafogo, Fluminense, Corinthians, São Paulo, Atlético Mineiro, Cruzeiro, Grêmio, Internacional, Bahia, Santos, Vasco da Gama, Athletico Paranaense, Red Bull Bragantino, Vitória, Mirassol, Coritiba, Chapecoense, Remo |
| Série B | Fortaleza, Ceará, Sport, Goiás, Juventude, Criciúma, Ponte Preta, Náutico, Avaí, América-MG, CRB, Cuiabá, Vila Nova, Atlético-GO, Novorizontino, Botafogo-SP, Operário-PR, São Bernardo, Londrina, Athletic-MG |
| Série C | Amazonas FC, Anápolis, Barra FC, Botafogo-PB, Brusque, Caxias, Confiança, Ferroviária, Figueirense, Floresta, Guarani, Inter de Limeira, Itabaiana, Ituano, Maranhão, Maringá FC, Paysandu, Santa Cruz, Volta Redonda, Ypiranga |

## Continuación segura

Antes de cambiar `STARS` o añadir semillas de Série C, verificar cada plantilla
de 2026 usando la ficha Transfermarkt sin `saison_id/2026` (el selector para
Brasil 2026 puede usar `saison_id/2025`) y cruzar afiliaciones con el registro
CBF. Registrar por separado incorporaciones, salidas y préstamos solo con
evidencia de movimiento. Completar el vacío de Série C solo con futbolistas
cuyas fichas y clubes estén verificados. Después validar identidades repetidas,
cesiones y rangos del juego. Mantener los IDs de club existentes: `brcrb`
identifica a Coritiba y `bb_crb` identifica a CRB; no son IDs intercambiables.
