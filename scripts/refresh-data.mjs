import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const cacheDir = join(root, ".cache", "source-downloads");
const generatedDir = join(root, "src", "data", "generated");
const publicDataDir = join(root, "public", "data");

mkdirSync(cacheDir, { recursive: true });
mkdirSync(generatedDir, { recursive: true });
mkdirSync(publicDataDir, { recursive: true });

const generatedAt = new Date().toISOString();

const sources = [
  {
    id: "statcan-wds",
    title: "Statistics Canada Web Data Service",
    publisher: "Statistics Canada",
    url: "https://www.statcan.gc.ca/en/developers/wds",
    sourceType: "official_api",
    tier: 1,
    cadence: "business-day",
    use: "Discovery and update metadata for StatCan public tables.",
  },
  {
    id: "statcan-business-counts-33101095",
    title: "Canadian Business Counts, with employees",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/en/tbl/csv/33101095-eng.zip",
    sourceType: "official_csv",
    tier: 1,
    cadence: "semi-annual",
    use: "Provincial firm-count signal by NAICS.",
  },
  {
    id: "statcan-rd-performers-27100049",
    title: "Counts of business enterprise research and development performers by industry group",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/en/tbl/csv/27100049-eng.zip",
    sourceType: "official_csv",
    tier: 1,
    cadence: "annual",
    use: "National R&D performer signal by industry.",
  },
  {
    id: "statcan-labour-14100023",
    title: "Labour force characteristics by industry, annual",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/en/tbl/csv/14100023-eng.zip",
    sourceType: "official_csv",
    tier: 1,
    cadence: "annual",
    use: "Catalogued for future labour normalization; not displayed as a computed regional value in v1.",
  },
  {
    id: "statcan-trade-12100175",
    title: "International merchandise trade by province, commodity, and principal trading partners",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/en/tbl/csv/12100175-eng.zip",
    sourceType: "official_csv",
    tier: 1,
    cadence: "monthly",
    use: "Catalogued for future export normalization; not displayed as a computed regional value in v1.",
  },
  {
    id: "statcan-gdp-36100711",
    title: "GDP at basic prices by industry, provinces and territories",
    publisher: "Statistics Canada",
    url: "https://www150.statcan.gc.ca/n1/en/tbl/csv/36100711-eng.zip",
    sourceType: "official_csv",
    tier: 1,
    cadence: "annual",
    use: "Catalogued for future provincial industry output normalization.",
  },
  {
    id: "dnd-dcb-2025",
    title: "Defence Capabilities Blueprint",
    publisher: "Department of National Defence",
    url: "https://apps.forces.gc.ca/en/defence-capabilities-blueprint/index.asp",
    sourceType: "official_html",
    tier: 1,
    cadence: "annual",
    use: "Public capability taxonomy and demand-signal context.",
  },
  {
    id: "dnd-defence-industrial-strategy",
    title: "Canada's Defence Industrial Strategy",
    publisher: "Department of National Defence",
    url: "https://www.canada.ca/en/department-national-defence/corporate/reports-publications/industrial-strategy/security-sovereignty-prosperity.html",
    sourceType: "official_html",
    tier: 1,
    cadence: "policy-update",
    use: "Public sovereign capability categories and strategic rationale.",
  },
  {
    id: "canadabuys-tenders",
    title: "CanadaBuys tender notices",
    publisher: "Public Services and Procurement Canada",
    url: "https://canadabuys.canada.ca/opendata/pub/tenderNoticeComplete-avisAppelOffresComplet.csv",
    sourceType: "official_csv",
    tier: 1,
    cadence: "daily",
    use: "Procurement demand signal; catalogued before keyword normalization.",
  },
  {
    id: "canadabuys-awards",
    title: "CanadaBuys award notices",
    publisher: "Public Services and Procurement Canada",
    url: "https://canadabuys.canada.ca/opendata/pub/awardNoticeComplete-avisAttributionComplet.csv",
    sourceType: "official_csv",
    tier: 1,
    cadence: "daily",
    use: "Award history signal; catalogued before buyer/vendor normalization.",
  },
  {
    id: "open-contracts",
    title: "Proactive Publication - Contracts",
    publisher: "Government of Canada",
    url: "https://open.canada.ca/data/en/dataset/d8f85d91-7dec-4fd1-8055-483b77225d8b",
    sourceType: "official_dataset",
    tier: 1,
    cadence: "quarterly",
    use: "Broader federal contract history.",
  },
  {
    id: "itb-policy",
    title: "Industrial and Technological Benefits Policy",
    publisher: "Innovation, Science and Economic Development Canada",
    url: "https://ised-isde.canada.ca/site/industrial-technological-benefits/en/industrial-and-technological-benefits",
    sourceType: "official_html",
    tier: 1,
    cadence: "policy-update",
    use: "ITB policy context and Key Industrial Capabilities.",
  },
  {
    id: "itb-obligations",
    title: "Breakdown of current obligations by contractor",
    publisher: "Innovation, Science and Economic Development Canada",
    url: "https://ised-isde.canada.ca/site/industrial-technological-benefits/en/projects-and-obligations/report-contractor-progress/breakdown-current-obligations-contractor",
    sourceType: "official_html_table",
    tier: 1,
    cadence: "annual",
    use: "Public ITB project/obligation context; personal contact fields are intentionally excluded from this app.",
  },
  {
    id: "nbd-broadband",
    title: "National Broadband Data",
    publisher: "Innovation, Science and Economic Development Canada",
    url: "https://open.canada.ca/data/en/dataset/00a331db-121b-445d-b119-35dbbe3eedd9",
    sourceType: "official_geodata",
    tier: 1,
    cadence: "dataset-update",
    use: "Catalogued for northern readiness overlays.",
  },
  {
    id: "remote-energy",
    title: "Remote Communities Energy Database",
    publisher: "Natural Resources Canada",
    url: "https://open.canada.ca/data/en/dataset/0e76433c-7aeb-46dc-a019-11db10ee28dd",
    sourceType: "official_geodata",
    tier: 1,
    cadence: "dataset-update",
    use: "Catalogued for northern energy readiness overlays.",
  },
];

