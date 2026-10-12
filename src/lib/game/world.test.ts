import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALL_PLAYABLE_LEAGUES, BRASILEIRAO_C_CLUBS, BRAZILIAN_IDS, CLUBS, FIFTH_LEAGUE_OF, FOURTH_LEAGUE_OF, LEAGUE_INFO, LEAGUE_ONE_CLUBS, LIGUE3_CLUBS, PRIMERA_B_METRO_IDS, SERIE_C_CLUBS, SERIE_D_CLUBS, SIXTH_LEAGUE_OF, THIRD_LEAGUE_OF, applyDivisions, argentineCupIds, brazilianCupIds, clubById, currentDivisions, domesticIds, emptyLeagueTables, emptyStanding, isSelectableClub } from "./clubs.ts";
import { QUAL_SPOTS, qualBandForPlace } from "./competitions.ts";
import { crestUrl } from "./crests.ts";
import { historicalCoverageFor, historicalFor, historicalStatusFor, honourKinds, honourLabel } from "./honours.ts";
import { buildSeasonSchedule, createCareer } from "./world.ts";
import { buildSquad } from "./squads.ts";
import { Rng } from "./rng.ts";
import { applyPromotionRelegation } from "./divisions.ts";

describe("Tercera División Argentina", () => {
  it("is selectable from Argentina and runs a full playable season", () => {
    const ids = domesticIds("primeraBMetro");
    const schedule = buildSeasonSchedule({
      clubId: ids[0]!,
      seed: 2701,
      season: 2026,
      uclGroups: [],
      uelTeams: [],
      ueclTeams: [],
      libGroups: [],
      sudTeams: [],
    });
    const fixtures = schedule.fixtures.filter((fixture) => fixture.competition === "primeraBMetro");
    const rounds = new Map<number, number>();
    const appearances = new Map(ids.map((id) => [id, 0]));
    const pairings = new Map<string, number>();
    for (const fixture of fixtures) {
      rounds.set(fixture.round, (rounds.get(fixture.round) ?? 0) + 1);
      appearances.set(fixture.homeId, appearances.get(fixture.homeId)! + 1);
      appearances.set(fixture.awayId, appearances.get(fixture.awayId)! + 1);
      const pair = [fixture.homeId, fixture.awayId].sort().join(":");
      pairings.set(pair, (pairings.get(pair) ?? 0) + 1);
    }

    assert.equal(THIRD_LEAGUE_OF.argentina, "primeraBMetro");
    assert.equal(LEAGUE_INFO.primeraNacional.title, "Primera Nacional");
    assert.equal(LEAGUE_INFO.primeraBMetro.title, "Primera B Metro / Federal A");
    assert.equal(ALL_PLAYABLE_LEAGUES.includes("primeraBMetro"), true);
    assert.equal(ids.length, 27);
    assert.deepEqual(new Set(ids), new Set(PRIMERA_B_METRO_IDS));
    assert.ok(ids.every(isSelectableClub));
    assert.equal(fixtures.length, 702);
    assert.equal(rounds.size, 54);
    assert.ok([...rounds.values()].every((matches) => matches === 13));
    assert.ok([...appearances.values()].every((matches) => matches === 52));
    assert.equal(pairings.size, (ids.length * (ids.length - 1)) / 2);
    assert.ok([...pairings.values()].every((meetings) => meetings === 2));
    for (const id of ["bm_brown", "bm_mid", "bm_ita", "bm_vsc", "bm_itu", "bm_sac", "bm_uai"]) {
      assert.ok(ids.includes(id));
      assert.equal(clubById(id).league, "primeraBMetro");
    }
    for (const id of ["tpa_buenos_aires_city", "tpa_juventud_pringles", "tpa_las_mandarinas"]) {
      assert.equal(clubById(id).league, "promocionalAmateur");
    }
  });
});

