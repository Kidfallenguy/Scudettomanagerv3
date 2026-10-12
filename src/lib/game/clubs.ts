import { crestUrl } from "./crests";
import { GHOST_CLUBS } from "./fictional";
import type { Club, ClubCustomization, Competition, LeagueKind, LeagueTables, PlayableLeagueId, Standing } from "./types";

type PremierSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function premierClub(row: PremierSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "premier",
    prestige,
    crest: crestUrl(id),
  };
}

/** 2026/27 Premier League (verificado al 5/10/2026): 20 clubes. Bajaron West Ham, Wolves y Burnley; subieron Coventry, Ipswich y Hull. */
const PREMIER_EXTRA: Club[] = (
  [
    ["mun", "Manchester United", "MUN", "Mánchester", "Old Trafford", 74310, "#da291c", "#111111", 86],
    ["tot", "Tottenham", "TOT", "Londres", "Tottenham Hotspur Stadium", 62850, "#ffffff", "#132257", 85],
    ["new", "Newcastle", "NEW", "Newcastle", "St James' Park", 52258, "#241f20", "#ffffff", 84],
    ["avl", "Aston Villa", "AVL", "Birmingham", "Villa Park", 42640, "#670e36", "#95bfe5", 83],
    ["bha", "Brighton", "BHA", "Brighton", "American Express Stadium", 31876, "#0057b8", "#ffffff", 79],
    ["nfo", "Nottingham Forest", "NFO", "Nottingham", "City Ground", 30445, "#dd0000", "#ffffff", 78],
    ["cry", "Crystal Palace", "CRY", "Londres", "Selhurst Park", 25486, "#1b458f", "#c4122e", 77],
    ["ful", "Fulham", "FUL", "Londres", "Craven Cottage", 24500, "#ffffff", "#000000", 76],
    ["bre", "Brentford", "BRE", "Londres", "Gtech Community Stadium", 17250, "#e30613", "#ffffff", 75],
    ["eve", "Everton", "EVE", "Liverpool", "Hill Dickinson Stadium", 52769, "#003399", "#ffffff", 74],
    ["bou", "Bournemouth", "BOU", "Bournemouth", "Vitality Stadium", 11307, "#da291c", "#111111", 73],
    ["lee", "Leeds United", "LEE", "Leeds", "Elland Road", 37608, "#ffffff", "#ffcd00", 72],
    ["sun", "Sunderland", "SUN", "Sunderland", "Stadium of Light", 49000, "#eb172b", "#ffffff", 69],
    ["cov", "Coventry City", "COV", "Coventry", "Coventry Building Society Arena", 32609, "#002b49", "#ffffff", 68],
    ["hul", "Hull City", "HUL", "Hull", "MKM Stadium", 25586, "#f5a11d", "#000000", 68],
    ["ips", "Ipswich Town", "IPS", "Ipswich", "Portman Road", 29673, "#0000ff", "#ff0000", 68],
  ] satisfies PremierSeed[]
).map(premierClub);


type ChampionshipSeed = PremierSeed;

function championshipClub(row: ChampionshipSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "championship", prestige, crest: crestUrl(id) };
}

/**
 * Descendidos de la Premier 2025/26. Siguen en CLUBS (con plantilla, mercado y partidas guardadas),
 * pero ya pertenecen a la 2ª división inglesa.
 */
const CHAMPIONSHIP_RELEGATED: Club[] = (
  [
    ["whu", "West Ham", "WHU", "Londres", "London Stadium", 62500, "#7a263a", "#1bb1e7", 76],
    ["wol", "Wolverhampton", "WOL", "Wolverhampton", "Molineux", 31750, "#fdb913", "#111111", 73],
    ["bur", "Burnley", "BUR", "Burnley", "Turf Moor", 21944, "#6c1d45", "#99d6ea", 70],
  ] satisfies ChampionshipSeed[]
).map(championshipClub);

/** Resto de la EFL Championship 2026/27 (solo datos de la división; sin plantillas simuladas todavía). */
const CHAMPIONSHIP_OTHERS: Club[] = (
  [
    ["ch_sou", "Southampton", "SOU", "Southampton", "St Mary's Stadium", 32384, "#d71920", "#ffffff", 65],
    ["ch_mid", "Middlesbrough", "MID", "Middlesbrough", "Riverside Stadium", 34742, "#e2001a", "#ffffff", 64],
    ["ch_nor", "Norwich City", "NOR", "Norwich", "Carrow Road", 27359, "#fff200", "#00a650", 63], // Invertido: Amarillo titular
    ["ch_bir", "Birmingham City", "BIR", "Birmingham", "St Andrew's", 29409, "#0000ff", "#ffffff", 66],
    ["ch_shu", "Sheffield United", "SHU", "Sheffield", "Bramall Lane", 32050, "#ee2737", "#ffffff", 62],
    ["ch_wba", "West Bromwich Albion", "WBA", "West Bromwich", "The Hawthorns", 26850, "#122f67", "#ffffff", 62],
    ["ch_blb", "Blackburn Rovers", "BLB", "Blackburn", "Ewood Park", 31367, "#003399", "#ffffff", 62], // Azul real/marino ajustado
    ["ch_car", "Cardiff City", "CAR", "Cardiff", "Cardiff City Stadium", 33280, "#0070b5", "#ffffff", 61],
    ["ch_der", "Derby County", "DER", "Derby", "Pride Park Stadium", 33597, "#ffffff", "#000000", 61],
    ["ch_wat", "Watford", "WAT", "Watford", "Vicarage Road", 22200, "#fbee23", "#ed2127", 61],
    ["ch_bri", "Bristol City", "BRI", "Bristol", "Ashton Gate", 26462, "#e21a2c", "#ffffff", 60],
    ["ch_cha", "Charlton Athletic", "CHA", "Londres", "The Valley", 27111, "#d4021d", "#ffffff", 60],
    ["ch_sto", "Stoke City", "STO", "Stoke-on-Trent", "bet365 Stadium", 30089, "#e03a3e", "#ffffff", 60],
    ["ch_swa", "Swansea City", "SWA", "Swansea", "Swansea.com Stadium", 21088, "#ffffff", "#000000", 60],
    ["ch_por", "Portsmouth", "POR", "Portsmouth", "Fratton Park", 20867, "#001489", "#ffffff", 59],
    ["ch_wrx", "Wrexham", "WRX", "Wrexham", "Racecourse Ground", 10771, "#d71920", "#ffffff", 59],
    ["ch_bol", "Bolton Wanderers", "BOL", "Horwich", "Toughsheet Community Stadium", 28723, "#ffffff", "#1c2c5b", 58],
    ["ch_mil", "Millwall", "MIL", "Londres", "The Den", 20146, "#001d4d", "#ffffff", 58],
    ["ch_qpr", "Queens Park Rangers", "QPR", "Londres", "Loftus Road", 18439, "#1d5ba4", "#ffffff", 58],
    ["ch_pne", "Preston North End", "PNE", "Preston", "Deepdale", 23408, "#ffffff", "#1c2c5b", 57],
    ["ch_lin", "Lincoln City", "LIN", "Lincoln", "Sincil Bank", 11400, "#e30613", "#ffffff", 52],
  ] satisfies ChampionshipSeed[]
).map(championshipClub);

/** Los 24 clubes de la EFL Championship 2026/27 (corte 5/10/2026). */
export const CHAMPIONSHIP_CLUBS: Club[] = [...CHAMPIONSHIP_RELEGATED, ...CHAMPIONSHIP_OTHERS].sort(
  (a, b) => b.prestige - a.prestige,
);
export const CHAMPIONSHIP_IDS = CHAMPIONSHIP_CLUBS.map((c) => c.id);

type LigaSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function ligaClub(row: LigaSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "laliga",
    prestige,
    crest: crestUrl(id),
  };
}

/** 2025/26 La Liga — 17 clubs besides Real Madrid, Barcelona and Atlético. */
const LALIGA_EXTRA: Club[] = (
  [
    ["bet", "Real Betis", "BET", "Sevilla", "Benito Villamarín", 60721, "#00954c", "#ffffff", 80],
    ["sev", "Sevilla", "SEV", "Sevilla", "Ramón Sánchez-Pizjuán", 43883, "#ffffff", "#d70f1f", 79], // Blanco titular
    ["ala", "Alavés", "ALA", "Vitoria", "Mendizorroza", 19840, "#004fa3", "#ffffff", 70],
    ["dep", "Deportivo", "DEP", "A Coruña", "Riazor", 32490, "#0055a4", "#ffffff", 71],
    ["rso", "Real Sociedad", "RSO", "San Sebastián", "Reale Arena", 39313, "#0067b1", "#ffffff", 81],
    ["vil", "Villarreal", "VIL", "Villarreal", "Estadio de la Cerámica", 23000, "#fbee00", "#00539b", 82],
    ["ath", "Athletic", "ATH", "Bilbao", "San Mamés", 53289, "#ee2523", "#ffffff", 84],
    ["get", "Getafe", "GET", "Getafe", "Coliseum", 17393, "#004fa3", "#ffffff", 72],
    ["ray", "Rayo Vallecano", "RAY", "Madrid", "Vallecas", 14708, "#e20613", "#ffffff", 74],
    ["osa", "Osasuna", "OSA", "Pamplona", "El Sadar", 23576, "#d91a2a", "#0a3161", 75],
    ["cel", "Celta de Vigo", "CEL", "Vigo", "Balaídos", 29000, "#8ccce8", "#ffffff", 76],
    ["esp", "RCD Espanyol", "ESP", "Barcelona", "Stage Front Stadium", 40000, "#0072ce", "#ffffff", 72],
    ["rac", "Racing de Santander", "RAC", "Santander", "El Sardinero", 22308, "#ffffff", "#006633", 67], // Blanco titular
    ["lev", "Levante", "LEV", "Valencia", "Ciutat de València", 26354, "#b1050f", "#0055a4", 68],
    ["elc", "Elche C. F.", "ELC", "Elche", "Martínez Valero", 31388, "#006333", "#ffffff", 69],
    ["val", "Valencia C. F.", "VAL", "Valencia", "Mestalla", 49430, "#ffffff", "#000000", 78], // Blanco y negro
    ["mlg", "Málaga", "MLG", "Málaga", "La Rosaleda", 30044, "#00a0e3", "#ffffff", 66],
  ] satisfies LigaSeed[]
).map(ligaClub);

type SerieBSeed = PremierSeed;

function serieBClub(row: SerieBSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "serieB", prestige, crest: crestUrl(id) };
}

/**
 * Serie B 2026/27 (20 clubes). Descendidos de la Serie A 2025/26: Pisa, Hellas Verona y Cremonese. Ascendidos de la
 * Serie C: Vicenza, Arezzo, Benevento y Ascoli (playoff). Cada club tiene un solo jugador provisional (ver STARS en
 * names.ts); el resto de la plantilla lo completa el motor con jugadores generados al nivel de la división.
 */
export const SERIE_B_CLUBS: Club[] = (
  [
    ["sb_pal", "Palermo", "PAL", "Palermo", "Stadio Renzo Barbera", 36349, "#f4a6c1", "#111111", 66],
    ["sb_pis", "Pisa", "PIS", "Pisa", "Arena Garibaldi", 14600, "#0055a4", "#000000", 65], // Azul Nerazzurro titular
    ["sb_ver", "Hellas Verona", "VER", "Verona", "Marcantonio Bentegodi", 38402, "#1b3a73", "#f7d117", 65],
    ["sb_sam", "Sampdoria", "SAM", "Génova", "Luigi Ferraris", 36599, "#1c4fa3", "#ffffff", 65],
    ["sb_cre", "Cremonese", "CRE", "Cremona", "Giovanni Zini", 16003, "#c8102e", "#8a8d91", 64],
    ["sb_emp", "Empoli", "EMP", "Empoli", "Carlo Castellani", 16284, "#0067b1", "#ffffff", 62],
    ["sb_cat", "Catanzaro", "CTZ", "Catanzaro", "Nicola Ceravolo", 14650, "#e30613", "#f7d117", 61],
    ["sb_mod", "Modena", "MOD", "Módena", "Alberto Braglia", 21151, "#f7d117", "#1d4f91", 60],
    ["sb_ces", "Cesena", "CES", "Cesena", "Dino Manuzzi", 23860, "#ffffff", "#000000", 59], // Blanco Bianconero
    ["sb_pad", "Padova", "PAD", "Padua", "Stadio Euganeo", 32336, "#ffffff", "#c8102e", 58],
    ["sb_ave", "Avellino", "AVE", "Avellino", "Partenio-Adriano Lombardi", 25000, "#0b6b3a", "#ffffff", 58],
    ["sb_ben", "Benevento", "BEN", "Benevento", "Ciro Vigorito", 16867, "#f7d117", "#c8102e", 58],
    ["sb_vic", "Vicenza", "VIC", "Vicenza", "Romeo Menti", 12200, "#c8102e", "#ffffff", 57],
    ["sb_jst", "Juve Stabia", "JST", "Castellammare di Stabia", "Romeo Menti", 6300, "#f7d117", "#1d4f91", 56],
    ["sb_man", "Mantova", "MAN", "Mantua", "Danilo Martelli", 14884, "#ffffff", "#c8102e", 56],
    ["sb_asc", "Ascoli", "ASC", "Ascoli Piceno", "Cino e Lillo Del Duca", 20500, "#ffffff", "#000000", 56], // Blanco Bianconero
    ["sb_crr", "Carrarese", "CRR", "Carrara", "Stadio dei Marmi", 9500, "#003399", "#f7d117", 55], // Azul primario
    ["sb_sud", "Südtirol", "SUD", "Bolzano", "Stadio Druso", 5539, "#ffffff", "#c8102e", 55],
    ["sb_ent", "Virtus Entella", "ENT", "Chiavari", "Comunale di Chiavari", 5535, "#ffffff", "#1d4f91", 54],
    ["sb_are", "Arezzo", "ARE", "Arezzo", "Città di Arezzo", 13128, "#8b1a2e", "#ffffff", 54],
  ] satisfies SerieBSeed[]
).map(serieBClub);
export const SERIE_B_IDS = SERIE_B_CLUBS.map((c) => c.id);

type SerieCSeed = PremierSeed;

function divisionClubCrest(id: string, short: string, color: string, color2: string): string {
  const direct = crestUrl(id);
  if (direct) return direct;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="shield"><path d="M50 4 91 19v29c0 23-16 39-41 49C25 87 9 71 9 48V19z"/></clipPath></defs><g clip-path="url(#shield)"><path fill="${color}" d="M0 0h100v100H0z"/><path fill="${color2}" d="M-10 34h120v19H-10z" transform="rotate(-24 50 43)"/></g><path fill="none" stroke="#202124" stroke-width="4" d="M50 4 91 19v29c0 23-16 39-41 49C25 87 9 71 9 48V19z"/><text x="50" y="68" fill="#fff" stroke="#202124" stroke-width="1.5" paint-order="stroke" font-family="Arial,sans-serif" font-size="20" font-weight="700" text-anchor="middle">${short}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function serieCClub(row: SerieCSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "serieC", prestige, crest: divisionClubCrest(id, short, color, color2) };
}

/** Serie C 2026/27 (3 grupos de 20 clubes, representación jugable del nivel profesional del tercer escalón italiano). */
export const SERIE_C_CLUBS: Club[] = (
  [
    ["ita_cit", "Cittadella", "CIT", "Cittadella", "Stadio Pier Cesare Tombolato", 7623, "#8b1a2e", "#ffffff", 52],
    ["ita_ubr", "Union Brescia", "UBR", "Brescia", "Stadio Mario Rigamonti", 19500, "#1d4f91", "#ffffff", 55],
    ["ita_arz", "Arzignano Valchiampo", "ARZ", "Arzignano", "Stadio Tommaso Dal Molin", 1500, "#f7d117", "#111111", 43],
    ["ita_osp", "Ospitaletto Franciacorta", "OSP", "Ospitaletto", "Stadio Gino Corioni", 2500, "#e87522", "#111111", 42],
    ["ita_fca", "Folgore Caratese", "FCA", "Carate Brianza", "Sportitalia Village", 1500, "#1d4f91", "#ffffff", 42],
    ["ita_tre", "Treviso", "TRE", "Treviso", "Stadio Omobono Tenni", 10000, "#ffffff", "#1d4f91", 47],
    ["ita_des", "Desenzano", "DES", "Desenzano del Garda", "Stadio Tre Stelle", 2500, "#1d4f91", "#ffffff", 43],
    ["ita_alb", "AlbinoLeffe", "ALB", "Zanica", "AlbinoLeffe Stadium", 7240, "#1c4fa3", "#ffffff", 49],
    ["ita_alc", "Alcione Milano", "ALC", "Milán", "Stadio Breda", 4500, "#f58220", "#1d4f91", 43],
    ["ita_lum", "Lumezzane", "LUM", "Lumezzane", "Nuovo Stadio Tullio Saleri", 4150, "#d71920", "#ffffff", 44],
    ["ita_gia", "Giana Erminio", "GIA", "Gorgonzola", "Stadio Città di Gorgonzola", 3766, "#1d4f91", "#ffffff", 44],
    ["ita_dol", "Dolomiti Bellunesi", "DOL", "Belluno", "Stadio Zugni Tauro", 1747, "#d71920", "#ffffff", 43],
    ["ita_lec", "Lecco", "LEC", "Lecco", "Stadio Rigamonti-Ceppi", 4997, "#1d4f91", "#d71920", 50],
    ["ita_nov", "Novara", "NOV", "Novara", "Stadio Silvio Piola", 17875, "#1d5aa6", "#ffffff", 49],
    ["ita_pve", "Pro Vercelli", "PVE", "Vercelli", "Stadio Silvio Piola", 5500, "#ffffff", "#111111", 47],
    ["ita_per", "Pergolettese", "PER", "Crema", "Stadio Giuseppe Voltini", 4100, "#f7d117", "#1d4f91", 42],
    ["ita_jng", "Juventus Next Gen", "JNG", "Alessandria", "Stadio Giuseppe Moccagatta", 6000, "#ffffff", "#111111", 52],
    ["ita_car", "Carpi", "CAR", "Carpi", "Stadio Sandro Cabassi", 4660, "#ffffff", "#d71920", 45],
    ["ita_ren", "Renate", "REN", "Meda", "Stadio Città di Meda", 2500, "#111111", "#ffffff", 43],
    ["ita_tnt", "Trento", "TNT", "Trento", "Stadio Briamasco", 4200, "#d71920", "#ffffff", 48],
  ] satisfies SerieCSeed[]
).map(serieCClub);
export const SERIE_C_IDS = SERIE_C_CLUBS.map((c) => c.id);

type SerieDSeed = PremierSeed;

function serieDClub(row: SerieDSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "serieD", prestige, crest: divisionClubCrest(id, short, color, color2) };
}

/** Serie D 2026/27 (regional y de estructura semiprofesional; primera versión jugable del cuarto nivel italiano). */
export const SERIE_D_CLUBS: Club[] = (
  [
    ["serd_ale", "Alessandria", "ALE", "Alessandria", "Stadio Giuseppe Moccagatta", 6000, "#d71920", "#111111", 48],
    ["serd_bie", "Biellese 1902", "BIE", "Biella", "Stadio Vittorio Pozzo", 5500, "#111111", "#ffffff", 43],
    ["serd_der", "Derthona", "DER", "Tortona", "Stadio Fausto Coppi", 3300, "#111111", "#ffffff", 42],
    ["serd_ast", "Asti", "AST", "Asti", "Stadio Censin Bosia", 3000, "#d71920", "#ffffff", 41],
    ["serd_lig", "Ligorna", "LIG", "Genova", "Campo Sportivo Ligorna", 1000, "#1d4f91", "#ffffff", 40],
    ["serd_goz", "Gozzano", "GOZ", "Gozzano", "Stadio Alfredo d'Albertas", 1500, "#d71920", "#ffffff", 39],
    ["serd_sal", "Saluzzo", "SAL", "Saluzzo", "Stadio Amedeo Damiano", 1000, "#d71920", "#1d4f91", 39],
    ["serd_mil", "Millesimo", "MIL", "Millesimo", "Stadio Comunale", 1000, "#d71920", "#ffffff", 37],
    ["serd_chi", "Chisola", "CHI", "Vinovo", "Stadio Dino Marola", 1000, "#1d4f91", "#ffffff", 39],
    ["serd_imp", "Imperia", "IMP", "Imperia", "Stadio Nino Ciccione", 3300, "#111111", "#ffffff", 40],
    ["serd_las", "Lascaris", "LAS", "Pianezza", "Campo Sportivo Lascaris", 1000, "#ffffff", "#111111", 37],
    ["serd_san", "Sanremese Calcio", "SAN", "Sanremo", "Stadio Comunale", 4000, "#1d4f91", "#ffffff", 43],
    ["serd_fez", "Fezzanese", "FEZ", "Fezzano", "Stadio Miro Luperi", 1000, "#1d4f91", "#ffffff", 38],
    ["serd_bra", "Bra", "BRA", "Bra", "Stadio Attilio Bravi", 2500, "#d71920", "#ffffff", 42],
    ["serd_bor", "Borgosesia Calcio", "BOR", "Borgosesia", "Stadio Comunale", 2500, "#d71920", "#ffffff", 39],
    ["serd_ses", "Sestri Levante", "SES", "Sestri Levante", "Stadio Giuseppe Sivori", 1500, "#d71920", "#1d4f91", 41],
    ["serd_vma", "Valenzana Mado", "VMA", "Valenza", "Stadio Comunale", 1500, "#d71920", "#ffffff", 38],
    ["serd_cva", "Celle Varazze", "CVA", "Celle Ligure", "Stadio Giuseppe Olmo", 1500, "#1d4f91", "#ffffff", 38],
  ] satisfies SerieDSeed[]
).map(serieDClub);
export const SERIE_D_IDS = SERIE_D_CLUBS.map((c) => c.id);

type Bundesliga2Seed = PremierSeed;

function bundesliga2Club(row: Bundesliga2Seed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "bundesliga2", prestige, crest: crestUrl(id) };
}

/**
 * 2. Bundesliga 2026/27 (18 clubes). Descendidos de la Bundesliga 2025/26: Wolfsburg, Heidenheim y St. Pauli.
 * Ascendidos de la 3. Liga: Osnabrück y Cottbus. Cada club tiene un solo jugador provisional (ver STARS en names.ts);
 * el resto de la plantilla lo completa el motor con jugadores generados al nivel de la división.
 * Todos los ids llevan el prefijo "b2_" para no chocar con los de la Bundesliga.
 */
export const BUNDESLIGA2_CLUBS: Club[] = (
  [
["b2_wob", "VfL Wolfsburg", "WOB", "Wolfsburgo", "Volkswagen Arena", 30000, "#65b32e", "#ffffff", 66],
    ["b2_her", "Hertha BSC", "HER", "Berlín", "Olympiastadion", 74649, "#005ca9", "#ffffff", 65],
    ["b2_stp", "FC St. Pauli", "STP", "Hamburgo", "Millerntor-Stadion", 29546, "#6e3b23", "#ffffff", 65],
    ["b2_h96", "Hannover 96", "H96", "Hannover", "Heinz von Heiden Arena", 49000, "#ed1c24", "#ffffff", 62], // Blanco secundario
    ["b2_fcn", "1. FC Nürnberg", "FCN", "Núremberg", "Max-Morlock-Stadion", 49923, "#c8102e", "#ffffff", 62],
    ["b2_hdh", "1. FC Heidenheim", "HDH", "Heidenheim", "Voith-Arena", 15000, "#e2001a", "#1c3f7a", 62],
    ["b2_fck", "1. FC Kaiserslautern", "FCK", "Kaiserslautern", "Fritz-Walter-Stadion", 49327, "#e2001a", "#ffffff", 61],
    ["b2_ksc", "Karlsruher SC", "KSC", "Karlsruhe", "BBBank Wildpark", 34302, "#1c3f95", "#ffffff", 60],
    ["b2_d98", "Darmstadt 98", "D98", "Darmstadt", "Merck-Stadion am Böllenfalltor", 17650, "#004e9e", "#ffffff", 60],
    ["b2_boc", "VfL Bochum", "BOC", "Bochum", "Vonovia Ruhrstadion", 26000, "#005ca9", "#ffffff", 60],
    ["b2_fcm", "1. FC Magdeburg", "FCM", "Magdeburgo", "Avnet Arena", 30098, "#1c4fa3", "#ffffff", 59],
    ["b2_sgd", "Dynamo Dresden", "SGD", "Dresde", "Rudolf-Harbig-Stadion", 32249, "#f4c300", "#000000", 59],
    ["b2_sgf", "Greuther Fürth", "SGF", "Fürth", "Sportpark Ronhof Thomas Sommer", 16626, "#1c8c3a", "#ffffff", 58],
    ["b2_ebs", "Eintracht Braunschweig", "EBS", "Brunswick", "Eintracht-Stadion", 23325, "#f4c300", "#1c3f95", 57],
    ["b2_ksv", "Holstein Kiel", "KSV", "Kiel", "Holstein-Stadion", 15034, "#1c4fa3", "#ffffff", 57], // Azul y blanco
    ["b2_dsc", "Arminia Bielefeld", "DSC", "Bielefeld", "Schüco-Arena", 27332, "#005ca9", "#ffffff", 57], // Azul y blanco
    ["b2_osn", "VfL Osnabrück", "OSN", "Osnabrück", "Stadion an der Bremer Brücke", 15741, "#6f2c91", "#ffffff", 54],
    ["b2_cot", "Energie Cottbus", "COT", "Cottbus", "LEAG Energie Stadion", 22528, "#c8102e", "#ffffff", 54],
  ] satisfies Bundesliga2Seed[]
).map(bundesliga2Club);
export const BUNDESLIGA2_IDS = BUNDESLIGA2_CLUBS.map((c) => c.id);
type Bundesliga3Seed = PremierSeed;

