import type { EssayDef } from "./index";

export const season2005Essay: EssayDef = {
  slug: "2005-season",
  eyebrow: "2005 · Season",
  title: "The year the alphabet ran out",
  dek:
    "Twenty-eight named storms, fifteen hurricanes, seven major hurricanes. The 2005 Atlantic season is still the upper bound of the modern record on almost every measure.",
  primaryStormId: "AL122005",
  bodyIntro:
    "The 2005 Atlantic hurricane season produced more named storms than any year on record (a tie was declared in 2020), more hurricanes, and more major hurricanes. Forecasters exhausted the standard list and used six Greek letters. Three Category 5 hurricanes — Katrina, Rita, and Wilma — formed within nine weeks of one another. The map at right traces the season's ten most intense storms by peak wind, in chronological order.",
  chapters: [
    {
      id: "early-summer",
      title: "An early start",
      prose:
        "Tropical Storm Arlene formed on June 8 — three weeks ahead of climatology — and Cindy was a hurricane making landfall in Louisiana by July 5. Dennis followed within days, peaking at 130 knots in the Caribbean before striking the Florida Panhandle. By the end of July, the season's ACE was already running well above any prior year on record.",
      cameraBbox: [-90, 18, -75, 32]
    },
    {
      id: "katrina-arrives",
      title: "Katrina, late August",
      prose:
        "Katrina formed in the Bahamas on August 23, crossed southern Florida as a Category 1, and then exploded in the Gulf — peaking at 150 knots and 902 mb on August 28. The Louisiana-Mississippi landfall the next morning, and the federal-levee failures that followed in New Orleans, killed more than 1,800 people and produced damages that NCEI puts north of $200 billion in CPI-adjusted terms.",
      pullQuote: "902 mb. Three landfalls. The bookkeeping never quite caught up.",
      cameraBbox: [-95, 24, -82, 32]
    },
    {
      id: "rita-stalks",
      title: "Rita, three weeks later",
      prose:
        "Rita formed on September 18 and reached 155 knots over the central Gulf — at 895 mb the lowest pressure ever recorded in the Atlantic basin at that time. Landfall on the Texas-Louisiana border was less catastrophic than feared; the evacuation, however, was the largest in U.S. history to that point and produced its own death toll.",
      cameraBbox: [-95, 22, -82, 32]
    },
    {
      id: "wilma",
      title: "Wilma's eye, twelve hours of it",
      prose:
        "On October 19, in a span of about twelve hours, Wilma's central pressure fell 95 millibars to 882 mb — the most rapid intensification ever observed in an Atlantic hurricane and the lowest pressure on the Atlantic record. The eye, briefly, was 2 nautical miles wide. Landfalls in Quintana Roo and South Florida followed.",
      cameraBbox: [-90, 17, -78, 28]
    },
    {
      id: "greek-letters",
      title: "The Greek list",
      prose:
        "Tropical Storm Alpha formed on October 22, the twenty-second named storm of the season. Beta, Gamma, Delta, Epsilon, and Zeta followed. Zeta was still a tropical storm on January 6, 2006, the only storm in the modern record to span two calendar years. The Greek-letter system has since been retired in favor of a supplemental list, but the 2005 entries remain on the books.",
      cameraBbox: [-65, 12, -45, 25]
    }
  ],
  closing:
    "What makes 2005 hard to compare with later seasons is that the season-total metrics — named storms, hurricanes, ACE — are themselves moving targets as detection and reanalysis improve. The events of August through October, however, are not. They produced four of the ten most intense Atlantic hurricanes ever recorded, and a death toll concentrated almost entirely in a single American city.",
  sources: [
    { label: "Beven et al., 2008 — Annual Summary, Atlantic Hurricane Season of 2005", href: "https://journals.ametsoc.org/view/journals/mwre/136/3/2007mwr2074.1.xml" },
    { label: "Knabb et al., NHC TCR — Hurricane Katrina", href: "https://www.nhc.noaa.gov/data/tcr/AL122005_Katrina.pdf" },
    { label: "Pasch et al., NHC TCR — Hurricane Wilma", href: "https://www.nhc.noaa.gov/data/tcr/AL252005_Wilma.pdf" },
    { label: "NOAA NCEI Billion-Dollar Weather and Climate Disasters" }
  ]
};
