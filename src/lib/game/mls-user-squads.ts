import type { StarSeed } from "./names";

export const MLS_USER_SQUADS: Record<string, StarSeed[]> = {
  // ── Inter Miami CF ──
  us_mia: [
    { name: "Lionel Messi", pos: "RW", ovr: 89, age: 39, nat: "ARG", pot: 89 },
    { name: "Luis Suárez", pos: "ST", ovr: 81, age: 39, nat: "URU", pot: 81 },
    { name: "Casemiro", pos: "CDM", ovr: 82, age: 34, nat: "BRA", pot: 82 },
    { name: "Rodrigo De Paul", pos: "CM", ovr: 83, age: 32, nat: "ARG", pot: 83 },
    { name: "Dayne St. Clair", pos: "GK", ovr: 74, age: 29, nat: "CAN", pot: 76 },
    { name: "Sergio Reguilón", pos: "LB", ovr: 77, age: 29, nat: "ESP", pot: 77 },
    { name: "Maximiliano Falcón", pos: "CB", ovr: 75, age: 29, nat: "URU", pot: 76 },
    { name: "Facundo Mura", pos: "RB", ovr: 74, age: 27, nat: "ARG", pot: 76 },
    { name: "Telasco Segovia", pos: "CM", ovr: 73, age: 23, nat: "VEN", pot: 81 },
    { name: "Germán Berterame", pos: "ST", ovr: 76, age: 27, nat: "MEX", pot: 77 },
    { name: "Tomás Avilés", pos: "CB", ovr: 73, age: 22, nat: "ARG", pot: 82 },
    { name: "Tadeo Allende", pos: "RW", ovr: 74, age: 27, nat: "ARG", pot: 75 },
    { name: "Allen Obando", pos: "ST", ovr: 71, age: 20, nat: "ECU", pot: 82 },
    { name: "Mateo Silvetti", pos: "LW", ovr: 70, age: 20, nat: "ARG", pot: 81 },
    { name: "Rocco Ríos Novo", pos: "GK", ovr: 70, age: 24, nat: "ARG", pot: 75 }
  ],

  // ── Atlanta United FC ──
  us_atl: [
    { name: "Miguel Almirón", pos: "CAM", ovr: 78, age: 32, nat: "PAR", pot: 78 },
    { name: "Brad Guzan", pos: "GK", ovr: 71, age: 41, nat: "USA", pot: 71 },
    { name: "Stian Gregersen", pos: "CB", ovr: 74, age: 31, nat: "NOR", pot: 74 },
    { name: "Derrick Williams", pos: "CB", ovr: 72, age: 33, nat: "IRL", pot: 72 },
    { name: "Brooks Lennon", pos: "RB", ovr: 74, age: 28, nat: "USA", pot: 75 },
    { name: "Pedro Amador", pos: "LB", ovr: 72, age: 27, nat: "POR", pot: 74 },
    { name: "Bartosz Slisz", pos: "CDM", ovr: 74, age: 27, nat: "POL", pot: 77 },
    { name: "Dax McCarty", pos: "CM", ovr: 68, age: 39, nat: "USA", pot: 68 },
    { name: "Tristan Muyumba", pos: "CM", ovr: 73, age: 29, nat: "FRA", pot: 75 },
    { name: "Alexey Miranchuk", pos: "CAM", ovr: 78, age: 30, nat: "RUS", pot: 78 },
    { name: "Saba Lobzhanidze", pos: "RW", ovr: 75, age: 31, nat: "GEO", pot: 75 },
    { name: "Xande Silva", pos: "LW", ovr: 74, age: 29, nat: "POR", pot: 75 },
    { name: "Daniel Ríos", pos: "ST", ovr: 71, age: 31, nat: "MEX", pot: 71 },
    { name: "Jamal Thiare", pos: "ST", ovr: 72, age: 33, nat: "SEN", pot: 72 },
    { name: "Josh Cohen", pos: "GK", ovr: 72, age: 33, nat: "USA", pot: 72 }
  ],

  // ── Austin FC ──
  us_aus: [
    { name: "Sebastián Driussi", pos: "CAM", ovr: 78, age: 30, nat: "ARG", pot: 78 },
    { name: "Brad Stuver", pos: "GK", ovr: 73, age: 35, nat: "USA", pot: 73 },
    { name: "Matt Hedges", pos: "CB", ovr: 71, age: 36, nat: "USA", pot: 71 },
    { name: "Julio Cascante", pos: "CB", ovr: 73, age: 32, nat: "CRC", pot: 73 },
    { name: "Jon Gallagher", pos: "LB", ovr: 73, age: 30, nat: "IRL", pot: 73 },
    { name: "Nick Lima", pos: "RB", ovr: 72, age: 31, nat: "USA", pot: 72 },
    { name: "Dani Pereira", pos: "CM", ovr: 74, age: 25, nat: "VEN", pot: 78 },
    { name: "Alex Ring", pos: "CDM", ovr: 72, age: 35, nat: "FIN", pot: 72 },
    { name: "Owen Wolff", pos: "CM", ovr: 71, age: 21, nat: "USA", pot: 78 },
    { name: "Ethan Finlay", pos: "RW", ovr: 70, age: 36, nat: "USA", pot: 70 },
    { name: "Osman Bukari", pos: "RW", ovr: 75, age: 27, nat: "GHA", pot: 77 },
    { name: "Jader Obrian", pos: "LW", ovr: 72, age: 31, nat: "COL", pot: 72 },
    { name: "Gyasi Zardes", pos: "ST", ovr: 71, age: 34, nat: "USA", pot: 71 },
    { name: "CJ Fodrey", pos: "ST", ovr: 68, age: 22, nat: "USA", pot: 75 },
    { name: "Stefan Cleveland", pos: "GK", ovr: 68, age: 32, nat: "USA", pot: 68 }
  ],

  // ── Charlotte FC ──
  us_clt: [
    { name: "Ashley Westwood", pos: "CM", ovr: 75, age: 36, nat: "ENG", pot: 75 },
    { name: "Kristijan Kahlina", pos: "GK", ovr: 75, age: 34, nat: "CRO", pot: 75 },
    { name: "Adilson Malanda", pos: "CB", ovr: 73, age: 24, nat: "FRA", pot: 78 },
    { name: "Andrew Privett", pos: "CB", ovr: 71, age: 26, nat: "USA", pot: 73 },
    { name: "Jere Uronen", pos: "LB", ovr: 72, age: 32, nat: "FIN", pot: 72 },
    { name: "Nathan Byrne", pos: "RB", ovr: 72, age: 34, nat: "ENG", pot: 72 },
    { name: "Brandt Bronico", pos: "CDM", ovr: 71, age: 31, nat: "USA", pot: 71 },
    { name: "Pep Biel", pos: "CAM", ovr: 76, age: 29, nat: "ESP", pot: 76 },
    { name: "Junior Urso", pos: "CM", ovr: 71, age: 37, nat: "BRA", pot: 71 },
    { name: "Liel Abada", pos: "RW", ovr: 75, age: 24, nat: "ISR", pot: 80 },
    { name: "Kerwin Vargas", pos: "LW", ovr: 72, age: 24, nat: "COL", pot: 77 },
    { name: "Karol Swiderski", pos: "ST", ovr: 74, age: 29, nat: "POL", pot: 75 },
    { name: "Patrick Agyemang", pos: "ST", ovr: 72, age: 25, nat: "USA", pot: 77 },
    { name: "Nikola Petkovic", pos: "CM", ovr: 69, age: 23, nat: "SRB", pot: 75 },
    { name: "David Bingham", pos: "GK", ovr: 68, age: 36, nat: "USA", pot: 68 }
  ],

  // ── Chicago Fire FC ──
  us_chi: [
    { name: "Robert Lewandowski", pos: "ST", ovr: 83, age: 38, nat: "POL", pot: 83 },
    { name: "Xherdan Shaqiri", pos: "CAM", ovr: 77, age: 34, nat: "SUI", pot: 77 },
    { name: "Chris Brady", pos: "GK", ovr: 73, age: 22, nat: "USA", pot: 81 },
    { name: "Rafael Czichos", pos: "CB", ovr: 72, age: 36, nat: "GER", pot: 72 },
    { name: "Carlos Terán", pos: "CB", ovr: 72, age: 26, nat: "COL", pot: 75 },
    { name: "Andrew Gutman", pos: "LB", ovr: 71, age: 29, nat: "USA", pot: 71 },
    { name: "Allan Arigoni", pos: "RB", ovr: 72, age: 27, nat: "SUI", pot: 73 },
    { name: "Gastón Giménez", pos: "CDM", ovr: 73, age: 35, nat: "PAR", pot: 73 },
    { name: "Brian Gutiérrez", pos: "CAM", ovr: 73, age: 23, nat: "USA", pot: 80 },
    { name: "Kellyn Acosta", pos: "CM", ovr: 74, age: 31, nat: "USA", pot: 74 },
    { name: "Misael Domínguez", pos: "LW", ovr: 70, age: 26, nat: "MEX", pot: 71 },
    { name: "Georgios Koutsias", pos: "ST", ovr: 71, age: 22, nat: "GRE", pot: 78 },
    { name: "Hugo Cuypers", pos: "ST", ovr: 75, age: 29, nat: "BEL", pot: 75 },
    { name: "Jonathan Dean", pos: "RB", ovr: 69, age: 29, nat: "USA", pot: 69 },
    { name: "Spencer Richey", pos: "GK", ovr: 67, age: 34, nat: "USA", pot: 67 }
  ],

  // ── FC Cincinnati ──
  us_cin: [
    { name: "Luciano Acosta", pos: "CAM", ovr: 80, age: 32, nat: "ARG", pot: 80 },
    { name: "Roman Celentano", pos: "GK", ovr: 75, age: 26, nat: "USA", pot: 79 },
    { name: "Miles Robinson", pos: "CB", ovr: 76, age: 29, nat: "USA", pot: 77 },
    { name: "Matt Miazga", pos: "CB", ovr: 77, age: 31, nat: "USA", pot: 77 },
    { name: "Chidozie Awaziem", pos: "CB", ovr: 75, age: 29, nat: "NGA", pot: 76 },
    { name: "Pavel Bucha", pos: "CM", ovr: 75, age: 28, nat: "CZE", pot: 76 },
    { name: "Obinna Nwobodo", pos: "CDM", ovr: 76, age: 29, nat: "NGA", pot: 76 },
    { name: "DeAndre Yedlin", pos: "RB", ovr: 74, age: 33, nat: "USA", pot: 74 },
    { name: "Luca Orellano", pos: "RB", ovr: 76, age: 26, nat: "ARG", pot: 79 },
    { name: "Gerardo Valenzuela", pos: "CAM", ovr: 69, age: 21, nat: "USA", pot: 77 },
    { name: "Yuya Kubo", pos: "CM", ovr: 72, age: 32, nat: "JPN", pot: 72 },
    { name: "Corey Baird", pos: "ST", ovr: 71, age: 30, nat: "USA", pot: 71 },
    { name: "Kevin Kelsy", pos: "ST", ovr: 73, age: 22, nat: "VEN", pot: 80 },
    { name: "Sergio Santos", pos: "ST", ovr: 71, age: 32, nat: "BRA", pot: 71 },
    { name: "Alec Kann", pos: "GK", ovr: 70, age: 36, nat: "USA", pot: 70 }
  ],

  // ── Colorado Rapids ──
  us_col: [
    { name: "Djordje Mihailovic", pos: "CAM", ovr: 76, age: 27, nat: "USA", pot: 78 },
    { name: "Zack Steffen", pos: "GK", ovr: 75, age: 31, nat: "USA", pot: 75 },
    { name: "Andreas Maxsø", pos: "CB", ovr: 73, age: 32, nat: "DEN", pot: 73 },
    { name: "Reggie Cannon", pos: "RB", ovr: 73, age: 28, nat: "USA", pot: 74 },
    { name: "Keegan Rosenberry", pos: "RB", ovr: 71, age: 32, nat: "USA", pot: 71 },
    { name: "Sam Vines", pos: "LB", ovr: 72, age: 27, nat: "USA", pot: 74 },
    { name: "Oliver Larraz", pos: "CM", ovr: 69, age: 24, nat: "USA", pot: 74 },
    { name: "Cole Bassett", pos: "CM", ovr: 73, age: 25, nat: "USA", pot: 76 },
    { name: "Connor Ronan", pos: "CM", ovr: 73, age: 28, nat: "IRL", pot: 74 },
    { name: "Calvin Harris", pos: "RW", ovr: 71, age: 26, nat: "ENG", pot: 73 },
    { name: "Omir Fernandez", pos: "LW", ovr: 71, age: 27, nat: "USA", pot: 72 },
    { name: "Rafael Navarro", pos: "ST", ovr: 74, age: 26, nat: "BRA", pot: 76 },
    { name: "Darren Yapi", pos: "ST", ovr: 69, age: 21, nat: "USA", pot: 76 },
    { name: "Moïse Bombito", pos: "CB", ovr: 73, age: 26, nat: "CAN", pot: 78 },
    { name: "Adam Beaudry", pos: "GK", ovr: 66, age: 20, nat: "USA", pot: 77 }
  ],

  // ── Columbus Crew ──
  us_ccr: [
    { name: "Cucho Hernández", pos: "ST", ovr: 80, age: 27, nat: "COL", pot: 82 },
    { name: "Diego Rossi", pos: "LW", ovr: 78, age: 28, nat: "URU", pot: 79 },
    { name: "Lucas Zelarayán", pos: "CAM", ovr: 78, age: 34, nat: "ARM", pot: 78 },
    { name: "Patrick Schulte", pos: "GK", ovr: 76, age: 25, nat: "USA", pot: 81 },
    { name: "Steven Moreira", pos: "CB", ovr: 75, age: 32, nat: "CPV", pot: 75 },
    { name: "Rudy Camacho", pos: "CB", ovr: 73, age: 35, nat: "FRA", pot: 73 },
    { name: "Yevhen Cheberko", pos: "CB", ovr: 72, age: 28, nat: "UKR", pot: 73 },
    { name: "Maximilian Arfsten", pos: "LWB", ovr: 72, age: 25, nat: "USA", pot: 75 },
    { name: "Alessio Castro-Montes", pos: "RWB", ovr: 74, age: 29, nat: "BEL", pot: 74 },
    { name: "Aidan Morris", pos: "CM", ovr: 75, age: 24, nat: "USA", pot: 80 },
    { name: "Darlington Nagbe", pos: "CM", ovr: 75, age: 36, nat: "USA", pot: 75 },
    { name: "Derrick Etienne Jr.", pos: "RW", ovr: 71, age: 29, nat: "HAI", pot: 71 },
    { name: "Christian Ramírez", pos: "ST", ovr: 73, age: 35, nat: "USA", pot: 73 },
    { name: "Yaw Yeboah", pos: "LW", ovr: 72, age: 29, nat: "GHA", pot: 72 },
    { name: "Nicholas Hagen", pos: "GK", ovr: 70, age: 30, nat: "GUA", pot: 70 }
  ],

  // ── D.C. United ──
  us_dcu: [
    { name: "Christian Benteke", pos: "ST", ovr: 78, age: 35, nat: "BEL", pot: 78 },
    { name: "Alex Bono", pos: "GK", ovr: 71, age: 32, nat: "USA", pot: 71 },
    { name: "Lucas Bartlett", pos: "CB", ovr: 71, age: 29, nat: "USA", pot: 72 },
    { name: "Matai Akinmboni", pos: "CB", ovr: 68, age: 19, nat: "USA", pot: 79 },
    { name: "Christopher McVey", pos: "CB", ovr: 71, age: 29, nat: "SWE", pot: 71 },
    { name: "Pedro Santos", pos: "LB", ovr: 70, age: 38, nat: "POR", pot: 70 },
    { name: "Aaron Herrera", pos: "RB", ovr: 73, age: 29, nat: "GUA", pot: 73 },
    { name: "Mateusz Klich", pos: "CM", ovr: 74, age: 36, nat: "POL", pot: 74 },
    { name: "Jared Stroud", pos: "RW", ovr: 71, age: 30, nat: "USA", pot: 71 },
    { name: "Gabriel Pirani", pos: "CAM", ovr: 72, age: 24, nat: "BRA", pot: 77 },
    { name: "Ted Ku-DiPietro", pos: "CAM", ovr: 70, age: 24, nat: "USA", pot: 76 },
    { name: "Jackson Hopkins", pos: "CM", ovr: 69, age: 22, nat: "USA", pot: 75 },
    { name: "Martín Rodríguez", pos: "LW", ovr: 71, age: 32, nat: "CHI", pot: 71 },
    { name: "Dominique Badji", pos: "ST", ovr: 69, age: 33, nat: "SEN", pot: 69 },
    { name: "Tyler Miller", pos: "GK", ovr: 70, age: 33, nat: "USA", pot: 70 }
  ],

  // ── FC Dallas ──
  us_dal: [
    { name: "Petar Musa", pos: "ST", ovr: 76, age: 28, nat: "CRO", pot: 78 },
    { name: "Maarten Paes", pos: "GK", ovr: 75, age: 28, nat: "IDN", pot: 78 },
    { name: "Nkosi Tafari", pos: "CB", ovr: 73, age: 29, nat: "USA", pot: 73 },
    { name: "Omar González", pos: "CB", ovr: 68, age: 38, nat: "USA", pot: 68 },
    { name: "Sebastien Ibeagha", pos: "CB", ovr: 71, age: 34, nat: "USA", pot: 71 },
    { name: "Marco Farfan", pos: "LB", ovr: 71, age: 27, nat: "USA", pot: 72 },
    { name: "Esmir Bajraktarevic", pos: "RW", ovr: 72, age: 21, nat: "USA", pot: 81 },
    { name: "Asier Illarramendi", pos: "CDM", ovr: 75, age: 36, nat: "ESP", pot: 75 },
    { name: "Paxton Pomykal", pos: "CM", ovr: 73, age: 26, nat: "USA", pot: 76 },
    { name: "Liam Fraser", pos: "CDM", ovr: 71, age: 28, nat: "CAN", pot: 72 },
    { name: "Logan Farrington", pos: "ST", ovr: 70, age: 24, nat: "USA", pot: 75 },
    { name: "Bernard Kamungo", pos: "RW", ovr: 71, age: 24, nat: "TAN", pot: 77 },
    { name: "Paul Arriola", pos: "RW", ovr: 73, age: 31, nat: "USA", pot: 73 },
    { name: "Alan Velasco", pos: "LW", ovr: 76, age: 24, nat: "ARG", pot: 81 },
    { name: "Jimmy Maurer", pos: "GK", ovr: 67, age: 37, nat: "USA", pot: 67 }
  ],

  // ── Houston Dynamo FC ──
  us_hou: [
    { name: "Héctor Herrera", pos: "CM", ovr: 77, age: 36, nat: "MEX", pot: 77 },
    { name: "Steve Clark", pos: "GK", ovr: 73, age: 40, nat: "USA", pot: 73 },
    { name: "Erik Sviatchenko", pos: "CB", ovr: 73, age: 34, nat: "DEN", pot: 73 },
    { name: "Micael", pos: "CB", ovr: 72, age: 26, nat: "BRA", pot: 75 },
    { name: "Griffin Dorsey", pos: "RB", ovr: 72, age: 27, nat: "USA", pot: 73 },
    { name: "Franco Escobar", pos: "RB", ovr: 72, age: 31, nat: "ARG", pot: 72 },
    { name: "Artur", pos: "CDM", ovr: 74, age: 30, nat: "BRA", pot: 74 },
    { name: "Amine Bassi", pos: "CAM", ovr: 74, age: 28, nat: "MAR", pot: 75 },
    { name: "Coco Carrasquilla", pos: "CM", ovr: 75, age: 27, nat: "PAN", pot: 77 },
    { name: "Latensing Blessing", pos: "RW", ovr: 72, age: 29, nat: "GHA", pot: 72 },
    { name: "Nelson Quiñónes", pos: "LW", ovr: 71, age: 23, nat: "COL", pot: 77 },
    { name: "Ibrahim Aliyu", pos: "ST", ovr: 72, age: 24, nat: "NGA", pot: 76 },
    { name: "Ezequiel Ponce", pos: "ST", ovr: 75, age: 29, nat: "ARG", pot: 76 },
    { name: "Brad Smith", pos: "LB", ovr: 69, age: 32, nat: "AUS", pot: 69 },
    { name: "Andrew Tarbell", pos: "GK", ovr: 68, age: 32, nat: "USA", pot: 68 }
  ],

  // ── LA Galaxy ──
  us_lag: [
    { name: "Riqui Puig", pos: "CAM", ovr: 79, age: 27, nat: "ESP", pot: 82 },
    { name: "John McCarthy", pos: "GK", ovr: 73, age: 34, nat: "USA", pot: 73 },
    { name: "Maya Yoshida", pos: "CB", ovr: 74, age: 38, nat: "JPN", pot: 74 },
    { name: "Martin Caceres", pos: "CB", ovr: 72, age: 39, nat: "URU", pot: 72 },
    { name: "Jalen Neal", pos: "CB", ovr: 71, age: 23, nat: "USA", pot: 78 },
    { name: "Miki Yamane", pos: "RB", ovr: 74, age: 32, nat: "JPN", pot: 74 },
    { name: "Gabriel Pec", pos: "RW", ovr: 77, age: 25, nat: "BRA", pot: 81 },
    { name: "Joseph Paintsil", pos: "LW", ovr: 78, age: 28, nat: "GHA", pot: 79 },
    { name: "Dejan Joveljic", pos: "ST", ovr: 76, age: 27, nat: "SRB", pot: 78 },
    { name: "Edwin Cerrillo", pos: "CDM", ovr: 72, age: 25, nat: "USA", pot: 76 },
    { name: "Mark Delgado", pos: "CM", ovr: 73, age: 31, nat: "USA", pot: 73 },
    { name: "Diego Fagúndez", pos: "LW", ovr: 72, age: 31, nat: "URU", pot: 72 },
    { name: "Miguel Berry", pos: "ST", ovr: 69, age: 28, nat: "ESP", pot: 69 },
    { name: "John Nelson", pos: "LB", ovr: 69, age: 27, nat: "USA", pot: 70 },
    { name: "Novak Micovic", pos: "GK", ovr: 69, age: 24, nat: "SRB", pot: 76 }
  ],

  // ── Los Angeles Football Club (LAFC) ──
  us_laf: [
    { name: "Denis Bouanga", pos: "LW", ovr: 80, age: 31, nat: "GAB", pot: 80 },
    { name: "Hugo Lloris", pos: "GK", ovr: 77, age: 39, nat: "FRA", pot: 77 },
    { name: "Aaron Long", pos: "CB", ovr: 75, age: 34, nat: "USA", pot: 75 },
    { name: "Eddie Segura", pos: "CB", ovr: 72, age: 29, nat: "COL", pot: 72 },
    { name: "Ryan Hollingshead", pos: "LB", ovr: 73, age: 35, nat: "USA", pot: 73 },
    { name: "Sergi Palencia", pos: "RB", ovr: 72, age: 30, nat: "ESP", pot: 72 },
    { name: "Ilie Sánchez", pos: "CDM", ovr: 74, age: 35, nat: "ESP", pot: 74 },
    { name: "Timothy Tillman", pos: "CM", ovr: 74, age: 27, nat: "USA", pot: 76 },
    { name: "Mateusz Bogusz", pos: "CAM", ovr: 76, age: 25, nat: "POL", pot: 81 },
    { name: "Olivier Giroud", pos: "ST", ovr: 78, age: 39, nat: "FRA", pot: 78 },
    { name: "Cristian Olivera", pos: "RW", ovr: 75, age: 24, nat: "URU", pot: 80 },
    { name: "Kei Kamara", pos: "ST", ovr: 70, age: 41, nat: "SLE", pot: 70 },
    { name: "David Martínez", pos: "RW", ovr: 71, age: 20, nat: "VEN", pot: 80 },
    { name: "Lewis O'Brien", pos: "CM", ovr: 74, age: 27, nat: "ENG", pot: 76 },
    { name: "Thomas Hasal", pos: "GK", ovr: 68, age: 27, nat: "CAN", pot: 71 }
  ],

  // ── Minnesota United FC ──
  us_mnu: [
    { name: "Teemu Pukki", pos: "ST", ovr: 75, age: 36, nat: "FIN", pot: 75 },
    { name: "Dayne St. Clair", pos: "GK", ovr: 74, age: 29, nat: "CAN", pot: 76 },
    { name: "Michael Boxall", pos: "CB", ovr: 72, age: 38, nat: "NZL", pot: 72 },
    { name: "Miguel Tapias", pos: "CB", ovr: 73, age: 29, nat: "MEX", pot: 73 },
    { name: "Devin Padelford", pos: "LB", ovr: 68, age: 23, nat: "USA", pot: 74 },
    { name: "Alejandro Bran", pos: "CM", ovr: 71, age: 25, nat: "CRC", pot: 75 },
    { name: "Hassani Dotson", pos: "CM", ovr: 73, age: 28, nat: "USA", pot: 74 },
    { name: "Wil Trapp", pos: "CDM", ovr: 72, age: 33, nat: "USA", pot: 72 },
    { name: "Robin Lod", pos: "RW", ovr: 75, age: 33, nat: "FIN", pot: 75 },
    { name: "Bongokuhle Hlongwane", pos: "RW", ovr: 74, age: 26, nat: "RSA", pot: 76 },
    { name: "Sang-bin Jeong", pos: "LW", ovr: 71, age: 24, nat: "KOR", pot: 76 },
    { name: "Kelvin Yeboah", pos: "ST", ovr: 74, age: 26, nat: "ITA", pot: 77 },
    { name: "Franco Fragapane", pos: "LW", ovr: 71, age: 33, nat: "ARG", pot: 71 },
    { name: "Zarek Valentin", pos: "RB", ovr: 68, age: 35, nat: "PUR", pot: 68 },
    { name: "Clint Irwin", pos: "GK", ovr: 66, age: 37, nat: "USA", pot: 66 }
  ],

  // ── CF Montréal ──
  us_cfm: [
    { name: "Samuel Piette", pos: "CDM", ovr: 72, age: 31, nat: "CAN", pot: 72 },
    { name: "Jonathan Sirois", pos: "GK", ovr: 73, age: 25, nat: "CAN", pot: 78 },
    { name: "Gabriele Corbo", pos: "CB", ovr: 71, age: 26, nat: "ITA", pot: 73 },
    { name: "Joel Waterman", pos: "CB", ovr: 72, age: 30, nat: "CAN", pot: 72 },
    { name: "Fernando Álvarez", pos: "CB", ovr: 70, age: 23, nat: "COL", pot: 76 },
    { name: "Ruan", pos: "RB", ovr: 72, age: 31, nat: "BRA", pot: 72 },
    { name: "Raheem Edwards", pos: "LB", ovr: 70, age: 31, nat: "CAN", pot: 70 },
    { name: "Bryce Duke", pos: "CM", ovr: 71, age: 25, nat: "USA", pot: 76 },
    { name: "Nathan Saliba", pos: "CM", ovr: 72, age: 22, nat: "CAN", pot: 80 },
    { name: "Matías Cóccaro", pos: "ST", ovr: 73, age: 28, nat: "URU", pot: 74 },
    { name: "Josef Martínez", pos: "ST", ovr: 75, age: 33, nat: "VEN", pot: 75 },
    { name: "Sunusi Ibrahim", pos: "LW", ovr: 71, age: 23, nat: "NGA", pot: 76 },
    { name: "Ariel Lassiter", pos: "LW", ovr: 71, age: 31, nat: "CRC", pot: 71 },
    { name: "Víctor Cabrera", pos: "CB", ovr: 70, age: 33, nat: "ARG", pot: 70 },
    { name: "Logan Ketterer", pos: "GK", ovr: 67, age: 32, nat: "USA", pot: 67 }
  ],

  // ── Nashville SC ──
  us_nsh: [
    { name: "Hany Mukhtar", pos: "CAM", ovr: 79, age: 31, nat: "GER", pot: 79 },
    { name: "Sam Surridge", pos: "ST", ovr: 75, age: 28, nat: "ENG", pot: 76 },
    { name: "Joe Willis", pos: "GK", ovr: 72, age: 38, nat: "USA", pot: 72 },
    { name: "Walker Zimmerman", pos: "CB", ovr: 77, age: 33, nat: "USA", pot: 77 },
    { name: "Lukas MacNaughton", pos: "CB", ovr: 71, age: 31, nat: "CAN", pot: 71 },
    { name: "Daniel Lovitz", pos: "LB", ovr: 72, age: 34, nat: "USA", pot: 72 },
    { name: "Shaq Moore", pos: "RB", ovr: 73, age: 29, nat: "USA", pot: 74 },
    { name: "Aníbal Godoy", pos: "CDM", ovr: 73, age: 36, nat: "PAN", pot: 73 },
    { name: "Sean Davis", pos: "CM", ovr: 72, age: 33, nat: "USA", pot: 72 },
    { name: "Alex Muyl", pos: "RM", ovr: 71, age: 30, nat: "USA", pot: 71 },
    { name: "Jacob Shaffelburg", pos: "LW", ovr: 73, age: 26, nat: "CAN", pot: 76 },
    { name: "Tyler Boyd", pos: "RW", ovr: 73, age: 31, nat: "NZL", pot: 73 },
    { name: "Teal Bunbury", pos: "ST", ovr: 68, age: 36, nat: "USA", pot: 68 },
    { name: "Dru Yearwood", pos: "CM", ovr: 71, age: 26, nat: "ENG", pot: 74 },
    { name: "Elliot Panicco", pos: "GK", ovr: 68, age: 29, nat: "USA", pot: 69 }
  ],

  // ── New England Revolution ──
  us_ne: [
    { name: "Carles Gil", pos: "CAM", ovr: 78, age: 33, nat: "ESP", pot: 78 },
    { name: "Henrich Ravas", pos: "GK", ovr: 72, age: 28, nat: "SVK", pot: 74 },
    { name: "Andrew Farrell", pos: "CB", ovr: 71, age: 34, nat: "USA", pot: 71 },
    { name: "McKinze Gaines", pos: "RB", ovr: 69, age: 28, nat: "USA", pot: 69 },
    { name: "Dave Romney", pos: "CB", ovr: 72, age: 33, nat: "USA", pot: 72 },
    { name: "DeJuan Jones", pos: "LB", ovr: 73, age: 29, nat: "USA", pot: 74 },
    { name: "Matt Polster", pos: "CDM", ovr: 73, age: 33, nat: "USA", pot: 73 },
    { name: "Mark-Anthony Kaye", pos: "CM", ovr: 72, age: 31, nat: "CAN", pot: 72 },
    { name: "Noel Buck", pos: "CM", ovr: 71, age: 21, nat: "ENG", pot: 80 },
    { name: "Tomás Chancalay", pos: "LW", ovr: 75, age: 27, nat: "ARG", pot: 77 },
    { name: "Dylan Borrero", pos: "LW", ovr: 72, age: 24, nat: "COL", pot: 78 },
    { name: "Giacomo Vrioni", pos: "ST", ovr: 74, age: 27, nat: "ALB", pot: 76 },
    { name: "Bobby Wood", pos: "ST", ovr: 71, age: 33, nat: "USA", pot: 71 },
    { name: "Ian Harkes", pos: "CM", ovr: 71, age: 31, nat: "USA", pot: 71 },
    { name: "Earl Edwards Jr.", pos: "GK", ovr: 68, age: 34, nat: "USA", pot: 68 }
  ],

  // ── New York City FC ──
  us_nyc: [
    { name: "Santiago Rodríguez", pos: "CAM", ovr: 76, age: 26, nat: "URU", pot: 79 },
    { name: "Matt Freese", pos: "GK", ovr: 75, age: 27, nat: "USA", pot: 79 },
    { name: "Thiago Martins", pos: "CB", ovr: 75, age: 31, nat: "BRA", pot: 75 },
    { name: "Birk Risa", pos: "CB", ovr: 73, age: 28, nat: "NOR", pot: 74 },
    { name: "Tayvon Gray", pos: "RB", ovr: 71, age: 24, nat: "JAM", pot: 76 },
    { name: "Kevin O'Toole", pos: "LB", ovr: 70, age: 27, nat: "USA", pot: 72 },
    { name: "James Sands", pos: "CDM", ovr: 74, age: 26, nat: "USA", pot: 77 },
    { name: "Andrés Perea", pos: "CM", ovr: 72, age: 25, nat: "USA", pot: 75 },
    { name: "Maxi Moralez", pos: "CAM", ovr: 71, age: 39, nat: "ARG", pot: 71 },
    { name: "Hannes Wolf", pos: "RW", ovr: 74, age: 27, nat: "AUT", pot: 76 },
    { name: "Julián Fernández", pos: "RW", ovr: 73, age: 22, nat: "ARG", pot: 80 },
    { name: "Alonso Martínez", pos: "ST", ovr: 73, age: 27, nat: "CRC", pot: 75 },
    { name: "Mounsef Bakrar", pos: "ST", ovr: 72, age: 25, nat: "ALG", pot: 76 },
    { name: "Justin Haak", pos: "CB", ovr: 70, age: 25, nat: "USA", pot: 73 },
    { name: "Luis Barraza", pos: "GK", ovr: 68, age: 29, nat: "USA", pot: 68 }
  ],

  // ── New York Red Bulls ──
  us_nyr: [
    { name: "Emil Forsberg", pos: "CAM", ovr: 79, age: 34, nat: "SWE", pot: 79 },
    { name: "Carlos Coronel", pos: "GK", ovr: 75, age: 29, nat: "PAR", pot: 77 },
    { name: "Sean Nealis", pos: "CB", ovr: 73, age: 29, nat: "USA", pot: 73 },
    { name: "Andrés Reyes", pos: "CB", ovr: 73, age: 26, nat: "COL", pot: 76 },
    { name: "John Tolkin", pos: "LB", ovr: 74, age: 24, nat: "USA", pot: 79 },
    { name: "Dylan Nealis", pos: "RB", ovr: 71, age: 27, nat: "USA", pot: 71 },
    { name: "Daniel Edelman", pos: "CDM", ovr: 72, age: 23, nat: "USA", pot: 78 },
    { name: "Wikelman Carmona", pos: "RW", ovr: 70, age: 23, nat: "VEN", pot: 76 },
    { name: "Peter Stroud", pos: "CM", ovr: 72, age: 24, nat: "USA", pot: 76 },
    { name: "Lewis Morgan", pos: "LW", ovr: 76, age: 29, nat: "SCO", pot: 76 },
    { name: "Eric Maxim Choupo-Moting", pos: "ST", ovr: 75, age: 37, nat: "CMR", pot: 75 },
    { name: "Dante Vanzeir", pos: "ST", ovr: 74, age: 28, nat: "BEL", pot: 75 },
    { name: "Cory Burke", pos: "ST", ovr: 71, age: 34, nat: "JAM", pot: 71 },
    { name: "Noah Eile", pos: "CB", ovr: 71, age: 24, nat: "SWE", pot: 76 },
    { name: "Ryan Meara", pos: "GK", ovr: 67, age: 35, nat: "USA", pot: 67 }
  ],

  // ── Orlando City SC ──
  us_orl: [
    { name: "Facundo Torres", pos: "RW", ovr: 78, age: 26, nat: "URU", pot: 81 },
    { name: "Pedro Gallese", pos: "GK", ovr: 76, age: 36, nat: "PER", pot: 76 },
    { name: "Robin Jansson", pos: "CB", ovr: 74, age: 34, nat: "SWE", pot: 74 },
    { name: "Antonio Carlos", pos: "CB", ovr: 73, age: 33, nat: "BRA", pot: 73 },
    { name: "David Brekalo", pos: "CB", ovr: 74, age: 27, nat: "SVN", pot: 76 },
    { name: "Rafael Santos", pos: "LB", ovr: 71, age: 27, nat: "BRA", pot: 73 },
    { name: "Dagur Dan Þórhallsson", pos: "RB", ovr: 71, age: 26, nat: "ISL", pot: 73 },
    { name: "César Araújo", pos: "CDM", ovr: 74, age: 25, nat: "URU", pot: 78 },
    { name: "Wilder Cartagena", pos: "CDM", ovr: 73, age: 31, nat: "PER", pot: 73 },
    { name: "Nicolás Lodeiro", pos: "CAM", ovr: 73, age: 37, nat: "URU", pot: 73 },
    { name: "Martín Ojeda", pos: "LW", ovr: 75, age: 27, nat: "ARG", pot: 77 },
    { name: "Duncan McGuire", pos: "ST", ovr: 73, age: 25, nat: "USA", pot: 77 },
    { name: "Luis Muriel", pos: "ST", ovr: 77, age: 35, nat: "COL", pot: 77 },
    { name: "Felipe Martins", pos: "CM", ovr: 68, age: 35, nat: "BRA", pot: 68 },
    { name: "Mason Stajduhar", pos: "GK", ovr: 68, age: 28, nat: "USA", pot: 70 }
  ],

  // ── Philadelphia Union ──
  us_phi: [
    { name: "Dániel Gazdag", pos: "CAM", ovr: 78, age: 30, nat: "HUN", pot: 78 },
    { name: "Andre Blake", pos: "GK", ovr: 78, age: 35, nat: "JAM", pot: 78 },
    { name: "Jakob Glesnes", pos: "CB", ovr: 75, age: 32, nat: "NOR", pot: 75 },
    { name: "Jack Elliott", pos: "CB", ovr: 74, age: 30, nat: "ENG", pot: 74 },
    { name: "Kai Wagner", pos: "LB", ovr: 76, age: 29, nat: "GER", pot: 76 },
    { name: "Nathan Harriel", pos: "RB", ovr: 72, age: 25, nat: "USA", pot: 76 },
    { name: "José Martínez", pos: "CDM", ovr: 75, age: 32, nat: "VEN", pot: 75 },
    { name: "Alejandro Bedoya", pos: "CM", ovr: 70, age: 39, nat: "USA", pot: 70 },
    { name: "Jack McGlynn", pos: "CM", ovr: 73, age: 23, nat: "USA", pot: 80 },
    { name: "Quinn Sullivan", pos: "RW", ovr: 71, age: 22, nat: "USA", pot: 78 },
    { name: "Mikael Uhre", pos: "ST", ovr: 74, age: 31, nat: "DEN", pot: 74 },
    { name: "Julián Carranza", pos: "ST", ovr: 76, age: 26, nat: "ARG", pot: 79 },
    { name: "Tai Baribo", pos: "ST", ovr: 72, age: 28, nat: "ISR", pot: 74 },
    { name: "Leon Flach", pos: "CDM", ovr: 71, age: 25, nat: "USA", pot: 74 },
    { name: "Oliver Semmle", pos: "GK", ovr: 69, age: 27, nat: "GER", pot: 72 }
  ],

  // ── Portland Timbers ──
  us_por: [
    { name: "Evander", pos: "CAM", ovr: 78, age: 28, nat: "BRA", pot: 80 },
    { name: "Maxime Crépeau", pos: "GK", ovr: 74, age: 32, nat: "CAN", pot: 74 },
    { name: "Kamal Miller", pos: "CB", ovr: 73, age: 29, nat: "CAN", pot: 74 },
    { name: "Dario Zuparic", pos: "CB", ovr: 71, age: 34, nat: "CRO", pot: 71 },
    { name: "Claudio Bravo", pos: "LB", ovr: 72, age: 29, nat: "ARG", pot: 72 },
    { name: "Juan Mosquera", pos: "RB", ovr: 73, age: 23, nat: "COL", pot: 78 },
    { name: "Diego Chará", pos: "CDM", ovr: 72, age: 40, nat: "COL", pot: 72 },
    { name: "David Ayala", pos: "CM", ovr: 71, age: 24, nat: "ARG", pot: 76 },
    { name: "Santiago Moreno", pos: "RW", ovr: 74, age: 26, nat: "COL", pot: 77 },
    { name: "Jonathan Rodríguez", pos: "LW", ovr: 77, age: 33, nat: "URU", pot: 77 },
    { name: "Felipe Mora", pos: "ST", ovr: 73, age: 33, nat: "CHI", pot: 73 },
    { name: "Antony", pos: "LW", ovr: 71, age: 25, nat: "BRA", pot: 75 },
    { name: "Dairon Asprilla", pos: "RW", ovr: 70, age: 34, nat: "COL", pot: 70 },
    { name: "Eryk Williamson", pos: "CM", ovr: 72, age: 29, nat: "USA", pot: 72 },
    { name: "James Pantemis", pos: "GK", ovr: 69, age: 29, nat: "CAN", pot: 71 }
  ],

  // ── Real Salt Lake ──
  us_rsl: [
    { name: "Cristian Arango", pos: "ST", ovr: 78, age: 31, nat: "COL", pot: 78 },
    { name: "Zac MacMath", pos: "GK", ovr: 72, age: 35, nat: "USA", pot: 72 },
    { name: "Justen Glad", pos: "CB", ovr: 73, age: 29, nat: "USA", pot: 74 },
    { name: "Brayan Vera", pos: "CB", ovr: 72, age: 27, nat: "COL", pot: 75 },
    { name: "Alexandros Katranis", pos: "LB", ovr: 71, age: 28, nat: "GRE", pot: 72 },
    { name: "Emeka Eneli", pos: "RB", ovr: 71, age: 26, nat: "USA", pot: 74 },
    { name: "Braian Ojeda", pos: "CDM", ovr: 73, age: 26, nat: "PAR", pot: 76 },
    { name: "Pablo Ruiz", pos: "CM", ovr: 73, age: 27, nat: "ARG", pot: 75 },
    { name: "Diego Luna", pos: "CAM", ovr: 74, age: 23, nat: "USA", pot: 81 },
    { name: "Andrés Gómez", pos: "RW", ovr: 75, age: 23, nat: "COL", pot: 80 },
    { name: "Anderson Julio", pos: "LW", ovr: 72, age: 30, nat: "ECU", pot: 72 },
    { name: "Nelson Palacio", pos: "CDM", ovr: 70, age: 25, nat: "COL", pot: 74 },
    { name: "Matt Crooks", pos: "CAM", ovr: 73, age: 32, nat: "ENG", pot: 73 },
    { name: "Bode Hidalgo", pos: "RB", ovr: 69, age: 24, nat: "USA", pot: 74 },
    { name: "Gavin Beavers", pos: "GK", ovr: 69, age: 21, nat: "USA", pot: 79 }
  ],

  // ── San Diego FC ──
  us_sdf: [
    { name: "Hirving Lozano", pos: "RW", ovr: 79, age: 31, nat: "MEX", pot: 79 },
    { name: "Pablo Sisniega", pos: "GK", ovr: 70, age: 31, nat: "MEX", pot: 70 },
    { name: "Marcus Ingvartsen", pos: "ST", ovr: 73, age: 30, nat: "DEN", pot: 73 },
    { name: "Jeppe Tverskov", pos: "CDM", ovr: 72, age: 33, nat: "DEN", pot: 72 },
    { name: "Anders Dreyer", pos: "RW", ovr: 76, age: 28, nat: "DEN", pot: 76 },
    { name: "Mikael Uhre", pos: "ST", ovr: 73, age: 31, nat: "DEN", pot: 73 },
    { name: "Cavan Sullivan", pos: "CAM", ovr: 68, age: 16, nat: "USA", pot: 89 },
    { name: "Aníbal Godoy", pos: "CDM", ovr: 71, age: 36, nat: "PAN", pot: 71 },
    { name: "Ayrton Costa", pos: "CB", ovr: 72, age: 27, nat: "ARG", pot: 75 },
    { name: "Tyler Boyd", pos: "LW", ovr: 71, age: 31, nat: "NZL", pot: 71 },
    { name: "Kobi Henry", pos: "CB", ovr: 68, age: 22, nat: "USA", pot: 76 },
    { name: "Wikelman Carmona", pos: "LW", ovr: 69, age: 23, nat: "VEN", pot: 75 },
    { name: "Djordje Petrovic", pos: "GK", ovr: 76, age: 26, nat: "SRB", pot: 80 },
    { name: "Alex Muyl", pos: "RM", ovr: 69, age: 30, nat: "USA", pot: 69 },
    { name: "Imran Oulad", pos: "CM", ovr: 67, age: 22, nat: "MAR", pot: 74 }
  ],

  // ── San Jose Earthquakes ──
  us_sje: [
    { name: "Cristian Espinoza", pos: "RW", ovr: 76, age: 31, nat: "ARG", pot: 76 },
    { name: "William Yarbrough", pos: "GK", ovr: 71, age: 37, nat: "USA", pot: 71 },
    { name: "Bruno Wilson", pos: "CB", ovr: 72, age: 29, nat: "POR", pot: 72 },
    { name: "Rodrigues", pos: "CB", ovr: 73, age: 29, nat: "BRA", pot: 74 },
    { name: "Paul Marie", pos: "LB", ovr: 70, age: 31, nat: "FRA", pot: 70 },
    { name: "Carlos Akapo", pos: "RB", ovr: 71, age: 33, nat: "EQG", pot: 71 },
    { name: "Jackson Yueill", pos: "CDM", ovr: 72, age: 29, nat: "USA", pot: 72 },
    { name: "Carlos Gruezo", pos: "CDM", ovr: 73, age: 31, nat: "ECU", pot: 73 },
    { name: "Hernán López", pos: "CAM", ovr: 75, age: 25, nat: "ARG", pot: 78 },
    { name: "Amahl Pellegrino", pos: "LW", ovr: 74, age: 36, nat: "NOR", pot: 74 },
    { name: "Jeremy Ebobisse", pos: "ST", ovr: 73, age: 29, nat: "USA", pot: 73 },
    { name: "Preston Judd", pos: "ST", ovr: 69, age: 27, nat: "USA", pot: 70 },
    { name: "Oussama Bouyaghlafen", pos: "LW", ovr: 68, age: 24, nat: "NED", pot: 73 },
    { name: "Tanner Beason", pos: "CB", ovr: 70, age: 29, nat: "USA", pot: 70 },
    { name: "Emi Ochoa", pos: "GK", ovr: 66, age: 21, nat: "MEX", pot: 78 }
  ],

  // ── Seattle Sounders FC ──
  us_sea: [
    { name: "Jordan Morris", pos: "ST", ovr: 76, age: 31, nat: "USA", pot: 76 },
    { name: "Stefan Frei", pos: "GK", ovr: 75, age: 40, nat: "SUI", pot: 75 },
    { name: "Yeimar Gómez", pos: "CB", ovr: 75, age: 34, nat: "COL", pot: 75 },
    { name: "Jackson Ragen", pos: "CB", ovr: 73, age: 27, nat: "USA", pot: 75 },
    { name: "Nouhou Tolo", pos: "LB", ovr: 74, age: 29, nat: "CMR", pot: 75 },
    { name: "Alex Roldan", pos: "RB", ovr: 73, age: 30, nat: "SLV", pot: 73 },
    { name: "João Paulo", pos: "CDM", ovr: 75, age: 35, nat: "BRA", pot: 75 },
    { name: "Albert Rusnák", pos: "CAM", ovr: 76, age: 32, nat: "SVK", pot: 76 },
    { name: "Cristian Roldan", pos: "CM", ovr: 75, age: 31, nat: "USA", pot: 75 },
    { name: "Pedro de la Vega", pos: "LW", ovr: 75, age: 25, nat: "ARG", pot: 80 },
    { name: "Raúl Ruidíaz", pos: "ST", ovr: 75, age: 36, nat: "PER", pot: 75 },
    { name: "Léo Chú", pos: "LW", ovr: 72, age: 26, nat: "BRA", pot: 75 },
    { name: "Paul Rothrock", pos: "LW", ovr: 70, age: 27, nat: "USA", pot: 71 },
    { name: "Obed Vargas", pos: "CM", ovr: 72, age: 21, nat: "MEX", pot: 81 },
    { name: "Andrew Thomas", pos: "GK", ovr: 69, age: 27, nat: "USA", pot: 73 }
  ],

  // ── Sporting Kansas City ──
  us_skc: [
    { name: "Alan Pulido", pos: "ST", ovr: 75, age: 35, nat: "MEX", pot: 75 },
    { name: "Tim Melia", pos: "GK", ovr: 72, age: 40, nat: "USA", pot: 72 },
    { name: "Dany Rosero", pos: "CB", ovr: 73, age: 32, nat: "COL", pot: 73 },
    { name: "Andreu Fontàs", pos: "CB", ovr: 71, age: 36, nat: "ESP", pot: 71 },
    { name: "Logan Ndenbe", pos: "LB", ovr: 71, age: 26, nat: "BEL", pot: 74 },
    { name: "Jake Davis", pos: "RB", ovr: 72, age: 24, nat: "USA", pot: 77 },
    { name: "Nemanja Radoja", pos: "CDM", ovr: 73, age: 33, nat: "SRB", pot: 73 },
    { name: "Erik Thommy", pos: "CAM", ovr: 75, age: 32, nat: "GER", pot: 75 },
    { name: "Rémi Walter", pos: "CM", ovr: 73, age: 31, nat: "FRA", pot: 73 },
    { name: "Johnny Russell", pos: "RW", ovr: 72, age: 36, nat: "SCO", pot: 72 },
    { name: "Dániel Sallói", pos: "LW", ovr: 75, age: 29, nat: "HUN", pot: 75 },
    { name: "Willy Agada", pos: "ST", ovr: 72, age: 27, nat: "NGA", pot: 74 },
    { name: "Memo Rodríguez", pos: "CM", ovr: 70, age: 30, nat: "USA", pot: 70 },
    { name: "Robert Voloder", pos: "CB", ovr: 69, age: 25, nat: "GER", pot: 72 },
    { name: "John Pulskamp", pos: "GK", ovr: 68, age: 25, nat: "USA", pot: 74 }
  ],

  // ── St. Louis CITY SC ──
  us_stl: [
    { name: "Roman Bürki", pos: "GK", ovr: 77, age: 35, nat: "SUI", pot: 77 },
    { name: "Joakim Nilsson", pos: "CB", ovr: 73, age: 32, nat: "SWE", pot: 73 },
    { name: "Tim Parker", pos: "CB", ovr: 73, age: 33, nat: "USA", pot: 73 },
    { name: "Jannes Horn", pos: "LB", ovr: 72, age: 29, nat: "GER", pot: 72 },
    { name: "Jake Nerwinski", pos: "RB", ovr: 70, age: 31, nat: "USA", pot: 70 },
    { name: "Eduard Löwen", pos: "CM", ovr: 76, age: 29, nat: "GER", pot: 77 },
    { name: "Célio Pompeu", pos: "LW", ovr: 71, age: 26, nat: "BRA", pot: 74 },
    { name: "Njabulo Blom", pos: "CDM", ovr: 72, age: 26, nat: "RSA", pot: 75 },
    { name: "Tomáš Ostrák", pos: "CAM", ovr: 71, age: 26, nat: "CZE", pot: 73 },
    { name: "João Klauss", pos: "ST", ovr: 75, age: 29, nat: "BRA", pot: 75 },
    { name: "Indiana Vassilev", pos: "RW", ovr: 72, age: 25, nat: "USA", pot: 76 },
    { name: "Simon Becher", pos: "ST", ovr: 70, age: 26, nat: "USA", pot: 72 },
    { name: "Samuel Adeniran", pos: "ST", ovr: 71, age: 27, nat: "USA", pot: 72 },
    { name: "Kyle Hiebert", pos: "CB", ovr: 70, age: 28, nat: "CAN", pot: 71 },
    { name: "Ben Lundt", pos: "GK", ovr: 68, age: 30, nat: "GER", pot: 68 }
  ],

  // ── Toronto FC ──
  us_tor: [
    { name: "Lorenzo Insigne", pos: "LW", ovr: 79, age: 35, nat: "ITA", pot: 79 },
    { name: "Federico Bernardeschi", pos: "RW", ovr: 78, age: 32, nat: "ITA", pot: 78 },
    { name: "Sean Johnson", pos: "GK", ovr: 74, age: 37, nat: "USA", pot: 74 },
    { name: "Kevin Long", pos: "CB", ovr: 72, age: 35, nat: "IRL", pot: 72 },
    { name: "Shane O'Neill", pos: "CB", ovr: 70, age: 32, nat: "USA", pot: 70 },
    { name: "Raoul Petretta", pos: "LB", ovr: 71, age: 29, nat: "ITA", pot: 71 },
    { name: "Laryea Richie", pos: "RB", ovr: 73, age: 31, nat: "CAN", pot: 73 },
    { name: "Jonathan Osorio", pos: "CM", ovr: 73, age: 34, nat: "CAN", pot: 73 },
    { name: "Alonso Coello", pos: "CDM", ovr: 71, age: 26, nat: "ESP", pot: 74 },
    { name: "Matty Longstaff", pos: "CM", ovr: 71, age: 26, nat: "ENG", pot: 74 },
    { name: "Deandre Kerr", pos: "ST", ovr: 71, age: 23, nat: "CAN", pot: 77 },
    { name: "Prince Owusu", pos: "ST", ovr: 72, age: 29, nat: "GER", pot: 72 },
    { name: "Brandon Servania", pos: "CM", ovr: 70, age: 27, nat: "USA", pot: 72 },
    { name: "Sigurd Rosted", pos: "CB", ovr: 71, age: 31, nat: "NOR", pot: 71 },
    { name: "Luka Gavran", pos: "GK", ovr: 68, age: 26, nat: "CAN", pot: 72 }
  ],

  // ── Vancouver Whitecaps FC ──
  us_van: [
    { name: "Ryan Gauld", pos: "CAM", ovr: 78, age: 30, nat: "SCO", pot: 78 },
    { name: "Takaoka Yohei", pos: "GK", ovr: 74, age: 30, nat: "JPN", pot: 74 },
    { name: "Ranko Veselinović", pos: "CB", ovr: 73, age: 27, nat: "SRB", pot: 75 },
    { name: "Tristan Blackmon", pos: "CB", ovr: 72, age: 30, nat: "USA", pot: 72 },
    { name: "Mathías Laborda", pos: "CB", ovr: 71, age: 26, nat: "URU", pot: 74 },
    { name: "Sam Adekugbe", pos: "LB", ovr: 72, age: 31, nat: "CAN", pot: 72 },
    { name: "Ali Ahmed", pos: "LW", ovr: 72, age: 25, nat: "CAN", pot: 77 },
    { name: "Andrés Cubas", pos: "CDM", ovr: 76, age: 30, nat: "PAR", pot: 76 },
    { name: "Pedro Vite", pos: "CAM", ovr: 73, age: 24, nat: "ECU", pot: 78 },
    { name: "Sebastian Berhalter", pos: "CM", ovr: 71, age: 25, nat: "USA", pot: 75 },
    { name: "Brian White", pos: "ST", ovr: 75, age: 30, nat: "USA", pot: 75 },
    { name: "Fafà Picault", pos: "LW", ovr: 73, age: 35, nat: "HAI", pot: 73 },
    { name: "Levis", pos: "RB", ovr: 69, age: 29, nat: "CAN", pot: 69 },
    { name: "Damir Kreilach", pos: "ST", ovr: 71, age: 37, nat: "CRO", pot: 71 },
    { name: "Isaac Boehmer", pos: "GK", ovr: 68, age: 24, nat: "CAN", pot: 74 }
  ]
};
