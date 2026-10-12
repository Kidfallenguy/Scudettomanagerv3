import { crestUrl } from "./crests";
import { GHOST_CLUBS } from "./fictional";
import type { Club, Competition, LeagueKind, LeagueTables, PlayableLeagueId, Standing } from "./types";

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
    ["ch_nor", "Norwich City", "NOR", "Norwich", "Carrow Road", 27359, "#00a650", "#fff200", 63],
    ["ch_bir", "Birmingham City", "BIR", "Birmingham", "St Andrew's", 29409, "#0000ff", "#ffffff", 66],
    ["ch_shu", "Sheffield United", "SHU", "Sheffield", "Bramall Lane", 32050, "#ee2737", "#ffffff", 62],
    ["ch_wba", "West Bromwich Albion", "WBA", "West Bromwich", "The Hawthorns", 26850, "#122f67", "#ffffff", 62],
    ["ch_blb", "Blackburn Rovers", "BLB", "Blackburn", "Ewood Park", 31367, "#009ee0", "#ffffff", 62],
    ["ch_car", "Cardiff City", "CAR", "Cardiff", "Cardiff City Stadium", 33280, "#0070b5", "#ffffff", 61],
    ["ch_der", "Derby County", "DER", "Derby", "Pride Park Stadium", 33597, "#ffffff", "#111111", 61],
    ["ch_wat", "Watford", "WAT", "Watford", "Vicarage Road", 22200, "#fbee23", "#ed2127", 61],
    ["ch_bri", "Bristol City", "BRI", "Bristol", "Ashton Gate", 26462, "#e21a2c", "#ffffff", 60],
    ["ch_cha", "Charlton Athletic", "CHA", "Londres", "The Valley", 27111, "#d4021d", "#ffffff", 60],
    ["ch_sto", "Stoke City", "STO", "Stoke-on-Trent", "bet365 Stadium", 30089, "#e03a3e", "#ffffff", 60],
    ["ch_swa", "Swansea City", "SWA", "Swansea", "Swansea.com Stadium", 21088, "#ffffff", "#111111", 60],
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
    ["sev", "Sevilla", "SEV", "Sevilla", "Ramón Sánchez-Pizjuán", 43883, "#d70f1f", "#ffffff", 79],
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
    ["rac", "Racing de Santander", "RAC", "Santander", "El Sardinero", 22308, "#006633", "#ffffff", 67],
    ["lev", "Levante", "LEV", "Valencia", "Ciutat de València", 26354, "#b1050f", "#0055a4", 68],
    ["elc", "Elche C. F.", "ELC", "Elche", "Martínez Valero", 31388, "#006333", "#ffffff", 69],
    ["val", "Valencia C. F.", "VAL", "Valencia", "Mestalla", 49430, "#ee3524", "#000000", 78],
    ["mlg", "Málaga", "MLG", "Málaga", "La Rosaleda", 30044, "#00a0e3", "#ffffff", 66],
  ] satisfies LigaSeed[]
).map(ligaClub);

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

/** 2026/27 Ligue 1 — 19 clubs besides Paris Saint-Germain. */
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
    ["fcn", "FC Nantes", "FCN", "Nantes", "La Beaujoire", 35322, "#ffed00", "#007a3d", 72],
    ["pfc", "Paris FC", "PFC", "París", "Stade Jean-Bouin", 20000, "#1a3a8c", "#ffffff", 70],
    ["aux", "AJ Auxerre", "AUX", "Auxerre", "Abbé-Deschamps", 18541, "#1a3a8a", "#ffffff", 69],
    ["hac", "Le Havre AC", "HAC", "Le Havre", "Stade Océane", 25178, "#1a4d8c", "#82c0e8", 68],
    ["ang", "Angers SCO", "ANG", "Angers", "Raymond-Kopa", 19351, "#ffffff", "#000000", 67],
    ["lor", "FC Lorient", "FCL", "Lorient", "Stade du Moustoir", 18890, "#f26522", "#000000", 67],
    ["met", "FC Metz", "FCM", "Metz", "Saint-Symphorien", 25636, "#6c1d45", "#ffffff", 66],
    ["tro", "ESTAC Troyes", "EST", "Troyes", "Stade de l'Aube", 20400, "#1e5aa8", "#ffffff", 65],
    ["lmn", "Le Mans FC", "LMN", "Le Mans", "MMArena", 25064, "#c8102e", "#ffd200", 64],
  ] satisfies LigueSeed[]
).map(ligueClub);

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
  ...BUNDESLIGA_EXTRA,
  ...LIGUE1_EXTRA,
  ...ARGENTINA_CLUBS,
];

