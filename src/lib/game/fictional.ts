import { crestUrl } from "./crests";
import type { Club, LeagueKind } from "./types";

type Seed = [
  id: string,
  name: string,
  short: string,
  city: string,
  stadium: string,
  capacity: number,
  color: string,
  color2: string,
  prestige: number,
  country: string,
  league: LeagueKind,
];

function ghost(row: Seed): Club {
  const [id, name, short, city, stadium, capacity, color, color2, prestige, country, league] = row;
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
    country,
    ghost: true,
    crest: crestUrl(id),
  };
}

/** Fictional European sides that fill UCL / UEL / UECL slots. Not selectable, not tradable. */
const EUROPE_SEEDS: Seed[] = [
  ["douro", "Sport União do Douro", "DOU", "Oporto", "Estádio do Rio", 50300, "#1a3a8a", "#ffffff", 83, "POR", "europe"],
  ["atlix", "CF Atlântico", "ATL", "Lisboa", "Estádio da Maré", 48200, "#006633", "#ffffff", 82, "POR", "europe"],
  ["verde", "Verde e Branco FC", "VEB", "Lisboa", "Campo das Acácias", 36500, "#1d7a3a", "#ffffff", 80, "POR", "europe"],
  ["ornh", "Oranjehaven FC", "ORH", "Ámsterdam", "Havenpark", 54000, "#e87722", "#111111", 82, "NED", "europe"],
  ["diks", "Dijkstad VV", "DIK", "Róterdam", "Maasstadion", 47500, "#c8102e", "#ffffff", 78, "NED", "europe"],
  ["lamp", "Lampistas FC", "LMP", "Eindhoven", "Lichtstad Arena", 35200, "#c8102e", "#111111", 79, "NED", "europe"],
  ["schel", "Royal Schelde", "SCH", "Amberes", "Scheldepark", 28000, "#6b1d45", "#ffffff", 75, "BEL", "europe"],
  ["ardn", "FC Ardennes", "ARD", "Lieja", "Stade des Bois", 24000, "#1e3a8a", "#c9a227", 73, "BEL", "europe"],
  ["nbnk", "Northbank Athletic", "NBA", "Glasgow", "Clydebank Park", 42000, "#1a3a8a", "#c8102e", 77, "SCO", "europe"],
  ["frth", "Forthside FC", "FTH", "Edimburgo", "Forth Stadium", 28000, "#5b1d8a", "#ffffff", 74, "SCO", "europe"],
  ["alps", "Alpenstadt SK", "ALP", "Salzburgo", "Alpenarena", 31000, "#c8102e", "#ffffff", 80, "AUT", "europe"],
  ["donau", "Donau Wien", "DON", "Viena", "Donauinsel", 26500, "#6b1d45", "#ffffff", 74, "AUT", "europe"],
  ["yild", "Yıldızspor", "YIL", "Estambul", "Yıldız Parkı", 52000, "#c9a227", "#c8102e", 79, "TUR", "europe"],
  ["bogz", "Boğaz FK", "BGZ", "Estambul", "Boğaz Stadyumu", 41000, "#1a3a8a", "#c9a227", 77, "TUR", "europe"],
  ["pira", "Pireo Azul", "PIR", "El Pireo", "Puerto Olímpico", 33500, "#1a3a8a", "#ffffff", 76, "GRE", "europe"],
  ["olya", "Olympia Atenas", "OLA", "Atenas", "Estadio de la Acrópolis", 28000, "#c8102e", "#ffffff", 74, "GRE", "europe"],
  ["meta", "Metalúrgico del Este", "MTE", "Donetsk", "Forja Arena", 38000, "#e87722", "#111111", 78, "UKR", "europe"],
  ["dnrv", "Dinamo del Río", "DNR", "Kiev", "Estadio del Dniéper", 45000, "#1a3a8a", "#ffffff", 76, "UKR", "europe"],
  ["hrad", "Hradčany FK", "HRD", "Praga", "Hrad Stadion", 22000, "#8b1a1a", "#ffffff", 75, "CZE", "europe"],
  ["morv", "Morava Brno", "MRV", "Brno", "Morava Park", 18000, "#1d7a3a", "#ffffff", 71, "CZE", "europe"],
  ["lemn", "Léman FC", "LEM", "Ginebra", "Stade du Lac", 25000, "#c8102e", "#ffffff", 74, "SUI", "europe"],
  ["yngb", "Alpes United", "ALU", "Berna", "Wankdorf Ghost", 31000, "#c9a227", "#111111", 76, "SUI", "europe"],
  ["sava", "Sava Zagreb", "SAV", "Zagreb", "Sava Park", 28000, "#1a3a8a", "#ffffff", 75, "CRO", "europe"],
  ["adri", "Adriático Split", "ADR", "Split", "Poljud Nuevo", 33000, "#ffffff", "#1a3a8a", 72, "CRO", "europe"],
  ["dnst", "Estrella del Danubio", "EDD", "Belgrado", "Marakana Norte", 49000, "#c8102e", "#ffffff", 76, "SRB", "europe"],
  ["ores", "Øresund BK", "ORE", "Copenhague", "Øresund Park", 36000, "#ffffff", "#1a3a8a", 75, "DEN", "europe"],
  ["fjrd", "Fjord FK", "FJD", "Bodø", "Fjord Arena", 12000, "#c9a227", "#111111", 73, "NOR", "europe"],
  ["mlms", "Malmstrand IF", "MLS", "Malmö", "Öresundsvallen", 24000, "#1a3a8a", "#ffffff", 72, "SWE", "europe"],
  ["stea", "Steaua del Sur", "STE", "Bucarest", "Ghencea Nuevo", 31000, "#c8102e", "#1a3a8a", 74, "ROU", "europe"],
  ["wisl", "Wisła Capital", "WIS", "Varsovia", "Vístula Stadion", 27000, "#c8102e", "#ffffff", 73, "POL", "europe"],
  ["pest", "Pest Ferenc", "PES", "Budapest", "Danubio Park", 22000, "#1d7a3a", "#ffffff", 72, "HUN", "europe"],
  ["qara", "Qara FK", "QAR", "Bakú", "Caspio Arena", 30000, "#111111", "#c9a227", 71, "AZE", "europe"],
  ["amat", "Amathus FC", "AMA", "Limassol", "Amathus Ground", 13000, "#1a3a8a", "#ffffff", 70, "CYP", "europe"],
  ["mcco", "Costa Maccabi", "MCC", "Tel Aviv", "Costa Stadium", 24000, "#c9a227", "#1a3a8a", 71, "ISR", "europe"],
  // ── Relleno extra para la Europa League de 36 equipos (prestigio menor que los anteriores: Champions no cambia) ──
  ["minho", "Minho Desportivo", "MND", "Braga", "Estádio do Minho", 30000, "#c8102e", "#ffffff", 69, "POR", "europe"],
  ["alga", "Algarve União", "ALV", "Faro", "Estádio da Costa", 18000, "#1a3a8a", "#f5d000", 64, "POR", "europe"],
  ["utrh", "Domstad Utrecht", "DUT", "Utrecht", "Domplein Arena", 23000, "#c8102e", "#ffffff", 68, "NED", "europe"],
  ["grnb", "Noord Groningen", "NGR", "Groninga", "Noordpark", 22500, "#1d7a3a", "#ffffff", 66, "NED", "europe"],
  ["twnt", "Twentepark FC", "TWP", "Enschede", "Twente Arena", 30000, "#c8102e", "#111111", 67, "NED", "europe"],
  ["gand", "KAA Gandavum", "GAN", "Gante", "Arena Gandavum", 20000, "#1a3a8a", "#ffffff", 68, "BEL", "europe"],
  ["brab", "Brabante Union", "BRB", "Lovaina", "Stade du Brabant", 19000, "#f5d000", "#1a3a8a", 65, "BEL", "europe"],
  ["abdn", "Aberdon Athletic", "ABD", "Aberdeen", "Granite Park", 20800, "#c8102e", "#ffffff", 65, "SCO", "europe"],
  ["hlnd", "Highland Rovers", "HLR", "Inverness", "Highland Park", 12000, "#1a3a8a", "#c9a227", 62, "SCO", "europe"],
  ["grzr", "Grazer Sturm", "GRS", "Graz", "Sturmarena", 16000, "#111111", "#ffffff", 66, "AUT", "europe"],
  ["linz", "Linzer Danubio", "LDA", "Linz", "Linzer Arena", 19000, "#111111", "#c8102e", 65, "AUT", "europe"],
  ["trab", "Anadolu Trabzon", "ANT", "Trabzon", "Karadeniz Arena", 40000, "#8b1a3a", "#1a3a8a", 69, "TUR", "europe"],
  ["bsks", "Başkent SK", "BSK", "Ankara", "Başkent Stadyumu", 28000, "#c9a227", "#1a3a8a", 64, "TUR", "europe"],
  ["salo", "Salónica FC", "SLN", "Salónica", "Toumba Nuevo", 28000, "#111111", "#ffffff", 68, "GRE", "europe"],
  ["khrk", "Slobozhanski Járkov", "SLJ", "Járkov", "Estadio Slobozhansky", 35000, "#c9a227", "#1a3a8a", 66, "UKR", "europe"],
  ["plzn", "Pilsen Viktoria", "PLZ", "Pilsen", "Štruncovy Sady Nuevo", 11700, "#c8102e", "#1a3a8a", 69, "CZE", "europe"],
  ["rjek", "Kvarner Rijeka", "KVR", "Rijeka", "Rujevica Nueva", 8000, "#ffffff", "#1a3a8a", 64, "CRO", "europe"],
  ["topc", "Topčider FK", "TOP", "Belgrado", "Estadio Topčider", 32000, "#111111", "#ffffff", 69, "SRB", "europe"],
  ["jutl", "Jutlandia FC", "JUT", "Herning", "Jutland Arena", 11800, "#c8102e", "#111111", 68, "DEN", "europe"],
  ["bfjl", "Bergen Fjell", "BFJ", "Bergen", "Fjell Stadion", 17000, "#c8102e", "#ffffff", 66, "NOR", "europe"],
  ["gtbk", "Göteborg Kamraterna", "GTK", "Gotemburgo", "Gamla Arena", 18000, "#1a3a8a", "#ffffff", 66, "SWE", "europe"],
  ["cluj", "Napoca Cluj", "NCJ", "Cluj", "Arena Napoca", 30000, "#8b1a3a", "#ffffff", 67, "ROU", "europe"],
  ["krak", "Kraków Biało", "KRB", "Cracovia", "Estadio Mariacki", 15000, "#c8102e", "#ffffff", 65, "POL", "europe"],
  ["debr", "Debrecen Loki", "DBL", "Debrecen", "Nagyerdei Nuevo", 20000, "#c8102e", "#ffffff", 62, "HUN", "europe"],
  // ── Relleno extra para la Conference League de 36 equipos (prestigio bajo: no altera Champions ni Europa League) ──
  ["slbr", "Slavín Bratislava", "SVB", "Bratislava", "Estadio Tehelné", 22500, "#1a3a8a", "#ffffff", 63, "SVK", "europe"],
  ["trnv", "Spartak Trnava Norte", "STN", "Trnava", "Anton Malatinský", 19000, "#c8102e", "#111111", 58, "SVK", "europe"],
  ["lubl", "Lublin Unión", "LBU", "Lublin", "Arena Lubelska", 15500, "#1d7a3a", "#ffffff", 60, "POL", "europe"],
  ["sofl", "Levski Serdica", "LVS", "Sofía", "Estadio Vasil", 25000, "#1a3a8a", "#ffffff", 59, "BUL", "europe"],
  ["razg", "Ludogorie Razgrad", "LRZ", "Razgrad", "Huvepharma Park", 10000, "#1d7a3a", "#ffffff", 61, "BUL", "europe"],
  ["vard", "Vardar Skopie", "VAR", "Skopie", "Estadio Filip II", 33000, "#c8102e", "#111111", 54, "MKD", "europe"],
  ["tira", "Partizani Tirana", "PTR", "Tirana", "Estadio Air Albania", 22500, "#c8102e", "#ffffff", 54, "ALB", "europe"],
  ["lblj", "Olimpija Liubliana", "OLJ", "Liubliana", "Stožice Park", 16000, "#1d7a3a", "#ffffff", 57, "SVN", "europe"],
  ["hels", "Helsinki Kaupunki", "HEK", "Helsinki", "Bolt Arena Nueva", 10800, "#1a3a8a", "#ffffff", 57, "FIN", "europe"],
  ["trnd", "Trondheim Lerka", "TRL", "Trondheim", "Lerkendal Nuevo", 21400, "#ffffff", "#111111", 62, "NOR", "europe"],
  ["aarh", "Aarhus Gudenå", "AGU", "Aarhus", "Ceres Park Nuevo", 19400, "#1a3a8a", "#ffffff", 61, "DEN", "europe"],
  ["bern", "Aare Berna", "AAB", "Berna", "Estadio del Aare", 32000, "#f5d000", "#111111", 62, "SUI", "europe"],
  ["basl", "Rheinstadt Basilea", "RHB", "Basilea", "Rhein Park", 38000, "#c8102e", "#1a3a8a", 66, "SUI", "europe"],
  ["govn", "Govan Rovers", "GVR", "Glasgow", "Govan Road", 50000, "#1d7a3a", "#ffffff", 65, "SCO", "europe"],
  ["minh", "Minsk Dinamo Norte", "MDN", "Minsk", "Estadio Svisloch", 22000, "#1a3a8a", "#ffffff", 56, "BLR", "europe"],
  ["asta", "Astana Estepa", "AES", "Astaná", "Steppe Arena", 30000, "#f5d000", "#1a3a8a", 58, "KAZ", "europe"],
  ["reyk", "Víkingur Reikiavik", "VRE", "Reikiavik", "Víkingsvöllur", 7000, "#c8102e", "#111111", 55, "ISL", "europe"],
  ["dubl", "Shelbourne Park Dublín", "SPD", "Dublín", "Tolka Park Nuevo", 9600, "#c8102e", "#ffffff", 55, "IRL", "europe"],
  ["belf", "Linfield Road Belfast", "LRB", "Belfast", "Windsor Nuevo", 18000, "#1a3a8a", "#ffffff", 55, "NIR", "europe"],
  ["molt", "Moldova Sheriff Sur", "MSS", "Tiráspol", "Sheriff Arena", 13000, "#f5d000", "#111111", 55, "MDA", "europe"],
  ["lxmb", "Luxemburgo Dudelange", "LXD", "Dudelange", "Stade Jos Nosbaum", 2600, "#c8102e", "#1a3a8a", 52, "LUX", "europe"],
  ["mlta", "Valletta Marina", "VMA", "La Valeta", "Ta' Qali Nuevo", 17000, "#ffffff", "#c8102e", 52, "MLT", "europe"],
];

