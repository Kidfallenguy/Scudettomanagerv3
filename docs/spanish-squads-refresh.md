# Revisión de plantillas españolas — temporada 2026/27

**Fecha de extracción:** 11 de octubre de 2026  
**Estado:** plantillas incorporadas a las semillas de carreras nuevas; las
excepciones de cesiones y los datos sin publicar quedan documentados abajo.

## Fuente y alcance

Se revisaron las páginas de plantilla 2026/27 de los **22 clubes de LaLiga
Hypermotion** y los **40 clubes de Primera Federación** (20 por grupo).
Transfermarkt fue la fuente de plantillas, edades, nacionalidades, posiciones,
valores de mercado disponibles, contratos y avisos de cesión. Se aceptó una
plantilla únicamente cuando el título de la ficha decía “Plantilla detallada
26/27”; las 62 fichas cumplieron esa comprobación.

Competiciones consultadas:

- [LaLiga Hypermotion 2026/27](https://www.transfermarkt.es/segunda-division/startseite/wettbewerb/ES2/saison_id/2026)
- [Primera Federación, Grupo 1 2026/27](https://www.transfermarkt.es/primera-federacion-grupo-1/startseite/wettbewerb/E3G1/saison_id/2026)
- [Primera Federación, Grupo 2 2026/27](https://www.transfermarkt.es/primera-federacion-grupo-2/startseite/wettbewerb/E3G2/saison_id/2026)

## Integración

- Se cargaron **1.519 futbolistas** de 62 clubes a las semillas de nuevas
  carreras. Los perfiles individuales de Transfermarkt dan identificadores
  estables `tm-{id}`; los homónimos con perfiles diferentes se conservan como
  futbolistas distintos.
- Desglose: **571** en Segunda, **470** en Primera Federación Grupo 1 y **478**
  en Primera Federación Grupo 2.
- Se representaron **139 préstamos entrantes** cuando el club propietario pudo
  vincularse sin ambigüedad con un club existente en el juego. Se crean los
  registros de cesión iniciales y vencen al acabar una temporada.
- Quedaron fuera **11 futbolistas cedidos** cuyo club propietario de
  Transfermarkt no se pudo resolver a un identificador del juego. No se los
  reasignó como propiedad del club receptor. Están registrados en el artefacto
  de extracción de esta sesión para una conciliación posterior.
- Las 11 excepciones: Emanuel Gularte y Andrés Ferrari (Sporting), Homam
  Al-Amin (Valladolid), Giorgi Gocholeishvili (Cádiz), Santiago Lencina
  (Burgos), Edgar Sevikyan (Ceuta), Vlad (Celta Fortuna), Bence Juhász
  (Mérida), Antoñín (Hércules), Jérémy Blasco (Ibiza) y Mirei Sugiura (Sant
  Andreu). Sus propietarios externos son Club Puebla, Sint-Truidense, Al-Duhail,
  Shakhtar Donetsk, River Plate, Ferencváros, Paços de Ferreira, Újpest, Korona
  Kielce, Radomiak Radom y Shonan Bellmare, respectivamente; esas entidades no
  tienen una referencia resoluble en los clubes del juego.
- **44** jugadores incorporados no tenían valor de mercado publicado y **3**
  no mostraban contrato. Esos campos no se inventaron: se usan los cálculos o
  valores por defecto del juego. En total, las 62 fichas consultadas tenían 45
  valores de mercado sin publicar; el restante corresponde a una cesión que
  quedó pendiente.
- El valor Transfermarkt disponible se conserva en `marketValueEur` para
  auditoría. Se utilizó para estimar el GRL y, con este, el valor de mercado de
  Scudetto mediante su economía interna; `Player.value` y el salario siguen
  siendo magnitudes distintas.
- La escala interna aplicada fue `61 + 6,2 × log10(valor / 300.000 €)` para
  Segunda y `54 + 5,8 × log10(valor / 100.000 €)` para Primera Federación,
  con ajustes moderados por edad y topes por categoría. Cuando faltó valor se
  usó el GRL base de la categoría. Potenciales jóvenes se limitaron a 91 en
  Segunda y 88 en Primera Federación; ningún atributo supera 100.
- La nacionalidad principal y la posición quedaron mapeadas para todos los
  futbolistas incorporados. El GRL y el potencial son estimaciones internas de
  Scudetto, no datos de Transfermarkt. El valor publicado se usó como referencia
  para ajustar el GRL a cada categoría; la economía del juego calcula el valor
  en partida y el salario sigue siendo independiente.

## Clubes revisados

### LaLiga Hypermotion — 22

Girona, RCD Mallorca, Real Oviedo, UD Las Palmas, UD Almería, Real Sporting,
Real Valladolid, Granada CF, CD Leganés, Cádiz CF, SD Eibar, Albacete Balompié,
CD Castellón, Córdoba CF, Burgos CF, FC Andorra, AD Ceuta FC, Real Sociedad B,
CD Tenerife, CE Sabadell, CD Eldense y Celta Fortuna.

### Primera Federación — 40

**Grupo 1:** AD Mérida, Arenas Club, Athletic Club B, Barakaldo CF, CD Coria,
CD Extremadura, CP Cacereño, CD Lugo, CD Mirandés, Cultural y Deportiva
Leonesa, Pontevedra CF, Racing Club Ferrol, RC Deportivo Fabril, Real Avilés
Industrial, Real Unión Club, SD Ponferradina, UD Logroñés, UD Ourense,
Unionistas de Salamanca CF y Zamora CF.

**Grupo 2:** AD Alcorcón, Águilas FC, Algeciras CF, Antequera CF, Atlético
Madrileño, CD Teruel, CE Europa, CF Rayo Majadahonda, FC Cartagena, Gimnàstic
de Tarragona, Hércules de Alicante CF, Juventud de Torremolinos CF, Real Jaén
CF, Real Madrid Castilla, Real Murcia CF, Real Zaragoza, SD Huesca, UD Ibiza,
UE Sant Andreu y Villarreal CF B.

## Archivos y compatibilidad

- `src/lib/game/spanish-squads.ts`: datos de plantilla 2026/27, posiciones,
  edades, nacionalidades, GRL/potencial internos, contratos disponibles y
  relaciones de cesión verificadas.
- `src/lib/game/names.ts`, `src/lib/game/squads.ts` y
  `src/lib/game/world.ts`: uso de semillas, IDs estables de Transfermarkt y
  registros de préstamos al crear carreras nuevas.
- `src/lib/game/format.ts`: etiqueta de nacionalidad de Martinica.
- `src/lib/game/spanish-squads.test.ts`: pruebas de cobertura y cesiones.

`createCareer()` continúa siendo el origen de las plantillas al iniciar una
carrera. Las carreras guardadas no se modifican. No se alteraron clubes,
calendarios, ascensos, descensos, playoffs ni formatos de competición.