function bundesliga3Club(row: Bundesliga3Seed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "bundesliga3", prestige, crest: crestUrl(id) };
}

/**
 * 3. Liga 2026/27 (20 clubes). Lista contrastada el 9/10/2026 con los participantes oficiales (kicker, fussball.de, weltfussball):
 * coincide con la prevista, así que no hizo falta corregirla. Sonnenhof Großaspach, Meppen, Fortuna Köln y Würzburger Kickers
 * vuelven a la categoría. No incluye al TSV 1860 München. Todos los ids llevan el prefijo "b3_" para no chocar con los de la
 * Bundesliga ni los de la 2. Bundesliga: VfB Stuttgart II y TSG Hoffenheim II son clubes distintos del VfB Stuttgart y el TSG
 * Hoffenheim de la Bundesliga. Los clubes arrancan con la plantilla que genera el motor al nivel de la división.
 */
export const BUNDESLIGA3_CLUBS: Club[] = (
  [
    ["b3_f95", "Fortuna Düsseldorf", "F95", "Düsseldorf", "Merkur Spiel-Arena", 54600, "#e2001a", "#ffffff", 55],
    ["b3_pre", "SC Preußen Münster", "PRE", "Münster", "Preußenstadion", 14300, "#0b6b3a", "#ffffff", 52],
    ["b3_rwe", "Rot-Weiss Essen", "RWE", "Essen", "Stadion Essen", 20650, "#d4101a", "#ffffff", 52],
    ["b3_msv", "MSV Duisburg", "MSV", "Duisburgo", "Schauinsland-Reisen-Arena", 31514, "#1c4fa3", "#ffffff", 54],
    ["b3_fch", "F.C. Hansa Rostock", "FCH", "Rostock", "Ostseestadion", 29000, "#1c4fa3", "#ffffff", 53],
    ["b3_ver", "SC Verl", "VER", "Verl", "Sportclub Arena", 5200, "#111111", "#ffffff", 44],
    ["b3_aac", "Alemannia Aachen", "AAC", "Aquisgrán", "Neuer Tivoli", 32960, "#111111", "#f4c300", 50],
    ["b3_wwi", "SV Wehen Wiesbaden", "SVW", "Wiesbaden", "BRITA-Arena", 12566, "#c8102e", "#111111", 46],
    ["b3_wal", "SV Waldhof Mannheim", "WAL", "Mannheim", "Carl-Benz-Stadion", 24302, "#1c4fa3", "#111111", 48],
    ["b3_vik", "FC Viktoria Köln", "VIK", "Colonia", "Sportpark Höhenberg", 10001, "#c8102e", "#ffffff", 46],
    ["b3_ing", "FC Ingolstadt 04", "ING", "Ingolstadt", "Audi Sportpark", 15200, "#c8102e", "#111111", 50],
    ["b3_reg", "SSV Jahn Regensburg", "REG", "Ratisbona", "Continental Arena", 15224, "#c8102e", "#ffffff", 48],
    ["b3_vf2", "VfB Stuttgart II", "VF2", "Stuttgart", "Robert-Schlienz-Stadion", 11410, "#ffffff", "#e32219", 42],
    ["b3_fcs", "1. FC Saarbrücken", "FCS", "Saarbrücken", "Ludwigsparkstadion", 16003, "#1c4fa3", "#111111", 48],
    ["b3_ho2", "TSG Hoffenheim II", "HO2", "Sinsheim", "Dietmar-Hopp-Stadion", 6350, "#1c63b7", "#ffffff", 40],
    ["b3_hav", "TSV Havelse", "HAV", "Garbsen", "Wilhelm-Langrehr-Stadion", 19700, "#1c4fa3", "#ffffff", 40],
    ["b3_mep", "SV Meppen", "MEP", "Meppen", "Hänsch-Arena", 13241, "#1c4fa3", "#ffffff", 44],
    ["b3_foc", "SC Fortuna Köln", "SCF", "Colonia", "Südstadion", 11748, "#c8102e", "#ffffff", 44],
    ["b3_gro", "SG Sonnenhof Großaspach", "SGS", "Aspach", "mechatronik Arena", 10001, "#c8102e", "#111111", 42],
    ["b3_wue", "FC Würzburger Kickers", "WUE", "Wurzburgo", "Stadion am Dallenberg", 13090, "#c8102e", "#ffffff", 42],
  ] satisfies Bundesliga3Seed[]
).map(bundesliga3Club);
export const BUNDESLIGA3_IDS = BUNDESLIGA3_CLUBS.map((c) => c.id);


/**
 * LaLiga Hypermotion 2026/27 (verificado al 7/10/2026): 22 clubes. Bajaron Oviedo, Mallorca y Girona de LaLiga EA Sports;
 * subieron de Primera RFEF Eldense, Tenerife, Sabadell y Celta Fortuna. Por ahora cada club tiene UNA plantilla
 * provisional de 1 jugador ({@link Club.provisional}); las plantillas completas llegan en la siguiente parte.
 */
function segundaClub(row: LigaSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "segunda", prestige, crest: crestUrl(id), provisional: true };
}

const SEGUNDA_CLUBS: Club[] = (
  [
    // Descendidos de LaLiga EA Sports 2025/26 (escudos ya incluidos en /public/crests).
    ["gir", "Girona", "GIR", "Girona", "Montilivi", 14624, "#cf142b", "#ffffff", 71],
    ["mll", "RCD Mallorca", "MLL", "Palma", "Estadi Mallorca Son Moix", 23142, "#e20613", "#111111", 70],
    ["ovi", "Real Oviedo", "OVI", "Oviedo", "Carlos Tartiere", 30500, "#0b4ea2", "#ffffff", 66],
    // Siguen en Segunda.
    ["sd_lpa", "UD Las Palmas", "LPA", "Las Palmas de Gran Canaria", "Estadio de Gran Canaria", 32392, "#ffd400", "#0b4ea2", 66],
    ["sd_alm", "UD Almería", "ALM", "Almería", "Power Horse Stadium", 15274, "#e30613", "#ffffff", 64],
    ["sd_spo", "Real Sporting", "SPO", "Gijón", "El Molinón", 29800, "#d71920", "#ffffff", 64],
    ["sd_vld", "Real Valladolid", "VLL", "Valladolid", "José Zorrilla", 26512, "#5b2a86", "#ffffff", 64],
    ["sd_gra", "Granada CF", "GRA", "Granada", "Nuevo Los Cármenes", 19336, "#c8102e", "#ffffff", 64],
    ["sd_leg", "CD Leganés", "LEG", "Leganés", "Butarque", 12454, "#0057b8", "#ffffff", 63],
    ["sd_cad", "Cádiz CF", "CAD", "Cádiz", "Nuevo Mirandilla", 15512, "#ffd400", "#0a2a6b", 63],
    ["sd_eib", "SD Eibar", "EIB", "Eibar", "Ipurúa", 8164, "#a50034", "#00529f", 62],
    ["sd_alb", "Albacete Balompié", "ALB", "Albacete", "Carlos Belmonte", 17524, "#ffffff", "#d71920", 58],
    ["sd_cas", "CD Castellón", "CAS", "Castellón de la Plana", "Nou Castàlia", 15500, "#111111", "#ffffff", 58],
    ["sd_cor", "Córdoba CF", "COR", "Córdoba", "Nuevo Arcángel", 12471, "#ffffff", "#00843d", 58],
    ["sd_bur", "Burgos CF", "BUR", "Burgos", "El Plantío", 12194, "#ffffff", "#111111", 57],
    ["sd_and", "FC Andorra", "AND", "Andorra la Vella", "Estadi Nacional", 3306, "#0b3d91", "#ffd400", 56],
    ["sd_ceu", "AD Ceuta FC", "CEU", "Ceuta", "Alfonso Murube", 6500, "#ffffff", "#111111", 54],
    ["sd_rsb", "Real Sociedad B", "RSB", "San Sebastián", "Zubieta", 2500, "#0067b1", "#ffffff", 52],
    // Ascendidos de Primera RFEF.
    ["sd_tfe", "CD Tenerife", "TFE", "Santa Cruz de Tenerife", "Heliodoro Rodríguez López", 22824, "#ffffff", "#0057b8", 61],
    ["sd_sab", "CE Sabadell", "SAB", "Sabadell", "Nova Creu Alta", 11908, "#0057b8", "#ffffff", 54],
    ["sd_eld", "CD Eldense", "ELD", "Elda", "Pepico Amat", 4000, "#0057b8", "#ffffff", 53],
    ["sd_cef", "Celta Fortuna", "CEF", "Vigo", "Barreiro", 4000, "#8ccce8", "#ffffff", 52],
  ] satisfies LigaSeed[]
).map(segundaClub);

/**
 * Primera Federación 2026/27 (3.ª división española): 40 clubes en dos grupos de 20 (liga `primeraFed1` y `primeraFed2`).
 * Sustituye a la antigua "Primera RFEF" fantasma de 4 clubes: Mirandés, Cultural Leonesa, Zaragoza y Huesca conservan su
 * registro (id `sd_*`) y ahora juegan aquí. Cada club lleva UNA plantilla provisional ({@link Club.provisional}): un jugador
 * de referencia (ver STARS en names.ts) y el resto generado al nivel de la categoría.
 * Fila: [id, nombre, sigla, ciudad, estadio, aforo, color, color2, prestigio, grupo, id del primer equipo (solo filiales)].
 */
type FedSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  group: 1 | 2,
  parent?: string,
];

const FED_CLUB_ROWS: FedSeed[] = [
  // ── Grupo 1 ──
  ["pf_mer", "AD Mérida", "MER", "Mérida", "Estadio Romano José Fouto", 14600, "#5b2a86", "#ffffff", 44, 1],
  ["pf_are", "Arenas Club", "ARE", "Getxo", "Gobela", 3000, "#111111", "#ffffff", 38, 1],
  ["pf_ath", "Athletic Club B", "ATB", "Bilbao", "Campos de Lezama", 3250, "#ee2523", "#ffffff", 46, 1, "ath"],
  ["pf_bar", "Barakaldo CF", "BAR", "Barakaldo", "Lasesarre", 7960, "#111111", "#ffffff", 44, 1],
  ["pf_cor", "CD Coria", "COR", "Coria del Río", "Estadio Guadalquivir", 3000, "#1c4fa3", "#ffffff", 38, 1],
  ["pf_ext", "CD Extremadura", "EXT", "Almendralejo", "Francisco de la Hera", 11580, "#1c4fa3", "#ffffff", 41, 1],
  ["pf_cac", "CP Cacereño", "CAC", "Cáceres", "Príncipe Felipe", 7500, "#0b7a43", "#ffffff", 43, 1],
  ["pf_lug", "CD Lugo", "LUG", "Lugo", "Anxo Carro", 7840, "#d71920", "#ffffff", 47, 1],
  ["sd_mir", "CD Mirandés", "MIR", "Miranda de Ebro", "Anduva", 5759, "#d71920", "#111111", 54, 1],
  ["sd_cul", "Cultural y Deportiva Leonesa", "CUL", "León", "Reino de León", 13451, "#ffffff", "#d71920", 53, 1],
  ["pf_pon", "Pontevedra CF", "PON", "Pontevedra", "Estadio Municipal de Pasarón", 12000, "#7b1e3a", "#ffffff", 46, 1],
  ["pf_fer", "Racing Club Ferrol", "FER", "Ferrol", "A Malata", 12043, "#0b7a43", "#ffffff", 45, 1],
  ["pf_fab", "RC Deportivo Fabril", "FAB", "Abegondo", "Cidade Deportiva de Abegondo", 1000, "#1c4fa3", "#ffffff", 44, 1, "dep"],
  ["pf_avi", "Real Avilés Industrial", "AVI", "Avilés", "Suárez Puerta", 5000, "#1c4fa3", "#ffffff", 41, 1],
  ["pf_run", "Real Unión Club", "RUN", "Irún", "Stadium Gal", 5000, "#1c4fa3", "#ffffff", 42, 1],
  ["pf_pnf", "SD Ponferradina", "PNF", "Ponferrada", "El Toralín", 8800, "#1c4fa3", "#ffffff", 49, 1],
  ["pf_log", "UD Logroñés", "LOG", "Logroño", "Las Gaunas", 16000, "#d71920", "#ffffff", 44, 1],
  ["pf_our", "UD Ourense", "OUR", "Ourense", "O Couto", 5659, "#1c4fa3", "#ffffff", 39, 1],
  ["pf_uni", "Unionistas de Salamanca CF", "UNI", "Salamanca", "Estadio Reina Sofía", 3500, "#111111", "#ffffff", 45, 1],
  ["pf_zam", "Zamora CF", "ZAM", "Zamora", "Ramiro Ledesma", 7813, "#ffffff", "#c8102e", 43, 1],
  // ── Grupo 2 ──
  ["pf_alc", "AD Alcorcón", "ALC", "Alcorcón", "Santo Domingo", 5100, "#ffd400", "#1c4fa3", 46, 2],
  ["pf_agu", "Águilas FC", "AGU", "Águilas", "El Rubial", 4000, "#c8102e", "#ffffff", 38, 2],
  ["pf_alg", "Algeciras CF", "ALG", "Algeciras", "Nuevo Mirador", 7200, "#c8102e", "#ffffff", 44, 2],
  ["pf_ant", "Antequera CF", "ANT", "Antequera", "El Maulí", 5000, "#ffffff", "#c8102e", 42, 2],
  ["pf_atm", "Atlético Madrileño", "ATM", "Madrid", "Ciudad Deportiva Wanda Alcalá de Henares", 2500, "#c8102e", "#ffffff", 47, 2, "atl"],
  ["pf_ter", "CD Teruel", "TER", "Teruel", "Estadio Pinilla", 4500, "#1c4fa3", "#ffffff", 42, 2],
  ["pf_eur", "CE Europa", "EUR", "Barcelona", "Nou Sardenya", 4000, "#1c4fa3", "#ffffff", 44, 2],
  ["pf_maj", "CF Rayo Majadahonda", "RMA", "Majadahonda", "Cerro del Espino", 3800, "#c8102e", "#ffffff", 45, 2],
  ["pf_car", "FC Cartagena", "CAR", "Cartagena", "Cartagonova", 15105, "#111111", "#ffffff", 52, 2],
  ["pf_gim", "Gimnàstic de Tarragona", "GIM", "Tarragona", "Nou Estadi Costa Daurada", 14591, "#8c1d40", "#ffffff", 52, 2],
  ["pf_her", "Hércules de Alicante CF", "HER", "Alicante", "José Rico Pérez", 29500, "#1c4fa3", "#ffffff", 52, 2],
  ["pf_tor", "Juventud de Torremolinos CF", "TOR", "Torremolinos", "Pepe Haro", 2500, "#1c4fa3", "#ffffff", 38, 2],
  ["pf_jae", "Real Jaén CF", "JAE", "Jaén", "Nuevo La Victoria", 12500, "#ffffff", "#0b7a43", 45, 2],
  ["pf_rmc", "Real Madrid Castilla", "RMC", "Madrid", "Alfredo Di Stéfano", 6000, "#ffffff", "#5b2a86", 54, 2, "rma"],
  ["pf_mur", "Real Murcia CF", "MUR", "Murcia", "Nueva Condomina", 31179, "#c8102e", "#ffffff", 51, 2],
  ["sd_zar", "Real Zaragoza", "ZAR", "Zaragoza", "La Romareda", 33608, "#0b4ea2", "#ffffff", 60, 2],
  ["sd_hue", "SD Huesca", "HUE", "Huesca", "El Alcoraz", 9100, "#8c1d40", "#0b4ea2", 56, 2],
  ["pf_ibi", "UD Ibiza", "IBI", "Ibiza", "Can Misses", 4600, "#6cb4ee", "#ffffff", 46, 2],
  ["pf_san", "UE Sant Andreu", "SAN", "Barcelona", "Narcís Sala", 3000, "#c8102e", "#ffd400", 40, 2],
  ["pf_vlb", "Villarreal CF B", "VLB", "Villarreal", "Mini Estadi", 3500, "#fbee00", "#00539b", 47, 2, "vil"],
];

/** Grupo (1 o 2) de Primera Federación en el que arranca cada club. */
export const FED_START_GROUP: Record<string, 1 | 2> = Object.fromEntries(FED_CLUB_ROWS.map((r) => [r[0], r[9]]));
/** Filiales: id del filial → id de su primer equipo (un filial nunca puede estar en la división de su primer equipo). */
export const FED_RESERVE_PARENT: Record<string, string> = Object.fromEntries(
  FED_CLUB_ROWS.filter((r) => r[10]).map((r) => [r[0], r[10]!]),
);

const PRIMERA_FED_CLUBS: Club[] = FED_CLUB_ROWS.map((row) => ({
  ...segundaClub([row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]]),
  league: row[9] === 1 ? ("primeraFed1" as const) : ("primeraFed2" as const),
  country: "ESP",
}));
export const PRIMERA_FED_IDS = PRIMERA_FED_CLUBS.map((c) => c.id);

type BundesSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function bundesClub(row: BundesSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "bundesliga",
    prestige,
    crest: crestUrl(id),
  };
}

/** 2026/27 Bundesliga — 15 clubs besides Bayern, Dortmund and Leipzig. */
const BUNDESLIGA_EXTRA: Club[] = (
  [
    ["b04", "Bayer Leverkusen", "B04", "Leverkusen", "BayArena", 30210, "#e32221", "#111111", 87],
    ["vfb", "VfB Stuttgart", "VFB", "Stuttgart", "MHPArena", 60449, "#ffffff", "#e32219", 82],
    ["sge", "Eintracht Frankfurt", "SGE", "Fráncfort", "Deutsche Bank Park", 58000, "#e1000f", "#111111", 81],
    ["bmg", "Borussia Mönchengladbach", "BMG", "Mönchengladbach", "Borussia-Park", 54057, "#111111", "#ffffff", 79],
    ["scf", "SC Freiburg", "SCF", "Friburgo", "Europa-Park Stadion", 34700, "#111111", "#e30613", 78],
    ["svw", "Werder Bremen", "SVW", "Bremen", "Weserstadion", 42100, "#1d9053", "#ffffff", 76],
    ["tsg", "TSG Hoffenheim", "TSG", "Sinsheim", "PreZero Arena", 30150, "#1c63b7", "#ffffff", 75],
    ["m05", "Mainz 05", "M05", "Maguncia", "Mewa Arena", 33305, "#c3141e", "#ffffff", 74],
    ["fcu", "Union Berlin", "FCU", "Berlín", "An der Alten Försterei", 22012, "#eb1923", "#ffd200", 74],
    ["koe", "1. FC Köln", "KOE", "Colonia", "RheinEnergieStadion", 50000, "#ed1c24", "#ffffff", 73],
    ["hsv", "Hamburger SV", "HSV", "Hamburgo", "Volksparkstadion", 57000, "#005ca9", "#020000", 73],
    ["fca", "FC Augsburg", "FCA", "Augsburgo", "WWK Arena", 30660, "#ba3733", "#1e5aa8", 71],
    ["s04", "Schalke 04", "S04", "Gelsenkirchen", "Veltins-Arena", 62271, "#004d9d", "#ffffff", 72],
    ["elv", "SV Elversberg", "ELV", "Elversberg", "Ursapharm-Arena", 10000, "#111111", "#ffffff", 68],
    ["scp", "SC Paderborn", "SCP", "Paderborn", "Home Deluxe Arena", 15000, "#4c8bff", "#ffffff", 67],
  ] satisfies BundesSeed[]
).map(bundesClub);

type LigueSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function ligueClub(row: LigueSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "ligue1",
    prestige,
    crest: crestUrl(id),
  };
}

/** 2026/27 Ligue 1 — 17 clubs besides Paris Saint-Germain (Metz y Nantes pasan a Ligue 2). */
const LIGUE1_EXTRA: Club[] = (
  [
    ["om", "Olympique de Marseille", "OM", "Marsella", "Orange Vélodrome", 67394, "#2fa8e0", "#ffffff", 84],
    ["asm", "AS Monaco", "ASM", "Mónaco", "Stade Louis-II", 18523, "#e30613", "#ffffff", 86],
    ["ol", "Olympique de Lyon", "OL", "Lyon", "Groupama Stadium", 59186, "#003da5", "#ffffff", 82],
    ["lil", "Lille OSC", "LIL", "Lille", "Pierre-Mauroy", 50186, "#e01a22", "#ffffff", 81],
    ["nic", "OGC Nice", "NIC", "Niza", "Allianz Riviera", 35624, "#d0001f", "#000000", 80],
    ["rcl", "Racing Club de Lens", "RCL", "Lens", "Bollaert-Delelis", 38223, "#d4a017", "#d41c1c", 79],
    ["rcs", "RC Strasbourg", "RCS", "Estrasburgo", "La Meinau", 26109, "#009fe3", "#ffffff", 77],
    ["sre", "Stade Rennais", "REN", "Rennes", "Roazhon Park", 29778, "#c8102e", "#000000", 76],
    ["sbr", "Stade Brestois 29", "SBR", "Brest", "Francis-Le Blé", 15931, "#e30613", "#ffffff", 74],
    ["tfc", "Toulouse FC", "TFC", "Toulouse", "Stadium de Toulouse", 33150, "#4a1c6b", "#ffffff", 73],
    ["pfc", "Paris FC", "PFC", "París", "Stade Jean-Bouin", 20000, "#1a3a8c", "#ffffff", 70],
    ["aux", "AJ Auxerre", "AUX", "Auxerre", "Abbé-Deschamps", 18541, "#1a3a8a", "#ffffff", 69],
    ["hac", "Le Havre AC", "HAC", "Le Havre", "Stade Océane", 25178, "#1a4d8c", "#82c0e8", 68],
    ["ang", "Angers SCO", "ANG", "Angers", "Raymond-Kopa", 19351, "#ffffff", "#000000", 67],
    ["lor", "FC Lorient", "FCL", "Lorient", "Stade du Moustoir", 18890, "#f26522", "#000000", 67],
    ["tro", "ESTAC Troyes", "EST", "Troyes", "Stade de l'Aube", 20400, "#1e5aa8", "#ffffff", 65],
    ["lmn", "Le Mans FC", "LMN", "Le Mans", "MMArena", 25064, "#c8102e", "#ffd200", 64],
  ] satisfies LigueSeed[]
).map(ligueClub);

/** Ligue 2 2026/27 — 18 clubes (solo datos de clubes; sin plantillas, tabla ni calendario todavía). Metz y Nantes reutilizan sus ids existentes. */
export const LIGUE2_CLUBS: Club[] = (
  [
    ["fcn", "FC Nantes", "FCN", "Nantes", "La Beaujoire", 35322, "#ffed00", "#007a3d", 72],
    ["met", "FC Metz", "FCM", "Metz", "Saint-Symphorien", 25636, "#6c1d45", "#ffffff", 66],
    ["l2_ste", "AS Saint-Étienne", "STE", "Saint-Étienne", "Geoffroy-Guichard", 41965, "#00964d", "#ffffff", 66],
    ["l2_mtp", "Montpellier HSC", "MTP", "Montpellier", "Stade de la Mosson", 32900, "#f26522", "#1a3a8c", 63],
    ["l2_rei", "Stade de Reims", "REI", "Reims", "Auguste-Delaune", 21684, "#e30613", "#ffffff", 62],
    ["l2_gui", "EA Guingamp", "GUI", "Guingamp", "Stade du Roudourou", 18256, "#e30613", "#000000", 58],
    ["l2_cle", "Clermont Foot 63", "CLE", "Clermont-Ferrand", "Stade Gabriel-Montpied", 11980, "#c8102e", "#1a3a8c", 56],
    ["l2_nan", "AS Nancy-Lorraine", "NCY", "Nancy", "Stade Marcel-Picot", 20087, "#ffffff", "#e30613", 56],
    ["l2_soc", "FC Sochaux-Montbéliard", "SOC", "Sochaux", "Stade Auguste-Bonal", 20005, "#ffd200", "#1a3a8c", 55],
    ["l2_dij", "Dijon FCO", "DIJ", "Dijon", "Stade Gaston-Gérard", 15995, "#e30613", "#ffffff", 54],
    ["l2_gre", "Grenoble Foot 38", "GRE", "Grenoble", "Stade des Alpes", 20068, "#1a3a8c", "#ffffff", 52],
    ["l2_ann", "FC Annecy", "ANN", "Annecy", "Parc des Sports", 15660, "#e30613", "#ffffff", 52],
    ["l2_lav", "Stade Lavallois", "LAV", "Laval", "Stade Francis-Le Basser", 18739, "#f26522", "#000000", 51],
    ["l2_dun", "USL Dunkerque", "DUN", "Dunkerque", "Stade Marcel-Tribut", 4933, "#1a3a8c", "#e30613", 50],
    ["l2_rsf", "Red Star FC", "RSF", "Saint-Ouen", "Stade Bauer", 10000, "#00a650", "#ffffff", 50],
    ["l2_bou", "US Boulogne", "BOU", "Boulogne-sur-Mer", "Stade de la Libération", 15004, "#e30613", "#ffffff", 48],
    ["l2_pau", "Pau FC", "PAU", "Pau", "Nouste Camp", 4031, "#ffd200", "#1a3a8c", 48],
    ["l2_rod", "Rodez Aveyron Football", "ROD", "Rodez", "Stade Paul-Lignon", 5955, "#e30613", "#ffd200", 48],
  ] satisfies LigueSeed[]
).map((row) => ({ ...ligueClub(row), league: "ligue2" as const, provisional: true }));
export const LIGUE2_IDS = LIGUE2_CLUBS.map((c) => c.id);

