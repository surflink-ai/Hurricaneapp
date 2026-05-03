import type { EssayDef } from "./index";

export const sandyEssay: EssayDef = {
  slug: "sandy-2012",
  eyebrow: "Sandy · 2012",
  title: "The storm that arrived sideways",
  dek:
    "Sandy was already past hurricane in any clean sense by the time it pivoted into the New Jersey coast. The damage report belongs to a hybrid.",
  primaryStormId: "AL182012",
  bodyIntro:
    "On October 29, 2012, a low approaching the Mid-Atlantic stopped behaving like a hurricane. It expanded — the wind field swelled to over a thousand miles wide — and it began drawing in cold air from the north. Forecasters had been calling the change for days. The map alongside follows that rotation, from Caribbean genesis to the unprecedented hard-left turn that drove a 14-foot surge into Lower Manhattan.",
  chapters: [
    {
      id: "genesis",
      title: "Off Nicaragua, in slow water",
      prose:
        "Sandy formed on October 22 as a tropical depression in the southwestern Caribbean — late-season ground for a system that would still be making weather a week later. It strengthened quickly under low shear and warm SSTs, becoming a hurricane on the 24th and crossing eastern Cuba the next day as a Category 3.",
      cameraBbox: [-82, 12, -72, 22],
      focusObsIndex: 4
    },
    {
      id: "transit-bahamas",
      title: "A second wind through the Bahamas",
      prose:
        "After Cuba, Sandy weakened, but the wind field kept growing. Over the central Bahamas the eyewall organization frayed even as the storm doubled in radius. By the time it exited toward open water, gale-force winds extended more than five hundred miles from the center — already comparable to a Category 1's outer edge.",
      cameraBbox: [-80, 22, -70, 32],
      focusObsIndex: 12
    },
    {
      id: "transition",
      title: "The transition",
      prose:
        "Off the Carolinas, Sandy met a cold trough digging in from the west. Forecast guidance had been showing the merger for three days; the geometry was unusual but no longer surprising. The storm hooked west, against climatology, and began absorbing baroclinic energy. Its central pressure deepened even as the warm core eroded. By landfall it would no longer be classified as tropical.",
      pullQuote:
        "It was a hurricane that finished as something else, and what it finished as was worse.",
      cameraBbox: [-80, 32, -68, 42],
      focusObsIndex: 22
    },
    {
      id: "landfall",
      title: "Mantoloking, 7:30 p.m.",
      prose:
        "At 23:30 UTC on October 29, near Brigantine, New Jersey, Sandy made landfall as a post-tropical cyclone with 70-knot sustained winds — and a pressure of 945 mb, which would have placed it at Category 3 intensity by the pressure-only metrics of decades past. The surge was timed almost exactly to high tide. In Mantoloking, the ocean met the bay across Route 35.",
      cameraBbox: [-75.6, 39.4, -72.5, 41.4],
      focusObsIndex: 28,
      imagery: { pairId: "sandy-mantoloking", label: "Mantoloking, NJ" }
    },
    {
      id: "aftermath",
      title: "An accounting that was always going to be expensive",
      prose:
        "Sandy killed 159 people in the United States and damaged or destroyed roughly 650,000 homes. NOAA's billion-dollar disasters series puts the CPI-adjusted cost above $80 billion. The strangeness of the meteorology obscured, for a while, the fact that the New York metro had been told for years it was vulnerable to exactly this scenario.",
      cameraBbox: [-76, 38, -71, 42]
    }
  ],
  closing:
    "Sandy is sometimes filed away as a freak — the perpendicular landfall, the post-tropical re-rating. The longer view is that hybrid storms are increasingly common, and that the warm Atlantic's tendency to deliver them onto a colder coast is a feature, not a once-a-century coincidence.",
  sources: [
    { label: "Blake et al., NHC Tropical Cyclone Report AL182012", href: "https://www.nhc.noaa.gov/data/tcr/AL182012_Sandy.pdf" },
    { label: "NOAA NCEI Billion-Dollar Weather and Climate Disasters", href: "https://www.ncei.noaa.gov/access/billions/" },
    { label: "NOAA NGS Emergency Response Imagery (Mantoloking)" }
  ]
};