export const CLUBS: Club[] = [...REAL_CLUBS, ...GHOST_CLUBS];

export const SERIE_A_IDS = uniqueIds(CLUBS.filter((c) => c.league === "serieA").map((c) => c.id));
/** Premier League 2026/27 de partida (los ascensos y descensos las cambian: usar {@link domesticIds}). */
export const PREMIER_IDS = uniqueIds(CLUBS.filter((c) => c.league === "premier").map((c) => c.id));
export const LALIGA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "laliga").map((c) => c.id));
export const BUNDESLIGA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "bundesliga").map((c) => c.id));
export const LIGUE1_IDS = uniqueIds(CLUBS.filter((c) => c.league === "ligue1").map((c) => c.id));
export const ARGENTINA_IDS = uniqueIds(CLUBS.filter((c) => c.league === "argentina").map((c) => c.id));

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

export type EnglishDivision = "premier" | "championship";

/** Todos los clubes que juegan (o pueden jugar) en las dos primeras divisiones inglesas. */
export const ENGLISH_IDS: string[] = uniqueIds(
  CLUBS.filter((c) => !c.ghost && (c.league === "premier" || c.league === "championship")).map((c) => c.id),
);

/** División de partida (2026/27) de cada club inglés. */
export const DEFAULT_DIVISIONS: Record<string, EnglishDivision> = Object.fromEntries(
  ENGLISH_IDS.map((id) => [id, CLUBS.find((c) => c.id === id)!.league as EnglishDivision]),
);

/** División inglesa actual de cada club (para guardar en la partida). */
export function currentDivisions(): Record<string, EnglishDivision> {
  const out: Record<string, EnglishDivision> = {};
  for (const id of ENGLISH_IDS) {
    const c = CLUBS.find((x) => x.id === id);
    out[id] = c?.league === "championship" ? "championship" : "premier";
  }
  return out;
}

/**
 * Pone a cada club inglés en su división (Premier / Championship). Sin argumento vuelve a la 2026/27.
 * Los ascensos y descensos cambian `club.league`, así que todo el juego (calendario, copas, tablas, nacionalidades,
 * presupuestos) ve siempre la división vigente. Se llama al cargar una partida, al empezar una y al cerrar la temporada.
 */
export function applyDivisions(divisions?: Record<string, EnglishDivision> | null) {
  for (const c of CLUBS) {
    if (!(c.id in DEFAULT_DIVISIONS)) continue;
    const want = divisions?.[c.id] ?? DEFAULT_DIVISIONS[c.id]!;
    if (want === "premier" || want === "championship") c.league = want;
  }
}

/** Clubes de una división inglesa, en el orden fijo de CLUBS. */
function englishClubIds(division: EnglishDivision): string[] {
  return uniqueIds(CLUBS.filter((c) => !c.ghost && c.league === division).map((c) => c.id));
}