/** Ligue 3 2026/27: plantillas provisionales, sin presentar nombres de futbolistas como reales. */
export const LIGUE3_CLUBS: Club[] = ([
  ["l3_lar", "La Roche VF", "LRV", "La Roche-sur-Yon", "Stade Henri-Desgrange", 5000, "#d71920", "#ffffff", 42],
  ["l3_rou", "Football Club Rouen", "FCR", "Rouen", "Stade Robert-Diochon", 12018, "#c8102e", "#ffffff", 55],
  ["l3_con", "Concarneau", "USC", "Concarneau", "Stade Guy-Piriou", 6200, "#e30613", "#ffffff", 47],
  ["l3_ver", "Football Club de Versailles 78", "FCV", "Versailles", "Stade Montbauron", 7500, "#f5d000", "#111111", 47],
  ["l3_ami", "Amiens SC", "ASC", "Amiens", "Stade de la Licorne", 12097, "#111111", "#ffffff", 57],
  ["l3_can", "Association Sportive de Cannes Football", "ASC", "Cannes", "Stade Pierre-de-Coubertin", 12000, "#c8102e", "#ffffff", 48],
  ["l3_caen", "SM Caen", "SMC", "Caen", "Stade Michel-d'Ornano", 20453, "#1a3a8c", "#d71920", 61],
  ["l3_puy", "Le Puy Foot 43 Auvergne", "LPF", "Le Puy-en-Velay", "Stade Charles-Massot", 4800, "#1a3a8c", "#ffffff", 45],
  ["l3_thi", "US Thionville Lusitanos", "UTL", "Thionville", "Stade de Guentrange", 3500, "#e30613", "#ffffff", 42],
  ["l3_fle", "Fleury 91", "F91", "Fleury-Mérogis", "Stade Auguste-Gentelet", 2500, "#c8102e", "#111111", 43],
  ["l3_par", "París 13 Atlético", "P13", "París", "Stade Pelé", 1000, "#1a3a8c", "#ffffff", 41],
  ["l3_bas", "Bastia", "SCB", "Bastia", "Stade Armand-Cesari", 16000, "#1a3a8c", "#ffffff", 58],
  ["l3_que", "Quevilly", "QRM", "Le Petit-Quevilly", "Stade Robert-Diochon", 12018, "#f5d000", "#111111", 49],
  ["l3_orl", "US Orléans", "USO", "Orléans", "Stade de la Source", 7000, "#f5d000", "#111111", 49],
  ["l3_val", "Valenciennes", "VAFC", "Valenciennes", "Stade du Hainaut", 25172, "#c8102e", "#ffffff", 58],
  ["l3_aub", "Aubagne Football Club", "AFC", "Aubagne", "Stade de Lattre", 3000, "#c8102e", "#111111", 42],
  ["l3_bou", "Bourg-Péronnas", "FBBP", "Bourg-en-Bresse", "Stade Marcel-Verchère", 11400, "#1a3a8c", "#ffffff", 43],
  ["l3_vil", "Football Club Villefranche Beaujolais", "FCVB", "Villefranche-sur-Saône", "Stade Armand-Chouffet", 3500, "#1a3a8c", "#ffffff", 44],
] satisfies LigueSeed[]).map((row) => ({
  ...ligueClub(row),
  league: "ligue3" as const,
  provisional: true,
  country: "FRA",
}));
export const LIGUE3_IDS = LIGUE3_CLUBS.map((club) => club.id);

type ArgentinaSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  featured?: boolean,
];

function argentinaClub(row: ArgentinaSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, featured] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "argentina",
    prestige,
    featured: featured || undefined,
    country: "ARG",
    crest: crestUrl(id),
  };
}

/** Liga Profesional 2026 — 24 clubes. */
const ARGENTINA_CLUBS: Club[] = (
  [
    ["irv", "Independiente Rivadavia", "IRV", "Mendoza", "Bautista Gargantini", 24000, "#1e4a9a", "#ffffff", 66],
    ["vel", "Vélez", "VEL", "Buenos Aires", "José Amalfitani", 49540, "#ffffff", "#1a3a8a", 80],
    ["boc", "Boca", "BOC", "Buenos Aires", "La Bombonera", 54000, "#0033a0", "#f9be01", 89],
    ["argj", "Argentinos Juniors", "AAJ", "Buenos Aires", "Diego Armando Maradona", 24380, "#c8102e", "#ffffff", 73],
    ["rcen", "Rosario Central", "CEN", "Rosario", "Gigante de Arroyito", 41654, "#1a3a8a", "#c9a227", 76],
    ["ins", "Instituto", "INS", "Córdoba", "Presidente Perón", 26000, "#c8102e", "#ffffff", 70],
    ["gim", "Gimnasia LP", "GIM", "La Plata", "Juan Carmelo Zerillo", 21500, "#ffffff", "#1a3a8a", 70],
    ["riv", "River", "RIV", "Buenos Aires", "Más Monumental", 84567, "#ffffff", "#c8102e", 90, true],
    ["bel", "Belgrano", "BEL", "Córdoba", "Gigante de Alberdi", 34500, "#6ec4e8", "#1a3a8a", 71],
    ["est", "Estudiantes LP", "EST", "La Plata", "Jorge Luis Hirschi", 32300, "#c8102e", "#ffffff", 80],
    ["cai", "Independiente", "CAI", "Avellaneda", "Libertadores de América", 42069, "#c8102e", "#ffffff", 81],
    ["lan", "Lanús", "LAN", "Lanús", "Ciudad de Lanús", 47027, "#6b1d45", "#ffffff", 77],
    ["hur", "Huracán", "HUR", "Buenos Aires", "Tomás Adolfo Ducó", 48314, "#ffffff", "#c8102e", 74],
    ["dyj", "Defensa y Justicia", "DYJ", "Florencio Varela", "Norberto Tomaghello", 10500, "#f5d000", "#1d7a3a", 73],
    ["tal", "Talleres", "TAL", "Córdoba", "Mario Alberto Kempes", 57000, "#1a3a8a", "#ffffff", 78],
    ["bcc", "Barracas Central", "BCC", "Buenos Aires", "Claudio Chiqui Tapia", 4400, "#c8102e", "#ffffff", 65],
    ["slo", "San Lorenzo", "SLO", "Buenos Aires", "Pedro Bidegain", 47000, "#1a3a8a", "#c8102e", 79],
    ["tig", "Tigre", "TIG", "Victoria", "José Dellagiovanna", 26282, "#1e5aa8", "#c8102e", 67],
    ["nob", "Newell's", "NOB", "Rosario", "Marcelo Bielsa", 42000, "#c8102e", "#111111", 75],
    ["rca", "Racing", "RCA", "Avellaneda", "Presidente Perón", 55000, "#6ec8e8", "#ffffff", 82],
    ["ban", "Banfield", "BAN", "Banfield", "Florencio Sola", 34901, "#1d7a3a", "#ffffff", 69],
    ["pla", "Platense", "PLA", "Vicente López", "Ciudad de Vicente López", 28530, "#6b4423", "#ffffff", 68],
    ["rie", "Riestra", "RIE", "Buenos Aires", "Guillermo Laza", 3000, "#111111", "#ffffff", 64],
    ["atu", "Atlético Tucumán", "ATU", "San Miguel de Tucumán", "Monumental José Fierro", 35200, "#6ec4e8", "#ffffff", 69],
  ] satisfies ArgentinaSeed[]
).map(argentinaClub);

/**
 * Primera Nacional 2026 — 24 clubes (Argentina, segundo nivel). Todavía no tienen plantilla completa: cada club tiene
 * UNA plantilla provisional de 1 jugador ({@link Club.provisional}), igual que LaLiga Hypermotion. Estadios, colores y
 * prestigio son aproximados. El nombre visible es SIEMPRE "Primera Nacional".
 */
function primeraNacionalClub(row: ArgentinaSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "primeraNacional",
    prestige,
    country: "ARG",
    crest: crestUrl(id),
    provisional: true,
  };
}

const PRIMERA_NACIONAL_CLUBS: Club[] = (
  [
    ["pn_ald", "Aldosivi", "ALD", "Mar del Plata", "José María Minella", 35180, "#f5d000", "#1d7a3a", 60],
    ["pn_cco", "Central Córdoba", "CCO", "Santiago del Estero", "Alfredo Terrera", 28000, "#111111", "#ffffff", 61],
    ["pn_gme", "Gimnasia de Mendoza", "GME", "Mendoza", "Víctor Legrotaglie", 11000, "#ffffff", "#1a3a8a", 58],
    ["pn_sar", "Sarmiento", "SAR", "Junín", "Eva Perón", 22000, "#1d7a3a", "#ffffff", 60],
    ["pn_uni", "Unión", "UNI", "Santa Fe", "15 de Abril", 28000, "#c8102e", "#ffffff", 62],
    ["pn_erc", "Estudiantes de Río Cuarto", "ERC", "Río Cuarto", "Antonio Candini", 15000, "#c8102e", "#ffffff", 52],
    ["pn_col", "Colón", "COL", "Santa Fe", "Brigadier General Estanislao López", 40000, "#c8102e", "#111111", 62],
    ["pn_qui", "Quilmes", "QUI", "Quilmes", "Centenario", 30000, "#ffffff", "#1a3a8a", 59],
    ["pn_nch", "Nueva Chicago", "NCH", "Buenos Aires", "República de Mataderos", 28000, "#111111", "#1d7a3a", 56],
    ["pn_cha", "Chacarita Juniors", "CHA", "San Martín", "Chacarita Juniors", 27000, "#c8102e", "#111111", 57],
    ["pn_atl", "Atlanta", "ATL", "Buenos Aires", "Don León Kolbowski", 14000, "#f5d000", "#1a3a8a", 55],
    ["pn_fer", "Ferro Carril Oeste", "FER", "Buenos Aires", "Arquitecto Ricardo Etcheverri", 24000, "#1d7a3a", "#ffffff", 58],
    ["pn_alb", "All Boys", "ALB", "Buenos Aires", "Islas Malvinas", 24000, "#ffffff", "#111111", 53],
    ["pn_smt", "San Martín de Tucumán", "SMT", "San Miguel de Tucumán", "La Ciudadela", 28000, "#c8102e", "#111111", 56],
    ["pn_gju", "Gimnasia de Jujuy", "GJU", "San Salvador de Jujuy", "23 de Agosto", 23000, "#ffffff", "#1a3a8a", 54],
    ["pn_pat", "Patronato", "PAT", "Paraná", "Presbítero Bartolomé Grella", 23000, "#c8102e", "#111111", 58],
    ["pn_dmo", "Deportivo Morón", "DMO", "Morón", "Nuevo Francisco Urbano", 20000, "#ffffff", "#c8102e", 52],
    ["pn_lda", "Los Andes", "LDA", "Lomas de Zamora", "Eduardo Gallardón", 33000, "#c8102e", "#ffffff", 54],
    ["pn_tem", "Temperley", "TEM", "Temperley", "Alfredo Beranger", 25000, "#6ec4e8", "#ffffff", 54],
    ["pn_eca", "Estudiantes de Caseros", "ECA", "Caseros", "Ciudad de Caseros", 15000, "#1a3a8a", "#f5d000", 49],
    ["pn_deb", "Defensores de Belgrano", "DEB", "Buenos Aires", "Juan Pasquale", 10000, "#111111", "#c8102e", 49],
    ["pn_agr", "Agropecuario", "AGR", "Carlos Casares", "Ofelia Rosa Eliseo", 11000, "#1d7a3a", "#ffffff", 50],
    ["pn_cfe", "Chaco For Ever", "CFE", "Resistencia", "Juan Alberto García", 22000, "#1d7a3a", "#ffffff", 50],
    ["pn_mse", "Mitre de Santiago del Estero", "MSE", "Santiago del Estero", "Doctor Antonio Castiglione", 14000, "#f5d000", "#111111", 50],
  ] satisfies ArgentinaSeed[]
).map(primeraNacionalClub);

const ARGENTINA_INITIAL_ASSIGNMENTS: Record<
  string,
  "primeraNacional" | "primeraBMetro" | "argentinaCuarta" | "argentinaQuinta"
> = {
  bm_aca: "primeraBMetro",
  bm_aq: "argentinaCuarta",
  bm_am: "argentinaQuinta",
  bm_com: "argentinaCuarta",
  bm_arm: "argentinaCuarta",
  bm_laf: "primeraNacional",
  bm_mer: "argentinaCuarta",
  bm_dock: "argentinaCuarta",
  bm_exc: "argentinaCuarta",
  bm_fla: "argentinaCuarta",
  bm_itu: "primeraBMetro",
  bm_lin: "argentinaQuinta",
  bm_mid: "primeraBMetro",
  bm_rp: "argentinaCuarta",
  bm_sac: "primeraBMetro",
  bm_smb: "argentinaCuarta",
  bm_ita: "primeraBMetro",
  bm_uai: "primeraBMetro",
  bm_vd: "primeraBMetro",
  bm_vsc: "primeraBMetro",
  bm_tal: "primeraBMetro",
  bm_brown: "primeraBMetro",
};

/** Tercera categoría argentina personalizada: Primera B Metropolitana y Federal A. */
const PRIMERA_B_METRO_CLUBS: Club[] = (
  [
    ["bm_aca", "Acassuso", "ACA", "San Isidro", "La Quema", 5000, "#c8102e", "#ffffff", 46, true],
    ["bm_aq", "Argentino de Quilmes", "AQ", "Quilmes", "La Barranca", 8000, "#111111", "#ffffff", 45],
    ["bm_am", "Argentino de Merlo", "AM", "Merlo", "Juan Carlos Brieva", 5000, "#111111", "#ffffff", 43],
    ["bm_com", "Club Comunicaciones", "COM", "Buenos Aires", "Alfredo Ramos", 3500, "#f5d000", "#111111", 44],
    ["bm_arm", "Deportivo Armenio", "ARM", "Ingeniero Maschwitz", "República de Armenia", 5000, "#f5d000", "#111111", 44],
    ["bm_laf", "Deportivo Laferrere", "LAF", "Gregorio de Laferrere", "Ciudad de Laferrere", 10_000, "#1d7a3a", "#ffffff", 46],
    ["bm_mer", "Deportivo Merlo", "MER", "Merlo", "José Manuel Moreno", 7500, "#1d7a3a", "#ffffff", 44],
    ["bm_dock", "Dock Sud", "DS", "Dock Sud", "De los Inmigrantes", 9500, "#1a3a8a", "#ffffff", 45],
    ["bm_exc", "Excursionistas", "EXC", "Buenos Aires", "Pampa y Miñones", 7000, "#1d7a3a", "#ffffff", 46],
    ["bm_fla", "Flandria", "FLA", "Jáuregui", "Carlos V", 5000, "#f5d000", "#111111", 45],
    ["bm_itu", "Ituzaingó", "ITU", "Ituzaingó", "Carlos Sacaan", 5000, "#1d7a3a", "#ffffff", 43],
    ["bm_lin", "Liniers", "LIN", "San Justo", "Juan Antonio Arias", 3000, "#111111", "#ffffff", 42],
    ["bm_mid", "Midland", "MID", "Libertad", "Ciudad de Libertad", 5000, "#111111", "#ffffff", 45],
    ["bm_rp", "Real Pilar", "RP", "Pilar", "Carlos Barraza", 10_000, "#ffffff", "#111111", 43],
    ["bm_sac", "Sacachispas", "SAC", "Villa Soldati", "Roberto Larrosa", 5000, "#6e2b87", "#ffffff", 42],
    ["bm_smb", "San Martín de Burzaco", "SMB", "Burzaco", "Francisco Boga", 6000, "#1a3a8a", "#ffffff", 43],
    ["bm_ita", "Sportivo Italiano", "ITA", "Ciudad Evita", "República de Italia", 8000, "#1a3a8a", "#ffffff", 44],
    ["bm_uai", "UAI Urquiza", "UAI", "Villa Lynch", "Monumental de Villa Lynch", 3000, "#1a3a8a", "#c8102e", 42],
    ["bm_vd", "Villa Dálmine", "VD", "Campana", "El Coliseo de Mitre y Puccini", 12_000, "#1a3a8a", "#ffffff", 45],
    ["bm_vsc", "Villa San Carlos", "VSC", "Berisso", "Genacio Sálice", 6000, "#6ec4e8", "#ffffff", 44],
    ["bm_tal", "Talleres de Remedios de Escalada", "TAL", "Remedios de Escalada", "Pablo Comelli", 8000, "#c8102e", "#ffffff", 47],
    ["bm_brown", "Brown de Adrogué", "BRO", "Adrogué", "Lorenzo Arandilla", 6000, "#6b4423", "#ffffff", 46],
  ] satisfies ArgentinaSeed[]
).map((row) => {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, featured] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: ARGENTINA_INITIAL_ASSIGNMENTS[id] ?? "primeraBMetro",
    prestige,
    featured: featured || undefined,
    country: "ARG",
    crest: crestUrl(id),
    provisional: true,
  };
});

type ArgentinaLowerSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function argentinaLowerClubs(
  league: "primeraBMetro" | "argentinaCuarta" | "argentinaQuinta" | "promocionalAmateur",
  rows: ArgentinaLowerSeed[],
): Club[] {
  return rows.map(([id, name, short, city, capacity, color, color2, prestige]) => ({
    id,
    name,
    short,
    city,
    stadium: "Estadio local",
    capacity,
    color,
    color2,
    league,
    prestige,
    country: "ARG",
    crest: crestUrl(id),
    provisional: true,
  }));
}

// La pirámide inferior de Scudetto es una estructura propia y no pretende replicar el reglamento oficial.
const ARGENTINA_FOURTH_CLUBS = argentinaLowerClubs("argentinaCuarta", [
  ["ar4_dep_espanol", "Deportivo Español", "ESP", "Buenos Aires", 8000, "#c8102e", "#ffffff", 35],
  ["ar4_lamadrid", "General Lamadrid", "LAM", "Villa Devoto", 5000, "#ffffff", "#111111", 33],
  ["ar4_victoriano", "Victoriano Arenas", "VIA", "Valentín Alsina", 3000, "#1a3a8a", "#ffffff", 32],
  ["ar4_atlas", "Atlas", "ATL", "General Rodríguez", 2500, "#f5d000", "#111111", 31],
  ["ar4_lujan", "Luján", "LUJ", "Luján", 2500, "#c8102e", "#ffffff", 33],
  ["ar4_berazategui", "Berazategui", "BER", "Berazategui", 5000, "#f58220", "#111111", 34],
  ["ar4_claypole", "Claypole", "CLY", "Claypole", 2500, "#111111", "#ffffff", 31],
  ["ar4_cc_rosario", "Central Córdoba de Rosario", "CCR", "Rosario", 5000, "#c8102e", "#111111", 35],
  ["ar4_sportivo_barracas", "Sportivo Barracas", "SBA", "Buenos Aires", 2000, "#6ec4e8", "#ffffff", 29],
]);

const ARGENTINA_FOURTH_TO_FIFTH_CLUBS = argentinaLowerClubs("argentinaQuinta", [
  ["ar4_puerto_nuevo", "Puerto Nuevo", "PNU", "Campana", 2500, "#f5d000", "#1a3a8a", 30],
  ["ar4_yupanqui", "Yupanqui", "YUP", "Villa Lugano", 1500, "#1d7a3a", "#ffffff", 29],
  ["ar4_jj_urquiza", "J.J. Urquiza", "JJU", "Caseros", 3000, "#1a3a8a", "#ffffff", 32],
  ["ar4_alem", "Leandro N. Alem", "ALE", "General Rodríguez", 2500, "#1d7a3a", "#ffffff", 31],
  ["ar4_el_porvenir", "El Porvenir", "POR", "Gerli", 5000, "#ffffff", "#111111", 32],
  ["ar4_lugano", "Lugano", "LUG", "Villa Lugano", 2000, "#f58220", "#111111", 29],
  ["ar4_juventud_unida", "Juventud Unida de San Miguel", "JUS", "San Miguel", 2500, "#1a3a8a", "#ffffff", 30],
  ["ar4_cambaceres", "Defensores de Cambaceres", "CAM", "Ensenada", 5000, "#c8102e", "#ffffff", 33],
]);

const ARGENTINA_FIFTH_CLUBS = argentinaLowerClubs("argentinaQuinta", [
  ["ar5_muniz", "Muñiz", "MUN", "San Miguel", 2000, "#c8102e", "#ffffff", 26],
  ["ar5_centro_espanol", "Centro Español", "CES", "Villa Sarmiento", 2000, "#1a3a8a", "#ffffff", 25],
  ["ar5_paraguayo", "Deportivo Paraguayo", "DPA", "Buenos Aires", 2000, "#1d7a3a", "#ffffff", 25],
]);

const ARGENTINA_THIRD_CLUBS = argentinaLowerClubs("primeraBMetro", [
  ["arg_3_abr", "Almirante Brown", "ALM", "Isidro Casanova", 25_000, "#f5d000", "#111111", 48],
  ["arg_3_ste", "San Telmo", "TEL", "Buenos Aires", 6000, "#111111", "#c8102e", 44],
  ["arg_3_alm", "Almagro", "ALG", "José Ingenieros", 19_000, "#111111", "#ffffff", 45],
  ["arg_3_smi", "San Miguel", "SMI", "Los Polvorines", 7000, "#1d7a3a", "#ffffff", 43],
  ["arg_3_col", "Colegiales", "COL", "Munro", 6000, "#1a3a8a", "#ffffff", 43],
  ["arg_3_tsu", "Tristán Suárez", "TSU", "Tristán Suárez", 7000, "#f5d000", "#111111", 44],
  ["arg_3_cadu", "Defensores Unidos / CADU", "CADU", "Zárate", 5000, "#6ec4e8", "#ffffff", 42],
  ["arg_3_smsj", "San Martín de San Juan", "SMSJ", "San Juan", 25_000, "#111111", "#ffffff", 48],
  ["arg_3_mad", "Deportivo Madryn", "MAD", "Puerto Madryn", 6000, "#f5d000", "#111111", 46],
  ["arg_3_rco", "Racing de Córdoba", "RAC", "Córdoba", 15_000, "#6ec4e8", "#ffffff", 46],
  ["arg_3_gts", "Gimnasia y Tiro de Salta", "GTS", "Salta", 10_000, "#ffffff", "#c8102e", 45],
  ["arg_3_oli", "Olimpo de Bahía Blanca", "OLI", "Bahía Blanca", 18_000, "#f5d000", "#111111", 48],
  ["arg_3_san", "Santamarina de Tandil", "SAN", "Tandil", 8000, "#f5d000", "#111111", 42],
  ["arg_3_cip", "Cipolletti de Río Negro", "CIP", "Cipolletti", 12_000, "#111111", "#c8102e", 43],
  ["arg_3_dha", "Douglas Haig de Pergamino", "DHA", "Pergamino", 10_000, "#c8102e", "#111111", 43],
  ["arg_3_cno", "Central Norte de Salta", "CNO", "Salta", 6000, "#111111", "#c8102e", 43],
  ["arg_3_sbe", "Sportivo Belgrano de San Francisco", "SBE", "San Francisco", 8000, "#1d7a3a", "#ffffff", 42],
]);

const ARGENTINA_FOURTH_EXTRA_CLUBS = argentinaLowerClubs("argentinaCuarta", [
  ["arg_4_bol", "Club Ciudad de Bolívar", "BOL", "San Carlos de Bolívar", 5000, "#1a3a8a", "#ffffff", 40],
  ["arg_4_gcu", "Gimnasia (Concepción del Uruguay)", "GCU", "Concepción del Uruguay", 5000, "#ffffff", "#1a3a8a", 38],
]);

const ARGENTINA_FIFTH_EXTRA_CLUBS = argentinaLowerClubs("argentinaQuinta", [
  ["arg_5_juu", "Juventud Unida Universitario (San Luis)", "JUU", "San Luis", 8000, "#c8102e", "#ffffff", 38],
  ["arg_5_sre", "Sarmiento de Resistencia", "SAR", "Resistencia", 10_000, "#1d7a3a", "#ffffff", 38],
  ["arg_5_saf", "Sol de América de Formosa", "SDA", "Formosa", 8000, "#1d7a3a", "#ffffff", 36],
]);