describe("Brasileirão Série C", () => {
  it("registra los 20 clubes una sola vez y genera ida y vuelta con 38 fechas", () => {
    const ids = domesticIds("brasileiraoC");
    const schedule = buildSeasonSchedule({
      clubId: ids[0]!,
      seed: 2026,
      season: 2026,
      uclGroups: [],
      uelTeams: [],
      ueclTeams: [],
      libGroups: [],
      sudTeams: [],
    });
    const fixtures = schedule.fixtures.filter((fixture) => fixture.competition === "brasileiraoC");
    const rounds = new Map<number, number>();
    const pairings = new Map<string, number>();
    for (const fixture of fixtures) {
      rounds.set(fixture.round, (rounds.get(fixture.round) ?? 0) + 1);
      const pair = [fixture.homeId, fixture.awayId].sort().join(":");
      pairings.set(pair, (pairings.get(pair) ?? 0) + 1);
    }

    assert.equal(ids.length, 20);
    assert.equal(BRASILEIRAO_C_CLUBS.length, 20);
    assert.equal(new Set(ids).size, 20);
    assert.equal(new Set(CLUBS.map((club) => club.id)).size, CLUBS.length);
    assert.deepEqual(ids.map((id) => clubById(id).name), [
      "Amazonas FC", "Anápolis", "Barra FC", "Botafogo-PB", "Brusque", "Caxias", "Confiança", "Ferroviária",
      "Figueirense", "Floresta", "Guarani", "Inter de Limeira", "Itabaiana", "Ituano", "Maranhão", "Maringá FC",
      "Paysandu", "Santa Cruz", "Volta Redonda", "Ypiranga",
    ]);
    assert.equal(THIRD_LEAGUE_OF.brasileirao, "brasileiraoC");
    assert.equal(LEAGUE_INFO.brasileiraoC.title, "Brasileirão Série C");
    assert.ok(ids.every(isSelectableClub));
    assert.ok(ids.every((id) => BRAZILIAN_IDS.includes(id)));
    assert.equal(fixtures.length, 380);
    assert.equal(rounds.size, 38);
    assert.ok([...rounds.values()].every((games) => games === 10));
    assert.equal(pairings.size, 190);
    assert.ok([...pairings.values()].every((meetings) => meetings === 2));
    for (const pair of new Set(fixtures.map((fixture) => [fixture.homeId, fixture.awayId].sort().join(":")))) {
      const [a, b] = pair.split(":");
      assert.equal(fixtures.filter((fixture) => fixture.homeId === a && fixture.awayId === b).length, 1);
      assert.equal(fixtures.filter((fixture) => fixture.homeId === b && fixture.awayId === a).length, 1);
    }
  });

  it("crea plantillas completas, limita la copa a cuatro cupos y conecta ascensos y descensos", () => {
    const ids = domesticIds("brasileiraoC");
    const cupIds = brazilianCupIds();
    const schedule = buildSeasonSchedule({
      clubId: ids[0]!,
      seed: 2026,
      season: 2026,
      uclGroups: [],
      uelTeams: [],
      ueclTeams: [],
      libGroups: [],
      sudTeams: [],
    });
    const cupFixtures = schedule.fixtures.filter((fixture) => fixture.competition === "coppa");
    const cupByes = schedule.calendar.flatMap((slot) => slot.competition === "coppa" ? slot.byes ?? [] : []);
    const cupEntrants = new Set([...cupFixtures.flatMap((fixture) => [fixture.homeId, fixture.awayId]), ...cupByes]);
    const startingDivisions = currentDivisions();
    const save = createCareer(ids[0]!, 2026);
    const finished = structuredClone(save);

    try {
      for (const id of ids) assert.ok(buildSquad(id, new Rng(2026), new Set()).length >= 18, `${id} needs a full squad`);
      assert.equal(cupIds.serieC.length, 4);
      assert.equal(new Set(cupIds.serieC).size, 4);
      assert.equal(cupEntrants.size, 44);
      assert.ok(cupIds.serieC.every((id) => cupEntrants.has(id)));
      assert.ok(!cupIds.serieC.some((id) => domesticIds("brasileirao").includes(id) || domesticIds("brasileiraoB").includes(id)));
      const customQualifiers = ids.slice(4, 8);
      assert.deepEqual(brazilianCupIds(customQualifiers).serieC, customQualifiers);
      assert.equal(QUAL_SPOTS.brasileiraoB.releg, 4);
      assert.equal(QUAL_SPOTS.brasileiraoC.promo, 4);

      const expectedCToB = domesticIds("brasileiraoC").slice(0, 4);
      const expectedBToC = domesticIds("brasileiraoB").slice(-4);
      for (const league of ["brasileirao", "brasileiraoB", "brasileiraoC"] as const) {
        const leagueIds = domesticIds(league);
        finished.leagueTables[league] = leagueIds.map((clubId, index) => ({
          ...emptyStanding(clubId),
          played: 38,
          won: 38 - index,
          pts: 60 - index * 2,
          form: ["W"],
        }));
      }

      const moves = applyPromotionRelegation(save, finished, new Rng(2026));
      assert.deepEqual(moves?.promoted, expectedCToB);
      assert.deepEqual(moves?.relegated, expectedBToC);
      assert.ok(expectedCToB.every((id) => clubById(id).league === "brasileiraoB"));
      assert.ok(expectedBToC.every((id) => clubById(id).league === "brasileiraoC"));
      assert.equal(domesticIds("brasileirao").length, 20);
      assert.equal(domesticIds("brasileiraoB").length, 20);
      assert.equal(domesticIds("brasileiraoC").length, 20);
      assert.ok(save.players.some((player) => player.clubId === ids[0]));
    } finally {
      applyDivisions(startingDivisions);
    }
  });
});

