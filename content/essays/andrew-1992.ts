import type { EssayDef } from "./index";

export const andrewEssay: EssayDef = {
  slug: "andrew-1992",
  eyebrow: "Andrew · 1992",
  title: "The storm that bent the scale",
  dek:
    "Andrew was rated Category 4 at landfall, then quietly upgraded to Category 5 a decade later. The reanalysis is the more interesting story.",
  primaryStormId: "AL041992",
  bodyIntro:
    "By the time Hurricane Andrew crossed the Florida coast just south of Miami at dawn on August 24, 1992, it had already been an unusually compact, unusually violent storm. The landfall intensity was first set at 130 knots — Category 4. In 2002, after a careful reanalysis of dropsonde, surface, and Doppler data, NOAA's Hurricane Research Division revised the figure to 145 knots. Andrew became, retroactively, only the third Atlantic Category 5 to hit the U.S. mainland.",
  chapters: [
    {
      id: "genesis",
      title: "A struggling tropical wave",
      prose:
        "Andrew began as a tropical wave off Africa on August 14. For the next week it crossed the deep Atlantic in a hostile environment — strong upper-level winds, dry mid-level air. By August 20 it had nearly dissipated. Then the shear collapsed.",
      cameraBbox: [-65, 20, -45, 32],
      focusObsIndex: 6
    },
    {
      id: "intensification",
      title: "Two days of geometry",
      prose:
        "From the morning of August 22 to the morning of August 23, Andrew's central pressure fell from 991 mb to 922 mb. Its eye contracted to under 8 nautical miles — a small storm by Atlantic standards, but a small storm with extraordinary pressure gradients. Eyewall winds were estimated at 165 mph at peak.",
      pullQuote: "The smaller the eye, the more the wind has to do.",
      cameraBbox: [-78, 23, -70, 29],
      focusObsIndex: 14
    },
    {
      id: "landfall",
      title: "Homestead",
      prose:
        "Andrew came ashore at Fender Point near Homestead at 09:05 UTC on August 24 with one-minute sustained winds of 145 knots and a central pressure of 922 mb — making it, in pressure terms alone, more intense than any landfalling Atlantic hurricane on record except the Labor Day storm of 1935. The eye crossed the southern tip of Florida in under four hours.",
      cameraBbox: [-82.5, 24.5, -79, 27],
      focusObsIndex: 18,
      imagery: { pairId: "andrew-homestead", label: "Homestead, FL" }
    },
    {
      id: "second-landfall",
      title: "Louisiana, two days later",
      prose:
        "Andrew re-emerged into the Gulf of Mexico, restrengthened over a few warm hours, and made a second landfall in south-central Louisiana on August 26 as a Category 3. The Louisiana damage was severe but overshadowed in public memory by what had already happened in Dade County.",
      cameraBbox: [-95, 27, -88, 32],
      focusObsIndex: 24
    },
    {
      id: "rewrite",
      title: "The rewrite",
      prose:
        "Andrew's 2002 reanalysis was not just a numerical update. It was the formal acknowledgement that the wind speeds at landfall had been systematically under-measured: anemometers had failed; aircraft data had been transcribed conservatively; the gradient between coastal stations and the eyewall was steeper than the available instruments could resolve. Florida's building codes, rewritten in 1994 in Andrew's wake, were already more honest about the storm than the official rating had been.",
      cameraBbox: [-82, 25, -79, 27]
    }
  ],
  closing:
    "Andrew is the case study most insurers cite for what a fast-moving Category 5 striking a major metropolitan area looks like in modern terms. It is also the case study for why operational-time best-track values are revisable.",
  sources: [
    { label: "Landsea et al., 2004 — A Reanalysis of Hurricane Andrew (1992)", href: "https://www.aoml.noaa.gov/hrd/hurdat/andrew_paper.html" },
    { label: "Rappaport, 1993 — Preliminary Report: Hurricane Andrew", href: "https://www.nhc.noaa.gov/1992andrew.html" },
    { label: "NASA Earth Observatory imagery (Andrew)" }
  ]
};