// Metalúrgico y Deportivo Metalúrgico se tratan como nombres del mismo club para evitar una institución duplicada.
const PROMOCIONAL_AMATEUR_CLUBS = argentinaLowerClubs("promocionalAmateur", [
  ["tpa_everton_lp", "Everton de La Plata", "EVL", "La Plata", 4000, "#f5d000", "#111111", 25],
  ["tpa_estrella_berisso", "Estrella de Berisso", "EDB", "Berisso", 2000, "#1d7a3a", "#ffffff", 22],
  ["tpa_belgrano_zarate", "Belgrano de Zárate", "BDZ", "Zárate", 2500, "#c8102e", "#ffffff", 23],
  ["tpa_metalurgico", "Deportivo Metalúrgico", "MET", "Pilar", 2500, "#1a3a8a", "#ffffff", 23],
  ["tpa_atletico_pilar", "Atlético Pilar", "ATP", "Pilar", 3000, "#c8102e", "#ffffff", 24],
  ["tpa_glew", "Defensores de Glew", "DGL", "Glew", 2000, "#1d7a3a", "#ffffff", 22],
  ["tpa_estrella_sur", "Estrella del Sur", "EDS", "Alejandro Korn", 2000, "#c8102e", "#111111", 22],
  ["tpa_camioneros", "Camioneros", "CAM", "Esteban Echeverría", 5000, "#1d7a3a", "#ffffff", 27],
  ["tpa_provincial_lobos", "Provincial de Lobos", "PDL", "Lobos", 2000, "#c8102e", "#ffffff", 21],
  ["tpa_barrancas", "Barrancas FC", "BAR", "General Rodríguez", 1500, "#1d7a3a", "#ffffff", 20],
  ["tpa_hacoaj", "Náutico Hacoaj", "HAC", "Tigre", 2500, "#1a3a8a", "#ffffff", 22],
  ["tpa_mercedes", "Club Mercedes", "MER", "Mercedes", 3000, "#1d7a3a", "#ffffff", 24],
  ["tpa_social_lux", "Social Lux", "SLU", "Rosario", 2000, "#1d7a3a", "#ffffff", 21],
  ["tpa_ezeiza", "FC Ezeiza", "EZE", "Ezeiza", 2000, "#1a3a8a", "#ffffff", 22],
  ["tpa_juventud_pringles", "Juventud Pringles", "JUP", "Coronel Pringles", 2000, "#c8102e", "#ffffff", 21],
  ["tpa_sat", "SAT (Social Atlético Televisión)", "SAT", "Moreno", 3000, "#1d7a3a", "#ffffff", 25],
  ["tpa_juventud_bernal", "Juventud de Bernal", "JDB", "Bernal", 2000, "#1a3a8a", "#ffffff", 22],
  ["tpa_uribelarrea", "Uribelarrea FC", "URB", "Uribelarrea", 1500, "#1d7a3a", "#ffffff", 20],
  ["tpa_buenos_aires_city", "Buenos Aires City FC", "BAC", "Buenos Aires", 2000, "#6ec4e8", "#ffffff", 22],
  ["tpa_alumni_los_hornos", "Alumni (Los Hornos)", "ALH", "Los Hornos", 2000, "#c8102e", "#ffffff", 21],
  ["tpa_aco", "Academia Control Orientado", "ACO", "Buenos Aires", 1500, "#111111", "#f5d000", 20],
  ["tpa_las_mandarinas", "Las Mandarinas (Brandsen)", "LMA", "Brandsen", 2000, "#f5d000", "#111111", 21],
  ["tpa_el_chasqui", "El Chasqui", "CHA", "Buenos Aires", 1500, "#1d7a3a", "#ffffff", 20],
]);

type BrasileiraoSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  featured?: boolean,
];

function brasileiraoClub(row: BrasileiraoSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, featured] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "brasileirao",
    prestige,
    featured: featured || undefined,
    country: "BRA",
    crest: crestUrl(id),
    // Cada club trae por ahora UN jugador cargado a mano (ver STARS en names.ts); el motor completa el resto de la
    // plantilla con jugadores generados al nivel de la liga. Compra, vende y cede en el mercado como cualquier club real.
    provisional: true,
  };
}

/**
 * Brasileirão Série A 2026 — 20 clubes. Descendieron a la Série B: Ceará, Fortaleza, Juventude y Sport. Ascendieron:
 * Coritiba, Athletico Paranaense, Chapecoense y Remo. Los ids de los 16 clubes que ya existían como rellenos de la
 * Libertadores (brfla, brpal…) se conservan; Mirassol, Coritiba, Chapecoense y Remo son nuevos. Estadios, colores y
 * prestigio son aproximados. La Série B ya existe como liga propia (ver BRASILEIRAO_B_CLUBS), pero todavía sin ascensos
 * ni descensos con la Série A: la liga se mantiene con los mismos 20 clubes.
 */
export const BRASILEIRAO_CLUBS: Club[] = (
  [
    ["brfla", "Flamengo", "FLA", "Río de Janeiro", "Maracanã", 78838, "#c8102e", "#111111", 86, true],
    ["brpal", "Palmeiras", "PAL", "São Paulo", "Allianz Parque", 43713, "#006437", "#ffffff", 86],
    ["brbot", "Botafogo", "BOT", "Río de Janeiro", "Nilton Santos", 46931, "#111111", "#ffffff", 82],
    ["brflu", "Fluminense", "FLU", "Río de Janeiro", "Maracanã", 78838, "#8b1a3a", "#1d7a3a", 80],
    ["brcor", "Corinthians", "COR", "São Paulo", "Neo Química Arena", 49205, "#111111", "#ffffff", 80],
    ["brsao", "São Paulo", "SAO", "São Paulo", "Morumbi", 66795, "#c8102e", "#111111", 80],
    ["bratm", "Atlético Mineiro", "CAM", "Belo Horizonte", "Arena MRV", 46000, "#111111", "#ffffff", 80],
    ["brcru", "Cruzeiro", "CRU", "Belo Horizonte", "Mineirão", 61846, "#1a3a8a", "#ffffff", 78],
    ["brgre", "Grêmio", "GRE", "Porto Alegre", "Arena do Grêmio", 55662, "#2a7fc1", "#111111", 79],
    ["brint", "Internacional", "INT", "Porto Alegre", "Beira-Rio", 50128, "#c8102e", "#ffffff", 79],
    ["brbah", "Bahia", "BAH", "Salvador", "Arena Fonte Nova", 47907, "#1a3a8a", "#c8102e", 77],
    ["brsan", "Santos", "SAN", "Santos", "Vila Belmiro", 20360, "#ffffff", "#111111", 76],
    ["brvas", "Vasco da Gama", "VAS", "Río de Janeiro", "São Januário", 21880, "#111111", "#ffffff", 76],
    ["brath", "Athletico Paranaense", "CAP", "Curitiba", "Ligga Arena", 42372, "#c8102e", "#111111", 76],
    ["brbra", "Red Bull Bragantino", "RBB", "Bragança Paulista", "Nabi Abi Chedid", 17128, "#ffffff", "#c8102e", 72],
    ["brvit", "Vitória", "VIT", "Salvador", "Barradão", 30618, "#c8102e", "#111111", 70],
    ["brmir", "Mirassol", "MIR", "Mirassol", "José Maria de Campos Maia", 15000, "#f5d000", "#1d7a3a", 66],
    ["brcrb", "Coritiba", "CFC", "Curitiba", "Couto Pereira", 38807, "#1d7a3a", "#ffffff", 66],
    ["brcha", "Chapecoense", "CHA", "Chapecó", "Arena Condá", 20089, "#1d7a3a", "#ffffff", 62],
    ["brrem", "Remo", "REM", "Belém", "Mangueirão", 53645, "#1a3a8a", "#ffffff", 62],
  ] satisfies BrasileiraoSeed[]
).map(brasileiraoClub);

/** Club de la Série B: mismo molde que el de la Série A, pero en la 2.ª división brasileña. */
function brasileiraoBClub(row: BrasileiraoSeed): Club {
  return { ...brasileiraoClub(row), league: "brasileiraoB" as const };
}

/**
 * Brasileirão Série B 2026 — 20 clubes (segunda división de Brasil). Son los 4 descendidos de la Série A 2025 (Ceará,
 * Fortaleza, Juventude y Sport) y los 16 que quedaron en la Série B. Los ids llevan el prefijo `bb_` (como `pn_` en la
 * Primera Nacional y `l2_` en la Ligue 2) para no chocar con los de la Série A (`br…`) ni con los de ninguna otra liga.
 * Estadios, colores y prestigio son aproximados. El prestigio va de 50 a 67: los grandes (Fortaleza, Ceará, Sport) quedan
 * apenas por encima del último de la Série A, pero con un presupuesto muy inferior (ver {@link startingBudget}).
 * Todavía no hay ascensos ni descensos ni Copa do Brasil para esta liga.
 */
export const BRASILEIRAO_B_CLUBS: Club[] = (
  [
    ["bb_for", "Fortaleza", "FOR", "Fortaleza", "Arena Castelão", 63903, "#1a3a8a", "#c8102e", 67],
    ["bb_cea", "Ceará", "CEA", "Fortaleza", "Arena Castelão", 63903, "#111111", "#ffffff", 66],
    ["bb_spo", "Sport", "SPT", "Recife", "Ilha do Retiro", 26418, "#c8102e", "#111111", 64],
    ["bb_goi", "Goiás", "GOI", "Goiânia", "Estádio da Serrinha", 14450, "#1d7a3a", "#ffffff", 61],
    ["bb_juv", "Juventude", "JUV", "Caxias do Sul", "Alfredo Jaconi", 19924, "#1d7a3a", "#ffffff", 60],
    ["bb_cri", "Criciúma", "CRI", "Criciúma", "Heriberto Hülse", 19300, "#f5d000", "#111111", 58],
    ["bb_pon", "Ponte Preta", "PON", "Campinas", "Moisés Lucarelli", 17728, "#111111", "#ffffff", 58],
    ["bb_nau", "Náutico", "NAU", "Recife", "Eládio de Barros Carvalho (Aflitos)", 19800, "#c8102e", "#ffffff", 58],
    ["bb_ava", "Avaí", "AVA", "Florianópolis", "Ressacada", 17800, "#1a6fb8", "#ffffff", 57],
    ["bb_ame", "América-MG", "AME", "Belo Horizonte", "Independência", 23018, "#1d7a3a", "#111111", 57],
    ["bb_crb", "CRB", "CRB", "Maceió", "Rei Pelé", 17126, "#c8102e", "#ffffff", 57],
    ["bb_cui", "Cuiabá", "CUI", "Cuiabá", "Arena Pantanal", 44097, "#1d7a3a", "#f5d000", 56],
    ["bb_vno", "Vila Nova", "VNO", "Goiânia", "Onésio Brasileiro Alvarenga", 11788, "#c8102e", "#ffffff", 56],
    ["bb_acg", "Atlético-GO", "ACG", "Goiânia", "Antônio Accioly", 12500, "#c8102e", "#111111", 55],
    ["bb_nov", "Novorizontino", "NOV", "Novo Horizonte", "Jorge Ismael de Biasi", 16000, "#f5d000", "#111111", 54],
    ["bb_bsp", "Botafogo-SP", "BSP", "Ribeirão Preto", "Santa Cruz", 29292, "#c8102e", "#111111", 53],
    ["bb_ope", "Operário-PR", "OPE", "Ponta Grossa", "Germano Krüger", 10632, "#111111", "#ffffff", 52],
    ["bb_sbe", "São Bernardo", "SBE", "São Bernardo do Campo", "Primeiro de Maio", 15159, "#f5d000", "#111111", 51],
    ["bb_lon", "Londrina", "LON", "Londrina", "Estádio do Café", 31000, "#1a6fb8", "#ffffff", 50],
    ["bb_atc", "Athletic-MG", "ATC", "São João del-Rei", "Joaquim Portugal", 8500, "#111111", "#ffffff", 50],
  ] satisfies BrasileiraoSeed[]
).map(brasileiraoBClub);
export const BRASILEIRAO_B_IDS = BRASILEIRAO_B_CLUBS.map((c) => c.id);

function brasileiraoCClub(row: BrasileiraoSeed): Club {
  return { ...brasileiraoClub(row), league: "brasileiraoC" as const };
}

/** Série C seleccionable: los estadios y prestigios son datos aproximados para el juego. */
export const BRASILEIRAO_C_CLUBS: Club[] = (
  [
    ["bc_amz", "Amazonas FC", "AMZ", "Manaus, Amazonas", "Arena da Amazônia", 44300, "#f0c419", "#111111", 55],
    ["bc_ana", "Anápolis", "ANA", "Anápolis, Goiás", "Estádio Jonas Duarte", 20000, "#111111", "#ffffff", 48],
    ["bc_bar", "Barra FC", "BAR", "Itajaí, Santa Catarina", "Arena Barra FC", 5500, "#1a3a8a", "#ffffff", 45],
    ["bc_bpb", "Botafogo-PB", "BPB", "João Pessoa, Paraíba", "Estádio Almeidão", 25770, "#111111", "#ffffff", 54],
    ["bc_bru", "Brusque", "BRU", "Brusque, Santa Catarina", "Estádio Augusto Bauer", 5000, "#c8102e", "#ffffff", 53],
    ["bc_cax", "Caxias", "CAX", "Caxias do Sul, Rio Grande do Sul", "Estádio Centenário", 22132, "#c8102e", "#ffffff", 53],
    ["bc_con", "Confiança", "CON", "Aracaju, Sergipe", "Estádio Batistão", 15575, "#1a3a8a", "#ffffff", 50],
    ["bc_fer", "Ferroviária", "FER", "Araraquara, São Paulo", "Arena Fonte Luminosa", 20000, "#c8102e", "#111111", 53],
    ["bc_fig", "Figueirense", "FIG", "Florianópolis, Santa Catarina", "Estádio Orlando Scarpelli", 19584, "#111111", "#ffffff", 55],
    ["bc_flo", "Floresta", "FLO", "Fortaleza, Ceará", "Estádio Domingão", 20000, "#1d7a3a", "#ffffff", 45],
    ["bc_gua", "Guarani", "GUA", "Campinas, São Paulo", "Estádio Brinco de Ouro", 29130, "#1d7a3a", "#ffffff", 57],
    ["bc_ild", "Inter de Limeira", "IDL", "Limeira, São Paulo", "Estádio Major José Levy Sobrinho", 18000, "#111111", "#ffffff", 49],
    ["bc_ita", "Itabaiana", "ITA", "Itabaiana, Sergipe", "Estádio Etelvino Mendonça", 10000, "#c8102e", "#ffffff", 48],
    ["bc_itu", "Ituano", "ITU", "Itu, São Paulo", "Estádio Novelli Júnior", 18560, "#c8102e", "#111111", 55],
    ["bc_mha", "Maranhão", "MHA", "São Luís, Maranhão", "Estádio Castelão", 40000, "#111111", "#ffffff", 49],
    ["bc_mfc", "Maringá FC", "MFC", "Maringá, Paraná", "Estádio Willie Davids", 21600, "#111111", "#ffffff", 50],
    ["bc_pay", "Paysandu", "PAY", "Belém, Pará", "Estádio da Curuzu", 16200, "#1a3a8a", "#ffffff", 56],
    ["bc_scr", "Santa Cruz", "SCR", "Recife, Pernambuco", "Estádio do Arruda", 60044, "#c8102e", "#111111", 56],
    ["bc_vre", "Volta Redonda", "VRE", "Volta Redonda, Rio de Janeiro", "Estádio Raulino de Oliveira", 18000, "#f5d000", "#111111", 54],
    ["bc_ypi", "Ypiranga", "YPI", "Erechim, Rio Grande do Sul", "Estádio Colosso da Lagoa", 22000, "#1d7a3a", "#ffffff", 49],
  ] satisfies BrasileiraoSeed[]
).map(brasileiraoCClub);
export const BRASILEIRAO_C_IDS = BRASILEIRAO_C_CLUBS.map((c) => c.id);

type PrimeiraSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  featured?: boolean,
];

function primeiraClub(row: PrimeiraSeed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, featured] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league: "primeira",
    prestige,
    featured: featured || undefined,
    country: "POR",
    crest: crestUrl(id),
    // Cada club trae UN jugador real cargado a mano (ver STARS en names.ts); el motor completa el resto de la plantilla
    // (~25) con jugadores generados al nivel de la liga. Compra, vende y cede en el mercado como cualquier club real.
    provisional: true,
  };
}

/**
 * Primeira Liga 2026/27 (Liga Portugal Betclic) — 18 clubes (verificado al 8/10/2026). Descendieron a la Liga Portugal 2
 * Tondela y AVS; ascendieron Marítimo y Académico de Viseu. Los ids llevan el prefijo `pt_` para no chocar con los de
 * ninguna otra liga (ni con los clubes ficticios portugueses de relleno de las copas europeas). Estadios y capacidades
 * según la lista oficial de participantes; colores y prestigio son aproximados. Casa Pia juega de local en Rio Maior
 * porque el Pina Manique no cumple los requisitos. Ascensos y descensos con la Liga Portugal 2: ver divisions.ts.
 * Copas: Taça de Portugal, Taça da Liga y Supertaça (ver world.ts y season.ts).
 */
export const PRIMEIRA_CLUBS: Club[] = (
  [
    ["pt_ben", "SL Benfica", "BEN", "Lisboa", "Estádio da Luz", 68100, "#e30613", "#ffffff", 83, true],
    ["pt_spo", "Sporting CP", "SCP", "Lisboa", "Estádio José Alvalade", 52095, "#00844a", "#ffffff", 83, true],
    ["pt_por", "FC Porto", "POR", "Oporto", "Estádio do Dragão", 50033, "#003e7e", "#ffffff", 82, true],
    ["pt_bra", "SC Braga", "BRA", "Braga", "Estádio Municipal de Braga", 30286, "#d0112b", "#ffffff", 76],
    ["pt_vit", "Vitória de Guimarães", "VSC", "Guimarães", "Estádio D. Afonso Henriques", 30029, "#ffffff", "#111111", 71],
    ["pt_fam", "FC Famalicão", "FAM", "Vila Nova de Famalicão", "Estádio Municipal de Famalicão", 5186, "#1f4e9c", "#ffffff", 68],
    ["pt_gil", "Gil Vicente", "GIL", "Barcelos", "Estádio Cidade de Barcelos", 12046, "#c8102e", "#1a3a8a", 66],
    ["pt_aro", "FC Arouca", "ARO", "Arouca", "Estádio Municipal de Arouca", 5000, "#f5d000", "#1d4aa3", 64],
    ["pt_est", "Estoril Praia", "EST", "Estoril", "Estádio António Coimbra da Mota", 5094, "#f5d000", "#1a3a8a", 64],
    ["pt_mor", "Moreirense", "MOR", "Guimarães", "Estádio Comendador Joaquim de Almeida Freitas", 6150, "#006b3f", "#ffffff", 63],
    ["pt_rio", "Rio Ave", "RAV", "Vila do Conde", "Estádio dos Arcos", 5300, "#00824a", "#ffffff", 62],
    ["pt_scl", "Santa Clara", "SCL", "Ponta Delgada", "Estádio de São Miguel", 12500, "#c8102e", "#ffffff", 62],
    ["pt_cas", "Casa Pia", "CPA", "Lisboa", "Estádio Municipal de Rio Maior", 7000, "#111111", "#ffffff", 61],
    ["pt_ama", "Estrela da Amadora", "AMA", "Amadora", "Estádio José Gomes", 9288, "#c8102e", "#00844a", 60],
    ["pt_nac", "CD Nacional", "NAC", "Funchal", "Estádio da Madeira", 5200, "#111111", "#ffffff", 60],
    ["pt_alv", "FC Alverca", "ALV", "Alverca do Ribatejo", "Complexo Desportivo FC Alverca", 6932, "#c8102e", "#ffffff", 59],
    ["pt_mar", "CS Marítimo", "MAR", "Funchal", "Estádio do Marítimo", 10600, "#c8102e", "#00844a", 59],
    ["pt_via", "Académico de Viseu", "AVI", "Viseu", "Estádio Municipal do Fontelo", 6912, "#0b7a3b", "#ffffff", 54],
  ] satisfies PrimeiraSeed[]
).map(primeiraClub);
export const PRIMEIRA_IDS = PRIMEIRA_CLUBS.map((c) => c.id);

function primeira2Club(row: PrimeiraSeed): Club {
  return { ...primeiraClub(row), league: "primeira2" };
}

/**
 * Liga Portugal 2 2026/27 (Liga Portugal 2 Meu Super) — 18 clubes según la lista oficial de participantes: descendieron de la
 * Primeira Liga Tondela y AFS; ascendieron de la Liga 3 Amarante y Académica. Los ids llevan el prefijo `pt2_` para no
 * chocar con los de la Primeira (`pt_`) ni con ningún otro club. Estadios y capacidades según la lista oficial; colores y
 * prestigio son aproximados. Sin tercera división jugable (la Liga 3 no existe en el juego): nadie baja de esta liga.
 */
export const PRIMEIRA2_CLUBS: Club[] = (
  [
    ["pt2_ton", "CD Tondela", "TON", "Tondela", "Estádio João Cardoso", 5000, "#0b7a3b", "#f5d000", 58],
    ["pt2_afs", "AFS", "AFS", "Vila das Aves", "Estádio do Clube Desportivo das Aves", 6230, "#00a650", "#ffffff", 56],
    ["pt2_aca", "Académica de Coimbra", "ACA", "Coimbra", "Estádio Cidade de Coimbra", 29622, "#111111", "#ffffff", 55],
    ["pt2_viz", "FC Vizela", "VIZ", "Vizela", "Estádio do Futebol Clube de Vizela", 6000, "#c8102e", "#ffffff", 55],
    ["pt2_far", "SC Farense", "FAR", "Faro", "Estádio de São Luís", 7000, "#111111", "#ffffff", 54],
    ["pt2_lei", "União de Leiria", "UDL", "Leiria", "Estádio Dr. Magalhães Pessoa", 23888, "#1d4aa3", "#ffffff", 54],
    ["pt2_por", "Portimonense", "POT", "Portimão", "Estádio Municipal de Portimão", 4961, "#111111", "#ffffff", 53],
    ["pt2_lex", "Leixões", "LEX", "Matosinhos", "Estádio do Mar", 6000, "#c8102e", "#ffffff", 52],
    ["pt2_ben", "Benfica B", "BEB", "Seixal", "Benfica Campus - Campo n.º 1", 2644, "#e30613", "#ffffff", 50],
    ["pt2_cha", "GD Chaves", "CHA", "Chaves", "Estádio Municipal Eng.º Manuel Branco Teixeira", 8400, "#1d4aa3", "#ffffff", 50],
    ["pt2_tor", "SC Torreense", "TOR", "Torres Vedras", "Estádio Manuel Marques", 2431, "#c8102e", "#ffffff", 50],
    ["pt2_fei", "CD Feirense", "FEI", "Santa Maria da Feira", "Estádio Marcolino Castro", 5401, "#1d4aa3", "#ffffff", 49],
    ["pt2_pob", "FC Porto B", "POB", "Vila Nova de Gaia", "Estádio Luís Filipe Menezes", 3800, "#003e7e", "#ffffff", 49],
    ["pt2_spb", "Sporting CP B", "SPB", "Alcochete", "Estádio Aurélio Pereira", 1180, "#00844a", "#ffffff", 49],
    ["pt2_pen", "FC Penafiel", "PEN", "Penafiel", "Estádio Municipal 25 de Abril", 5230, "#1a3a8a", "#ffffff", 48],
    ["pt2_fel", "Felgueiras 1932", "FEL", "Felgueiras", "Estádio Dr. Machado de Matos", 7540, "#c8102e", "#ffffff", 47],
    ["pt2_lus", "Lusitânia de Lourosa", "LUS", "Lourosa", "Estádio do Lusitânia de Lourosa FC", 4900, "#c8102e", "#ffffff", 47],
    ["pt2_ama", "Amarante FC", "AMA", "Amarante", "Estádio Municipal de Amarante", 5000, "#c8102e", "#ffffff", 46],
  ] satisfies PrimeiraSeed[]
).map(primeira2Club);
export const PRIMEIRA2_IDS = PRIMEIRA2_CLUBS.map((c) => c.id);

/**
 * EFL League One 2026/27 (3.ª división inglesa): 24 clubes (confirmados al cierre del playoff de League Two, mayo de 2026).
 * Descendidos de la Championship: Leicester City, Sheffield Wednesday y Oxford United. Ascendidos de la League Two:
 * Bromley, MK Dons, Cambridge United y Notts County. Cada club trae un solo jugador real (ver STARS en names.ts) y el resto
 * de la plantilla (25 en total) se genera al nivel de la división. Ids con prefijo `l1_`: no chocan con ningún otro club.
 * Todavía no hay ascensos ni descensos con la Championship: los clubes de la League One no están en DIVISION_KINDS.
 */
