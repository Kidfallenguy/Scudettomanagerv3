# Plantillas y caras organizadas

`FACES/poner` es la fuente de entrada para las ligas y clubes organizados por
el usuario. El importador genera `src/lib/game/current-face-squads.ts` con
plantillas actuales de ESPN para esos clubes. El sincronizador mueve las fotos
a `FACES/Realplayersfaces/[liga]/[club]/`, las publica en
`public/player-faces/real/` y actualiza
`src/lib/game/real-player-face-index.ts`. Las carpetas de fotos se mantienen
por liga y equipo; si ya existe un archivo con el mismo nombre, la
sincronización se detiene sin sobrescribirlo.

Al generar una carrera, los jugadores actuales de esos equipos sustituyen a
sus plantillas anteriores. Si un jugador coincide con una ficha anterior, se
conservan su posición específica y sus valoraciones. Los futbolistas antiguos
que no están en la fuente actual se conservan cuando tienen POT superior a 85
o cuando tienen una foto identificable asignada a ese mismo club. Los nombres
en las plantillas actuales de otro club no se duplican. Los equipos sin carpeta
en `poner` mantienen sus fuentes habituales.

ESPN proporciona nombre, edad, nacionalidad e identificación, pero no GRL ni
potencial. Si falta edad, se calcula desde la fecha de nacimiento cuando está
disponible. Si aún falta edad o nacionalidad, el importador intenta completar
los datos desde el perfil exacto de Transfermarkt cuando el jugador tiene una
foto. Los registros que siguen incompletos o no se pueden verificar se omiten
y se enumeran en el informe; no se inventan datos. Las imágenes sueltas en
`FACES/poner/Otros` se publican junto con las fotos reales; las asociadas a
prospectos New Gen se asignan explícitamente por nombre de archivo. En
particular, `Santiago Curti.png` es la foto de Daniel Curti. Las demás fotos
sueltas se dejan sin asignar hasta poder confirmar el jugador. Las carpetas
auxiliares con nombres que comienzan con guion bajo no se tratan como carpetas
de jugadores. Las valoraciones de
jugadores nuevos son estimaciones internas de Scudetto basadas en prestigio y
edad, no calificaciones oficiales. La posición usa la línea general de ESPN
(portero, defensa, mediocampo o ataque), salvo que ya hubiera una posición
específica guardada.

Las fotos con nombre identificable se contrastan con los planteles de todos los
clubes importados; cuando una foto está en otro club, ese equipo de carpeta es
la asignación prioritaria y el jugador no se duplica. Las imágenes cuyo nombre
no se puede vincular con seguridad a un registro actual permanecen publicadas
e indexadas, pero no se inventa una ficha de jugador para ellas.

La entrada procesada de `FACES/poner` incluye Brasileirão, Eredivisie, Liga
Argentina, Liga de Portugal, MLS, 2. Bundesliga, Championship, LaLiga 2,
Saudi Pro League, Serie B, League One, League Two, Primera Nacional y Série B
del Brasileirão. Solo se reemplazan las plantillas de los clubes presentes en
esas carpetas; las demás ligas se conservan. Las carpetas vacías y las carpetas
auxiliares cuyo nombre comienza con guion bajo no se importan. Las partidas
guardadas tampoco se reescriben; los cambios aplican a carreras nuevas.