/**
 * Clubes REALES de Sudamérica (fuera de Argentina, cuyos 24 clubes viven en la Liga Profesional).
 * No son seleccionables ni comerciables (sus plantillas son de relleno), pero juegan Libertadores y Sudamericana
 * con su nombre, ciudad y estadio verdaderos. Los ids llevan prefijo de país para no chocar con otros clubes.
 */
const CONMEBOL_SEEDS: Seed[] = [
  // ── Brasil: sus 20 clubes juegan el Brasileirão (ver BRASILEIRAO_CLUBS en clubs.ts) ──
  // ── Uruguay ──
  ["uypen", "Peñarol", "PEN", "Montevideo", "Campeón del Siglo", 40000, "#f5d000", "#111111", 78, "URU", "conmebol"],
  ["uynac", "Nacional", "NAC", "Montevideo", "Gran Parque Central", 34000, "#ffffff", "#1a3a8a", 78, "URU", "conmebol"],
  ["uydef", "Defensor Sporting", "DEF", "Montevideo", "Luis Franzini", 18000, "#6b1d8a", "#ffffff", 68, "URU", "conmebol"],
  ["uylpl", "Liverpool Montevideo", "LIV", "Montevideo", "Belvedere", 10000, "#1a3a8a", "#111111", 66, "URU", "conmebol"],
  // ── Colombia ──
  ["conal", "Atlético Nacional", "ANA", "Medellín", "Atanasio Girardot", 44000, "#1d7a3a", "#ffffff", 75, "COL", "conmebol"],
  ["comil", "Millonarios", "MIL", "Bogotá", "El Campín", 36343, "#1a3a8a", "#ffffff", 72, "COL", "conmebol"],
  ["cojun", "Junior de Barranquilla", "JUN", "Barranquilla", "Metropolitano Roberto Meléndez", 46692, "#c8102e", "#ffffff", 72, "COL", "conmebol"],
  ["coame", "América de Cali", "AME", "Cali", "Pascual Guerrero", 35405, "#c8102e", "#ffffff", 70, "COL", "conmebol"],
  ["codim", "Independiente Medellín", "DIM", "Medellín", "Atanasio Girardot", 44000, "#c8102e", "#1a3a8a", 70, "COL", "conmebol"],
  ["cotol", "Deportes Tolima", "TOL", "Ibagué", "Manuel Murillo Toro", 28100, "#8b1a3a", "#f5d000", 70, "COL", "conmebol"],
  ["cosfe", "Independiente Santa Fe", "ISF", "Bogotá", "El Campín", 36343, "#c8102e", "#ffffff", 68, "COL", "conmebol"],
  // ── Chile ──
  ["clcol", "Colo-Colo", "CCO", "Santiago", "Monumental David Arellano", 47347, "#ffffff", "#111111", 74, "CHI", "conmebol"],
  ["cluch", "Universidad de Chile", "UCH", "Santiago", "Estadio Nacional", 48665, "#1a3a8a", "#c8102e", 72, "CHI", "conmebol"],
  ["clcat", "Universidad Católica", "UCA", "Santiago", "San Carlos de Apoquindo", 14118, "#ffffff", "#1a3a8a", 70, "CHI", "conmebol"],
  ["clpal", "Palestino", "PLT", "Santiago", "Municipal de La Cisterna", 12000, "#1d7a3a", "#c8102e", 64, "CHI", "conmebol"],
  ["clcoq", "Coquimbo Unido", "CQU", "Coquimbo", "Francisco Sánchez Rumoroso", 18750, "#f5d000", "#111111", 64, "CHI", "conmebol"],
  ["clcob", "Cobresal", "CBR", "El Salvador", "El Cobre", 12000, "#e87722", "#ffffff", 62, "CHI", "conmebol"],
  // ── Paraguay ──
  ["pyolm", "Olimpia", "OLI", "Asunción", "Manuel Ferreira", 25000, "#ffffff", "#111111", 72, "PAR", "conmebol"],
  ["pycer", "Cerro Porteño", "CER", "Asunción", "La Nueva Olla", 45000, "#1a3a8a", "#c8102e", 72, "PAR", "conmebol"],
  ["pylib", "Libertad", "LIB", "Asunción", "Dr. Nicolás Leoz", 10500, "#111111", "#ffffff", 70, "PAR", "conmebol"],
  ["pynac", "Nacional de Asunción", "NAS", "Asunción", "Arsenio Erico", 4500, "#ffffff", "#c8102e", 64, "PAR", "conmebol"],
  ["pygua", "Guaraní", "GUA", "Asunción", "Rogelio Livieres", 8000, "#f5d000", "#111111", 64, "PAR", "conmebol"],
  // ── Ecuador ──
  ["eclde", "LDU Quito", "LDU", "Quito", "Rodrigo Paz Delgado", 41575, "#ffffff", "#1a3a8a", 74, "ECU", "conmebol"],
  ["ecidv", "Independiente del Valle", "IDV", "Sangolquí", "Banco Guayaquil", 12000, "#1a3a8a", "#111111", 74, "ECU", "conmebol"],
  ["ecbar", "Barcelona SC", "BSC", "Guayaquil", "Monumental Banco Pichincha", 57267, "#f5d000", "#111111", 72, "ECU", "conmebol"],
  ["ecemm", "Emelec", "EME", "Guayaquil", "George Capwell", 40000, "#1a3a8a", "#ffffff", 68, "ECU", "conmebol"],
  ["ecauc", "Aucas", "AUC", "Quito", "Gonzalo Pozo Ripalda", 18799, "#f5d000", "#c8102e", 62, "ECU", "conmebol"],
  // ── Perú ──
  ["peuni", "Universitario", "UNI", "Lima", "Monumental", 80093, "#f5e6b0", "#8b1a3a", 70, "PER", "conmebol"],
  ["peali", "Alianza Lima", "ALI", "Lima", "Alejandro Villanueva", 35938, "#1a3a8a", "#ffffff", 70, "PER", "conmebol"],
  ["pecri", "Sporting Cristal", "CRI", "Lima", "Alberto Gallardo", 11600, "#6ec4e8", "#ffffff", 68, "PER", "conmebol"],
  ["pemel", "FBC Melgar", "MEL", "Arequipa", "Monumental de la UNSA", 40370, "#c8102e", "#111111", 64, "PER", "conmebol"],
  ["pecie", "Cienciano", "CIE", "Cusco", "Garcilaso de la Vega", 42056, "#c8102e", "#ffffff", 62, "PER", "conmebol"],
  // ── Bolivia ──
  ["bobol", "Bolívar", "BLV", "La Paz", "Hernando Siles", 41143, "#6ec4e8", "#ffffff", 68, "BOL", "conmebol"],
  ["bostr", "The Strongest", "STR", "La Paz", "Rafael Mendoza", 25000, "#f5d000", "#111111", 68, "BOL", "conmebol"],
  ["boalw", "Always Ready", "ALR", "El Alto", "Municipal de El Alto", 25000, "#c8102e", "#ffffff", 62, "BOL", "conmebol"],
  ["bobla", "Blooming", "BLO", "Santa Cruz", "Ramón Tahuichi Aguilera", 38000, "#1a3a8a", "#ffffff", 60, "BOL", "conmebol"],
  ["bonac", "Nacional Potosí", "NPO", "Potosí", "Víctor Agustín Ugarte", 32105, "#c8102e", "#1a3a8a", 58, "BOL", "conmebol"],
  // ── Venezuela ──
  ["vecar", "Carabobo", "CRB", "Valencia", "Misael Delgado", 10000, "#c8102e", "#ffffff", 60, "VEN", "conmebol"],
  ["vetac", "Deportivo Táchira", "TAC", "San Cristóbal", "Pueblo Nuevo", 38755, "#f5d000", "#111111", 60, "VEN", "conmebol"],
  ["vecac", "Caracas FC", "CCS", "Caracas", "Olímpico de la UCV", 24000, "#c8102e", "#ffffff", 60, "VEN", "conmebol"],
  ["vemon", "Monagas", "MON", "Maturín", "Monumental de Maturín", 51796, "#f5d000", "#111111", 56, "VEN", "conmebol"],
];