describe("Escudos de ligas aportados", () => {
  it("aplica los archivos seleccionados por club y deja intactos los demás", () => {
    assert.equal(
      crestUrl("bm_brown"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/brown-de-adrogue.3123ae04.png",
    );
    assert.equal(
      crestUrl("bm_itu"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/ituzaingo.37861bfe.png",
    );
    assert.equal(
      crestUrl("bm_mid"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/midland.png",
    );
    assert.equal(
      crestUrl("bm_sac"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/sacachispas.6e1827f9.png",
    );
    assert.equal(
      crestUrl("bm_ita"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/sportivo-italiano.d2c125e6.png",
    );
    assert.equal(
      crestUrl("bm_uai"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/uai-urquiza.3e50758d.png",
    );
    assert.equal(
      crestUrl("bm_vsc"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/villa-san-carlos.56ade182.png",
    );
    assert.equal(
      crestUrl("arg_3_abr"),
      "/crests/escudos%20de%20ligas/3ra%20division%20argentina/almirante-brown-logo-footylogos.svg",
    );
    assert.equal(
      crestUrl("tpa_el_chasqui"),
      "/crests/escudos%20de%20ligas/PROMOCIONAL%20AMATEUR/El%20chasqui.png",
    );
    assert.equal(
      crestUrl("tpa_buenos_aires_city"),
      "/crests/escudos%20nuevos/6ta%20division/Buenos_Aires_City_Football_Club.png",
    );
    assert.equal(
      crestUrl("tpa_juventud_pringles"),
      "/crests/escudos%20nuevos/6ta%20division/Pringles.png",
    );
    assert.equal(
      crestUrl("tpa_las_mandarinas"),
      "/crests/escudos%20nuevos/6ta%20division/las-mandarinas-brandsen-buenos-aires.png",
    );
    assert.equal(
      crestUrl("nl1_alm"),
      "/crests/escudos%20nuevos/2da%20Division%20holandesa/almere-city-fc.28f26b3f.png",
    );
    for (const [reserveId, parentId] of [
      ["nl1_jaj", "nl_aja"],
      ["nl1_jps", "nl_psv"],
      ["nl1_jut", "nl_utr"],
      ["nl1_jaz", "nl_az"],
      ["nl2_jsp", "nl_spa"],
      ["nl2_jal", "nl1_alm"],
      ["pt2_ben", "pt_ben"],
      ["pt2_pob", "pt_por"],
      ["pt2_spb", "pt_spo"],
    ]) {
      assert.equal(crestUrl(reserveId), crestUrl(parentId), `${reserveId} should use ${parentId}'s crest`);
    }
    assert.equal(
      crestUrl("pt2_aca"),
      "/crests/escudos%20nuevos/2da%20division%20portuguesa/academica-de-coimbra.1a1f510e.png",
    );
    assert.equal(
      crestUrl("nl2_afc"),
      "/crests/escudos%20nuevos/3ra%20division%20holandesa/afc-amsterdam.bae679fc.png",
    );
    assert.equal(
      crestUrl("b3_ho2"),
      "/crests/escudos%20nuevos/actualizar%203.%20liga%20alemania/tsg-hoffenheim-logo-footylogos.svg",
    );
    assert.equal(
      crestUrl("bc_amz"),
      "/crests/escudos%20nuevos/BRAZILERAO%20LIGA%20C/brazil_amazonas.football-logos.cc.svg",
    );
    assert.equal(
      crestUrl("usl_rif"),
      "/crests/escudos%20nuevos/mls%20segunda%20division/rhode-island.55967209.png",
    );
    assert.equal(
      crestUrl("b3_fcs"),
      "/crests/escudos%20de%20ligas/3,ra%20liga%20ALEMANA/1-fc-saarbrucken-logo-footylogos.svg",
    );
    assert.equal(crestUrl("boc"), "/crests/boc.png");
  });
});

describe("Pirámide argentina personalizada", () => {
  it("registra clubes únicos y calendarios completos en cuarta, quinta y Promocional Amateur", () => {
    const levels = [
      { league: "primeraBMetro" as const, clubs: 27, matches: 702, rounds: 54 },
      { league: "argentinaCuarta" as const, clubs: 20, matches: 380, rounds: 38 },
      { league: "argentinaQuinta" as const, clubs: 16, matches: 240, rounds: 30 },
      { league: "promocionalAmateur" as const, clubs: 23, matches: 506, rounds: 46 },
    ];

    assert.equal(FOURTH_LEAGUE_OF.argentina, "argentinaCuarta");
    assert.equal(FIFTH_LEAGUE_OF.argentina, "argentinaQuinta");
    assert.equal(SIXTH_LEAGUE_OF.argentina, "promocionalAmateur");
    assert.equal(new Set(CLUBS.map((club) => club.id)).size, CLUBS.length);

    for (const { league, clubs, matches, rounds } of levels) {
      const ids = domesticIds(league);
      const schedule = buildSeasonSchedule({
        clubId: ids[0]!,
        seed: 2701,
        season: 2026,
        uclGroups: [],
        uelTeams: [],
        ueclTeams: [],
        libGroups: [],
        sudTeams: [],
      });
      const fixtures = schedule.fixtures.filter((fixture) => fixture.competition === league);

      assert.equal(ids.length, clubs);
      assert.ok(ids.every(isSelectableClub));
      assert.equal(fixtures.length, matches);
      assert.equal(new Set(fixtures.map((fixture) => fixture.round)).size, rounds);
      assert.ok(emptyLeagueTables()[league].every((row) => row.played === 0 && row.form.length === 0));
      const squad = buildSquad(ids[0]!, new Rng(2701), new Set());
      assert.ok(squad.length >= 16);
      if (league !== "primeraBMetro" || ids[0]!.startsWith("arg_3_")) {
        assert.ok(squad.every((player) => !/^jugador\s*\d*$/i.test(player.name)), "nunca nombres genéricos tipo Jugador N");
      }
      if (league === "promocionalAmateur") {
        assert.equal(schedule.fixtures.some((fixture) => fixture.competition === "coppa"), false);
      }
    }
    for (const id of domesticIds("primeraBMetro").filter((clubId) => clubId.startsWith("arg_3_"))) {
      const squad = buildSquad(id, new Rng(2701), new Set());
      assert.ok(squad.length >= 16);
      assert.ok(squad.every((player) => !/^jugador\s*\d*$/i.test(player.name)), "nunca nombres genéricos tipo Jugador N");
    }

    const expectedRosters = {
      argentinaCuarta: [
        "Club Ciudad de Bolívar", "Club Comunicaciones", "Deportivo Armenio", "Argentino de Quilmes",
        "Flandria", "Excursionistas", "Dock Sud", "Gimnasia (Concepción del Uruguay)", "Real Pilar",
        "Deportivo Español", "General Lamadrid", "Victoriano Arenas", "Atlas", "Luján", "Berazategui",
        "Claypole", "Central Córdoba de Rosario", "Sportivo Barracas", "Deportivo Merlo", "San Martín de Burzaco",
      ],
      primeraBMetro: [
        "Almirante Brown", "San Telmo", "Almagro", "San Miguel", "Colegiales", "Acassuso", "Tristán Suárez",
        "Talleres de Remedios de Escalada", "Defensores Unidos / CADU", "San Martín de San Juan", "Deportivo Madryn",
        "Racing de Córdoba", "Gimnasia y Tiro de Salta", "Olimpo de Bahía Blanca", "Villa Dálmine",
        "Santamarina de Tandil", "Cipolletti de Río Negro", "Douglas Haig de Pergamino", "Central Norte de Salta",
        "Sportivo Belgrano de San Francisco", "Brown de Adrogué", "Midland", "Sportivo Italiano", "Villa San Carlos",
        "Ituzaingó", "Sacachispas", "UAI Urquiza",
      ],
      argentinaQuinta: [
        "J.J. Urquiza", "Leandro N. Alem", "El Porvenir", "Lugano", "Juventud Unida de San Miguel",
        "Defensores de Cambaceres", "Yupanqui", "Puerto Nuevo", "Muñiz", "Centro Español",
        "Deportivo Paraguayo", "Liniers", "Argentino de Merlo", "Juventud Unida Universitario (San Luis)",
        "Sarmiento de Resistencia", "Sol de América de Formosa",
      ],
      promocionalAmateur: [
        "Estrella del Sur", "Camioneros", "FC Ezeiza", "Deportivo Metalúrgico", "Belgrano de Zárate",
        "Everton de La Plata", "Estrella de Berisso", "Defensores de Glew", "Club Mercedes", "Social Lux",
        "Náutico Hacoaj", "Provincial de Lobos", "Barrancas FC", "Juventud Pringles", "Atlético Pilar",
        "SAT (Social Atlético Televisión)", "Juventud de Bernal", "Uribelarrea FC", "Buenos Aires City FC",
        "Alumni (Los Hornos)", "Academia Control Orientado", "Las Mandarinas (Brandsen)", "El Chasqui",
      ],
    };
    for (const [league, expectedNames] of Object.entries(expectedRosters)) {
      const actualNames = domesticIds(league as keyof typeof expectedRosters).map((id) => clubById(id).name);
      assert.deepEqual(actualNames.sort(), [...expectedNames].sort(), `plantel de ${league}`);
    }
    const lowerDivisionClubs = CLUBS.filter((club) =>
      ["primeraBMetro", "argentinaCuarta", "argentinaQuinta", "promocionalAmateur"].includes(club.league),
    );
    assert.equal(new Set(lowerDivisionClubs.map((club) => club.name)).size, lowerDivisionClubs.length);
    assert.equal(CLUBS.some((club) => club.id === "tpa_bohemios" || club.name === "Los Bohemios"), false);
  });

  it("incluye cuarta y quinta en la Copa Argentina, pero excluye al Promocional Amateur", () => {
    const cup = argentineCupIds();
    const entrants = [...cup.profesional, ...cup.nacional, ...cup.metropolitana, ...cup.cuarta, ...cup.quinta];
    const amateur = domesticIds("promocionalAmateur");

    assert.equal(new Set(entrants).size, entrants.length);
    assert.ok(cup.cuarta.every((id) => CLUBS.find((club) => club.id === id)?.league === "argentinaCuarta"));
    assert.ok(cup.quinta.every((id) => CLUBS.find((club) => club.id === id)?.league === "argentinaQuinta"));
    assert.ok(amateur.every((id) => !entrants.includes(id)));
    assert.equal(QUAL_SPOTS.promocionalAmateur.promo, 1);
    assert.equal(QUAL_SPOTS.argentinaQuinta.releg, 1);
  });

  it("mueve clubes entre los cinco niveles sin alterar sus identidades", () => {
    const amateurChampion = domesticIds("promocionalAmateur")[0]!;
    const movements = [
      [domesticIds("primeraBMetro")[0]!, "primeraNacional"],
      [domesticIds("argentinaCuarta")[0]!, "primeraBMetro"],
      [domesticIds("argentinaQuinta")[0]!, "argentinaCuarta"],
      [amateurChampion, "argentinaQuinta"],
      [domesticIds("primeraNacional").at(-1)!, "primeraBMetro"],
      [domesticIds("primeraBMetro").at(-1)!, "argentinaCuarta"],
      [domesticIds("argentinaCuarta").at(-1)!, "argentinaQuinta"],
      [domesticIds("argentinaQuinta").at(-1)!, "promocionalAmateur"],
    ] as const;
    const save = createCareer(amateurChampion, 2701);
    const finished = structuredClone(save);
    const startingDivisions = currentDivisions();

    try {
      for (const league of ["primeraNacional", "primeraBMetro", "argentinaCuarta", "argentinaQuinta", "promocionalAmateur"] as const) {
        const ids = domesticIds(league);
        finished.leagueTables[league] = ids.map((clubId, index) => ({
          ...emptyStanding(clubId),
          played: 1,
          won: 1,
          gf: ids.length - index,
          pts: ids.length - index,
          form: ["W"],
        }));
      }

      const moves = applyPromotionRelegation(save, finished, new Rng(2701));

      assert.ok(moves?.promoted.includes(amateurChampion));
      for (const [clubId, league] of movements) {
        assert.equal(clubById(clubId).league, league);
      }
      assert.ok(domesticIds("argentinaQuinta").includes(amateurChampion));
      assert.equal(new Set(CLUBS.map((club) => club.id)).size, CLUBS.length);
    } finally {
      applyDivisions(startingDivisions);
    }
  });
});

describe("Ligue 3 2026/27", () => {
  it("registers the 18 requested clubs once and leaves their starting standings unplayed", () => {
    const names = [
      "La Roche VF", "Football Club Rouen", "Concarneau", "Football Club de Versailles 78", "Amiens SC",
      "Association Sportive de Cannes Football", "SM Caen", "Le Puy Foot 43 Auvergne", "US Thionville Lusitanos",
      "Fleury 91", "París 13 Atlético", "Bastia", "Quevilly", "US Orléans", "Valenciennes",
      "Aubagne Football Club", "Bourg-Péronnas", "Football Club Villefranche Beaujolais",
    ];
    const ids = domesticIds("ligue3");
    const table = emptyLeagueTables().ligue3;

    assert.equal(LIGUE3_CLUBS.length, 18);
    assert.equal(new Set(ids).size, 18);
    assert.equal(new Set(CLUBS.map((club) => club.id)).size, CLUBS.length);
    assert.deepEqual(LIGUE3_CLUBS.map((club) => club.name), names);
    assert.ok(LIGUE3_CLUBS.every((club) => club.provisional && club.country === "FRA"));
    assert.equal(table.length, 18);
    assert.ok(table.every((row) => row.played === 0 && row.form.length === 0));
    assert.equal(QUAL_SPOTS.ligue3.promo, 3);
    assert.equal(QUAL_SPOTS.ligue3.releg, 0);
  });

  it("generates a 34-round, 306-match double round-robin season", () => {
    const schedule = buildSeasonSchedule({
      clubId: domesticIds("ligue3")[0]!,
      seed: 1701,
      season: 2026,
      uclGroups: [],
      uelTeams: [],
      ueclTeams: [],
      libGroups: [],
      sudTeams: [],
    });
    const fixtures = schedule.fixtures.filter((fixture) => fixture.competition === "ligue3");
    const rounds = [...new Set(fixtures.map((fixture) => fixture.round))];

    assert.equal(fixtures.length, 306);
    assert.equal(rounds.length, 34);
    assert.ok(rounds.every((round) => fixtures.filter((fixture) => fixture.round === round).length === 9));
    assert.ok(fixtures.every((fixture) => schedule.calendar.some((slot) => slot.fixtures.includes(fixture.id))));
    assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, 306);
  });

  it("creates complete provisional squads with generated names instead of numbered placeholders", () => {
    const squad = buildSquad(LIGUE3_CLUBS[0]!.id, new Rng(2026), new Set());

    assert.equal(squad.length, 25);
    assert.ok(squad.every((player) => !/^Jugador\s+\d+$/i.test(player.name)));
    assert.equal(new Set(squad.map((player) => player.name)).size, squad.length);
  });
});

describe("world history persistence", () => {
  it("includes the official Serie C and Serie D Girone A clubs for 2026/27", () => {
    assert.equal(SERIE_C_CLUBS.length, 20);
    assert.equal(new Set(SERIE_C_CLUBS.map((club) => club.id)).size, 20);
    assert.equal(SERIE_C_CLUBS.find((club) => club.id === "ita_lec")?.crest, "/crests/lec.png");
    assert.equal(SERIE_C_CLUBS.find((club) => club.id === "ita_jng")?.crest, "/crests/juv.svg");
    assert.ok(SERIE_C_CLUBS.every((club) => club.crest.startsWith("data:image/svg+xml,") || club.crest.startsWith("/crests/")));

    assert.equal(crestUrl("l1_bar"), "/crests/england_barnsley.football-logos.cc.svg");
    assert.equal(crestUrl("l1_lei"), "/crests/england_leicester.football-logos.cc.svg");
    assert.equal(crestUrl("l1_wim"), "/crests/england_afc-wimbledon.football-logos.cc.svg");
    assert.equal(crestUrl("bar"), "/crests/LALIGAESPAÑOLA/bar.png");
    assert.equal(crestUrl("rma"), "/crests/LALIGAESPAÑOLA/rma.png");
    assert.equal(crestUrl("bet"), "/crests/LALIGAESPAÑOLA/bet.png");
    assert.equal(crestUrl("sev"), "/crests/LALIGAESPAÑOLA/sev.png");
    assert.equal(crestUrl("gir"), "/crests/LALIGAESPAÑOLA/gir.png");
    assert.ok(LEAGUE_ONE_CLUBS.every((club) => club.crest === crestUrl(club.id)));
    assert.deepEqual(
      SERIE_C_CLUBS.map((club) => club.name).sort(),
      [
        "AlbinoLeffe", "Alcione Milano", "Arzignano Valchiampo", "Carpi", "Cittadella", "Desenzano",
        "Dolomiti Bellunesi", "Folgore Caratese", "Giana Erminio", "Juventus Next Gen", "Lecco",
        "Lumezzane", "Novara", "Ospitaletto Franciacorta", "Pergolettese", "Pro Vercelli", "Renate",
        "Trento", "Treviso", "Union Brescia",
      ].sort(),
    );

    assert.equal(SERIE_D_CLUBS.length, 18);
    assert.equal(new Set(SERIE_D_CLUBS.map((club) => club.id)).size, 18);
    assert.ok(SERIE_D_CLUBS.every((club) => club.crest.startsWith("data:image/svg+xml,")));
    assert.deepEqual(
      SERIE_D_CLUBS.map((club) => club.name).sort(),
      [
        "Alessandria", "Asti", "Biellese 1902", "Borgosesia Calcio", "Bra", "Celle Varazze", "Chisola",
        "Derthona", "Fezzanese", "Gozzano", "Imperia", "Lascaris", "Ligorna", "Millesimo", "Saluzzo",
        "Sanremese Calcio", "Sestri Levante", "Valenzana Mado",
      ].sort(),
    );
  });

  it("keeps all season champion fields initialized for new saves and old save compatibility", () => {
    const save = createCareer("rma");

    assert.equal(save.lastChampions.scudetto, null);
    assert.equal(save.lastChampions.coppa, null);
    assert.equal(save.lastChampions.carabao, null);
    assert.equal(save.lastChampions.supercoppa, null);
    assert.equal(save.lastChampions.kingsCup, null);
    assert.equal(save.lastChampions.saudiSuperCup, null);
    assert.equal(save.lastChampions.kingsCupRunnerUp, null);
    assert.equal(save.lastChampions.saudiSuperCupRunnerUp, null);
    assert.equal(save.lastChampions.ucl, null);
    assert.equal(save.lastChampions.uel, null);
    assert.equal(save.lastChampions.uecl, null);
    assert.equal(save.lastChampions.libertadores, null);
    assert.equal(save.lastChampions.sudamericana, null);
    assert.equal(save.lastChampions.coppaRunnerUp, null);
    assert.equal(save.lastChampions.mundial, null);
    assert.equal(save.lastChampions.intercontinental, null);
    assert.equal(save.lastChampions.transatlantica, null);
  });

  it("keeps Saudi clubs with historical trophy data in the all-time club records", () => {
    assert.ok(historicalFor("sau_hil").scudetto > 0);
    assert.ok(historicalFor("sau_nas").scudetto > 0);
    assert.ok(historicalFor("sau_ahl").scudetto > 0);
    assert.ok(historicalFor("sau_itt").scudetto > 0);
  });

  it("distinguishes missing history from a documented zero-title record", () => {
    assert.equal(historicalStatusFor("ch_sou"), "pending");
    assert.equal(historicalStatusFor("juv"), "partial");
  });

  it("loads cited league and national cup totals for Brazilian Série B clubs", () => {
    assert.equal(historicalFor("bb_for").scudetto, 1);
    assert.equal(historicalFor("bb_goi").scudetto, 2);
    assert.equal(historicalFor("bb_juv").coppa, 1);
    assert.equal(historicalFor("bb_cri").coppa, 1);
    assert.equal(historicalFor("bb_spo").scudetto, 1);
    assert.equal(historicalFor("bb_spo").coppa, 1);
    assert.equal(historicalCoverageFor("bb_for").status, "partial");
    assert.ok(historicalCoverageFor("bb_for").sources.length > 0);
  });

  it("loads Brazilian Série A totals using officially recognized seasons", () => {
    assert.equal(historicalFor("brpal").scudetto, 12);
    assert.equal(historicalFor("brpal").coppa, 4);
    assert.equal(historicalFor("brpal").supercoppa, 1);
    assert.equal(historicalFor("brfla").scudetto, 8);
    assert.equal(historicalFor("brcor").supercoppa, 2);
    assert.equal(historicalCoverageFor("brpal").status, "partial");
  });

  it("documents MLS Cup totals, including confirmed zero-title clubs", () => {
    assert.equal(historicalFor("us_lag").scudetto, 6);
    assert.equal(historicalFor("us_atl").scudetto, 1);
    assert.equal(historicalFor("us_phi").scudetto, 0);

    const mlsClubs = CLUBS.filter((club) => club.league === "mls");
    assert.equal(mlsClubs.length, 30);
    for (const club of mlsClubs) {
      assert.equal(historicalCoverageFor(club.id).status, "partial");
      assert.ok(historicalCoverageFor(club.id).knownKinds.includes("scudetto"));
    }
  });

  it("tracks USL Championship winners without awarding the canceled 2020 final", () => {
    assert.equal(historicalFor("usl_lou").scudetto, 2);
    assert.equal(historicalFor("usl_ocs").scudetto, 1);
    assert.equal(historicalFor("usl_sa").scudetto, 1);
    assert.equal(historicalFor("usl_phx").scudetto, 1);
    assert.equal(historicalFor("usl_cos").scudetto, 1);
    assert.equal(historicalFor("usl_pit").scudetto, 1);
    assert.equal(historicalFor("usl_tbr").scudetto, 0);

    const uslClubs = CLUBS.filter((club) => club.league === "uslChampionship");
    assert.equal(uslClubs.length, 25);
    for (const club of uslClubs) {
      assert.equal(historicalCoverageFor(club.id).status, "partial");
      assert.ok(historicalCoverageFor(club.id).knownKinds.includes("scudetto"));
    }
  });

  it("distinguishes sourced Portuguese league totals from undocumented clubs", () => {
    assert.equal(historicalFor("pt_bra").scudetto, 0);
    assert.ok(historicalCoverageFor("pt_bra").knownKinds.includes("scudetto"));
    assert.equal(historicalFor("pt2_por").scudetto, 1);
    assert.equal(historicalFor("pt2_lei").scudetto, 1);
    assert.equal(historicalStatusFor("pt2_ton"), "pending");
  });

  it("records verified Eredivisie titles without filling other Dutch clubs by assumption", () => {
    assert.equal(historicalFor("nl_aja").scudetto, 36);
    assert.equal(historicalFor("nl_psv").scudetto, 27);
    assert.equal(historicalFor("nl_fey").scudetto, 16);
    assert.equal(historicalStatusFor("nl_twe"), "pending");
  });

  it("shows only league-appropriate trophies with league-specific labels", () => {
    assert.deepEqual(honourKinds("mls"), ["scudetto"]);
    assert.equal(honourLabel("scudetto", "mls"), "MLS Cup");
    assert.deepEqual(honourKinds("uslChampionship"), ["scudetto"]);
    assert.equal(honourLabel("scudetto", "serieA"), "Serie A");
    assert.equal(honourLabel("coppa", "serieA"), "Coppa Italia");
    assert.equal(honourLabel("coppa", "eredivisie"), "KNVB Beker");
    assert.ok(!honourKinds("mls").some((kind) => honourLabel(kind, "mls") === "Coppa Italia"));
    assert.ok(!honourKinds("brasileiraoB").includes("supercoppa"));

    for (const league of ALL_PLAYABLE_LEAGUES) {
      assert.ok(honourKinds(league).length > 0, `${league} should have a trophy list`);
      if (league !== "serieA" && league !== "serieB") {
        assert.notEqual(honourLabel("coppa", league), "Coppa Italia", `${league} must not inherit Italy's cup label`);
      }
    }
  });

  it("includes the confirmed 24 unique League Two clubs as a playable division", () => {
    assert.ok(ALL_PLAYABLE_LEAGUES.map(String).includes("leagueTwo"));
    const leagueTwoClubs = CLUBS.filter((club) => String(club.league) === "leagueTwo");
    assert.equal(leagueTwoClubs.length, 24);
    assert.equal(new Set(leagueTwoClubs.map((club) => club.id)).size, 24);
    assert.equal(new Set(leagueTwoClubs.map((club) => club.name)).size, 24);
    assert.deepEqual(
      leagueTwoClubs.map((club) => club.name).sort(),
      [
        "Accrington Stanley", "Barnet", "Bristol Rovers", "Cheltenham Town", "Chesterfield", "Colchester United",
        "Crawley Town", "Crewe Alexandra", "Exeter City", "Fleetwood Town", "Gillingham", "Grimsby Town",
        "Newport County", "Northampton Town", "Oldham Athletic", "Port Vale", "Rochdale", "Rotherham United",
        "Salford City", "Shrewsbury Town", "Swindon Town", "Tranmere Rovers", "Walsall", "York City",
      ].sort(),
    );
  });

  it("builds a full League Two season, generated squads, cups, and official promotion bands", () => {
    const save = createCareer("l2_yor", 20261010);
    const leagueFixtures = save.fixtures.filter((fixture) => fixture.competition === "leagueTwo");
    assert.equal(leagueFixtures.length, 552);
    assert.equal(save.standings.length, 24);
    assert.equal(new Set(leagueFixtures.map((fixture) => fixture.round)).size, 46);
    for (let round = 1; round <= 46; round++) {
      assert.equal(leagueFixtures.filter((fixture) => fixture.round === round).length, 12);
    }
    assert.equal(save.players.filter((player) => player.clubId === "l2_yor").length, 25);

    const faFirstRound = save.calendar.find((slot) => slot.competition === "coppa" && slot.round === 1);
    const carabaoFirstRound = save.calendar.find((slot) => slot.competition === "carabao" && slot.round === 1);
    assert.equal(faFirstRound?.fixtures.length, 28);
    assert.equal(carabaoFirstRound?.fixtures.length, 28);
    for (const club of CLUBS.filter((entry) => String(entry.league) === "leagueTwo")) {
      assert.ok(faFirstRound?.fixtures.some((id) => save.fixtures.find((fixture) => fixture.id === id)?.homeId === club.id || save.fixtures.find((fixture) => fixture.id === id)?.awayId === club.id));
      assert.ok(carabaoFirstRound?.fixtures.some((id) => save.fixtures.find((fixture) => fixture.id === id)?.homeId === club.id || save.fixtures.find((fixture) => fixture.id === id)?.awayId === club.id));
    }

    assert.equal(qualBandForPlace("leagueTwo", 3, 24), "promo");
    for (const place of [4, 5, 6, 7]) assert.equal(qualBandForPlace("leagueTwo", place, 24), "playoff");
    assert.equal(qualBandForPlace("leagueTwo", 23, 24), "releg");
    assert.equal(qualBandForPlace("leagueTwo", 24, 24), "releg");
  });
});
