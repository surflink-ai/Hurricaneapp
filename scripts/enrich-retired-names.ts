import { readFile, writeFile } from "node:fs/promises";
import type { StormsIndex } from "../lib/types";

interface RetiredEntry {
  name: string;
  year: number;
  retirementYear?: number;
}

const RETIRED_NAMES: ReadonlyArray<RetiredEntry> = [
  { name: "CAROL", year: 1954 }, { name: "EDNA", year: 1954 }, { name: "HAZEL", year: 1954 },
  { name: "CONNIE", year: 1955 }, { name: "DIANE", year: 1955 }, { name: "IONE", year: 1955 }, { name: "JANET", year: 1955 },
  { name: "AUDREY", year: 1957 },
  { name: "DONNA", year: 1960 },
  { name: "CARLA", year: 1961 }, { name: "HATTIE", year: 1961 },
  { name: "FLORA", year: 1963 },
  { name: "CLEO", year: 1964 }, { name: "DORA", year: 1964 }, { name: "HILDA", year: 1964 },
  { name: "BETSY", year: 1965 },
  { name: "INEZ", year: 1966 },
  { name: "BEULAH", year: 1967 },
  { name: "CAMILLE", year: 1969 },
  { name: "CELIA", year: 1970 },
  { name: "AGNES", year: 1972 },
  { name: "CARMEN", year: 1974 }, { name: "FIFI", year: 1974 },
  { name: "ELOISE", year: 1975 },
  { name: "ANITA", year: 1977 },
  { name: "DAVID", year: 1979 }, { name: "FREDERIC", year: 1979 },
  { name: "ALLEN", year: 1980 },
  { name: "ALICIA", year: 1983 },
  { name: "ELENA", year: 1985 }, { name: "GLORIA", year: 1985 },
  { name: "GILBERT", year: 1988 }, { name: "JOAN", year: 1988 },
  { name: "HUGO", year: 1989 },
  { name: "DIANA", year: 1990 }, { name: "KLAUS", year: 1990 },
  { name: "BOB", year: 1991 },
  { name: "ANDREW", year: 1992 },
  { name: "OPAL", year: 1995 }, { name: "ROXANNE", year: 1995 }, { name: "MARILYN", year: 1995 }, { name: "LUIS", year: 1995 },
  { name: "CESAR", year: 1996 }, { name: "FRAN", year: 1996 }, { name: "HORTENSE", year: 1996 },
  { name: "GEORGES", year: 1998 }, { name: "MITCH", year: 1998 },
  { name: "FLOYD", year: 1999 }, { name: "LENNY", year: 1999 },
  { name: "KEITH", year: 2000 },
  { name: "ALLISON", year: 2001 }, { name: "IRIS", year: 2001 }, { name: "MICHELLE", year: 2001 },
  { name: "ISIDORE", year: 2002 }, { name: "LILI", year: 2002 },
  { name: "FABIAN", year: 2003 }, { name: "ISABEL", year: 2003 }, { name: "JUAN", year: 2003 },
  { name: "CHARLEY", year: 2004 }, { name: "FRANCES", year: 2004 }, { name: "IVAN", year: 2004 }, { name: "JEANNE", year: 2004 },
  { name: "DENNIS", year: 2005 }, { name: "KATRINA", year: 2005 }, { name: "RITA", year: 2005 },
  { name: "STAN", year: 2005 }, { name: "WILMA", year: 2005 },
  { name: "DEAN", year: 2007 }, { name: "FELIX", year: 2007 }, { name: "NOEL", year: 2007 },
  { name: "GUSTAV", year: 2008 }, { name: "IKE", year: 2008 }, { name: "PALOMA", year: 2008 },
  { name: "IGOR", year: 2010 }, { name: "TOMAS", year: 2010 },
  { name: "IRENE", year: 2011 },
  { name: "SANDY", year: 2012 },
  { name: "INGRID", year: 2013 },
  { name: "ERIKA", year: 2015 }, { name: "JOAQUIN", year: 2015 },
  { name: "MATTHEW", year: 2016 }, { name: "OTTO", year: 2016 },
  { name: "HARVEY", year: 2017 }, { name: "IRMA", year: 2017 }, { name: "MARIA", year: 2017 }, { name: "NATE", year: 2017 },
  { name: "FLORENCE", year: 2018 }, { name: "MICHAEL", year: 2018 },
  { name: "DORIAN", year: 2019 },
  { name: "LAURA", year: 2020 }, { name: "ETA", year: 2020 }, { name: "IOTA", year: 2020 },
  { name: "IDA", year: 2021 },
  { name: "FIONA", year: 2022 }, { name: "IAN", year: 2022 },
  { name: "BERYL", year: 2024 }, { name: "HELENE", year: 2024 }, { name: "MILTON", year: 2024 }
];

async function main(): Promise<void> {
  const idxPath = "public/data/storms-index.json";
  const idx = JSON.parse(await readFile(idxPath, "utf8")) as StormsIndex;
  const lookup = new Map<string, RetiredEntry>();
  for (const r of RETIRED_NAMES) lookup.set(`${r.name}|${r.year}`, r);
  let count = 0;
  for (const storm of idx.storms) {
    const key = `${storm.name}|${storm.year}`;
    const entry = lookup.get(key);
    if (entry) {
      storm.retired = true;
      if (entry.retirementYear) storm.retirementYear = entry.retirementYear;
      count += 1;
    }
  }
  console.log(`[enrich-retired-names] flagged ${count} retired names`);
  await writeFile(idxPath, JSON.stringify(idx));
}

main().catch((err) => {
  console.error("[enrich-retired-names] failed:", err);
});