const regions = [
  ["CA-BC", "British Columbia", "BC", "2021A000259"],
  ["CA-AB", "Alberta", "AB", "2021A000248"],
  ["CA-SK", "Saskatchewan", "SK", "2021A000247"],
  ["CA-MB", "Manitoba", "MB", "2021A000246"],
  ["CA-ON", "Ontario", "ON", "2021A000235"],
  ["CA-QC", "Quebec", "QC", "2021A000224"],
  ["CA-NB", "New Brunswick", "NB", "2021A000213"],
  ["CA-NS", "Nova Scotia", "NS", "2021A000212"],
  ["CA-PE", "Prince Edward Island", "PE", "2021A000211"],
  ["CA-NL", "Newfoundland and Labrador", "NL", "2021A000210"],
  ["CA-YT", "Yukon", "YT", "2021A000260"],
  ["CA-NT", "Northwest Territories", "NT", "2021A000261"],
  ["CA-NU", "Nunavut", "NU", "2021A000262"],
].map(([id, name, shortName, dguid]) => ({ id, name, shortName, dguid }));

const missions = [
  {
    id: "arctic-isr-drones",
    name: "Arctic ISR Drones",
    shortName: "Arctic ISR",
    description:
      "Uncrewed aerial, space, sensor, communications, and autonomy capacity relevant to Arctic intelligence, surveillance, and reconnaissance.",
    sourceIds: [
      "statcan-business-counts-33101095",
      "statcan-rd-performers-27100049",
      "dnd-dcb-2025",
      "dnd-defence-industrial-strategy",
      "nbd-broadband",
      "remote-energy",
    ],
    taxonomy: {
      naics: ["3342", "3345", "3364", "5413", "5415", "5417"],
      educationFields: ["Computer and information sciences", "Engineering", "Physical sciences"],
      tradeCommodities: ["Aircraft and parts", "Navigation instruments", "Telecommunications equipment"],
      procurementKeywords: ["uncrewed", "drone", "ISR", "surveillance", "Arctic", "remote sensing"],
      dcbLabels: ["Surveillance & Reconnaissance", "Uncrewed and Autonomous Systems", "Artificial Intelligence"],
    },
    weights: { firms: 0.62, sourceCoverage: 0.2, rd: 0.18 },
    naicsMatchers: [
      "Communications equipment manufacturing",
      "Navigational, measuring, medical and control instruments manufacturing",
      "Aerospace product and parts manufacturing",
      "Architectural, engineering and related services",
      "Computer systems design and related services",
      "Scientific research and development services",
    ],
    nationalSignals: [
      {
        label: "Sovereign capability category",
        value: "Uncrewed and Autonomous Systems",
        sourceIds: ["dnd-defence-industrial-strategy"],
      },
      {
        label: "Northern overlay",
        value: "Broadband and remote energy datasets catalogued, not normalized",
        sourceIds: ["nbd-broadband", "remote-energy"],
      },
    ],
  },
  {
    id: "secure-communications",
    name: "Secure Communications",
    shortName: "Secure Comms",
    description:
      "Secure cloud, high-assurance communications, command-and-control, cybersecurity, and communications equipment capacity.",
    sourceIds: [
      "statcan-business-counts-33101095",
      "statcan-rd-performers-27100049",
      "dnd-dcb-2025",
      "dnd-defence-industrial-strategy",
      "canadabuys-tenders",
      "canadabuys-awards",
    ],
    taxonomy: {
      naics: ["3341", "3342", "3344", "517", "518", "5415", "5417"],
      educationFields: ["Computer and information sciences", "Mathematics and statistics", "Engineering"],
      tradeCommodities: ["Telecommunications equipment", "Computer equipment", "Semiconductors"],
      procurementKeywords: ["secure cloud", "communications", "C4I", "cyber", "network", "command and control"],
      dcbLabels: ["C4I", "Cyber, Electronic & Irregular Warfare", "Artificial Intelligence"],
    },
    weights: { firms: 0.64, sourceCoverage: 0.18, rd: 0.18 },
    naicsMatchers: [
      "Computer and peripheral equipment manufacturing",
      "Communications equipment manufacturing",
      "Semiconductor and other electronic component manufacturing",
      "Telecommunications",
      "Data processing, hosting, and related services",
      "Computer systems design and related services",
      "Scientific research and development services",
    ],
    nationalSignals: [
      {
        label: "DCB public project signal",
        value: "11 projects listed under Artificial Intelligence",
        sourceIds: ["dnd-dcb-2025"],
      },
      {
        label: "Sovereign capability category",
        value: "Digital Systems: Secure Cloud, AI, Quantum, C4I, high-assurance communications equipment",
        sourceIds: ["dnd-defence-industrial-strategy"],
      },
    ],
  },
  {
    id: "naval-autonomy",
    name: "Naval Autonomy",
    shortName: "Naval Autonomy",
    description:
      "Autonomous surface and underwater systems, naval sensors, ship systems, engineering, and simulation capacity.",
    sourceIds: [
      "statcan-business-counts-33101095",
      "statcan-rd-performers-27100049",
      "dnd-dcb-2025",
      "dnd-defence-industrial-strategy",
      "itb-policy",
      "itb-obligations",
    ],
    taxonomy: {
      naics: ["3345", "3366", "5413", "5415", "5417"],
      educationFields: ["Engineering", "Computer and information sciences", "Transportation technologies"],
      tradeCommodities: ["Ships and boats", "Marine sensors", "Navigation instruments"],
      procurementKeywords: ["naval", "marine", "autonomous", "underwater", "surface systems", "sensors"],
      dcbLabels: ["Sea", "Sensors", "Uncrewed and Autonomous Systems", "Training and Simulation"],
    },
    weights: { firms: 0.66, sourceCoverage: 0.18, rd: 0.16 },
    naicsMatchers: [
      "Navigational, measuring, medical and control instruments manufacturing",
      "Ship and boat building",
      "Architectural, engineering and related services",
      "Computer systems design and related services",
      "Scientific research and development services",
    ],
    nationalSignals: [
      {
        label: "Sovereign capability category",
        value: "Specialized Manufacturing: Land Vehicles / Surface Ships, including Icebreakers and Marine Systems",
        sourceIds: ["dnd-defence-industrial-strategy"],
      },
      {
        label: "ITB relevance",
        value: "Public ITB policy motivates defence-sector investments and Canadian supplier development",
        sourceIds: ["itb-policy", "itb-obligations"],
      },
    ],
  },
];