type LeagueOneSeed = PremierSeed;
export const LEAGUE_ONE_CLUBS: Club[] = (
  [
    ["l1_lei", "Leicester City", "LEI", "Leicester", "King Power Stadium", 32261, "#003090", "#fdbe11", 58],
    ["l1_shw", "Sheffield Wednesday", "SHW", "Sheffield", "Hillsborough", 39732, "#0e4eaa", "#ffffff", 54],
    ["l1_lut", "Luton Town", "LUT", "Luton", "Kenilworth Road", 12000, "#f78f1e", "#002d62", 54],
    ["l1_oxf", "Oxford United", "OXF", "Oxford", "Kassam Stadium", 12500, "#fdd835", "#002147", 52],
    ["l1_hud", "Huddersfield Town", "HUD", "Huddersfield", "Accu Stadium", 24121, "#0e63ad", "#ffffff", 50],
    ["l1_rea", "Reading", "REA", "Reading", "Select Car Leasing Stadium", 24161, "#004494", "#ffffff", 50],
    ["l1_ply", "Plymouth Argyle", "PLY", "Plymouth", "Home Park", 17900, "#0b5a2b", "#ffffff", 49],
    ["l1_wig", "Wigan Athletic", "WIG", "Wigan", "Brick Community Stadium", 25138, "#1d59af", "#ffffff", 48],
    ["l1_bra", "Bradford City", "BRA", "Bradford", "Valley Parade", 25136, "#7a0026", "#f2b705", 48],
    ["l1_bar", "Barnsley", "BAR", "Barnsley", "Oakwell", 23287, "#d71920", "#ffffff", 47],
    ["l1_bla", "Blackpool", "BLA", "Blackpool", "Bloomfield Road", 16616, "#f58220", "#ffffff", 46],
    ["l1_pet", "Peterborough United", "PET", "Peterborough", "Weston Homes Stadium", 15314, "#0055a5", "#ffffff", 46],
    ["l1_stk", "Stockport County", "STK", "Stockport", "Edgeley Park", 10852, "#0055a5", "#ffffff", 46],
    ["l1_not", "Notts County", "NTC", "Nottingham", "Meadow Lane", 19841, "#111111", "#ffffff", 45],
    ["l1_man", "Mansfield Town", "MAN", "Mansfield", "One Call Stadium", 9186, "#fdb913", "#0b4aa6", 44],
    ["l1_ori", "Leyton Orient", "ORI", "Londres", "Brisbane Road", 9271, "#d71920", "#ffffff", 44],
    ["l1_wyc", "Wycombe Wanderers", "WYC", "High Wycombe", "Adams Park", 9448, "#78bde5", "#1c2a5a", 44],
    ["l1_don", "Doncaster Rovers", "DON", "Doncaster", "Eco-Power Stadium", 15231, "#d71920", "#ffffff", 43],
    ["l1_mkd", "MK Dons", "MKD", "Milton Keynes", "Stadium MK", 30500, "#ffffff", "#d71920", 43],
    ["l1_ste", "Stevenage", "STE", "Stevenage", "Broadhall Way", 7100, "#d71920", "#ffffff", 42],
    ["l1_bur", "Burton Albion", "BUR", "Burton upon Trent", "Pirelli Stadium", 6912, "#fdd835", "#111111", 42],
    ["l1_cam", "Cambridge United", "CAM", "Cambridge", "Abbey Stadium", 8127, "#f9b100", "#111111", 41],
    ["l1_wim", "AFC Wimbledon", "WIM", "Londres", "Plough Lane", 9215, "#0033a0", "#ffd400", 41],
    ["l1_brm", "Bromley", "BRM", "Londres", "Hayes Lane", 5000, "#111111", "#ffffff", 38],
  ] satisfies LeagueOneSeed[]
).map((row) => {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return { id, name, short, city, stadium, capacity, color, color2, league: "leagueOne" as const, prestige, crest: crestUrl(id), provisional: true };
});
export const LEAGUE_ONE_IDS = LEAGUE_ONE_CLUBS.map((c) => c.id);

type EredivisieSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

/** Eredivisie 2026/27: participantes confirmados al inicio de la temporada. */
const EREDIVISIE_CLUBS: Club[] = ([
  ["nl_aja", "Ajax", "AJX", "Ámsterdam", "Johan Cruyff Arena", 55865, "#d2122e", "#ffffff", 83],
  ["nl_psv", "PSV Eindhoven", "PSV", "Eindhoven", "Philips Stadion", 35000, "#ed1c24", "#ffffff", 82],
  ["nl_fey", "Feyenoord", "FEY", "Róterdam", "De Kuip", 47500, "#e30613", "#ffffff", 82],
  ["nl_twe", "FC Twente", "TWE", "Enschede", "De Grolsch Veste", 30205, "#e30613", "#ffffff", 75],
  ["nl_az", "AZ Alkmaar", "AZ", "Alkmaar", "AFAS Stadion", 19478, "#d71920", "#ffffff", 75],
  ["nl_utr", "FC Utrecht", "UTR", "Utrecht", "Stadion Galgenwaard", 23750, "#d71920", "#ffffff", 73],
  ["nl_nec", "NEC Nijmegen", "NEC", "Nimega", "Goffertstadion", 12500, "#d71920", "#111111", 70],
  ["nl_gae", "Go Ahead Eagles", "GAE", "Deventer", "De Adelaarshorst", 10000, "#d71920", "#f5d000", 67],
  ["nl_spa", "Sparta Rotterdam", "SPA", "Róterdam", "Sparta Stadion Het Kasteel", 11026, "#d71920", "#ffffff", 66],
  ["nl_hee", "SC Heerenveen", "HEE", "Heerenveen", "Abe Lenstra Stadion", 26100, "#0051a5", "#ffffff", 66],
  ["nl_for", "Fortuna Sittard", "FOR", "Sittard", "Fortuna Sittard Stadion", 12500, "#00843d", "#f5d000", 62],
  ["nl_pec", "PEC Zwolle", "PEC", "Zwolle", "MAC³PARK Stadion", 14000, "#0055a4", "#ffffff", 61],
  ["nl_gro", "FC Groningen", "GRO", "Groninga", "Euroborg", 22550, "#00843d", "#ffffff", 63],
  ["nl_exc", "Excelsior Rotterdam", "EXC", "Róterdam", "Van Donge & De Roo Stadion", 4500, "#111111", "#d71920", 58],
  ["nl_tel", "Telstar", "TEL", "Velsen-Zuid", "Buko Stadion", 5300, "#ffffff", "#d71920", 56],
  ["nl_wil", "Willem II", "WIL", "Tilburgo", "Koning Willem II Stadion", 14700, "#d71920", "#ffffff", 61],
  ["nl_ado", "ADO Den Haag", "ADO", "La Haya", "Werktalent Stadion", 15000, "#00843d", "#f5d000", 64],
  ["nl_cam", "SC Cambuur", "CAM", "Leeuwarden", "Kooi Stadion", 15000, "#f5d000", "#111111", 62],
 ] satisfies EredivisieSeed[]).map(([id, name, short, city, stadium, capacity, color, color2, prestige]) => ({
  id,
  name,
  short,
  city,
  stadium,
  capacity,
  color,
  color2,
  league: "eredivisie" as const,
  prestige,
  featured: id === "nl_aja" || id === "nl_psv" || id === "nl_fey" || undefined,
  country: "NED",
  crest: crestUrl(id),
  provisional: true,
}));

type DutchClubSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function dutchClub(row: DutchClubSeed, league: "eersteDivisie" | "tweedeDivisie"): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league,
    prestige,
    country: "NED",
    crest: crestUrl(id),
    provisional: true,
  };
}

/** Eerste Divisie 2026/27: equipos indicados por el usuario; los cuatro Jong no pueden ascender. */
const EERSTE_DIVISIE_CLUBS: Club[] = ([
  ["nl1_her", "Heracles Almelo", "HER", "Almelo", "Asito Stadion", 12500, "#111111", "#ffffff", 62],
  ["nl1_nac", "NAC Breda", "NAC", "Breda", "Rat Verlegh Stadion", 19900, "#f4d21f", "#111111", 62],
  ["nl1_vol", "FC Volendam", "VOL", "Volendam", "Kras Stadion", 7384, "#f58220", "#111111", 61],
  ["nl1_dor", "FC Dordrecht", "DOR", "Dordrecht", "M-Scores Stadion", 4100, "#006f42", "#ffffff", 51],
  ["nl1_mvv", "MVV Maastricht", "MVV", "Maastricht", "De Geusselt", 10000, "#e30613", "#ffffff", 51],
  ["nl1_rod", "Roda JC Kerkrade", "ROD", "Kerkrade", "Parkstad Limburg Stadion", 19979, "#f1c40f", "#111111", 58],
  ["nl1_gra", "De Graafschap", "GRA", "Doetinchem", "De Vijverberg", 12600, "#00529b", "#ffffff", 59],
  ["nl1_ein", "FC Eindhoven", "EIN", "Eindhoven", "Jan Louwers Stadion", 4600, "#0055a4", "#ffffff", 52],
  ["nl1_emm", "FC Emmen", "EMM", "Emmen", "De Oude Meerdijk", 8600, "#d71920", "#ffffff", 58],
  ["nl1_oss", "TOP Oss", "OSS", "Oss", "Frans Heesen Stadion", 4700, "#d71920", "#ffffff", 48],
  ["nl1_rkc", "RKC Waalwijk", "RKC", "Waalwijk", "Mandemakers Stadion", 7500, "#f5d000", "#00529b", 60],
  ["nl1_jaj", "Jong Ajax", "JAX", "Amsterdam", "Sportcomplex De Toekomst", 2250, "#d2122e", "#ffffff", 54],
  ["nl1_jps", "Jong PSV", "JPS", "Eindhoven", "De Herdgang", 2500, "#ed1c24", "#ffffff", 54],
  ["nl1_jut", "Jong FC Utrecht", "JUT", "Utrecht", "Sportcomplex Zoudenbalch", 1000, "#d71920", "#ffffff", 49],
  ["nl1_jaz", "Jong AZ", "JAZ", "Wijdewormer", "AFAS Trainingscomplex", 1000, "#d71920", "#ffffff", 53],
  ["nl1_hel", "Helmond Sport", "HEL", "Helmond", "GS Staalwerken Stadion", 4200, "#d71920", "#111111", 50],
  ["nl1_alm", "Almere City FC", "ALM", "Almere", "Yanmar Stadion", 4500, "#d71920", "#ffffff", 57],
  ["nl1_db", "FC Den Bosch", "DBO", "’s-Hertogenbosch", "Stadion De Vliert", 9000, "#00529b", "#ffffff", 50],
  ["nl1_vvv", "VVV-Venlo", "VVV", "Venlo", "Covebo Stadion - De Koel", 8000, "#ffdf00", "#111111", 55],
  ["nl1_vit", "Vitesse", "VIT", "Arnhem", "GelreDome", 25000, "#f5a623", "#111111", 58],
] satisfies DutchClubSeed[]).map((row) => dutchClub(row, "eersteDivisie"));

/** Tweede Divisie 2026/27: participantes suministrados por el usuario. */
const TWEEDE_DIVISIE_CLUBS: Club[] = ([
  ["nl2_qb", "Quick Boys", "QBO", "Katwijk", "Sportpark Nieuw Zuid", 8500, "#00529b", "#ffffff", 48],
  ["nl2_kb", "Kozakken Boys", "KBO", "Werkendam", "Sportpark De Zwaaier", 4500, "#d71920", "#ffffff", 43],
  ["nl2_dt", "De Treffers", "DTR", "Groesbeek", "Sportpark Zuid", 4000, "#d71920", "#111111", 45],
  ["nl2_hhc", "HHC Hardenberg", "HHC", "Hardenberg", "Sportpark de Boshoek", 4500, "#f58220", "#111111", 44],
  ["nl2_ijv", "IJsselmeervogels", "IJV", "Bunschoten", "Sportpark De Westmaat", 8000, "#d71920", "#ffffff", 47],
  ["nl2_spa", "SV Spakenburg", "SPA", "Bunschoten", "Sportpark De Westmaat", 8000, "#00529b", "#ffffff", 47],
  ["nl2_afc", "AFC Amsterdam", "AFC", "Amsterdam", "Sportpark Goed Genoeg", 4500, "#d71920", "#111111", 46],
  ["nl2_jsp", "Jong Sparta Rotterdam", "JSP", "Rotterdam", "Sportcomplex Nieuw Terbregge", 1500, "#d71920", "#ffffff", 44],
  ["nl2_rkv", "RKAV Volendam", "RKV", "Volendam", "Sportpark Volendam", 2500, "#f58220", "#111111", 42],
  ["nl2_kat", "VV Katwijk", "KAT", "Katwijk", "Sportpark De Krom", 6000, "#f58220", "#111111", 48],
  ["nl2_bar", "BVV Barendrecht", "BAR", "Barendrecht", "Sportpark de Bongerd", 3500, "#d71920", "#ffffff", 41],
  ["nl2_rbb", "Rijnsburgse Boys", "RBB", "Rijnsburg", "Sportpark Middelmors", 6000, "#f5d000", "#111111", 47],
  ["nl2_hoek", "HSV Hoek", "HOE", "Hoek", "Sportpark Denoek", 2500, "#00529b", "#ffffff", 40],
  ["nl2_khf", "Koninklijke HFC", "KHF", "Haarlem", "Sportpark Koninklijke HFC", 3000, "#00529b", "#ffffff", 46],
  ["nl2_klo", "VV Kloetinge", "KLO", "Kloetinge", "Sportpark Wesselopark", 2500, "#00843d", "#ffffff", 39],
  ["nl2_jal", "Jong Almere City FC", "JAL", "Almere", "Yanmar Stadion", 4500, "#d71920", "#ffffff", 40],
  ["nl2_gvv", "GVVV", "GVV", "Veenendaal", "Sportpark Panhuis", 4500, "#00529b", "#ffffff", 45],
  ["nl2_ral", "Rohda Raalte", "ROH", "Raalte", "Sportpark Tijenraan", 2500, "#d71920", "#ffffff", 39],
] satisfies DutchClubSeed[]).map((row) => dutchClub(row, "tweedeDivisie"));

type UsClubSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  conference: "Eastern" | "Western",
];

function usClub(row: UsClubSeed, league: "mls" | "uslChampionship"): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, conference] = row;
  return {
    id, name, short, city, stadium, capacity, color, color2, league, prestige,
    country: "USA", conference, crest: crestUrl(id), provisional: true,
    featured: id === "us_mia" || undefined,
  };
}

/** MLS 2026: 30 clubes, organizados en dos conferencias de 15. */
const MLS_CLUBS: Club[] = ([
  ["us_atl", "Atlanta United", "ATL", "Atlanta", "Mercedes-Benz Stadium", 71000, "#80000a", "#a19060", 75, "Eastern"],
  ["us_aus", "Austin FC", "ATX", "Austin", "Q2 Stadium", 20738, "#00b140", "#111111", 68, "Western"],
  ["us_cfm", "CF Montréal", "MTL", "Montreal", "Stade Saputo", 19619, "#00529b", "#111111", 66, "Eastern"],
  ["us_clt", "Charlotte FC", "CLT", "Charlotte", "Bank of America Stadium", 75412, "#0080c6", "#111111", 69, "Eastern"],
  ["us_chi", "Chicago Fire FC", "CHI", "Chicago", "Soldier Field", 62493, "#e21e2b", "#061922", 70, "Eastern"],
  ["us_col", "Colorado Rapids", "COL", "Commerce City", "Dick's Sporting Goods Park", 18061, "#8b2332", "#91b0d5", 65, "Western"],
  ["us_ccr", "Columbus Crew", "CLB", "Columbus", "Lower.com Field", 20371, "#fedd00", "#111111", 78, "Eastern"],
  ["us_cin", "FC Cincinnati", "CIN", "Cincinnati", "TQL Stadium", 26000, "#f05323", "#263b7a", 77, "Eastern"],
  ["us_dal", "FC Dallas", "DAL", "Frisco", "Toyota Stadium", 19096, "#d11241", "#00205b", 69, "Western"],
  ["us_dcu", "D.C. United", "DCU", "Washington", "Audi Field", 20000, "#e51937", "#111111", 70, "Eastern"],
  ["us_hou", "Houston Dynamo FC", "HOU", "Houston", "Shell Energy Stadium", 22039, "#f68712", "#101820", 71, "Western"],
  ["us_mia", "Inter Miami CF", "MIA", "Fort Lauderdale", "Chase Stadium", 21550, "#f7b5cd", "#231f20", 82, "Eastern"],
  ["us_laf", "Los Angeles FC", "LAFC", "Los Ángeles", "BMO Stadium", 22000, "#111111", "#c39e6d", 83, "Western"],
  ["us_lag", "LA Galaxy", "LA", "Carson", "Dignity Health Sports Park", 27000, "#00245d", "#ffd200", 81, "Western"],
  ["us_mnu", "Minnesota United FC", "MIN", "Saint Paul", "Allianz Field", 19400, "#8cd2f4", "#231f20", 73, "Western"],
  ["us_nsh", "Nashville SC", "NSH", "Nashville", "GEODIS Park", 30000, "#f5e500", "#1b1b1b", 73, "Eastern"],
  ["us_ne", "New England Revolution", "NE", "Foxborough", "Gillette Stadium", 65878, "#0c2340", "#c8102e", 71, "Eastern"],
  ["us_nyc", "New York City FC", "NYC", "Nueva York", "Yankee Stadium", 47309, "#6cace4", "#f15524", 77, "Eastern"],
  ["us_nyr", "New York Red Bulls", "NYRB", "Harrison", "Sports Illustrated Stadium", 25000, "#ed1e36", "#001b5d", 75, "Eastern"],
  ["us_orl", "Orlando City SC", "ORL", "Orlando", "Inter&Co Stadium", 25500, "#633492", "#f7b718", 75, "Eastern"],
  ["us_phi", "Philadelphia Union", "PHI", "Chester", "Subaru Park", 18500, "#071d49", "#b18500", 78, "Eastern"],
  ["us_por", "Portland Timbers", "POR", "Portland", "Providence Park", 25000, "#004812", "#d6a14a", 77, "Western"],
  ["us_rsl", "Real Salt Lake", "RSL", "Sandy", "America First Field", 20213, "#b30838", "#013a81", 71, "Western"],
  ["us_sdf", "San Diego FC", "SD", "San Diego", "Snapdragon Stadium", 35000, "#182b4d", "#c9a86a", 74, "Western"],
  ["us_sje", "San Jose Earthquakes", "SJ", "San José", "PayPal Park", 18000, "#0067b1", "#111111", 70, "Western"],
  ["us_sea", "Seattle Sounders FC", "SEA", "Seattle", "Lumen Field", 37722, "#5d9741", "#005595", 80, "Western"],
  ["us_skc", "Sporting Kansas City", "SKC", "Kansas City", "Children's Mercy Park", 18467, "#a0d7e7", "#111111", 72, "Western"],
  ["us_stl", "St. Louis City SC", "STL", "St. Louis", "CITYPARK", 22500, "#d22630", "#f2f0eb", 70, "Western"],
  ["us_tor", "Toronto FC", "TOR", "Toronto", "BMO Field", 30991, "#e31837", "#111111", 72, "Eastern"],
  ["us_van", "Vancouver Whitecaps FC", "VAN", "Vancouver", "BC Place", 22120, "#00245e", "#ffffff", 75, "Western"],
] satisfies UsClubSeed[]).map((row) => usClub(row, "mls"));

/** USL Championship 2026: 25 clubes; liga independiente, sin ascensos ni descensos con MLS. */
const USL_CHAMPIONSHIP_CLUBS: Club[] = ([
  ["usl_bhm", "Birmingham Legion FC", "BHM", "Birmingham", "Protective Stadium", 47000, "#e31837", "#111111", 54, "Eastern"],
  ["usl_bkn", "Brooklyn FC", "BKN", "Brooklyn", "Maimonides Park", 7000, "#111111", "#ffffff", 53, "Eastern"],
  ["usl_chs", "Charleston Battery", "CHS", "Charleston", "Patriots Point", 5000, "#f2c300", "#111111", 59, "Eastern"],
  ["usl_det", "Detroit City FC", "DET", "Detroit", "Keyworth Stadium", 7500, "#d71920", "#111111", 57, "Eastern"],
  ["usl_hfd", "Hartford Athletic", "HFD", "Hartford", "Trinity Health Stadium", 5500, "#00843d", "#ffffff", 50, "Eastern"],
  ["usl_ind", "Indy Eleven", "IND", "Indianapolis", "Michael A. Carroll Stadium", 12500, "#111111", "#b79a5b", 54, "Eastern"],
  ["usl_lex", "Lexington SC", "LEX", "Lexington", "Toyota Stadium", 7500, "#f2c300", "#111111", 48, "Western"],
  ["usl_lou", "Louisville City FC", "LOU", "Louisville", "Lynn Family Stadium", 15000, "#74232d", "#111111", 62, "Eastern"],
  ["usl_ldn", "Loudoun United FC", "LDN", "Leesburg", "Segra Field", 5000, "#e31837", "#111111", 49, "Eastern"],
  ["usl_mia", "Miami FC", "MFC", "Miami", "FIU Stadium", 20000, "#00529b", "#f2c300", 50, "Eastern"],
  ["usl_pit", "Pittsburgh Riverhounds SC", "PIT", "Pittsburgh", "Highmark Stadium", 5000, "#111111", "#f2c300", 61, "Eastern"],
  ["usl_rif", "Rhode Island FC", "RIFC", "Pawtucket", "Centreville Bank Stadium", 10000, "#79bce8", "#f2c300", 52, "Eastern"],
  ["usl_tbr", "Tampa Bay Rowdies", "TBR", "St. Petersburg", "Al Lang Stadium", 7500, "#006b3f", "#f2c300", 57, "Eastern"],
  ["usl_jax", "Sporting Club Jacksonville", "JAX", "Jacksonville", "Hodges Stadium", 12000, "#111111", "#f2c300", 47, "Eastern"],
  ["usl_cos", "Colorado Springs Switchbacks FC", "COS", "Colorado Springs", "Weidner Field", 8000, "#111111", "#c8102e", 55, "Western"],
  ["usl_elp", "El Paso Locomotive FC", "ELP", "El Paso", "Southwest University Park", 9500, "#111111", "#d71920", 53, "Western"],
  ["usl_lv", "Las Vegas Lights FC", "LV", "Las Vegas", "Cashman Field", 9000, "#f2c300", "#111111", 50, "Western"],
  ["usl_mbay", "Monterey Bay FC", "MB", "Seaside", "Cardinale Stadium", 6000, "#003b5c", "#e57200", 51, "Western"],
  ["usl_nm", "New Mexico United", "NMU", "Albuquerque", "Isotopes Park", 13000, "#111111", "#f2c300", 58, "Western"],
  ["usl_oak", "Oakland Roots SC", "OAK", "Oakland", "Oakland Coliseum", 63000, "#111111", "#f2c300", 54, "Western"],
  ["usl_ocs", "Orange County SC", "OC", "Irvine", "Championship Soccer Stadium", 5000, "#111111", "#e57200", 53, "Western"],
  ["usl_phx", "Phoenix Rising FC", "PHX", "Phoenix", "Phoenix Rising Stadium", 10000, "#c8102e", "#111111", 57, "Western"],
  ["usl_sac", "Sacramento Republic FC", "SAC", "Sacramento", "Heart Health Park", 11000, "#7b1e3b", "#c9a86a", 60, "Western"],
  ["usl_sa", "San Antonio FC", "SAFC", "San Antonio", "Toyota Field", 8000, "#111111", "#c8102e", 57, "Western"],
  ["usl_tul", "FC Tulsa", "TUL", "Tulsa", "ONEOK Field", 7500, "#00529b", "#f2c300", 50, "Western"],
] satisfies UsClubSeed[]).map((row) => usClub(row, "uslChampionship"));

type SaudiClubSeed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
];

function saudiClub(row: SaudiClubSeed, league: "saudiProLeague" | "saudiFirstDivision"): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige] = row;
  return {
    id,
    name,
    short,
    city,
    stadium,
    capacity,
    color,
    color2,
    league,
    prestige,
    country: "KSA",
    crest: crestUrl(id),
    provisional: true,
    featured: (league === "saudiProLeague" && ["sau_nas", "sau_hil", "sau_ahl"].includes(id)) || undefined,
  };
}