/** Los 44 participantes de la FA Cup y la Carabao Cup: Premier + Championship actuales. */
export function englishCupIds(): { premier: string[]; championship: string[] } {
  return { premier: englishClubIds("premier"), championship: englishClubIds("championship") };
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
  laliga: {
    id: "laliga",
    competition: "laliga",
    title: "La Liga",
    cup: "Copa del Rey",
    superCup: "Supercopa de España",
    goal: "Objetivo: pelear La Liga y no malvender el futuro.",
    rest: "Resto de La Liga",
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
};

/** Nombre de cada 2ª división. Por ahora solo la Championship (Premier) es jugable. */
export const SECOND_DIVISION: Record<PlayableLeague, { title: string; available: boolean }> = {
  serieA: { title: "Serie B", available: false },
  premier: { title: "Championship", available: true },
  championship: { title: "League One", available: false },
  laliga: { title: "Segunda División", available: false },
  bundesliga: { title: "2. Bundesliga", available: false },
  ligue1: { title: "Ligue 2", available: false },
  argentina: { title: "Primera Nacional", available: false },
};

export function playableLeague(league: LeagueKind): PlayableLeague {
  if (league === "premier") return "premier";
  if (league === "championship") return "championship";
  if (league === "laliga") return "laliga";
  if (league === "bundesliga") return "bundesliga";
  if (league === "ligue1") return "ligue1";
  if (league === "argentina") return "argentina";
  return "serieA";
}

export function leagueInfo(league: LeagueKind) {
  return LEAGUE_INFO[playableLeague(league)];
}

export function domesticIds(league: LeagueKind): string[] {
  if (league === "premier" || league === "championship") return englishClubIds(league);
  if (league === "laliga") return LALIGA_IDS;
  if (league === "bundesliga") return BUNDESLIGA_IDS;
  if (league === "ligue1") return LIGUE1_IDS;
  if (league === "argentina") return ARGENTINA_IDS;
  return SERIE_A_IDS;
}

export function domesticCompetition(league: LeagueKind): Competition {
  return leagueInfo(league).competition;
}

export function isDomesticCompetition(comp: Competition): boolean {
  return (
    comp === "serieA" ||
    comp === "premier" ||
    comp === "championship" ||
    comp === "laliga" ||
    comp === "bundesliga" ||
    comp === "ligue1" ||
    comp === "argentina"
  );
}

export function competitionToLeague(comp: Competition): PlayableLeague | null {
  if (comp === "serieA") return "serieA";
  if (comp === "premier") return "premier";
  if (comp === "championship") return "championship";
  if (comp === "laliga") return "laliga";
  if (comp === "bundesliga") return "bundesliga";
  if (comp === "ligue1") return "ligue1";
  if (comp === "argentina") return "argentina";
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
  crest: crestUrl("mil"),
};

export function findClub(id: string): Club | undefined {
  if (!id) return undefined;
  return CLUBS.find((x) => x.id === id);
}

export function isGhostClub(id: string): boolean {
  return Boolean(findClub(id)?.ghost);
}

export function isSelectableClub(id: string): boolean {
  const c = findClub(id);
  if (!c || c.ghost) return false;
  return (
    c.league === "serieA" ||
    c.league === "premier" ||
    c.league === "championship" ||
    c.league === "laliga" ||
    c.league === "bundesliga" ||
    c.league === "ligue1" ||
    c.league === "argentina"
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

/**
 * Caja inicial del manager. La Championship maneja mucho menos dinero que la Premier (derechos de TV, taquilla y
 * patrocinios muy inferiores): ×0,45, de modo que el mejor club de la Championship siga por debajo del último de la Premier.
 */
export function startingBudget(prestige: number, league?: LeagueKind) {
  const raw = Math.pow(prestige / 10, 3.15) * 90_000;
  return Math.round(league === "championship" ? raw * 0.45 : raw);
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
    serieA: SERIE_A_IDS.map(emptyStanding),
    premier: domesticIds("premier").map(emptyStanding),
    championship: domesticIds("championship").map(emptyStanding),
    laliga: LALIGA_IDS.map(emptyStanding),
    bundesliga: BUNDESLIGA_IDS.map(emptyStanding),
    ligue1: LIGUE1_IDS.map(emptyStanding),
    argentina: ARGENTINA_IDS.map(emptyStanding),
  };
}

export const ALL_PLAYABLE_LEAGUES: PlayableLeague[] = [
  "serieA",
  "premier",
  "championship",
  "laliga",
  "bundesliga",
  "ligue1",
  "argentina",
];
