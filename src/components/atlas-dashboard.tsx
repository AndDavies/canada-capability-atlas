"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Database,
  FileText,
  Filter,
  Gauge,
  Info,
  Layers3,
  Loader2,
  MapPinned,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AtlasData, Score, ScoreSignal, Source } from "@/data/types";
import type { EvidenceBrief } from "@/lib/memo";
import {
  displayIndicatorNote,
  formatIndicator,
  formatSignalValue,
  gapIndicators,
  getBriefSlug,
  getMission,
  getRank,
  getRegion,
  getScore,
  indicatorLabels,
  indicatorOrder,
  measuredIndicators,
  rankScores,
  scoreTone,
  signalLabels,
  signalOrder,
  signalStatusLabel,
  statusLabel,
} from "@/lib/atlas-utils";

type Props = {
  data: AtlasData;
  sources: Source[];
};

type RegionFilter = "all" | "measured" | "north";
type SignalKey = keyof Score["signals"];

const regionLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
  "CA-YT": { x: 68, y: 52, w: 72, h: 58 },
  "CA-NT": { x: 146, y: 52, w: 88, h: 58 },
  "CA-NU": { x: 242, y: 46, w: 138, h: 64 },
  "CA-BC": { x: 96, y: 176, w: 76, h: 70 },
  "CA-AB": { x: 178, y: 178, w: 72, h: 68 },
  "CA-SK": { x: 256, y: 180, w: 72, h: 66 },
  "CA-MB": { x: 334, y: 184, w: 72, h: 64 },
  "CA-ON": { x: 412, y: 196, w: 112, h: 74 },
  "CA-QC": { x: 532, y: 168, w: 112, h: 78 },
  "CA-NB": { x: 612, y: 260, w: 56, h: 46 },
  "CA-NS": { x: 674, y: 282, w: 58, h: 42 },
  "CA-PE": { x: 674, y: 238, w: 42, h: 30 },
  "CA-NL": { x: 662, y: 122, w: 74, h: 62 },
};

const northRegionIds = new Set(["CA-YT", "CA-NT", "CA-NU", "CA-NL"]);

const capabilityGuidance: Record<string, { question: string; plain: string; useWhen: string }> = {
  "arctic-isr-drones": {
    question: "Where can Canada support Arctic sensing and drones?",
    plain: "Drone, sensor, satellite, and Arctic monitoring signals.",
    useWhen: "Look for public evidence of drones, sensors, satellites, and Arctic monitoring.",
  },
  "secure-communications": {
    question: "Where are secure communications signals visible?",
    plain: "Secure network, cyber, cloud, chip, and command-system signals.",
    useWhen: "Look for public evidence of secure networks, cyber tools, cloud, chips, and command systems.",
  },
  "naval-autonomy": {
    question: "Where could Canada build naval autonomy?",
    plain: "Autonomous ship, underwater system, naval sensor, and marine engineering signals.",
    useWhen: "Look for public evidence of autonomous ships, underwater systems, naval sensors, and marine engineering.",
  },
};

function regionFill(score: number | null, selected: boolean) {
  if (selected) return "var(--red)";
  if (score === null) return "var(--paper)";
  if (score >= 75) return "var(--teal)";
  if (score >= 50) return "var(--green)";
  if (score >= 25) return "var(--yellow)";
  return "var(--paper)";
}

function signalTone(signal: ScoreSignal) {
  if (signal.normalizedScore === null) return "low";
  return scoreTone(signal.normalizedScore);
}