/** Saudi Pro League 2026/27: 18 equipos, 34 jornadas. */
const SAUDI_PRO_LEAGUE_CLUBS: Club[] = ([
  ["sau_nas", "Al Nassr", "NAS", "Riad", "Al-Awwal Park", 25000, "#f4c900", "#123f8c", 86],
  ["sau_hil", "Al Hilal", "HIL", "Riad", "Kingdom Arena", 26000, "#1a3a8a", "#ffffff", 87],
  ["sau_ahl", "Al Ahli", "AHL", "Yeda", "King Abdullah Sports City", 62241, "#16834b", "#ffffff", 83],
  ["sau_qad", "Al Qadsiah", "QAD", "Jubail", "Prince Saud bin Jalawi Stadium", 15000, "#c8102e", "#f5d000", 77],
  ["sau_itt", "Al Ittihad", "ITT", "Yeda", "King Abdullah Sports City", 62241, "#f5c400", "#111111", 82],
  ["sau_taa", "Al Taawoun", "TAA", "Buraidah", "King Abdullah Sport City Stadium", 25000, "#f5c400", "#c8102e", 68],
  ["sau_ett", "Al Ettifaq", "ETT", "Dammam", "EGO Stadium", 15000, "#16834b", "#c8102e", 67],
  ["sau_neo", "NEOM SC", "NEO", "Tabuk", "King Khalid Sport City", 12000, "#153b6b", "#ffffff", 64],
  ["sau_haz", "Al Hazem", "HAZ", "Ar Rass", "Al-Hazem Club Stadium", 8000, "#f5c400", "#111111", 50],
  ["sau_fay", "Al Fayha", "FAY", "Al Majma'ah", "Al Majma'ah Sports City", 7000, "#f36f21", "#153b6b", 59],
  ["sau_fat", "Al Fateh", "FAT", "Al-Hofuf", "Prince Abdullah bin Jalawi Stadium", 19550, "#16834b", "#ffffff", 57],
  ["sau_kha", "Al Khaleej", "KHA", "Saihat", "Prince Nayef bin Abdulaziz Stadium", 12000, "#f5c400", "#16834b", 56],
  ["sau_sha", "Al Shabab", "SHA", "Riad", "SHG Arena", 15000, "#ffffff", "#111111", 70],
  ["sau_kho", "Al Kholood", "KHO", "Ar Rass", "Al-Hazem Club Stadium", 8000, "#c8102e", "#ffffff", 50],
  ["sau_riy", "Al Riyadh", "RIY", "Riad", "Prince Faisal bin Fahd Stadium", 22000, "#c8102e", "#ffffff", 52],
  ["sau_abh", "Abha", "ABH", "Abha", "Prince Sultan bin Abdul Aziz Stadium", 20000, "#c8102e", "#ffffff", 55],
  ["sau_fai", "Al Faisaly", "FAI", "Harmah", "Al Majma'ah Sports City", 7000, "#c8102e", "#153b6b", 55],
  ["sau_dir", "Al Diriyah", "DIR", "Diriyah", "Prince Turki bin Abdulaziz Stadium", 15000, "#16834b", "#ffffff", 56],
] satisfies SaudiClubSeed[]).map((row) => saudiClub(row, "saudiProLeague"));

/** Saudi First Division League 2026/27: 18 equipos, con ascenso a la Saudi Pro League. */
const SAUDI_FIRST_DIVISION_CLUBS: Club[] = ([
  ["sau_okh", "Al Okhdood", "OKH", "Najran", "Prince Hathloul bin Abdulaziz Sports City", 12000, "#c8102e", "#ffffff", 55],
  ["sau_anw", "Al Anwar", "ANW", "Hawtat Bani Tamim", "Al-Anwar Club Stadium", 6000, "#f5c400", "#111111", 39],
  ["sau_buk", "Al Bukiryah", "BUK", "Al Bukayriyah", "Al-Bukiryah Club Stadium", 5000, "#c8102e", "#ffffff", 40],
  ["sau_jab", "Al Jabalin", "JAB", "Ha'il", "Prince Abdulaziz bin Musa'ed Stadium", 12000, "#c8102e", "#111111", 46],
  ["sau_jan", "Al Jandal", "JAN", "Dumat al-Jandal", "Al-Jandal Club Stadium", 5000, "#f5c400", "#111111", 39],
  ["sau_jee", "Al Jeel", "JEE", "Al-Hasa", "Al-Jeel Club Stadium", 5000, "#16834b", "#ffffff", 40],
  ["sau_rae", "Al Raed", "RAE", "Buraidah", "King Abdullah Sport City Stadium", 25000, "#c8102e", "#111111", 56],
  ["sau_zul", "Al Zulfi", "ZUL", "Az Zulfi", "Al-Zulfi Club Stadium", 5000, "#16834b", "#ffffff", 40],
  ["sau_saq", "Al Saqer", "SAQ", "Unaizah", "Al-Saqer Club Stadium", 5000, "#f5c400", "#c8102e", 39],
  ["sau_tai", "Al Tai", "TAI", "Ha'il", "Prince Abdulaziz bin Musa'ed Stadium", 12000, "#c8102e", "#111111", 51],
  ["sau_ada", "Al Adalah", "ADA", "Al-Hasa", "Prince Abdullah bin Jalawi Stadium", 19550, "#c8102e", "#ffffff", 45],
  ["sau_oru", "Al Orobah", "ORO", "Sakaka", "Al-Orobah Club Stadium", 7000, "#16834b", "#ffffff", 50],
  ["sau_ula", "AlUla", "ULA", "AlUla", "AlUla Club Stadium", 5000, "#c8102e", "#ffffff", 51],
  ["sau_naj", "Al Najmah", "NAJ", "Unaizah", "Department of Education Stadium", 5000, "#c8102e", "#ffffff", 46],
  ["sau_weh", "Al Wehda", "WEH", "La Meca", "King Abdul Aziz Stadium", 38000, "#c8102e", "#ffffff", 52],
  ["sau_jed", "Jeddah", "JED", "Yeda", "Prince Abdullah Al-Faisal Stadium", 20000, "#c8102e", "#ffffff", 43],
  ["sau_dam", "Damac", "DAM", "Khamis Mushait", "Prince Sultan bin Abdul Aziz Stadium", 20000, "#c8102e", "#ffffff", 55],
  ["sau_haj", "Hajer", "HAJ", "Al-Hasa", "Prince Abdullah bin Jalawi Stadium", 19550, "#16834b", "#ffffff", 42],
] satisfies SaudiClubSeed[]).map((row) => saudiClub(row, "saudiFirstDivision"));

const REAL_CLUBS: Club[] = [
  {
    id: "mil",
    name: "AC Milan",
    short: "MIL",
    city: "Milán",
    stadium: "San Siro",
    capacity: 75817,
    color: "#c8102e",
    color2: "#1a1a1a",
    league: "serieA",
    prestige: 86,
    featured: true,
    crest: crestUrl("mil"),
  },
  {
    id: "int",
    name: "Inter",
    short: "INT",
    city: "Milán",
    stadium: "San Siro",
    capacity: 75817,
    color: "#0033a0",
    color2: "#1a1a1a",
    league: "serieA",
    prestige: 91,
    crest: crestUrl("int"),
  },
  {
    id: "juv",
    name: "Juventus",
    short: "JUV",
    city: "Turín",
    stadium: "Allianz Stadium",
    capacity: 41507,
    color: "#ffffff",
    color2: "#111111",
    league: "serieA",
    prestige: 85,
    crest: crestUrl("juv"),
  },
  {
    id: "nap",
    name: "Napoli",
    short: "NAP",
    city: "Nápoles",
    stadium: "Diego Armando Maradona",
    capacity: 54726,
    color: "#0094de",
    color2: "#ffffff",
    league: "serieA",
    prestige: 87,
    crest: crestUrl("nap"),
  },
  {
    id: "rom",
    name: "Roma",
    short: "ROM",
    city: "Roma",
    stadium: "Olimpico",
    capacity: 70634,
    color: "#8b1e1e",
    color2: "#c9a227",
    league: "serieA",
    prestige: 85,
    crest: crestUrl("rom"),
  },
  {
    id: "com",
    name: "Como",
    short: "COM",
    city: "Como",
    stadium: "Giuseppe Sinigaglia",
    capacity: 13602,
    color: "#1d4e89",
    color2: "#ffffff",
    league: "serieA",
    prestige: 82,
    crest: crestUrl("com"),
  },
  {
    id: "ata",
    name: "Atalanta",
    short: "ATA",
    city: "Bérgamo",
    stadium: "Gewiss Stadium",
    capacity: 24950,
    color: "#1e3a8a",
    color2: "#000000",
    league: "serieA",
    prestige: 83,
    crest: crestUrl("ata"),
  },
  {
    id: "laz",
    name: "Lazio",
    short: "LAZ",
    city: "Roma",
    stadium: "Olimpico",
    capacity: 70634,
    color: "#87ceeb",
    color2: "#ffffff",
    league: "serieA",
    prestige: 80,
    crest: crestUrl("laz"),
  },
  {
    id: "fio",
    name: "Fiorentina",
    short: "FIO",
    city: "Florencia",
    stadium: "Artemio Franchi",
    capacity: 43147,
    color: "#4824a3",
    color2: "#ffffff",
    league: "serieA",
    prestige: 77,
    crest: crestUrl("fio"),
  },
  {
    id: "bol",
    name: "Bologna",
    short: "BOL",
    city: "Bolonia",
    stadium: "Renato Dall'Ara",
    capacity: 36462,
    color: "#8b1a1a",
    color2: "#1a1a1a",
    league: "serieA",
    prestige: 77,
    crest: crestUrl("bol"),
  },
  {
    id: "tor",
    name: "Torino",
    short: "TOR",
    city: "Turín",
    stadium: "Olimpico Grande Torino",
    capacity: 27958,
    color: "#8b1a1a",
    color2: "#ffffff",
    league: "serieA",
    prestige: 74,
    crest: crestUrl("tor"),
  },
  {
    id: "gen",
    name: "Genoa",
    short: "GEN",
    city: "Génova",
    stadium: "Luigi Ferraris",
    capacity: 36320,
    color: "#8b1a1a",
    color2: "#1e3a8a",
    league: "serieA",
    prestige: 72,
    crest: crestUrl("gen"),
  },
  {
    id: "udi",
    name: "Udinese",
    short: "UDI",
    city: "Udine",
    stadium: "Bluenergy Stadium",
    capacity: 25132,
    color: "#000000",
    color2: "#ffffff",
    league: "serieA",
    prestige: 71,
    crest: crestUrl("udi"),
  },
  {
    id: "cag",
    name: "Cagliari",
    short: "CAG",
    city: "Cagliari",
    stadium: "Unipol Domus",
    capacity: 16416,
    color: "#c8102e",
    color2: "#1e3a8a",
    league: "serieA",
    prestige: 70,
    crest: crestUrl("cag"),
  },
  {
    id: "par",
    name: "Parma",
    short: "PAR",
    city: "Parma",
    stadium: "Ennio Tardini",
    capacity: 22352,
    color: "#ffd200",
    color2: "#1a3a8a",
    league: "serieA",
    prestige: 70,
    crest: crestUrl("par"),
  },
  {
    id: "lec",
    name: "Lecce",
    short: "LEC",
    city: "Lecce",
    stadium: "Via del Mare",
    capacity: 31533,
    color: "#c8102e",
    color2: "#ffd200",
    league: "serieA",
    prestige: 67,
    crest: crestUrl("lec"),
  },
  {
    id: "sas",
    name: "Sassuolo",
    short: "SAS",
    city: "Sassuolo",
    stadium: "Mapei Stadium",
    capacity: 21584,
    color: "#006633",
    color2: "#000000",
    league: "serieA",
    prestige: 72,
    crest: crestUrl("sas"),
  },
  {
    id: "fro",
    name: "Frosinone",
    short: "FRO",
    city: "Frosinone",
    stadium: "Benito Stirpe",
    capacity: 16227,
    color: "#ffd200",
    color2: "#1e3a8a",
    league: "serieA",
    prestige: 68,
    crest: crestUrl("fro"),
  },
  {
    id: "ven",
    name: "Venezia",
    short: "VEN",
    city: "Venecia",
    stadium: "Pier Luigi Penzo",
    capacity: 11150,
    color: "#1a3a2a",
    color2: "#c9a227",
    league: "serieA",
    prestige: 68,
    crest: crestUrl("ven"),
  },
  {
    id: "mon",
    name: "Monza",
    short: "MON",
    city: "Monza",
    stadium: "U-Power Stadium",
    capacity: 15039,
    color: "#c8102e",
    color2: "#ffffff",
    league: "serieA",
    prestige: 66,
    crest: crestUrl("mon"),
  },
  {
    id: "rma",
    name: "Real Madrid",
    short: "RMA",
    city: "Madrid",
    stadium: "Santiago Bernabéu",
    capacity: 81044,
    color: "#ffffff",
    color2: "#1e3a8a",
    league: "laliga",
    prestige: 95,
    featured: true,
    crest: crestUrl("rma"),
  },
  {
    id: "bar",
    name: "Barcelona",
    short: "BAR",
    city: "Barcelona",
    stadium: "Spotify Camp Nou",
    capacity: 99354,
    color: "#a50044",
    color2: "#004d98",
    league: "laliga",
    prestige: 93,
    crest: crestUrl("bar"),
  },
  {
    id: "bay",
    name: "Bayern Munich",
    short: "BAY",
    city: "Múnich",
    stadium: "Allianz Arena",
    capacity: 75000,
    color: "#dc052d",
    color2: "#ffffff",
    league: "bundesliga",
    prestige: 94,
    featured: true,
    crest: crestUrl("bay"),
  },
  {
    id: "mci",
    name: "Manchester City",
    short: "MCI",
    city: "Mánchester",
    stadium: "Etihad Stadium",
    capacity: 53400,
    color: "#6cabdd",
    color2: "#1c2c5b",
    league: "premier",
    prestige: 94,
    crest: crestUrl("mci"),
  },
  {
    id: "psg",
    name: "Paris Saint-Germain",
    short: "PSG",
    city: "París",
    stadium: "Parc des Princes",
    capacity: 47929,
    color: "#004170",
    color2: "#da291c",
    league: "ligue1",
    prestige: 95,
    featured: true,
    crest: crestUrl("psg"),
  },
  {
    id: "liv",
    name: "Liverpool",
    short: "LIV",
    city: "Liverpool",
    stadium: "Anfield",
    capacity: 61276,
    color: "#c8102e",
    color2: "#00a398",
    league: "premier",
    prestige: 91,
    crest: crestUrl("liv"),
  },
  {
    id: "ars",
    name: "Arsenal",
    short: "ARS",
    city: "Londres",
    stadium: "Emirates Stadium",
    capacity: 60704,
    color: "#ef0107",
    color2: "#ffffff",
    league: "premier",
    prestige: 90,
    featured: true,
    crest: crestUrl("ars"),
  },
  {
    id: "dor",
    name: "Borussia Dortmund",
    short: "BVB",
    city: "Dortmund",
    stadium: "Signal Iduna Park",
    capacity: 81365,
    color: "#fde100",
    color2: "#000000",
    league: "bundesliga",
    prestige: 86,
    crest: crestUrl("dor"),
  },
  {
    id: "atl",
    name: "Atlético Madrid",
    short: "ATL",
    city: "Madrid",
    stadium: "Cívitas Metropolitano",
    capacity: 70460,
    color: "#c8102e",
    color2: "#ffffff",
    league: "laliga",
    prestige: 88,
    crest: crestUrl("atl"),
  },
  {
    id: "che",
    name: "Chelsea",
    short: "CHE",
    city: "Londres",
    stadium: "Stamford Bridge",
    capacity: 40341,
    color: "#034694",
    color2: "#ffffff",
    league: "premier",
    prestige: 87,
    crest: crestUrl("che"),
  },
  {
    id: "rbl",
    name: "RB Leipzig",
    short: "RBL",
    city: "Leipzig",
    stadium: "Red Bull Arena",
    capacity: 47069,
    color: "#dd0747",
    color2: "#ffffff",
    league: "bundesliga",
    prestige: 82,
    crest: crestUrl("rbl"),
  },
  {
    id: "bru",
    name: "Club Brugge",
    short: "BRU",
    city: "Brujas",
    stadium: "Jan Breydel",
    capacity: 29062,
    color: "#1e3a8a",
    color2: "#000000",
    league: "europe",
    prestige: 76,
    ghost: true,
    country: "BEL",
    crest: crestUrl("bru"),
  },
  ...PREMIER_EXTRA,
  ...CHAMPIONSHIP_RELEGATED,
  ...CHAMPIONSHIP_OTHERS,
  ...LALIGA_EXTRA,
  ...SEGUNDA_CLUBS,
  ...PRIMERA_FED_CLUBS,
  ...BUNDESLIGA_EXTRA,
  ...LIGUE1_EXTRA,
  ...LIGUE2_CLUBS,
  ...ARGENTINA_CLUBS,
  ...PRIMERA_NACIONAL_CLUBS,
  ...PRIMERA_B_METRO_CLUBS,
  ...BRASILEIRAO_CLUBS,
  ...BRASILEIRAO_B_CLUBS,
  ...BRASILEIRAO_C_CLUBS,
  ...PRIMEIRA_CLUBS,
  ...SERIE_B_CLUBS,
  ...SERIE_C_CLUBS,
  ...SERIE_D_CLUBS,
  ...BUNDESLIGA2_CLUBS,
  // Al final: así los clubes de las demás ligas conservan el mismo orden (y el mismo sorteo de plantillas).
  ...PRIMEIRA2_CLUBS,
  // La League One va al final: así ninguna otra liga cambia el orden de sus clubes (ni el sorteo de sus plantillas).
  ...LEAGUE_ONE_CLUBS,
  // La 3. Liga va todavía después: ninguna liga existente cambia el orden de sus clubes ni el sorteo de sus plantillas.
  ...BUNDESLIGA3_CLUBS,
  ...EREDIVISIE_CLUBS,
  ...EERSTE_DIVISIE_CLUBS,
  ...TWEEDE_DIVISIE_CLUBS,
  ...MLS_CLUBS,
  ...USL_CHAMPIONSHIP_CLUBS,
  ...SAUDI_PRO_LEAGUE_CLUBS,
  ...SAUDI_FIRST_DIVISION_CLUBS,
  ...ARGENTINA_FOURTH_CLUBS,
  ...ARGENTINA_FOURTH_TO_FIFTH_CLUBS,
  ...ARGENTINA_FIFTH_CLUBS,
  ...PROMOCIONAL_AMATEUR_CLUBS,
  ...ARGENTINA_THIRD_CLUBS,
  ...ARGENTINA_FOURTH_EXTRA_CLUBS,
  ...ARGENTINA_FIFTH_EXTRA_CLUBS,
];

/** Participantes oficiales EFL League Two 2026/27 según la tabla EFL del 10/10/2026. Plantillas provisionales generadas. */
const LEAGUE_TWO_CLUBS: Club[] = ([
  ["l2_acc", "Accrington Stanley", "ACC", "Accrington", "Wham Stadium", 5450, "#d71920", "#ffffff", 33],
  ["l2_brn", "Barnet", "BRN", "Londres", "The Hive Stadium", 6500, "#f58220", "#111111", 34],
  ["l2_bri", "Bristol Rovers", "BRI", "Bristol", "Memorial Stadium", 12000, "#0b1b5c", "#ffffff", 37],
  ["l2_cht", "Cheltenham Town", "CHT", "Cheltenham", "Whaddon Road", 7066, "#d71920", "#111111", 31],
  ["l2_chf", "Chesterfield", "CHF", "Chesterfield", "SMH Group Stadium", 10504, "#0057a8", "#ffffff", 36],
  ["l2_col", "Colchester United", "COL", "Colchester", "JobServe Community Stadium", 10105, "#0057a8", "#ffffff", 34],
  ["l2_cra", "Crawley Town", "CRA", "Crawley", "Broadfield Stadium", 6134, "#d71920", "#ffffff", 31],
  ["l2_cre", "Crewe Alexandra", "CRE", "Crewe", "Mornflake Stadium", 10153, "#d71920", "#ffffff", 34],
  ["l2_exe", "Exeter City", "EXE", "Exeter", "St James Park", 8541, "#d71920", "#ffffff", 38],
  ["l2_fle", "Fleetwood Town", "FLE", "Fleetwood", "Highbury Stadium", 5327, "#d71920", "#ffffff", 33],
  ["l2_gil", "Gillingham", "GIL", "Gillingham", "Priestfield Stadium", 11582, "#1c2c5b", "#ffffff", 36],
  ["l2_gri", "Grimsby Town", "GRI", "Grimsby", "Blundell Park", 9052, "#111111", "#ffffff", 35],
  ["l2_new", "Newport County", "NEWC", "Newport", "Rodney Parade", 7850, "#111111", "#d71920", 32],
  ["l2_nor", "Northampton Town", "NOR", "Northampton", "Sixfields Stadium", 7798, "#d71920", "#ffffff", 36],
  ["l2_old", "Oldham Athletic", "OLD", "Oldham", "Boundary Park", 13512, "#0057a8", "#ffffff", 35],
  ["l2_pov", "Port Vale", "PVA", "Stoke-on-Trent", "Vale Park", 19052, "#111111", "#ffffff", 37],
  ["l2_roc", "Rochdale", "ROC", "Rochdale", "Crown Oil Arena", 10249, "#111111", "#ffffff", 35],
  ["l2_rot", "Rotherham United", "ROT", "Rotherham", "AESSEAL New York Stadium", 12021, "#d71920", "#ffffff", 40],
  ["l2_sal", "Salford City", "SAL", "Salford", "Peninsula Stadium", 5108, "#d71920", "#ffffff", 35],
  ["l2_shr", "Shrewsbury Town", "SHR", "Shrewsbury", "Croud Meadow", 9875, "#0057a8", "#f5d000", 35],
  ["l2_swi", "Swindon Town", "SWI", "Swindon", "County Ground", 15728, "#d71920", "#ffffff", 37],
  ["l2_tra", "Tranmere Rovers", "TRA", "Birkenhead", "Prenton Park", 16587, "#ffffff", "#1c2c5b", 36],
  ["l2_wal", "Walsall", "WAL", "Walsall", "Bescot Stadium", 11300, "#d71920", "#ffffff", 34],
  ["l2_yor", "York City", "YOR", "York", "LNER Community Stadium", 8500, "#d71920", "#ffffff", 35],
] satisfies PremierSeed[]).map(([id, name, short, city, stadium, capacity, color, color2, prestige]) => ({
  id,
  name,
  short,
  city,
  stadium,
  capacity,
  color,
  color2,
  league: "leagueTwo" as const,
  prestige,
  crest: crestUrl(id),
  provisional: true,
  country: "ENG",
}));

export const LEAGUE_TWO_IDS = LEAGUE_TWO_CLUBS.map((club) => club.id);
export const CLUBS: Club[] = [...REAL_CLUBS, ...GHOST_CLUBS, ...LEAGUE_TWO_CLUBS, ...LIGUE3_CLUBS];
const CLUB_BY_ID = new Map<string, Club>();
for (const club of CLUBS) {
  if (!CLUB_BY_ID.has(club.id)) CLUB_BY_ID.set(club.id, club);
}
const BASE_CLUB_IDENTITY = new Map(
  CLUBS.map((club) => [
    club.id,
    {
      name: club.name,
      short: club.short,
      city: club.city,
      stadium: club.stadium,
      capacity: club.capacity,
      color: club.color,
      color2: club.color2,
      crest: club.crest,
      prestige: club.prestige,
    },
  ]),
);

/** Restablece el catálogo base y, opcionalmente, aplica una identidad a un participante existente. */
export function applyClubIdentity(
  clubId: string | null | undefined,
  identity?: ClubCustomization | null,
) {
  for (const club of CLUBS) {
    const base = BASE_CLUB_IDENTITY.get(club.id);
    if (base) Object.assign(club, base);
    delete club.crestBackgroundTransparent;
  }
  if (!clubId || !identity) return;
  const club = CLUBS.find((candidate) => candidate.id === clubId);
  if (!club) return;
  Object.assign(club, {
    name: identity.name,
    short: identity.short,
    city: identity.city,
    stadium: identity.stadium,
    capacity: identity.capacity,
    color: identity.color,
    color2: identity.color2,
    crest: identity.crest,
    crestBackgroundTransparent: identity.crestBackgroundTransparent ?? false,
    prestige: identity.prestige,
  });
}

export const SERIE_A_IDS = uniqueIds(CLUBS.filter((c) => c.league === "serieA").map((c) => c.id));
/** Premier League 2026/27 de partida (los ascensos y descensos las cambian: usar {@link domesticIds}). */
export const PREMIER_IDS = uniqueIds(CLUBS.filter((c) => c.league === "premier").map((c) => c.id));
export const LALIGA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "laliga").map((c) => c.id));
export const BUNDESLIGA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "bundesliga").map((c) => c.id));
export const LIGUE1_IDS = uniqueIds(CLUBS.filter((c) => c.league === "ligue1").map((c) => c.id));
/**
 * Liga Profesional de partida (2026). Los ascensos y descensos con la Primera Nacional la cambian: para los clubes que
 * juegan HOY en la Liga Profesional usar {@link domesticIds}("argentina").
 */
export const ARGENTINA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "argentina").map((c) => c.id));
/** Primera Nacional de partida (2026). Ver {@link domesticIds}("primeraNacional") para la división vigente. */
export const PRIMERA_NACIONAL_IDS = uniqueIds(CLUBS.filter((c) => c.league === "primeraNacional").map((c) => c.id));
export const PRIMERA_B_METRO_IDS = uniqueIds(CLUBS.filter((c) => c.league === "primeraBMetro").map((c) => c.id));

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

export type EnglishDivision = "premier" | "championship" | "leagueOne" | "leagueTwo";
export type SpanishDivision = "laliga" | "segunda" | "primeraFed1" | "primeraFed2" | "rfef";
export type ArgentineDivision =
  | "argentina"
  | "primeraNacional"
  | "primeraBMetro"
  | "argentinaCuarta"
  | "argentinaQuinta"
  | "promocionalAmateur";
export type ItalianDivision = "serieA" | "serieB" | "serieC" | "serieD";
export type GermanDivision = "bundesliga" | "bundesliga2" | "bundesliga3";
export type FrenchDivision = "ligue1" | "ligue2" | "ligue3";
export type BrazilianDivision = "brasileirao" | "brasileiraoB" | "brasileiraoC";
export type PortugueseDivision = "primeira" | "primeira2";
/** Cualquier división con ascensos y descensos en el juego. */
export type Division =
  | EnglishDivision
  | SpanishDivision
  | ArgentineDivision
  | ItalianDivision
  | GermanDivision
  | FrenchDivision
  | BrazilianDivision
  | PortugueseDivision
  | "eredivisie"
  | "eersteDivisie"
  | "tweedeDivisie"
  | "saudiProLeague"
  | "saudiFirstDivision";

