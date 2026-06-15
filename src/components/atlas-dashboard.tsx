"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Database,
  FileText,
  Filter,
  Gauge,
  Layers3,
  Loader2,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import type { AtlasData, Source } from "@/data/types";
import type { CapabilityMemo } from "@/lib/memo";
import {
  confidenceTone,
  formatIndicator,
  formatNumber,
  gapIndicators,
  getMission,
  getRank,
  getRegion,
  getScore,
  indicatorLabels,
  indicatorOrder,
  measuredIndicators,
  rankScores,
  scoreTone,
  statusLabel,
} from "@/lib/atlas-utils";

type Props = {
  data: AtlasData;
  sources: Source[];
};

type RegionFilter = "all" | "measured" | "north";

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

function regionFill(score: number, selected: boolean) {
  if (selected) return "var(--red)";
  if (score >= 75) return "var(--teal)";
  if (score >= 50) return "var(--green)";
  if (score >= 25) return "var(--yellow)";
  return "var(--paper)";
}

export function AtlasDashboard({ data, sources }: Props) {
  const [missionId, setMissionId] = useState(data.missions[0]?.id ?? "");
  const [regionId, setRegionId] = useState("CA-ON");
  const [filter, setFilter] = useState<RegionFilter>("all");
  const [memo, setMemo] = useState<CapabilityMemo | null>(null);
  const [memoState, setMemoState] = useState<"idle" | "loading" | "error">("idle");

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const mission = getMission(data, missionId) ?? data.missions[0];
  const selectedScore = getScore(data, mission.id, regionId) ?? rankScores(data, mission.id)[0];
  const selectedRegion = getRegion(data, selectedScore.regionId) ?? data.regions[0];
  const rankedScores = rankScores(data, mission.id);
  const filteredScores = rankedScores.filter((score) => {
    if (filter === "measured") return Number(score.indicators.firms.value ?? 0) > 0;
    if (filter === "north") return northRegionIds.has(score.regionId);
    return true;
  });
  const topScore = rankedScores[0];
  const topRegion = topScore ? getRegion(data, topScore.regionId) : undefined;
  const maxScore = Math.max(...rankedScores.map((score) => score.readinessScore), 1);

  async function requestMemo() {
    setMemoState("loading");
    setMemo(null);
    const response = await fetch("/api/memo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ missionId: mission.id, regionId: selectedScore.regionId }),
    });
    if (!response.ok) {
      setMemoState("error");
      return;
    }
    const payload = (await response.json()) as CapabilityMemo;
    setMemo(payload);
    setMemoState("idle");
  }

  function selectMission(nextMissionId: string) {
    setMissionId(nextMissionId);
    const nextTop = rankScores(data, nextMissionId)[0];
    if (nextTop) setRegionId(nextTop.regionId);
    setMemo(null);
    setMemoState("idle");
  }

  function selectRegion(nextRegionId: string) {
    setRegionId(nextRegionId);
    setMemo(null);
    setMemoState("idle");
  }

  return (
    <div className="atlas-shell">
      <aside className="left-rail">
        <div className="rail-section">
          <div className="eyebrow"><ShieldCheck size={13} /> Mission</div>
          <div className="mission-list">
            {data.missions.map((item) => (
              <button
                key={item.id}
                className={`mission-button ${item.id === mission.id ? "active" : ""}`}
                type="button"
                onClick={() => selectMission(item.id)}
              >
                <span>{item.name}</span>
                <small>{item.taxonomy.dcbLabels.slice(0, 2).join(" / ")}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="rail-section">
          <div className="eyebrow"><Filter size={13} /> Region view</div>
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

        <div className="rail-section source-note">
          <div className="eyebrow"><Database size={13} /> Evidence rule</div>
          <p>Every value on this screen is pulled from generated artifacts. Unnormalized layers are labelled as source gaps.</p>
        </div>
      </aside>

      <main className="atlas-main">
        <section className="hero-band">
          <div>
            <div className="eyebrow"><MapPinned size={13} /> Public capability explorer</div>
            <h1>{mission.name}</h1>
            <p>{mission.description}</p>
          </div>
          <div className="hero-meta">
            <span>Artifact {data.methodology.version}</span>
            <span>{new Date(data.generatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </section>

        <section className="summary-grid">
          <MetricCard
            icon={<Gauge size={18} />}
            label="Selected readiness"
            value={`${selectedScore.readinessScore}/100`}
            detail={`${selectedRegion.name}, rank #${getRank(data, mission.id, selectedRegion.id)}`}
            tone={scoreTone(selectedScore.readinessScore)}
          />
          <MetricCard
            icon={<ArrowUpRight size={18} />}
            label="Top region"
            value={topRegion?.shortName ?? "N/A"}
            detail={topRegion ? `${topRegion.name} at ${topScore.readinessScore}/100` : "No region score"}
            tone="high"
          />
          <MetricCard
            icon={<BarChart3 size={18} />}
            label="Measured firms"
            value={formatNumber(selectedScore.indicators.firms.value)}
            detail={selectedScore.indicators.firms.note}
            tone="medium"
          />
          <MetricCard
            icon={<Layers3 size={18} />}
            label="Source coverage"
            value={`${selectedScore.sourceIds.length}/${sources.length}`}
            detail={`${selectedScore.confidence} confidence, ${gapIndicators(selectedScore).length} open gaps`}
            tone={confidenceTone(selectedScore.confidence)}
          />
        </section>

        <section className="map-and-rank">
          <div className="map-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Capability map</div>
                <h2>Provincial and territorial readiness index</h2>
              </div>
              <div className="legend">
                <span><i className="dot dot-low" /> Watch</span>
                <span><i className="dot dot-mid" /> Building</span>
                <span><i className="dot dot-high" /> Strong</span>
              </div>
            </div>
            <CanadaCartogram
              data={data}
              maxScore={maxScore}
              missionId={mission.id}
              selectedRegionId={selectedRegion.id}
              onSelect={selectRegion}
            />
          </div>

          <div className="ranking-panel">
            <div className="panel-heading compact">
              <div>
                <div className="eyebrow">Ranking</div>
                <h2>{filteredScores.length} regions</h2>
              </div>
            </div>
            <div className="rank-list">
              {filteredScores.map((score, index) => {
                const region = getRegion(data, score.regionId);
                if (!region) return null;
                return (
                  <button
                    key={score.regionId}
                    type="button"
                    className={`rank-row ${score.regionId === selectedRegion.id ? "active" : ""}`}
                    onClick={() => selectRegion(score.regionId)}
                  >
                    <span className="rank-index">{index + 1}</span>
                    <span className="rank-name">{region.name}</span>
                    <span className="rank-bar"><span style={{ width: `${score.readinessScore}%` }} /></span>
                    <span className="rank-score">{score.readinessScore}</span>
                  </button>
                );
              })}
              {filteredScores.length === 0 ? <p className="empty-state">No regions match this filter. No rows are fabricated.</p> : null}
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
                <p>{indicator.note}</p>
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
              <div className="eyebrow"><FileText size={13} /> Capability Memo</div>
              <h2>{selectedRegion.name}</h2>
            </div>
            <span className={`confidence ${selectedScore.confidence.toLowerCase()}`}>{selectedScore.confidence}</span>
          </div>

          <div className="memo-preview">
            <p>
              {selectedRegion.name} is ranked #{getRank(data, mission.id, selectedRegion.id)} for {mission.name}.
              The memo uses {selectedScore.sourceIds.length} primary source references plus indicator-level citations.
            </p>
            <dl>
              <div>
                <dt>Measured layers</dt>
                <dd>{measuredIndicators(selectedScore).length}</dd>
              </div>
              <div>
                <dt>Open gaps</dt>
                <dd>{gapIndicators(selectedScore).length}</dd>
              </div>
            </dl>
          </div>

          <button className="primary-action" type="button" onClick={requestMemo} disabled={memoState === "loading"}>
            {memoState === "loading" ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
            Generate cited memo
          </button>

          {memoState === "error" ? <p className="empty-state">Memo request failed. Unsupported missions or regions are refused.</p> : null}

          {memo ? (
            <div className="memo-output">
              <h3>{memo.title}</h3>
              <p>{memo.summary}</p>
              <ul>
                {memo.findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
              <h4>Citations</h4>
              <div className="citation-list">
                {memo.citations.map((citation) => (
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
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function CanadaCartogram({
  data,
  maxScore,
  missionId,
  selectedRegionId,
  onSelect,
}: {
  data: AtlasData;
  maxScore: number;
  missionId: string;
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
          const selected = selectedRegionId === region.id;
          const height = Math.max(10, (score.readinessScore / maxScore) * layout.h);
          return (
            <g
              key={region.id}
              className={`map-region ${selected ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${region.name}: ${score.readinessScore} readiness score`}
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
                fill={regionFill(score.readinessScore, selected)}
                opacity={selected ? 1 : 0.82}
              />
              <text x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 - 1} textAnchor="middle">
                {region.shortName}
              </text>
              <text className="map-score" x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 + 17} textAnchor="middle">
                {score.readinessScore}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
