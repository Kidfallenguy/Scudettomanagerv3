# Plantillas italianas — temporada 2026/27

**Fecha de revisión:** 11 de octubre de 2026  
**Estado:** integradas en las semillas de carreras nuevas para todas las
divisiones y grupos italianos que ya están implementados en Scudetto. Los
grupos que el juego no contiene y las excepciones de datos se dejan pendientes;
no se agregaron clubes ni competiciones.

## Alcance y fuentes

Se verificaron las fichas de plantilla Transfermarkt de temporada 26/27 para
los **20 clubes de Serie B**, los **20 de Serie C Girone A** y los **18 de
Serie D Girone A** que tienen club y liga configurados en el juego. Las páginas
de plantilla y sus fichas individuales de jugadores fueron la fuente de
nombres, edades, nacionalidades, posición principal, valor de mercado
publicado, contrato disponible y avisos de cesión:

- [Serie B 2026/27](https://www.transfermarkt.it/serie-b/startseite/wettbewerb/IT2/saison_id/2026)
- [Serie C Girone A 2026/27](https://www.transfermarkt.it/serie-c-girone-a/startseite/wettbewerb/IT3A/saison_id/2026)
- [Serie D Girone A 2026/27](https://www.transfermarkt.it/serie-d-girone-a/startseite/wettbewerb/IT4A/saison_id/2026)

La temporada se aceptó solo cuando la ficha mostraba el listado detallado
26/27. La fuente no proporciona GRL, potencial ni salarios del juego.

**Cobertura de la estructura actual:** Scudetto tiene configurados únicamente
Serie B, Girone A de Serie C y Girone A de Serie D. Por eso no se incorporaron
los otros dos grupos de Serie C ni los grupos B–I de Serie D; añadirlos habría
supuesto cambiar la estructura de competiciones expresamente protegida por la
tarea. En Transfermarkt aparecen otros 40 clubes de Serie C (Gironi B/C) y 144
de Serie D (Gironi B–I), sin equivalente actualmente en la base de clubes del
juego.

## Resultado por división

| División implementada | Clubes revisados | Jugadores en las fichas | Semillas importadas |
|---|---:|---:|---:|
| Serie B | 20 | 579 | 544 |
| Serie C — Girone A | 20 | 534 | 519 |
| Serie D — Girone A | 18 | 532 | 526 |
| **Total** | **58** | **1.645** | **1.589** |

### Clubes revisados

- **Serie B:** Palermo, Pisa, Hellas Verona, Sampdoria, Cremonese, Empoli,
  Catanzaro, Modena, Cesena, Padova, Avellino, Benevento, Vicenza, Juve Stabia,
  Mantova, Ascoli, Carrarese, Südtirol, Virtus Entella y Arezzo.
- **Serie C — Girone A:** Cittadella, Union Brescia, Arzignano Valchiampo,
  Ospitaletto Franciacorta, Folgore Caratese, Treviso, Desenzano, AlbinoLeffe,
  Alcione Milano, Lumezzane, Giana Erminio, Dolomiti Bellunesi, Lecco, Novara,
  Pro Vercelli, Pergolettese, Juventus Next Gen, Carpi, Renate y Trento.
- **Serie D — Girone A:** Alessandria, Biellese 1902, Derthona, Asti, Ligorna,
  Gozzano, Saluzzo, Millesimo, Chisola, Imperia, Lascaris, Sanremese Calcio,
  Fezzanese, Bra, Borgosesia Calcio, Sestri Levante, Valenzana Mado y Celle
  Varazze.

Los registros conservan identidad estable como `tm-{id}` del perfil
Transfermarkt. Los jugadores cuyas fichas indican cesión se modelan con el
club propietario únicamente cuando ese club existe entre los clubes del juego.
Así se enlazaron **208 cesiones**; otras **56** se excluyeron de las plantillas
iniciales porque Transfermarkt atribuye su propiedad a clubes no representados
en el juego. No se los transformó en propiedad del receptor ni se afirmó que
fueran agentes libres. Los dos nombres repetidos exactos son Mattia Rossetti y
Alessandro Rossi; tienen perfiles Transfermarkt diferentes y se conservaron
como homónimos, no como duplicados de identidad.

Pendientes de conciliación (jugador — club receptor indicado por Transfermarkt;
propietario externo): **Serie B (35):** Grigoris Kastanos — Hellas Verona
(Aris Limassol); Mattia Fortin, Manfredi Nespola y Andrea Bozzolan — Palermo
(RC Lens, US Pianese y AC Reggiana); Leonardo Loria, Mateus Lusuardi, Andrea
Primasso, Jacopo Frosali, Tomás Esteves y Louis Buffon — Pisa (Spezia Calcio,
AC Reggiana, Vis Pesaro 1898, Aurora Pro Patria 1919, SSC Bari y US Città di
Pontedera); Peter Vindahl y Antoine Makoumbou — Sampdoria (AC Sparta Praga y
Samsunspor); Jacopo Seghetti, Emiliano Filippis y Luca Belardinelli — Empoli
(US Livorno 1915, US Pianese y AC Reggiana); Yuri Rocchetti — Cremonese (Potenza
Calcio); Marco Ruggero, Antonio Candela, Andrej Pogacar y Gabriel Arditi —
Catanzaro (Spezia Calcio, Spezia Calcio, NK Radomlje y Siracusa Calcio); Kleis
Bozhanaj — Modena (AC Reggiana); Luca Schirone — Cesena (Pineto Calcio); Matteo
Di Paola y Emanuele Adamo — Avellino (Cavese 1919 y Spezia Calcio); Enrico
Silletti y Diego Marcolini — Padova (Altamura S.S. y FC Trapani 1905); Matteo
Baldi y Kevin Piscopo — Juve Stabia (Torres y SSC Bari); Jean-Pierre Longonda y
Giacomo Fedel — Mantova (FC Koper y SS Monopoli 1966); Edoardo Torrielli, Lucas
Felippe, Mattia Valori y Gabriele Costa — Virtus Entella (Flaminia Civita
Castellana, Potenza Calcio, FC Scandicci 1908 y AS Gubbio 1910); Tommaso
Guercio — Carrarese (Slask Wroclaw).

**Serie C — Girone A (15):** Elia Campesan — Arzignano Valchiampo (FC Bassano);
Andrea Tessiore y Andrea Santarcangelo — Folgore Caratese (Guidonia Montecelio
1937 FC y Casarano Calcio); Marco Taramelli — AlbinoLeffe (Calcio Brusaporto);
Davide Grassini, Enrico Di Gesù y Alexander Murillo — Lecco (MSK Povazska
Bystrica, Siracusa Calcio y FC Liefering); Diego Zuppel — Novara (Guidonia
Montecelio 1937 FC); Simone Cat Berro y Diego Ripani — Juventus Next Gen
(Cairese y Forlì FC); Giovanni Vaglica — Carpi (Giugliano Calcio 1928); Martín
Suárez — Renate (AC Reggiana); Carlo Ghidini y Edoardo Ferretti — Lumezzane
(Pro Palazzolo); Juan Ignacio Molina — Trento (US Salernitana).

**Serie D — Girone A (6):** Alessio Insignito y Andrea Baldetti — Ligorna
(Spezia Calcio); Lorenzo Valente y Lorenzo Viano — Chisola (Fermana FC y Tau
Calcio Altopascio); Joshua Vuillermoz — Imperia (US Salernitana); Gioele Conte
— Fezzanese (Spezia Calcio).

## GRL y economía de Scudetto

El GRL y el potencial son estimaciones internas, no atributos publicados por
Transfermarkt. Se calcularon con referencia al valor de mercado cuando
estaba disponible, la categoría y la edad; los límites de equilibrio usados
fueron:

| División | GRL | Potencial máximo |
|---|---:|---:|
| Serie B | 50–75 | 89 |
| Serie C | 43–69 | 84 |
| Serie D | 38–64 | 79 |

El potencial de los jugadores jóvenes se mantiene por encima o al nivel de su
GRL, con topes acordes a la división. El valor Transfermarkt se conserva en
`marketValueEur` como referencia de auditoría; el juego sigue calculando
`Player.value` y el salario con su propia economía. No se reemplazan salarios
con valores de mercado ni se presenta una estimación de GRL como un dato de la
fuente.

## Datos pendientes

- **306** jugadores importados no tienen valor de mercado publicado. Se conserva
  esa ausencia y el motor aplica su economía interna; no se inventó un valor
  Transfermarkt.
- **229** jugadores importados no muestran un vencimiento de contrato utilizable.
  El motor asigna el contrato interno habitual al crear la carrera.
- **Tres** fichas indican nacionalidad no disponible; se usa el código explícito
  `UNK` para mostrar “Nacionalidad no disponible”.
- En nueve casos la ficha 26/27 aparece con un vencimiento de contrato anterior
  o igual a 2026. No se trasladó esa fecha vencida como duración activa; queda
  pendiente conciliar la discrepancia entre la ficha de plantilla y la fecha
  contractual.
- Las 56 cesiones de clubes propietarios no representados se mantienen fuera
  de las plantillas iniciales hasta que el propietario pueda incorporarse o
  conciliarse con seguridad.

## Archivos e integración

- `src/lib/game/italian-squads.ts`: 1.589 semillas; perfiles, datos disponibles,
  campos de referencia y cesiones enlazadas.
- `src/lib/game/squads.ts`: selecciona las semillas italianas para los 58 clubes
  cubiertos en lugar de combinar esos equipos con sus antiguas plantillas
  manuales.
- `src/lib/game/format.ts`: añade etiquetas para Guadalupe y nacionalidad no
  disponible; Bangladesh utiliza el código existente `BAN`.
- `src/lib/game/italian-squads.test.ts`: cobertura por liga y club, identidad
  única, rangos de GRL/potencial, metadatos disponibles, plantillas y préstamos
  al crear una carrera.

`createCareer()` sigue construyendo los jugadores y los registros iniciales de
préstamo a partir de las plantillas de inicio. Los datos guardados de carreras
existentes no se reescriben. No se cambiaron clubes, calendarios, formatos,
ascensos, descensos, playoffs ni competiciones.