const DIVISION_KINDS: Division[] = [
  "premier",
  "championship",
  "leagueOne",
  "leagueTwo",
  "serieA",
  "serieB",
  "laliga",
  "segunda",
  "primeraFed1",
  "primeraFed2",
  "rfef",
  "bundesliga",
  "bundesliga2",
  "ligue1",
  "ligue2",
  "ligue3",
  "argentina",
  "primeraNacional",
  "primeraBMetro",
  "argentinaCuarta",
  "argentinaQuinta",
  "promocionalAmateur",
  "brasileirao",
  "brasileiraoB",
  "brasileiraoC",
  "primeira",
  "primeira2",
  "eredivisie",
  "eersteDivisie",
  "tweedeDivisie",
  "saudiProLeague",
  "saudiFirstDivision",
];

/**
 * Todos los clubes que cambian de división con ascensos y descensos (Inglaterra, con la League One + España, incluida la Primera RFEF, y
 * Argentina: Liga Profesional + Primera Nacional).
 */
export const PROMOTABLE_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => (DIVISION_KINDS as string[]).includes(c.league) && (!c.ghost || c.league === "rfef")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en las cuatro divisiones EFL del juego. */
export const ENGLISH_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "premier" || c.league === "championship" || c.league === "leagueOne" || c.league === "leagueTwo")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en las tres primeras divisiones argentinas. */
export const ARGENTINE_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && ["argentina", "primeraNacional", "primeraBMetro", "argentinaCuarta", "argentinaQuinta", "promocionalAmateur"].includes(c.league)).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en las dos primeras divisiones italianas. */
export const ITALIAN_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "serieA" || c.league === "serieB" || c.league === "serieC" || c.league === "serieD")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en las dos primeras divisiones alemanas. */
export const GERMAN_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "bundesliga" || c.league === "bundesliga2")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en las tres divisiones francesas. */
export const FRENCH_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "ligue1" || c.league === "ligue2" || c.league === "ligue3")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en el Brasileirão Série A o en la Série B. */
export const BRAZILIAN_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "brasileirao" || c.league === "brasileiraoB" || c.league === "brasileiraoC")).map((c) => c.id),
);
/** Todos los clubes que juegan (o pueden jugar) en la Primeira Liga o en la Liga Portugal 2. */
export const PORTUGUESE_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "primeira" || c.league === "primeira2")).map((c) => c.id),
);
export const DUTCH_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "eredivisie" || c.league === "eersteDivisie" || c.league === "tweedeDivisie")).map((c) => c.id),
);
export const US_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "mls" || c.league === "uslChampionship")).map((c) => c.id),
);
export const SAUDI_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "saudiProLeague" || c.league === "saudiFirstDivision")).map((c) => c.id),
);
/** Clubes de La Liga, Segunda y Primera RFEF (los 4 de la RFEF son el relevo de la Segunda). */
export const SPANISH_IDS: string[] = PROMOTABLE_IDS.filter(
  (id) =>
    !ENGLISH_IDS.includes(id) &&
    !ARGENTINE_IDS.includes(id) &&
    !ITALIAN_IDS.includes(id) &&
    !GERMAN_IDS.includes(id) &&
    !FRENCH_IDS.includes(id) &&
    !BRAZILIAN_IDS.includes(id) &&
    !PORTUGUESE_IDS.includes(id) &&
    !DUTCH_IDS.includes(id) &&
    !SAUDI_IDS.includes(id),
);

/** Divisiones en las que puede estar un club según su país: un club nunca cruza de país. */
function divisionsOfCountry(id: string): Division[] {
  if (ENGLISH_IDS.includes(id)) return ["premier", "championship", "leagueOne", "leagueTwo"];
  if (ARGENTINE_IDS.includes(id)) return ["argentina", "primeraNacional", "primeraBMetro", "argentinaCuarta", "argentinaQuinta", "promocionalAmateur"];
  if (ITALIAN_IDS.includes(id)) return ["serieA", "serieB", "serieC", "serieD"];
  if (GERMAN_IDS.includes(id)) return ["bundesliga", "bundesliga2"];
  if (FRENCH_IDS.includes(id)) return ["ligue1", "ligue2", "ligue3"];
  if (BRAZILIAN_IDS.includes(id)) return ["brasileirao", "brasileiraoB", "brasileiraoC"];
  if (PORTUGUESE_IDS.includes(id)) return ["primeira", "primeira2"];
  if (DUTCH_IDS.includes(id)) return ["eredivisie", "eersteDivisie", "tweedeDivisie"];
  if (SAUDI_IDS.includes(id)) return ["saudiProLeague", "saudiFirstDivision"];
  return ["laliga", "segunda", "primeraFed1", "primeraFed2", "rfef"];
}

/** División de partida (2026/27) de cada club con ascensos/descensos. */
export const DEFAULT_DIVISIONS: Record<string, Division> = Object.fromEntries(
  PROMOTABLE_IDS.map((id) => [id, CLUBS.find((c) => c.id === id)!.league as Division]),
);

/** División actual de cada club (para guardar en la partida). */
export function currentDivisions(): Record<string, Division> {
  const out: Record<string, Division> = {};
  for (const id of PROMOTABLE_IDS) {
    const c = CLUBS.find((x) => x.id === id);
    out[id] = (c?.league as Division | undefined) ?? DEFAULT_DIVISIONS[id]!;
  }
  return out;
}

/**
 * Pone a cada club en su división (Premier / Championship / League One / League Two / Ligue 1 / Ligue 2 / Ligue 3 / La Liga / Segunda / Primera RFEF / Liga Profesional /
 * Primera Nacional). Sin argumento vuelve a la de partida. Los ascensos y descensos cambian `club.league`, así que todo
 * el juego (calendario, copas, tablas, nacionalidades, presupuestos) ve siempre la división vigente. Se llama al cargar
 * una partida, al empezar una y al cerrar la temporada. Los clubes en Primera RFEF quedan como `ghost` (no juegan ni se
 * pueden fichar). Un club solo está en UNA división a la vez (`club.league` es único) y nunca cruza de país.
 */
export function applyDivisions(divisions?: Record<string, Division> | null) {
  for (const c of CLUBS) {
    if (!(c.id in DEFAULT_DIVISIONS)) continue;
    let want = divisions?.[c.id] ?? DEFAULT_DIVISIONS[c.id]!;
    // Partidas viejas: la antigua "Primera RFEF" fantasma ahora es la Primera Federación (el club vuelve a su grupo de partida).
    if (want === "rfef") want = FED_START_GROUP[c.id] === 2 ? "primeraFed2" : "primeraFed1";
    if (!DIVISION_KINDS.includes(want)) continue;
    // Las partidas viejas (o un id cruzado) nunca mueven a un club de un país a otro.
    if (!divisionsOfCountry(c.id).includes(want)) continue;
    c.league = want;
    // En Primera RFEF un club es `ghost`; al volver a subir a Segunda deja de serlo, sea cual sea su división de partida
    // (antes solo se liberaban los 4 que ya empezaban en la RFEF y un club caído quedaba "fantasma" para siempre).
    if (c.ghost) c.ghost = false;
  }
}

/** Clubes de una división (inglesa, española o argentina), en el orden fijo de CLUBS. */
function divisionClubIds(division: LeagueKind): string[] {
  return uniqueIds(CLUBS.filter((c) => !c.ghost && c.league === division).map((c) => c.id));
}
function englishClubIds(division: EnglishDivision): string[] {
  return divisionClubIds(division);
}

/** Los 68 participantes de la FA Cup y la Carabao Cup: Premier + Championship + League One actuales (sin repetir clubes). */
export function englishCupIds(): { premier: string[]; championship: string[]; leagueOne: string[]; leagueTwo: string[] } {
  const seen = new Set<string>();
  const once = (ids: string[]) => ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
  const premier = once(englishClubIds("premier"));
  const championship = once(englishClubIds("championship"));
  const leagueOne = once(englishClubIds("leagueOne"));
  const leagueTwo = once(englishClubIds("leagueTwo"));
  return { premier, championship, leagueOne, leagueTwo };
}

/** Los participantes de la DFB-Pokal: Bundesliga + 2. Bundesliga actuales (36 clubes). */
export function germanCupIds(): { bundesliga: string[]; bundesliga2: string[] } {
  return { bundesliga: divisionClubIds("bundesliga"), bundesliga2: divisionClubIds("bundesliga2") };
}

/** Los participantes de la Coupe de France: Ligue 1 + Ligue 2 actuales (36 clubes). */
export function frenchCupIds(): { ligue1: string[]; ligue2: string[] } {
  return { ligue1: divisionClubIds("ligue1"), ligue2: divisionClubIds("ligue2") };
}

/** Participantes actuales de Copa do Brasil: Série A + Série B y cuatro cupos de Série C. */
export function brazilianCupIds(serieCQualifiers: string[] = []): { serieA: string[]; serieB: string[]; serieC: string[] } {
  const currentC = divisionClubIds("brasileiraoC");
  const rankedC = rankedBrazilianSerieCIds();
  const selectedC = serieCQualifiers.length
    ? uniqueIds(serieCQualifiers.filter((id) => currentC.includes(id))).slice(0, 4)
    : [];
  const serieC = [...selectedC, ...rankedC.filter((id) => !selectedC.includes(id))].slice(0, 4);
  return {
    serieA: divisionClubIds("brasileirao"),
    serieB: divisionClubIds("brasileiraoB"),
    serieC: serieC,
  };
}

function rankedBrazilianSerieCIds(): string[] {
  return divisionClubIds("brasileiraoC").sort((a, b) => clubById(b).prestige - clubById(a).prestige);
}

/**
 * ¿Es un equipo B / filial (Benfica B, FC Porto B, Sporting CP B)? Los equipos B juegan la Liga Portugal 2 pero NO pueden
 * participar en la Taça de Portugal ni en la Taça da Liga.
 */
export function isPortugueseReserveTeam(id: string): boolean {
  const c = CLUBS.find((x) => x.id === id);
  return !!c && (c.league === "primeira" || c.league === "primeira2") && /\sB$/.test(c.name);
}

/**
 * Los participantes elegibles de la Taça de Portugal y de la Taça da Liga: Primeira Liga + Liga Portugal 2 actuales, sin
 * los equipos B (33 clubes con la lista 2026/27: 18 + 15).
 */
export function portugueseCupIds(): { primeira: string[]; primeira2: string[] } {
  return {
    primeira: divisionClubIds("primeira").filter((id) => !isPortugueseReserveTeam(id)),
    primeira2: divisionClubIds("primeira2").filter((id) => !isPortugueseReserveTeam(id)),
  };
}

/** Participantes de la Copa Argentina hasta la Quinta División; excluye expresamente el Promocional Amateur. */
export function argentineCupIds(): {
  profesional: string[];
  nacional: string[];
  metropolitana: string[];
  cuarta: string[];
  quinta: string[];
} {
  return {
    profesional: divisionClubIds("argentina"),
    nacional: divisionClubIds("primeraNacional"),
    metropolitana: divisionClubIds("primeraBMetro"),
    cuarta: divisionClubIds("argentinaCuarta"),
    quinta: divisionClubIds("argentinaQuinta"),
  };
}

/**
 * Clubes españoles de LaLiga EA Sports + LaLiga Hypermotion que pueden entrar en la Copa del Rey.
 * Preparado para la siguiente parte: de momento el cuadro actual de la Copa del Rey NO se modifica.
 */
export function copaDelReyEligibleIds(): { laliga: string[]; segunda: string[] } {
  return { laliga: divisionClubIds("laliga"), segunda: divisionClubIds("segunda") };
}

/** Cupos de la Primera Federación en la Copa del Rey 2026/27 (21 clubes entran en la primera eliminatoria). */
export const COPA_DEL_REY_FED_SPOTS = 21;

/** Los filiales no pueden jugar la Copa del Rey (Real Sociedad B, Celta Fortuna y los filiales de la Primera Federación). */
const SPANISH_CUP_RESERVES = new Set<string>([...Object.keys(FED_RESERVE_PARENT), "sd_rsb", "sd_cef"]);

export function isSpanishReserveTeam(id: string): boolean {
  return SPANISH_CUP_RESERVES.has(id);
}

/**
 * Participantes de la Copa del Rey: LaLiga EA Sports + LaLiga Hypermotion (sin filiales) + los 21 mejores clubes de la
 * Primera Federación (ambos grupos, sin filiales; por prestigio). Un mismo club nunca aparece dos veces.
 */
export function spanishCupIds(): { laliga: string[]; segunda: string[]; fed: string[] } {
  const laliga = divisionClubIds("laliga").filter((id) => !isSpanishReserveTeam(id));
  const segunda = divisionClubIds("segunda").filter((id) => !isSpanishReserveTeam(id));
  const fed = [...divisionClubIds("primeraFed1"), ...divisionClubIds("primeraFed2")]
    .filter((id) => !isSpanishReserveTeam(id))
    .sort((a, b) => clubById(b).prestige - clubById(a).prestige || a.localeCompare(b))
    .slice(0, COPA_DEL_REY_FED_SPOTS);
  return { laliga, segunda, fed };
}

/** ¿Este club juega la Copa del Rey? (LaLiga y Hypermotion sí, salvo filiales; Primera Federación solo los clasificados.) */
export function playsCopaDelRey(id: string): boolean {
  const { laliga, segunda, fed } = spanishCupIds();
  return laliga.includes(id) || segunda.includes(id) || fed.includes(id);
}

export type PlayableLeague = PlayableLeagueId;

export const LEAGUE_INFO: Record<
  PlayableLeague,
  {
    id: PlayableLeague;
    competition: Competition;
    title: string;
    cup: string;
    superCup: string;
    goal: string;
    rest: string;
    region: string;
  }
> = {
  serieA: {
    id: "serieA",
    competition: "serieA",
    title: "Serie A",
    cup: "Coppa Italia",
    superCup: "Supercoppa Italiana",
    goal: "Objetivo: pelear el scudetto y no malvender el futuro.",
    rest: "Resto de la Serie A",
    region: "Italia",
  },
  serieB: {
    id: "serieB",
    competition: "serieB",
    title: "Serie B",
    cup: "Coppa Italia",
    superCup: "Supercoppa Italiana",
    goal: "Objetivo: pelear el ascenso a la Serie A y no malvender el futuro.",
    rest: "Resto de la Serie B",
    region: "Italia",
  },
  serieC: {
    id: "serieC",
    competition: "serieC",
    title: "Serie C",
    cup: "Coppa Italia",
    superCup: "Supercoppa Italiana",
    goal: "Objetivo: pelear el ascenso a la Serie B y consolidar la categoría.",
    rest: "Resto de la Serie C",
    region: "Italia",
  },
  serieD: {
    id: "serieD",
    competition: "serieD",
    title: "Serie D",
    cup: "Coppa Italia",
    superCup: "Supercoppa Italiana",
    goal: "Objetivo: competir por el ascenso a la Serie C y fortalecer el proyecto.",
    rest: "Resto de la Serie D",
    region: "Italia",
  },
  premier: {
    id: "premier",
    competition: "premier",
    title: "Premier League",
    cup: "FA Cup",
    superCup: "Community Shield",
    goal: "Objetivo: pelear la Premier League y no malvender el futuro.",
    rest: "Resto de la Premier League",
    region: "Inglaterra",
  },
  championship: {
    id: "championship",
    competition: "championship",
    title: "Championship",
    cup: "FA Cup",
    superCup: "Community Shield",
    goal: "Objetivo: pelear el ascenso a la Premier League y no malvender el futuro.",
    rest: "Resto de la Championship",
    region: "Inglaterra",
  },
  leagueOne: {
    id: "leagueOne",
    competition: "leagueOne",
    title: "League One",
    cup: "FA Cup",
    superCup: "Community Shield",
    goal: "Objetivo: pelear los puestos de ascenso de la League One y no malvender el futuro.",
    rest: "Resto de la League One",
    region: "Inglaterra",
  },
  leagueTwo: {
    id: "leagueTwo",
    competition: "leagueTwo",
    title: "EFL League Two",
    cup: "FA Cup",
    superCup: "Community Shield",
    goal: "Objetivo: competir por el ascenso a League One.",
    rest: "Resto de la League Two",
    region: "Inglaterra",
  },
  laliga: {
    id: "laliga",
    competition: "laliga",
    title: "LaLiga EA Sports",
    cup: "Copa del Rey",
    superCup: "Supercopa de España",
    goal: "Objetivo: pelear La Liga y no malvender el futuro.",
    rest: "Resto de La Liga",
    region: "España",
  },
  segunda: {
    id: "segunda",
    competition: "segunda",
    title: "LaLiga Hypermotion",
    cup: "Copa del Rey",
    superCup: "Supercopa de España",
    goal: "Objetivo: pelear el ascenso a LaLiga EA Sports y no malvender el futuro.",
    rest: "Resto de LaLiga Hypermotion",
    region: "España",
  },
  primeraFed1: {
    id: "primeraFed1",
    competition: "primeraFed1",
    title: "Primera Federación · Grupo 1",
    cup: "Copa del Rey",
    superCup: "Supercopa de España",
    goal: "Objetivo: pelear el ascenso a LaLiga Hypermotion y no malvender el futuro.",
    rest: "Resto del Grupo 1",
    region: "España",
  },
  primeraFed2: {
    id: "primeraFed2",
    competition: "primeraFed2",
    title: "Primera Federación · Grupo 2",
    cup: "Copa del Rey",
    superCup: "Supercopa de España",
    goal: "Objetivo: pelear el ascenso a LaLiga Hypermotion y no malvender el futuro.",
    rest: "Resto del Grupo 2",
    region: "España",
  },
  bundesliga: {
    id: "bundesliga",
    competition: "bundesliga",
    title: "Bundesliga",
    cup: "DFB-Pokal",
    superCup: "DFL-Supercup",
    goal: "Objetivo: pelear la Meisterschale y no malvender el futuro.",
    rest: "Resto de la Bundesliga",
    region: "Alemania",
  },
  bundesliga2: {
    id: "bundesliga2",
    competition: "bundesliga2",
    title: "2. Bundesliga",
    cup: "DFB-Pokal",
    superCup: "DFL-Supercup",
    goal: "Objetivo: pelear el ascenso a la Bundesliga y no malvender el futuro.",
    rest: "Resto de la 2. Bundesliga",
    region: "Alemania",
  },
  bundesliga3: {
    id: "bundesliga3",
    competition: "bundesliga3",
    title: "3. Liga",
    // La 3. Liga no juega la DFB-Pokal en este modo (solo Bundesliga + 2. Bundesliga): sin copa ni supercopa propias.
    cup: "DFB-Pokal",
    superCup: "DFL-Supercup",
    goal: "Objetivo: pelear el ascenso a la 2. Bundesliga y no malvender el futuro.",
    rest: "Resto de la 3. Liga",
    region: "Alemania",
  },
  ligue1: {
    id: "ligue1",
    competition: "ligue1",
    title: "Ligue 1",
    cup: "Coupe de France",
    superCup: "Trophée des Champions",
    goal: "Objetivo: pelear la Ligue 1 y no malvender el futuro.",
    rest: "Resto de la Ligue 1",
    region: "Francia",
  },
  ligue2: {
    id: "ligue2",
    competition: "ligue2",
    title: "Ligue 2",
    cup: "Coupe de France",
    superCup: "Trophée des Champions",
    goal: "Objetivo: pelear el ascenso a la Ligue 1 y no malvender el futuro.",
    rest: "Resto de la Ligue 2",
    region: "Francia",
  },
  ligue3: {
    id: "ligue3",
    competition: "ligue3",
    title: "Ligue 3",
    cup: "Coupe de France",
    superCup: "Trophée des Champions",
    goal: "Objetivo: luchar por el ascenso a la Ligue 2 y desarrollar el club.",
    rest: "Resto de la Ligue 3",
    region: "Francia",
  },
  argentina: {
    id: "argentina",
    competition: "argentina",
    title: "Liga Profesional",
    cup: "Copa Argentina",
    superCup: "SuperCopa Argentina",
    goal: "Objetivo: pelear el campeonato y clasificar a Libertadores.",
    rest: "Resto de la Liga Profesional",
    region: "Argentina",
  },
  primeraNacional: {
    id: "primeraNacional",
    competition: "primeraNacional",
    title: "Primera Nacional",
    cup: "Copa Argentina",
    superCup: "SuperCopa Argentina",
    goal: "Objetivo: pelear el ascenso a la Liga Profesional y no malvender el futuro.",
    rest: "Resto de la Primera Nacional",
    region: "Argentina",
  },
  primeraBMetro: {
    id: "primeraBMetro",
    competition: "primeraBMetro",
    title: "Primera B Metro / Federal A",
    cup: "Copa Argentina",
    superCup: "SuperCopa Argentina",
    goal: "Objetivo: luchar por el ascenso a la Primera Nacional desde la tercera división.",
    rest: "Resto de la Tercera División Argentina",
    region: "Argentina",
  },
  argentinaCuarta: {
    id: "argentinaCuarta",
    competition: "argentinaCuarta",
    title: "Cuarta División Argentina",
    cup: "Copa Argentina",
    superCup: "SuperCopa Argentina",
    goal: "Objetivo: luchar por el ascenso a la tercera división.",
    rest: "Resto de la Cuarta División",
    region: "Argentina",
  },
  argentinaQuinta: {
    id: "argentinaQuinta",
    competition: "argentinaQuinta",
    title: "Quinta División Argentina",
    cup: "Copa Argentina",
    superCup: "SuperCopa Argentina",
    goal: "Objetivo: luchar por el ascenso a la Cuarta División.",
    rest: "Resto de la Quinta División",
    region: "Argentina",
  },
  promocionalAmateur: {
    id: "promocionalAmateur",
    competition: "promocionalAmateur",
    title: "Torneo Promocional Amateur",
    cup: "No participa en la Copa Argentina",
    superCup: "Sin supercopa",
    goal: "Objetivo: luchar por el ascenso a la Quinta División.",
    rest: "Resto del Torneo Promocional Amateur",
    region: "Argentina",
  },
  brasileirao: {
    id: "brasileirao",
    competition: "brasileirao",
    title: "Brasileirão",
    cup: "Copa do Brasil",
    superCup: "Supercopa do Brasil",
    goal: "Objetivo: pelear el Brasileirão y clasificar a la Libertadores.",
    rest: "Resto del Brasileirão",
    region: "Brasil",
  },
  brasileiraoB: {
    id: "brasileiraoB",
    competition: "brasileiraoB",
    title: "Brasileirão Série B",
    cup: "Copa do Brasil",
    superCup: "Supercopa do Brasil",
    goal: "Objetivo: pelear los primeros puestos de la Série B y no malvender el futuro.",
    rest: "Resto de la Série B",
    region: "Brasil",
  },
  brasileiraoC: {
    id: "brasileiraoC",
    competition: "brasileiraoC",
    title: "Brasileirão Série C",
    cup: "Copa do Brasil",
    superCup: "Sin supercopa",
    goal: "Objetivo: luchar por el ascenso a la Série B y sostener el proyecto.",
    rest: "Resto del Brasileirão Série C",
    region: "Brasil",
  },
  primeira: {
    id: "primeira",
    competition: "primeira",
    title: "Primeira Liga",
    cup: "Taça de Portugal",
    superCup: "Supertaça Cândido de Oliveira",
    goal: "Objetivo: pelear la Primeira Liga y no malvender el futuro.",
    rest: "Resto de la Primeira Liga",
    region: "Portugal",
  },
  primeira2: {
    id: "primeira2",
    competition: "primeira2",
    title: "Liga Portugal 2",
    cup: "Taça de Portugal",
    superCup: "Supertaça Cândido de Oliveira",
    goal: "Objetivo: pelear el ascenso a la Primeira Liga y no malvender el futuro.",
    rest: "Resto de la Liga Portugal 2",
    region: "Portugal",
  },
  eredivisie: {
    id: "eredivisie",
    competition: "eredivisie",
    title: "Eredivisie",
    cup: "KNVB Beker",
    superCup: "Johan Cruijff Schaal",
    goal: "Objetivo: competir por la Eredivisie y asegurar una plaza europea.",
    rest: "Resto de la Eredivisie",
    region: "Países Bajos",
  },
  eersteDivisie: {
    id: "eersteDivisie",
    competition: "eersteDivisie",
    title: "Eerste Divisie",
    cup: "KNVB Beker",
    superCup: "Johan Cruijff Schaal",
    goal: "Objetivo: competir por el ascenso a la Eredivisie.",
    rest: "Resto de la Eerste Divisie",
    region: "Países Bajos",
  },
  tweedeDivisie: {
    id: "tweedeDivisie",
    competition: "tweedeDivisie",
    title: "Tweede Divisie",
    cup: "KNVB Beker",
    superCup: "Johan Cruijff Schaal",
    goal: "Objetivo: competir en la Tweede Divisie y desarrollar el club.",
    rest: "Resto de la Tweede Divisie",
    region: "Países Bajos",
  },
  mls: {
    id: "mls",
    competition: "mls",
    title: "MLS",
    cup: "MLS Cup",
    superCup: "MLS Cup",
    goal: "Objetivo: competir por la MLS y clasificar a los playoffs.",
    rest: "Resto de la MLS",
    region: "Estados Unidos",
  },
  uslChampionship: {
    id: "uslChampionship",
    competition: "uslChampionship",
    title: "USL Championship",
    cup: "USL Cup",
    superCup: "USL Cup",
    goal: "Objetivo: competir por el título de la USL Championship.",
    rest: "Resto de la USL Championship",
    region: "Estados Unidos",
  },
  saudiProLeague: {
    id: "saudiProLeague",
    competition: "saudiProLeague",
    title: "Saudi Pro League",
    cup: "Sin copa nacional implementada",
    superCup: "Sin supercopa",
    goal: "Objetivo: competir por la Saudi Pro League y clasificar a las competiciones continentales.",
    rest: "Resto de la Saudi Pro League",
    region: "Arabia Saudita",
  },
  saudiFirstDivision: {
    id: "saudiFirstDivision",
    competition: "saudiFirstDivision",
    title: "Saudi First Division League",
    cup: "Sin copa nacional implementada",
    superCup: "Sin supercopa",
    goal: "Objetivo: luchar por el ascenso a la Saudi Pro League.",
    rest: "Resto de la Saudi First Division League",
    region: "Arabia Saudita",
  },
};