/** Clubes reales de AFC, CAF, CONCACAF y OFC: relleno del Mundial de Clubes. No seleccionables. */
const AFC_SEEDS: Seed[] = [
  ["jpura", "Urawa Red Diamonds", "URA", "Saitama", "Saitama Stadium", 63700, "#c8102e", "#ffffff", 78, "JPN", "afc"],
  ["krsan", "Ulsan HD", "ULS", "Ulsan", "Ulsan Munsu", 44431, "#1a3a8a", "#ffffff", 76, "KOR", "afc"],
  ["jpmar", "Yokohama F. Marinos", "YFM", "Yokohama", "Nissan Stadium", 72327, "#1a3a8a", "#ffffff", 75, "JPN", "afc"],
  ["aeain", "Al-Ain", "AIN", "Al Ain", "Hazza bin Zayed", 25188, "#6b1d8a", "#ffffff", 75, "UAE", "afc"],
  ["qalsd", "Al-Sadd", "SAD", "Doha", "Jassim bin Hamad", 13000, "#ffffff", "#111111", 74, "QAT", "afc"],
];

const CAF_SEEDS: Seed[] = [
  ["egalh", "Al Ahly", "AHL", "El Cairo", "Cairo International Stadium", 75000, "#c8102e", "#ffffff", 84, "EGY", "caf"],
  ["mawyd", "Wydad Casablanca", "WAC", "Casablanca", "Mohammed V", 45000, "#c8102e", "#ffffff", 78, "MAR", "caf"],
  ["tnesp", "Espérance de Tunis", "EST", "Túnez", "Olympique de Radès", 60000, "#f5d000", "#c8102e", 77, "TUN", "caf"],
  ["zasun", "Mamelodi Sundowns", "SUN", "Pretoria", "Loftus Versfeld", 51762, "#f5d000", "#1a3a8a", 76, "RSA", "caf"],
  ["egpyr", "Pyramids FC", "PYR", "El Cairo", "30 June Stadium", 30000, "#1a3a8a", "#ffffff", 75, "EGY", "caf"],
  ["maraj", "Raja Casablanca", "RAJ", "Casablanca", "Mohammed V", 45000, "#1d7a3a", "#ffffff", 74, "MAR", "caf"],
  ["cdtpm", "TP Mazembe", "TPM", "Lubumbashi", "Stade TP Mazembe", 18000, "#111111", "#ffffff", 73, "COD", "caf"],
  ["tzyan", "Young Africans", "YAN", "Dar es Salaam", "Benjamin Mkapa", 60000, "#f5d000", "#1d7a3a", 70, "TAN", "caf"],
];