function download(url, filename) {
  const destination = join(cacheDir, filename);
  execFileSync("curl", ["-sL", "-o", destination, url], { stdio: "inherit" });
  return destination;
}

function unzipText(zipPath, member) {
  return execFileSync("unzip", ["-p", zipPath, member], { encoding: "utf8", maxBuffer: 1024 * 1024 * 80 });
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [rawHeaders, ...records] = rows;
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, ""));
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

function includesAny(value, needles) {
  return needles.some((needle) => value.toLowerCase().includes(needle.toLowerCase()));
}

function latestValue(rows, dateField = "REF_DATE") {
  return [...new Set(rows.map((row) => row[dateField]).filter(Boolean))].sort().at(-1);
}

function sumBusinessCounts(rows, mission, regionName, latestDate) {
  return rows
    .filter(
      (row) =>
        row.REF_DATE === latestDate &&
        row.GEO === regionName &&
        row["Employment size"] === "Total, with employees" &&
        includesAny(row["North American Industry Classification System (NAICS)"], mission.naicsMatchers),
    )
    .reduce((total, row) => total + Number(row.VALUE || 0), 0);
}

function sumRdPerformers(rows, mission, latestDate) {
  return rows
    .filter(
      (row) =>
        row.REF_DATE === latestDate &&
        row.GEO === "Canada" &&
        includesAny(row["North American Industry Classification System (NAICS)"], mission.naicsMatchers),
    )
    .reduce((total, row) => total + Number(row.VALUE || 0), 0);
}