export function AtlasDashboard({ data, sources }: Props) {
  const initialMission = data.missions.find((mission) => mission.id === "naval-autonomy") ?? data.missions[0];
  const [missionId, setMissionId] = useState(initialMission?.id ?? "");
  const [regionId, setRegionId] = useState("CA-NS");
  const [filter, setFilter] = useState<RegionFilter>("all");
  const [rankSignal, setRankSignal] = useState<SignalKey>("readiness");
  const [drawerSignal, setDrawerSignal] = useState<SignalKey | null>(null);
  const [brief, setBrief] = useState<EvidenceBrief | null>(null);
  const [briefState, setBriefState] = useState<"idle" | "loading" | "error">("idle");

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const mission = getMission(data, missionId) ?? data.missions[0];
  const selectedScore = getScore(data, mission.id, regionId) ?? getScore(data, mission.id, "CA-NS") ?? rankScores(data, mission.id)[0];
  const selectedRegion = getRegion(data, selectedScore.regionId) ?? data.regions[0];
  const rankedScores = rankScores(data, mission.id, rankSignal);
  const filteredScores = rankedScores.filter((score) => {
    if (filter === "measured") return score.signals.scale.status === "measured" && Number(score.signals.scale.value ?? 0) > 0;
    if (filter === "north") return northRegionIds.has(score.regionId);
    return true;
  });
  const maxSignalScore = Math.max(...rankedScores.map((score) => score.signals[rankSignal].normalizedScore ?? 0), 1);
  const selectedBriefSlug = getBriefSlug(data, mission.id, selectedRegion.id);
  const drawer = drawerSignal ? selectedScore.signals[drawerSignal] : null;

  async function requestBrief() {
    setBriefState("loading");
    setBrief(null);
    const response = await fetch(`/api/brief?missionId=${mission.id}&regionId=${selectedScore.regionId}`);
    if (!response.ok) {
      setBriefState("error");
      return;
    }
    const payload = (await response.json()) as EvidenceBrief;
    setBrief(payload);
    setBriefState("idle");
  }

  function selectMission(nextMissionId: string) {
    setMissionId(nextMissionId);
    const preferredRegion = nextMissionId === "naval-autonomy" ? "CA-NS" : rankScores(data, nextMissionId, rankSignal)[0]?.regionId;
    if (preferredRegion) setRegionId(preferredRegion);
    setBrief(null);
    setBriefState("idle");
    setDrawerSignal(null);
  }

  function selectRegion(nextRegionId: string) {
    setRegionId(nextRegionId);
    setBrief(null);
    setBriefState("idle");
    setDrawerSignal(null);
  }

  return (
    <div className="atlas-shell">
      <aside className="left-rail" id="explorer">
        <div className="rail-section">
          <div className="eyebrow"><MapPinned size={13} /> Explore a capability</div>
          <p className="rail-help">Choose the question you want the Atlas to answer. The map, rankings, signal cards, and evidence brief update together.</p>
          <div className="mission-list">
            {data.missions.map((item) => (
              <button
                key={item.id}
                className={`mission-button ${item.id === mission.id ? "active" : ""}`}
                type="button"
                onClick={() => selectMission(item.id)}
              >
                <span>{capabilityGuidance[item.id]?.question ?? item.name}</span>
                <small>{capabilityGuidance[item.id]?.useWhen ?? item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="rail-section">
          <div className="eyebrow"><Filter size={13} /> Narrow regions</div>
          <p className="rail-help">Show all places, places with measured business-location evidence, or northern regions.</p>
          <div className="segmented">
            {[
              ["all", "All"],
              ["measured", "Measured"],
              ["north", "North"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                type="button"
                onClick={() => setFilter(value as RegionFilter)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Link className="rail-section featured-brief" href="/briefs/naval-autonomy-nova-scotia">
          <div className="eyebrow"><FileText size={13} /> Featured evidence brief</div>
          <h2>Naval Autonomy in Nova Scotia</h2>
          <p>
            A flagship proof point for using the Atlas: measured public business-location evidence,
            Canada-wide research context, missing layers, and citations in one shareable page.
          </p>
        </Link>

        <div className="rail-section source-note">
          <div className="eyebrow"><Database size={13} /> Source coverage</div>
          <p>Every displayed metric must point to a public source. Missing layers are labelled by workflow stage instead of filled with guesses.</p>
        </div>

        <div className="rail-section about-rail">
          <div className="eyebrow"><ShieldCheck size={13} /> About the Atlas</div>
          <h2>A public map of Canadian capability.</h2>
          <p>
            The Atlas brings public evidence into one place so builders, researchers, and policy teams can
            find places worth investigating and check the sources behind each signal.
          </p>
        </div>
      </aside>

      <main className="atlas-main">
        <section className="hero-band">
          <div>
            <h1>Where can Canada build?</h1>
            <p>
              Canada Capability Atlas maps public evidence of firms, research, talent, contracts, exports,
              and infrastructure behind Canada&apos;s defence and dual-use industrial base.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#explorer">Explore a capability</a>
              <Link className="secondary-link" href="/methodology">View the evidence model</Link>
            </div>
            <p className="trust-line">
              Built from public, aggregate, source-linked data. Not procurement advice. Not classified analysis.
            </p>
          </div>
          <div className="hero-meta">
            <span>Artifact {data.methodology.version}</span>
            <span>{new Date(data.generatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </section>

        <section className="help-strip" aria-label="How to use this resource">
          <div>
            <span>1</span>
            <strong>Pick a question</strong>
            <p>Choose a capability need such as naval autonomy or secure communications.</p>
          </div>
          <div>
            <span>2</span>
            <strong>Compare signals</strong>
            <p>Switch scale, density, capability signal, and source coverage to change the ranking.</p>
          </div>
          <div>
            <span>3</span>
            <strong>Open the evidence</strong>
            <p>Use evidence briefs and source links to see what is measured and what is missing.</p>
          </div>
        </section>

        <section className="signal-grid" aria-label="Capability signals">
          {signalOrder.map((key) => (
            <SignalCard
              key={key}
              icon={signalIcon(key)}
              label={signalLabels[key]}
              signal={selectedScore.signals[key]}
              detail={signalDetail(key, selectedScore, selectedRegion.name, mission.name, data)}
              tone={signalTone(selectedScore.signals[key])}
              onOpen={() => setDrawerSignal(key)}
            />
          ))}
        </section>

        <section className="map-and-rank">
          <div className="map-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Map</div>
                <h2>Where the selected signal is strongest</h2>
              </div>
              <div className="legend">
                <span><i className="dot dot-low" /> Watch</span>
                <span><i className="dot dot-mid" /> Building</span>
                <span><i className="dot dot-high" /> Strong</span>
              </div>
            </div>
            <p className="scale-caveat">
              Large provinces often score higher by scale. Use density to find smaller regions with unusual concentration.
            </p>
            <div className="signal-tabs" aria-label="Ranking signal">
              {(["readiness", "scale", "density", "evidenceCoverage"] as SignalKey[]).map((key) => (
                <button
                  key={key}
                  className={rankSignal === key ? "active" : ""}
                  type="button"
                  onClick={() => setRankSignal(key)}
                >
                  {signalLabels[key]}
                </button>
              ))}
            </div>
            <CanadaCartogram
              data={data}
              maxScore={maxSignalScore}
              missionId={mission.id}
              signalKey={rankSignal}
              selectedRegionId={selectedRegion.id}
              onSelect={selectRegion}
            />
          </div>

          <div className="ranking-panel">
            <div className="panel-heading compact">
              <div>
                <div className="eyebrow">Province and territory ranking</div>
                <h2>{signalLabels[rankSignal]} across {filteredScores.length} places</h2>
              </div>
            </div>
            <div className="rank-list">
              {filteredScores.map((score, index) => {
                const region = getRegion(data, score.regionId);
                if (!region) return null;
                const signal = score.signals[rankSignal];
                const width = signal.normalizedScore ?? 0;
                return (
                  <button
                    key={score.regionId}
                    type="button"
                    className={`rank-row ${score.regionId === selectedRegion.id ? "active" : ""}`}
                    onClick={() => selectRegion(score.regionId)}
                  >
                    <span className="rank-index">{index + 1}</span>
                    <span className="rank-name">{region.name}</span>
                    <span className="rank-bar"><span style={{ width: `${width}%` }} /></span>
                    <span className="rank-score">{signal.normalizedScore ?? "NA"}</span>
                  </button>
                );
              })}
              {filteredScores.length === 0 ? (
                <p className="empty-state">No measured rows match this filter. The source layer may be identified, parsed, or waiting for review, but the Atlas will not create placeholder rows.</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="chart-strip">
          {indicatorOrder.map((key) => {
            const indicator = selectedScore.indicators[key];
            return (
              <article key={key} className="indicator-card">
                <div>
                  <span className={`status-pill ${indicator.status}`}>{statusLabel(indicator.status)}</span>
                  <h3>{indicatorLabels[key]}</h3>
                </div>
                <strong>{formatIndicator(indicator)}</strong>
                <p>{displayIndicatorNote(key, indicator)}</p>
                <div className="mini-sources">
                  {indicator.sourceIds.slice(0, 2).map((sourceId) => (
                    <a key={sourceId} href={sourceMap.get(sourceId)?.url ?? "#"} target="_blank" rel="noreferrer">
                      {sourceId}
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <aside className="memo-panel">
        <div className="memo-sticky">
          <div className="panel-heading compact">
            <div>
              <div className="eyebrow"><FileText size={13} /> Evidence brief</div>
              <h2>{mission.name} in {selectedRegion.name}</h2>
            </div>
            <span className={`confidence ${selectedScore.confidence.toLowerCase()}`}>{selectedScore.confidence}</span>
          </div>

          <div className="memo-preview">
            <p>
              Generate a cited brief that explains what is measured, what is missing, and which source links
              support this capability-region view.
            </p>
            <dl>
              <div>
                <dt>Measured layers</dt>
                <dd>{measuredIndicators(selectedScore).length}</dd>
              </div>
              <div>
                <dt>Missing layers</dt>
                <dd>{gapIndicators(selectedScore).length}</dd>
              </div>
            </dl>
          </div>

          <button className="primary-action" type="button" onClick={requestBrief} disabled={briefState === "loading"}>
            {briefState === "loading" ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
            Generate evidence brief
          </button>

          <Link className="secondary-action" href={`/briefs/${selectedBriefSlug}`}>
            <ArrowUpRight size={15} />
            Open shareable brief
          </Link>

          {briefState === "error" ? <p className="empty-state">Evidence brief request failed. Unsupported capability-region pairs are refused.</p> : null}

          {brief ? (
            <div className="memo-output">
              <h3>{brief.title}</h3>
              <p>{brief.summary}</p>
              <h4>Measured evidence</h4>
              <ul>
                {brief.measuredEvidence.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
              <h4>Missing layers</h4>
              <ul>
                {brief.missingLayers.map((layer) => (
                  <li key={layer}>{layer}</li>
                ))}
              </ul>
              <h4>Citations</h4>
              <div className="citation-list">
                {brief.citations.map((citation) => (
                  <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer">
                    <span>{citation.title}</span>
                    <small>{citation.publisher} / Tier {citation.tier}</small>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {drawerSignal && drawer ? (
        <aside className="methodology-drawer" role="dialog" aria-modal="true" aria-label={`${signalLabels[drawerSignal]} methodology`}>
          <button className="drawer-close" type="button" onClick={() => setDrawerSignal(null)} aria-label="Close methodology drawer">
            <X size={16} />
          </button>
          <div className="eyebrow"><Info size={13} /> Signal methodology</div>
          <h2>{signalLabels[drawerSignal]}</h2>
          <dl>
            <div><dt>Status</dt><dd>{signalStatusLabel(drawer.status)}</dd></div>
            <div><dt>Value</dt><dd>{formatSignalValue(drawer)}</dd></div>
            <div><dt>Rule</dt><dd>{drawer.methodology}</dd></div>
            <div><dt>Caveat</dt><dd>{drawer.caveat}</dd></div>
            <div><dt>Last generated</dt><dd>{new Date(data.generatedAt).toLocaleString("en-CA")}</dd></div>
          </dl>
          <h3>Source IDs</h3>
          <div className="citation-list">
            {drawer.sourceIds.length ? (
              drawer.sourceIds.map((sourceId) => (
                <a key={sourceId} href={sourceMap.get(sourceId)?.url ?? "#"} target="_blank" rel="noreferrer">
                  <span>{sourceId}</span>
                  <small>{sourceMap.get(sourceId)?.publisher ?? "Source catalogue"}</small>
                </a>
              ))
            ) : (
              <p className="empty-state">Source identified, but no measured source ID is attached to this signal yet.</p>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function signalIcon(key: SignalKey) {
  const icons: Record<SignalKey, ReactNode> = {
    scale: <Scale size={18} />,
    density: <BarChart3 size={18} />,
    momentum: <ArrowUpRight size={18} />,
    readiness: <Gauge size={18} />,
    evidenceCoverage: <Layers3 size={18} />,
  };
  return icons[key];
}

function signalDetail(key: SignalKey, score: Score, regionName: string, missionName: string, data: AtlasData) {
  if (key === "scale") return `${regionName}, rank #${getRank(data, score.missionId, score.regionId, "scale")} by absolute relevant business locations.`;
  if (key === "density") return `Concentration within ${regionName}'s regional business base for ${missionName}.`;
  if (key === "momentum") return "Contract, award, and news time-series rows are not normalized yet.";
  if (key === "evidenceCoverage") return `${score.signals.evidenceCoverage.methodology}`;
  return `${regionName}, rank #${getRank(data, score.missionId, score.regionId, "readiness")} on the directional capability signal.`;
}

function SignalCard({
  icon,
  label,
  signal,
  detail,
  tone,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  signal: ScoreSignal;
  detail: string;
  tone: string;
  onOpen: () => void;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-card-top">
        <div className="metric-icon">{icon}</div>
        <button type="button" onClick={onOpen} aria-label={`Open ${label} methodology`}>
          <Info size={14} />
        </button>
      </div>
      <span>{label}</span>
      <strong>{formatSignalHeadline(signal)}</strong>
      <p>{detail}</p>
    </article>
  );
}

function formatSignalHeadline(signal: ScoreSignal) {
  if (typeof signal.value !== "number" || Number.isNaN(signal.value)) return signalStatusLabel(signal.status);
  if (signal.unit.includes("percent")) return `${Math.round(signal.value)}%`;
  if (signal.unit.includes("per 10,000")) return `${signal.value.toLocaleString("en-CA", { maximumFractionDigits: 2 })} per 10k`;
  if (signal.unit.includes("index score")) return `${Math.round(signal.value)}/100`;
  return formatNumberCompact(signal.value);
}

function formatNumberCompact(value: number) {
  return new Intl.NumberFormat("en-CA").format(value);
}

function CanadaCartogram({
  data,
  maxScore,
  missionId,
  signalKey,
  selectedRegionId,
  onSelect,
}: {
  data: AtlasData;
  maxScore: number;
  missionId: string;
  signalKey: SignalKey;
  selectedRegionId: string;
  onSelect: (regionId: string) => void;
}) {
  return (
    <svg className="canada-map" role="img" viewBox="0 0 790 370" aria-label="Canada capability map">
      <g transform="matrix(1.15 0 0 1.15 -50 -30)">
        <path className="map-gridline" d="M80 318 C180 292 276 310 364 286 C448 264 546 292 708 240" />
        {data.regions.map((region) => {
          const layout = regionLayout[region.id];
          const score = getScore(data, missionId, region.id);
          if (!layout || !score) return null;
          const signal = score.signals[signalKey];
          const value = signal.normalizedScore;
          const selected = selectedRegionId === region.id;
          const height = Math.max(10, ((value ?? 0) / maxScore) * layout.h);
          return (
            <g
              key={region.id}
              className={`map-region ${selected ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${region.name}: ${value ?? "not measured"} ${signalLabels[signalKey]}`}
              onClick={() => onSelect(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(region.id);
              }}
            >
              <rect
                x={layout.x}
                y={layout.y}
                width={layout.w}
                height={layout.h}
                fill="var(--paper)"
                stroke="var(--line)"
                strokeWidth={1.5}
              />
              <rect
                x={layout.x}
                y={layout.y + layout.h - height}
                width={layout.w}
                height={height}
                fill={regionFill(value, selected)}
                opacity={selected ? 1 : 0.82}
              />
              <text x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 - 1} textAnchor="middle">
                {region.shortName}
              </text>
              <text className="map-score" x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 + 17} textAnchor="middle">
                {value ?? "NA"}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