const CONCACAF_SEEDS: Seed[] = [
  ["mxame", "Club América", "AME", "Ciudad de México", "Estadio Azteca", 87523, "#f5d000", "#1a3a8a", 82, "MEX", "concacaf"],
  ["mxmty", "Monterrey", "MTY", "Monterrey", "BBVA", 53500, "#1a3a8a", "#ffffff", 81, "MEX", "concacaf"],
  ["mxpac", "Pachuca", "PAC", "Pachuca", "Hidalgo", 30000, "#1a3a8a", "#ffffff", 76, "MEX", "concacaf"],
  ["mxcaz", "Cruz Azul", "CAZ", "Ciudad de México", "Estadio Azteca", 87523, "#1a3a8a", "#ffffff", 76, "MEX", "concacaf"],
  ["mxlea", "León", "LEO", "León", "Nou Camp", 31297, "#1d7a3a", "#ffffff", 72, "MEX", "concacaf"],
];

const OFC_SEEDS: Seed[] = [
  ["nzauc", "Auckland City", "AUC", "Auckland", "Kiwitea Street", 3500, "#1a3a8a", "#ffffff", 68, "NZL", "ofc"],
  ["pgasw", "AS Pirae", "PIR", "Pirae", "Stade Pater", 10000, "#c8102e", "#ffffff", 58, "TAH", "ofc"],
];

export const GHOST_CLUBS: Club[] = [...EUROPE_SEEDS, ...CONMEBOL_SEEDS, ...AFC_SEEDS, ...CAF_SEEDS, ...CONCACAF_SEEDS, ...OFC_SEEDS].map(ghost);

export const EUROPE_GHOST_IDS = EUROPE_SEEDS.map((s) => s[0]);
export const CONMEBOL_GHOST_IDS = CONMEBOL_SEEDS.map((s) => s[0]);
export const AFC_GHOST_IDS = AFC_SEEDS.map((s) => s[0]);
export const CAF_GHOST_IDS = CAF_SEEDS.map((s) => s[0]);
export const CONCACAF_GHOST_IDS = CONCACAF_SEEDS.map((s) => s[0]);
export const OFC_GHOST_IDS = OFC_SEEDS.map((s) => s[0]);