const businessZip = download("https://www150.statcan.gc.ca/n1/en/tbl/csv/33101095-eng.zip", "33101095.zip");
const rdZip = download("https://www150.statcan.gc.ca/n1/en/tbl/csv/27100049-eng.zip", "27100049.zip");

const businessRows = parseCsv(unzipText(businessZip, "33101095.csv"));
const rdRows = parseCsv(unzipText(rdZip, "27100049.csv"));
const latestBusinessDate = latestValue(businessRows);
const latestRdDate = latestValue(rdRows);

const missionNationalMetrics = Object.fromEntries(
  missions.map((mission) => [
    mission.id,
    {
      rdPerformers: sumRdPerformers(rdRows, mission, latestRdDate),
      rdReferencePeriod: latestRdDate,
      businessReferencePeriod: latestBusinessDate,
    },
  ]),
);

const rawScores = missions.flatMap((mission) =>
  regions.map((region) => ({
    missionId: mission.id,
    regionId: region.id,
    firms: sumBusinessCounts(businessRows, mission, region.name, latestBusinessDate),
  })),
);

const maxFirmsByMission = Object.fromEntries(
  missions.map((mission) => [
    mission.id,
    Math.max(...rawScores.filter((score) => score.missionId === mission.id).map((score) => score.firms), 1),
  ]),
);