/** Para cada 1ª división con segunda propia, la liga de esa segunda (Premier → Championship, LaLiga → Hypermotion, Liga Profesional → Primera Nacional). */
export const SECOND_LEAGUE_OF: Partial<Record<PlayableLeague, PlayableLeague>> = {
  premier: "championship",
  leagueOne: "leagueTwo",
  serieA: "serieB",
  serieB: "serieC",
  serieC: "serieD",
  laliga: "segunda",
  bundesliga: "bundesliga2",
  ligue1: "ligue2",
  ligue2: "ligue3",
  argentina: "primeraNacional",
  primeraNacional: "primeraBMetro",
  argentinaCuarta: "argentinaQuinta",
  argentinaQuinta: "promocionalAmateur",
  brasileirao: "brasileiraoB",
  primeira: "primeira2",
  eredivisie: "eersteDivisie",
  eersteDivisie: "tweedeDivisie",
  mls: "uslChampionship",
  saudiProLeague: "saudiFirstDivision",
};

/** Para cada 1ª división con tercera jugable, la liga de esa tercera (Premier → League One). */
export const THIRD_LEAGUE_OF: Partial<Record<PlayableLeague, PlayableLeague>> = {
  premier: "leagueOne",
  serieA: "serieC",
  brasileirao: "brasileiraoC",
  // La 3.ª división española son dos grupos (primeraFed1 y primeraFed2): la selección de club junta los dos (ver select-club.tsx).
  laliga: "primeraFed1",
  // La 3. Liga alemana (3.ª división): se elige desde Alemania → 3ª División.
  bundesliga: "bundesliga3",
  ligue1: "ligue3",
  argentina: "primeraBMetro",
};

/** Cuartas divisiones jugables, seleccionables desde la liga de su país. */
export const FOURTH_LEAGUE_OF: Partial<Record<PlayableLeague, PlayableLeague>> = {
  premier: "leagueTwo",
  serieA: "serieD",
  argentina: "argentinaCuarta",
};

/** Quinta división argentina, seleccionable desde el bloque de Argentina. */
export const FIFTH_LEAGUE_OF: Partial<Record<PlayableLeague, PlayableLeague>> = {
  argentina: "argentinaQuinta",
};

/** Sexto nivel de la pirámide argentina personalizada. */
export const SIXTH_LEAGUE_OF: Partial<Record<PlayableLeague, PlayableLeague>> = {
  argentina: "promocionalAmateur",
};

/** Las dos ligas (grupos) de la Primera Federación. */
export const FED_GROUPS: PlayableLeague[] = ["primeraFed1", "primeraFed2"];
export function isFedLeague(league: LeagueKind): boolean {
  return league === "primeraFed1" || league === "primeraFed2";
}

/**
 * Nombre de cada 2ª división. `available` = el usuario puede elegir un club de esa división al empezar. La Championship
 * sí; LaLiga Hypermotion y la Primera Nacional existen y compiten, pero sus clubes tienen plantilla provisional (1 jugador)
 * hasta que lleguen las plantillas completas (se muestran, pero todavía no se pueden dirigir al empezar).
 */
export const SECOND_DIVISION: Record<PlayableLeague, { title: string; available: boolean; preview?: boolean }> = {
  serieA: { title: "Serie B", available: true },
  serieB: { title: "Serie C", available: true },
  serieC: { title: "Serie D", available: true },
  serieD: { title: "Serie E", available: false },
  premier: { title: "Championship", available: true },
  championship: { title: "League One", available: true },
  leagueOne: { title: "League Two", available: true },
  leagueTwo: { title: "National League", available: false },
  // La Primera Federación (2 grupos de 20) ya es jugable: se puede empezar un modo carrera con cualquiera de sus 40 clubes.
  segunda: { title: "Primera Federación", available: true },
  primeraFed1: { title: "Segunda Federación", available: false },
  primeraFed2: { title: "Segunda Federación", available: false },
  primeraNacional: { title: "Primera B Metro / Federal A", available: true },
  primeraBMetro: { title: "No disponible", available: false },
  argentinaCuarta: { title: "Quinta División Argentina", available: true },
  argentinaQuinta: { title: "Torneo Promocional Amateur", available: true },
  promocionalAmateur: { title: "No disponible", available: false },
  laliga: { title: "LaLiga Hypermotion", available: false, preview: true },
  bundesliga: { title: "2. Bundesliga", available: true },
  // La 3. Liga ya es jugable (sin ascensos ni descensos todavía): se puede empezar un modo carrera con cualquiera de sus 20 clubes.
  bundesliga2: { title: "3. Liga", available: true },
  bundesliga3: { title: "Regionalliga", available: false },
  ligue1: { title: "Ligue 2", available: true },
  ligue2: { title: "Ligue 3", available: true },
  ligue3: { title: "National 2", available: false },
  argentina: { title: "Primera Nacional", available: true },
  // La Série B ya es jugable (sin ascensos ni descensos todavía): se puede empezar un modo carrera con cualquiera de sus 20 clubes.
  brasileirao: { title: "Série B", available: true },
  brasileiraoB: { title: "Série C", available: true },
  brasileiraoC: { title: "Sin división inferior jugable", available: false },
  // La Liga Portugal 2 ya es jugable y tiene ascensos y descensos con la Primeira Liga (la Liga 3 no es jugable).
  primeira: { title: "Liga Portugal 2", available: true },
  primeira2: { title: "Liga 3", available: false },
  eredivisie: { title: "Eerste Divisie", available: true },
  eersteDivisie: { title: "Tweede Divisie", available: true },
  tweedeDivisie: { title: "Vierde Divisie", available: false },
  mls: { title: "USL Championship", available: true },
  uslChampionship: { title: "USL League One", available: false },
  saudiProLeague: { title: "Saudi First Division League", available: true },
  saudiFirstDivision: { title: "No disponible", available: false },
};

export function playableLeague(league: LeagueKind): PlayableLeague {
  if (league === "premier") return "premier";
  if (league === "serieA") return "serieA";
  if (league === "serieB") return "serieB";
  if (league === "serieC") return "serieC";
  if (league === "serieD") return "serieD";
  if (league === "championship") return "championship";
  if (league === "leagueOne") return "leagueOne";
  if (league === "leagueTwo") return "leagueTwo";
  if (league === "laliga") return "laliga";
  if (league === "segunda") return "segunda";
  if (league === "primeraFed1") return "primeraFed1";
  if (league === "primeraFed2") return "primeraFed2";
  if (league === "bundesliga") return "bundesliga";
  if (league === "bundesliga2") return "bundesliga2";
  if (league === "bundesliga3") return "bundesliga3";
  if (league === "ligue1") return "ligue1";
  if (league === "ligue2") return "ligue2";
  if (league === "ligue3") return "ligue3";
  if (league === "argentina") return "argentina";
  if (league === "primeraNacional") return "primeraNacional";
  if (league === "primeraBMetro") return "primeraBMetro";
  if (league === "argentinaCuarta") return "argentinaCuarta";
  if (league === "argentinaQuinta") return "argentinaQuinta";
  if (league === "promocionalAmateur") return "promocionalAmateur";
  if (league === "brasileirao") return "brasileirao";
  if (league === "brasileiraoB") return "brasileiraoB";
  if (league === "brasileiraoC") return "brasileiraoC";
  if (league === "primeira") return "primeira";
  if (league === "primeira2") return "primeira2";
  if (league === "eredivisie") return "eredivisie";
  if (league === "eersteDivisie") return "eersteDivisie";
  if (league === "tweedeDivisie") return "tweedeDivisie";
  if (league === "mls") return "mls";
  if (league === "uslChampionship") return "uslChampionship";
  if (league === "saudiProLeague") return "saudiProLeague";
  if (league === "saudiFirstDivision") return "saudiFirstDivision";
  return "serieA";
}

export function leagueInfo(league: LeagueKind) {
  return LEAGUE_INFO[playableLeague(league)];
}

export function domesticIds(league: LeagueKind): string[] {
  if (league === "premier" || league === "championship" || league === "leagueOne" || league === "leagueTwo") {
    return englishClubIds(league);
  }
  if (league === "laliga" || league === "segunda") return divisionClubIds(league);
  // Primera Federación: dos grupos de 20 clubes, dinámicos (los ascensos y descensos los reparten cada temporada).
  if (league === "primeraFed1" || league === "primeraFed2") return divisionClubIds(league);
  // Serie A / Serie B / Serie C / Serie D y Bundesliga / 2. Bundesliga: dinámicas (los ascensos y descensos las cambian cada temporada).
  if (
    league === "serieA" ||
    league === "serieB" ||
    league === "serieC" ||
    league === "serieD" ||
    league === "bundesliga" ||
    league === "bundesliga2"
  ) return divisionClubIds(league);
  // 3. Liga: 20 clubes fijos (sin ascensos ni descensos todavía), no se mueven de la categoría.
  if (league === "bundesliga3") return divisionClubIds(league);
  // Ligue 1 / Ligue 2 / Ligue 3: dinámicas (los ascensos y descensos las cambian cada temporada).
  if (league === "ligue1" || league === "ligue2" || league === "ligue3") return divisionClubIds(league);
  if (
    league === "argentina" ||
    league === "primeraNacional" ||
    league === "primeraBMetro" ||
    league === "argentinaCuarta" ||
    league === "argentinaQuinta" ||
    league === "promocionalAmateur"
  ) return divisionClubIds(league);
  if (league === "brasileirao" || league === "brasileiraoB" || league === "brasileiraoC") return divisionClubIds(league);
  // Primeira Liga / Liga Portugal 2: dinámicas (los ascensos y descensos las cambian cada temporada).
  if (
    league === "primeira" ||
    league === "primeira2" ||
    league === "eredivisie" ||
    league === "eersteDivisie" ||
    league === "tweedeDivisie"
    || league === "mls"
    || league === "uslChampionship"
    || league === "saudiProLeague"
    || league === "saudiFirstDivision"
  ) return divisionClubIds(league);
  return divisionClubIds("serieA");
}

export function domesticCompetition(league: LeagueKind): Competition {
  return leagueInfo(league).competition;
}

export function isDomesticCompetition(comp: Competition): boolean {
  return (
    comp === "serieA" ||
    comp === "serieB" ||
    comp === "serieC" ||
    comp === "serieD" ||
    comp === "premier" ||
    comp === "championship" ||
    comp === "leagueOne" ||
    comp === "leagueTwo" ||
    comp === "laliga" ||
    comp === "segunda" ||
    comp === "primeraFed1" ||
    comp === "primeraFed2" ||
    comp === "bundesliga" ||
    comp === "bundesliga3" ||
    comp === "ligue1" ||
    comp === "ligue3" ||
    comp === "argentina" ||
    comp === "primeraNacional" ||
    comp === "primeraBMetro" ||
    comp === "argentinaCuarta" ||
    comp === "argentinaQuinta" ||
    comp === "promocionalAmateur" ||
    comp === "brasileirao" ||
    comp === "brasileiraoB" ||
    comp === "brasileiraoC" ||
    comp === "primeira" ||
    comp === "primeira2" ||
    comp === "eredivisie" ||
    comp === "eersteDivisie" ||
    comp === "tweedeDivisie"
    || comp === "mls"
    || comp === "uslChampionship"
    || comp === "saudiProLeague"
    || comp === "saudiFirstDivision"
  );
}

export function competitionToLeague(comp: Competition): PlayableLeague | null {
  if (comp === "serieA") return "serieA";
  if (comp === "serieB") return "serieB";
  if (comp === "serieC") return "serieC";
  if (comp === "serieD") return "serieD";
  if (comp === "premier") return "premier";
  if (comp === "championship") return "championship";
  if (comp === "leagueOne") return "leagueOne";
  if (comp === "leagueTwo") return "leagueTwo";
  if (comp === "laliga") return "laliga";
  if (comp === "segunda") return "segunda";
  if (comp === "primeraFed1") return "primeraFed1";
  if (comp === "primeraFed2") return "primeraFed2";
  if (comp === "bundesliga") return "bundesliga";
  if (comp === "bundesliga2") return "bundesliga2";
  if (comp === "bundesliga3") return "bundesliga3";
  if (comp === "ligue1") return "ligue1";
  if (comp === "ligue2") return "ligue2";
  if (comp === "ligue3") return "ligue3";
  if (comp === "argentina") return "argentina";
  if (comp === "primeraNacional") return "primeraNacional";
  if (comp === "primeraBMetro") return "primeraBMetro";
  if (comp === "argentinaCuarta") return "argentinaCuarta";
  if (comp === "argentinaQuinta") return "argentinaQuinta";
  if (comp === "promocionalAmateur") return "promocionalAmateur";
  if (comp === "brasileirao") return "brasileirao";
  if (comp === "brasileiraoB") return "brasileiraoB";
  if (comp === "brasileiraoC") return "brasileiraoC";
  if (comp === "primeira") return "primeira";
  if (comp === "primeira2") return "primeira2";
  if (comp === "eredivisie") return "eredivisie";
  if (comp === "eersteDivisie") return "eersteDivisie";
  if (comp === "tweedeDivisie") return "tweedeDivisie";
  if (comp === "mls") return "mls";
  if (comp === "uslChampionship") return "uslChampionship";
  if (comp === "saudiProLeague") return "saudiProLeague";
  if (comp === "saudiFirstDivision") return "saudiFirstDivision";
  return null;
}

export function foreignClubIds(userLeague: LeagueKind): string[] {
  return CLUBS.filter((c) => c.league !== userLeague && !c.ghost).map((c) => c.id);
}

export const UCL_GROUPS: string[][] = [
  ["int", "rma", "che", "bru"],
  ["nap", "mci", "ars", "atl"],
  ["rom", "bay", "liv", "rbl"],
  ["com", "psg", "dor", "bar"],
];

export const UCL_CLUB_IDS = UCL_GROUPS.flat();

const FALLBACK_CLUB: Club = {
  id: "unk",
  name: "Club",
  short: "?",
  city: "",
  stadium: "",
  capacity: 0,
  color: "#6a6660",
  color2: "#12141a",
  league: "serieA",
  prestige: 60,
  crest: crestUrl("unk"),
};

/**
 * Los titulares de las ligas B (2ª divisiones) rondan entre 5 y 14 puntos POR ENCIMA del prestigio del club (en las
 * ligas de Primera el once ronda el prestigio). Este desfase, medido sobre las plantillas generadas, corrige el nivel
 * de juego esperado de cada club: la IA de mercado lo usa para detectar necesidades y fijar a quién puede fichar.
 */
const LEAGUE_LEVEL_BONUS: Partial<Record<Club["league"], number>> = {
  championship: 9,
  // League One: sus titulares rondan 54-66 de GRL, unos 10 puntos por encima del prestigio del club (38-58).
  leagueOne: 10,
  // League Two: plantilla profesional de cuarta categoría, por debajo de League One.
  leagueTwo: 11,
  segunda: 5,
  rfef: 5,
  // Primera Federación (3.ª división española): sus titulares rondan 50-62 de GRL, unos 12 puntos por encima del prestigio (38-60).
  primeraFed1: 12,
  primeraFed2: 12,
  serieB: 10,
  serieC: 12,
  serieD: 14,
  bundesliga2: 9,
  // 3. Liga: sus titulares rondan 46-60 de GRL, unos 8 puntos por encima del prestigio del club (40-55).
  bundesliga3: 8,
  ligue2: 14,
  ligue3: 18,
  primeraNacional: 12,
  primeraBMetro: 16,
  argentinaCuarta: 19,
  argentinaQuinta: 22,
  promocionalAmateur: 25,
  // Série B brasileña: sus titulares rondan 58-68 de GRL (la Série A va de ~62 a ~82 en su once).
  brasileiraoB: 6,
  brasileiraoC: 4,
  // Liga Portugal 2: sus titulares rondan 52-64 de GRL, unos 8 puntos por encima del prestigio del club (46-58).
  primeira2: 8,
  eersteDivisie: 7,
  tweedeDivisie: 3,
  uslChampionship: 8,
  saudiFirstDivision: 7,
};

/** Nivel de juego (GRL) esperado de los titulares de un club: prestigio + desfase de su división. */
export function clubRating(club: Club): number {
  return club.prestige + (LEAGUE_LEVEL_BONUS[club.league] ?? 0);
}

/** ¿Es una liga B (segunda división de alguna de las ligas del juego)? */
export function isSecondDivisionClub(club: Club): boolean {
  return club.league in LEAGUE_LEVEL_BONUS;
}

export function findClub(id: string): Club | undefined {
  if (!id) return undefined;
  const canonicalId = LEGACY_CLUB_IDS[id] ?? id;
  return CLUB_BY_ID.get(canonicalId);
}

const LEGACY_CLUB_IDS: Record<string, string> = {
  usmia: "us_mia",
  uslaf: "us_laf",
  ussea: "us_sea",
  saahl: "sau_hil",
  saaln: "sau_nas",
  saahli: "sau_ahl",
};

export function isGhostClub(id: string): boolean {
  return Boolean(findClub(id)?.ghost);
}

export function isSelectableClub(id: string): boolean {
  const c = findClub(id);
  if (!c || c.ghost) return false;
  // Los clubes "provisionales" ya arrancan con plantilla completa (buildSquad
  // junta MANUAL_SQUADS + STARS y completa con generados), así que todos se pueden dirigir.
  return (
    c.league === "serieA" ||
    c.league === "serieB" ||
    c.league === "serieC" ||
    c.league === "serieD" ||
    c.league === "premier" ||
    c.league === "championship" ||
    c.league === "leagueOne" ||
    c.league === "leagueTwo" ||
    c.league === "laliga" ||
    c.league === "segunda" ||
    c.league === "primeraFed1" ||
    c.league === "primeraFed2" ||
    c.league === "bundesliga" ||
    c.league === "bundesliga2" ||
    c.league === "bundesliga3" ||
    c.league === "ligue1" ||
    c.league === "ligue2" ||
    c.league === "ligue3" ||
    c.league === "argentina" ||
    c.league === "primeraNacional" ||
    c.league === "primeraBMetro" ||
    c.league === "argentinaCuarta" ||
    c.league === "argentinaQuinta" ||
    c.league === "promocionalAmateur" ||
    c.league === "brasileirao" ||
    c.league === "brasileiraoB" ||
    c.league === "brasileiraoC" ||
    c.league === "primeira" ||
    c.league === "primeira2" ||
    c.league === "eredivisie" ||
    c.league === "eersteDivisie" ||
    c.league === "tweedeDivisie"
    || c.league === "mls"
    || c.league === "uslChampionship"
    || c.league === "saudiProLeague"
    || c.league === "saudiFirstDivision"
  );
}

export function isTradableClub(id: string): boolean {
  const c = findClub(id);
  return Boolean(c && !c.ghost);
}

export function isKnownClub(id: string): boolean {
  return Boolean(findClub(id));
}

/** Never throws — unknown ids get a placeholder so a stale save cannot blank the app. */
export function clubById(id: string): Club {
  const c = findClub(id);
  if (c) return c;
  const short = (id || "?").slice(0, 3).toUpperCase();
  return { ...FALLBACK_CLUB, id: id || "unk", name: short, short };
}

/** Caja inicial del manager, ajustada a la categoría para que el salto económico sea gradual. */
export function startingBudget(prestige: number, league?: LeagueKind) {
  const raw = Math.pow(prestige / 10, 3.15) * 90_000;
  const factors: Partial<Record<LeagueKind, number>> = {
    championship: 0.2,
    segunda: 0.2,
    primeraNacional: 0.2,
    leagueOne: 0.1,
    leagueTwo: 0.05,
    serieB: 0.18,
    serieC: 0.08,
    serieD: 0.04,
    brasileiraoB: 0.18,
    brasileiraoC: 0.08,
    bundesliga2: 0.18,
    bundesliga3: 0.08,
    ligue2: 0.18,
    ligue3: 0.07,
    primeraBMetro: 0.07,
    argentinaCuarta: 0.04,
    argentinaQuinta: 0.025,
    promocionalAmateur: 0.015,
    primeira2: 0.1,
    primeraFed1: 0.04,
    primeraFed2: 0.04,
    primeira: 0.5,
    eredivisie: 0.55,
    eersteDivisie: 0.12,
    tweedeDivisie: 0.06,
    mls: 0.65,
    uslChampionship: 0.08,
    saudiProLeague: 0.8,
    saudiFirstDivision: 0.12,
  };
  const factor = league ? (factors[league] ?? 1) : 1;
  return Math.round(raw * factor);
}

export function emptyStanding(clubId: string): Standing {
  return {
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    pts: 0,
    form: [],
  };
}

export function emptyLeagueTables(): LeagueTables {
  return {
    serieA: domesticIds("serieA").map(emptyStanding),
    serieB: domesticIds("serieB").map(emptyStanding),
    serieC: domesticIds("serieC").map(emptyStanding),
    serieD: domesticIds("serieD").map(emptyStanding),
    premier: domesticIds("premier").map(emptyStanding),
    championship: domesticIds("championship").map(emptyStanding),
    leagueOne: domesticIds("leagueOne").map(emptyStanding),
    leagueTwo: domesticIds("leagueTwo").map(emptyStanding),
    laliga: domesticIds("laliga").map(emptyStanding),
    segunda: domesticIds("segunda").map(emptyStanding),
    primeraFed1: domesticIds("primeraFed1").map(emptyStanding),
    primeraFed2: domesticIds("primeraFed2").map(emptyStanding),
    bundesliga: domesticIds("bundesliga").map(emptyStanding),
    bundesliga2: domesticIds("bundesliga2").map(emptyStanding),
    bundesliga3: domesticIds("bundesliga3").map(emptyStanding),
    ligue1: domesticIds("ligue1").map(emptyStanding),
    ligue2: domesticIds("ligue2").map(emptyStanding),
    ligue3: domesticIds("ligue3").map(emptyStanding),
    argentina: domesticIds("argentina").map(emptyStanding),
    primeraNacional: domesticIds("primeraNacional").map(emptyStanding),
    primeraBMetro: domesticIds("primeraBMetro").map(emptyStanding),
    argentinaCuarta: domesticIds("argentinaCuarta").map(emptyStanding),
    argentinaQuinta: domesticIds("argentinaQuinta").map(emptyStanding),
    promocionalAmateur: domesticIds("promocionalAmateur").map(emptyStanding),
    brasileirao: domesticIds("brasileirao").map(emptyStanding),
    brasileiraoB: domesticIds("brasileiraoB").map(emptyStanding),
    brasileiraoC: domesticIds("brasileiraoC").map(emptyStanding),
    primeira: domesticIds("primeira").map(emptyStanding),
    primeira2: domesticIds("primeira2").map(emptyStanding),
    eredivisie: domesticIds("eredivisie").map(emptyStanding),
    eersteDivisie: domesticIds("eersteDivisie").map(emptyStanding),
    tweedeDivisie: domesticIds("tweedeDivisie").map(emptyStanding),
    mls: domesticIds("mls").map(emptyStanding),
    uslChampionship: domesticIds("uslChampionship").map(emptyStanding),
    saudiProLeague: domesticIds("saudiProLeague").map(emptyStanding),
    saudiFirstDivision: domesticIds("saudiFirstDivision").map(emptyStanding),
  };
}

export const ALL_PLAYABLE_LEAGUES: PlayableLeague[] = [
  "serieA",
  "serieB",
  "serieC",
  "serieD",
  "premier",
  "championship",
  "leagueOne",
  "leagueTwo",
  "laliga",
  "segunda",
  "primeraFed1",
  "primeraFed2",
  "bundesliga",
  "bundesliga2",
  "bundesliga3",
  "ligue1",
  "ligue2",
  "ligue3",
  "argentina",
  "primeraNacional",
  "primeraBMetro",
  "argentinaCuarta",
  "argentinaQuinta",
  "promocionalAmateur",
  "brasileirao",
  "brasileiraoB",
  "brasileiraoC",
  "primeira",
  "primeira2",
  "eredivisie",
  "eersteDivisie",
  "tweedeDivisie",
  "mls",
  "uslChampionship",
  "saudiProLeague",
  "saudiFirstDivision",
];