const scores = rawScores.map((rawScore) => {
  const mission = missions.find((item) => item.id === rawScore.missionId);
  if (!mission) throw new Error(`Missing mission ${rawScore.missionId}`);
  const nationalRd = missionNationalMetrics[mission.id].rdPerformers;
  const firmScore = (rawScore.firms / maxFirmsByMission[mission.id]) * 100;
  const rdScore = nationalRd > 0 ? 100 : 0;
  const sourceCoverageScore = mission.sourceIds.length >= 5 ? 100 : mission.sourceIds.length * 20;
  const readinessScore = Math.round(
    firmScore * mission.weights.firms + rdScore * mission.weights.rd + sourceCoverageScore * mission.weights.sourceCoverage,
  );

  return {
    missionId: mission.id,
    regionId: rawScore.regionId,
    readinessScore,
    confidence: rawScore.firms > 0 ? "Medium" : "Low",
    sourceIds: mission.sourceIds,
    indicators: {
      firms: {
        status: "measured",
        value: rawScore.firms,
        unit: "business locations with employees",
        sourceIds: ["statcan-business-counts-33101095"],
        note: `Sum of selected NAICS categories for ${latestBusinessDate}.`,
      },
      labour: {
        status: "catalogued_not_normalized",
        value: null,
        unit: "persons",
        sourceIds: ["statcan-labour-14100023"],
        note: "Source is catalogued; mission-to-labour mapping has not been normalized in v1.",
      },
      rd: {
        status: "national_context_only",
        value: null,
        nationalValue: nationalRd,
        unit: "R&D performers",
        sourceIds: ["statcan-rd-performers-27100049"],
        note: `National R&D performer signal for selected industries, ${latestRdDate}.`,
      },
      exports: {
        status: "catalogued_not_normalized",
        value: null,
        unit: "CAD",
        sourceIds: ["statcan-trade-12100175"],
        note: "Trade source is catalogued; commodity concordance is not normalized in v1.",
      },
      procurementSignals: {
        status: "national_context_only",
        value: null,
        unit: "public demand signals",
        sourceIds: ["dnd-dcb-2025", "canadabuys-tenders", "canadabuys-awards", "open-contracts"],
        note: "Public procurement sources are catalogued; keyword counts are not regionalized in v1.",
      },
      infrastructure: {
        status: mission.id === "arctic-isr-drones" ? "catalogued_not_normalized" : "not_applicable_for_v1",
        value: null,
        unit: "readiness overlays",
        sourceIds:
          mission.id === "arctic-isr-drones"
            ? ["nbd-broadband", "remote-energy"]
            : ["dnd-dcb-2025", "dnd-defence-industrial-strategy"],
        note:
          mission.id === "arctic-isr-drones"
            ? "Northern broadband and remote energy datasets are catalogued for later overlays."
            : "No infrastructure overlay is computed for this mission in v1.",
      },
    },
  };
});

const atlasData = {
  generatedAt,
  name: "Canada Capability Atlas",
  methodology: {
    version: "0.1.0",
    summary:
      "Readiness scores combine measured provincial firm-count signal, national R&D performer context, and source coverage. Non-normalized layers are shown as explicit gaps, not placeholders.",
    caveats: [
      "Scores are directional public-data indices, not procurement advice or claims of classified capability.",
      "Company-level targeting and personal contact fields are intentionally excluded.",
      "Labour, export, and procurement layers are catalogued in v1 but not yet normalized into regional scores.",
    ],
  },
  regions,
  missions: missions.map((mission) => {
    const publicMission = { ...mission };
    delete publicMission.naicsMatchers;

    return {
      ...publicMission,
      nationalMetrics: missionNationalMetrics[mission.id],
    };
  }),
  scores,
};

const manifest = {
  generatedAt,
  artifactVersion: atlasData.methodology.version,
  artifacts: [
    { path: "src/data/generated/atlas-data.json", records: scores.length, description: "Mission, region, and score data." },
    { path: "src/data/generated/sources.json", records: sources.length, description: "Source catalogue." },
  ],
  sourcePolicy: "Tier 1 official and durable public sources only for displayed metrics.",
};

writeFileSync(join(generatedDir, "atlas-data.json"), `${JSON.stringify(atlasData, null, 2)}\n`);
writeFileSync(join(generatedDir, "sources.json"), `${JSON.stringify({ generatedAt, sources }, null, 2)}\n`);
writeFileSync(join(publicDataDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

rmSync(cacheDir, { recursive: true, force: true });

console.log(`Generated ${scores.length} score rows from ${sources.length} sources.`);
