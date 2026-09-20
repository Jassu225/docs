'use client';

import { useEffect, useRef, useState } from 'react';

import {
  type Flow,
  type FlowLayout,
  type PlacedEdge,
  type PlacedNode,
  TYPE,
  layoutStacked,
  layoutWide,
} from '@/lib/flow';

const ROLE_CLASS: Record<string, string> = {
  grey: 'fill-[var(--role-grey-fill)] stroke-[var(--role-grey-line)]',
  amber: 'fill-[var(--role-amber-fill)] stroke-[var(--role-amber-line)]',
  blue: 'fill-[var(--role-blue-fill)] stroke-[var(--role-blue-line)]',
  purple: 'fill-[var(--role-purple-fill)] stroke-[var(--role-purple-line)]',
  green: 'fill-[var(--role-green-fill)] stroke-[var(--role-green-line)]',
  red: 'fill-[var(--role-red-fill)] stroke-[var(--role-red-line)]',
};

const ROLE_INK: Record<string, string> = {
  grey: 'var(--role-grey-ink)',
  amber: 'var(--role-amber-ink)',
  blue: 'var(--role-blue-ink)',
  purple: 'var(--role-purple-ink)',
  green: 'var(--role-green-ink)',
  red: 'var(--role-red-ink)',
};

const EDGE_STROKE = {
  forward: 'var(--edge)',
  loop: 'var(--edge-loop)',
  success: 'var(--edge-ok)',
  optional: 'var(--edge)',
} as const;

function pathOf(points: Array<[number, number]>) {
  // Rounded corners on the elbows keep long loop-backs readable.
  const r = 10;
  if (points.length === 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const ri = Math.min(r, inLen / 2, outLen / 2);
    const sx = cx - ((cx - px) / (inLen || 1)) * ri;
    const sy = cy - ((cy - py) / (inLen || 1)) * ri;
    const ex = cx + ((nx - cx) / (outLen || 1)) * ri;
    const ey = cy + ((ny - cy) / (outLen || 1)) * ri;
    d += ` L ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function NodeShape({
  node,
  dimmed,
  active,
  onHover,
}: {
  node: PlacedNode;
  dimmed: boolean;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const { box } = node;
  const radius = node.variant === 'state' ? box.h / 2 : 12;
  const ink = ROLE_INK[node.role];
  const centred = node.variant === 'panel';

  let cursorY = box.y + 13;
  const textX = centred ? box.x + box.w / 2 : box.x + 14;
  const anchor = centred ? 'middle' : 'start';

  const content = (
    <g
      className="transition-opacity duration-200"
      style={{ opacity: dimmed ? 0.35 : 1 }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={radius}
        className={ROLE_CLASS[node.role]}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <text textAnchor={anchor} style={{ pointerEvents: 'none' }}>
        {node.kickerLines.map((line, i) => {
          const y = cursorY + TYPE.kicker.size + i * TYPE.kicker.leading;
          if (i === node.kickerLines.length - 1) cursorY = y + 4;
          return (
            <tspan
              key={`k${i}`}
              x={textX}
              y={y}
              fill={ink}
              fontSize={TYPE.kicker.size}
              fontWeight={700}
              letterSpacing="0.09em"
              opacity={0.75}
            >
              {line.toUpperCase()}
            </tspan>
          );
        })}
        {node.titleLines.map((line, i) => {
          const y = cursorY + TYPE.title.size + i * TYPE.title.leading;
          if (i === node.titleLines.length - 1) cursorY = y + 4;
          return (
            <tspan
              key={`t${i}`}
              x={textX}
              y={y}
              fill={ink}
              fontSize={TYPE.title.size}
              fontWeight={650}
            >
              {line}
            </tspan>
          );
        })}
        {node.bodyLines.map((line, i) => (
          <tspan
            key={`b${i}`}
            x={textX}
            y={cursorY + TYPE.body.size + i * TYPE.body.leading}
            fill={ink}
            fontSize={TYPE.body.size}
            opacity={0.92}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );

  if (!node.href) return content;
  return (
    <a href={node.href} aria-label={node.title} className="outline-none">
      {content}
    </a>
  );
}

function EdgeShape({
  edge,
  dimmed,
  active,
}: {
  edge: PlacedEdge;
  dimmed: boolean;
  active: boolean;
}) {
  const kind = edge.kind ?? 'forward';
  const stroke = EDGE_STROKE[kind];
  return (
    <g className="transition-opacity duration-200" style={{ opacity: dimmed ? 0.25 : 1 }}>
      <path
        d={pathOf(edge.points)}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 2.6 : 1.8}
        strokeDasharray={kind === 'forward' ? undefined : kind === 'optional' ? '2 5' : '7 5'}
        markerEnd={`url(#flow-arrow-${kind})`}
        className={kind === 'loop' || kind === 'success' ? 'flow-loop' : undefined}
      />
      {edge.labelLines.length ? (
        // Masks the line passing under the label, so the two never fight.
        <rect
          x={
            edge.labelX -
            (edge.labelAnchor === 'middle'
              ? edge.labelWidth / 2
              : edge.labelAnchor === 'end'
                ? edge.labelWidth
                : 0) -
            4
          }
          y={edge.labelY - TYPE.edge.size - 2}
          width={edge.labelWidth + 8}
          height={edge.labelLines.length * TYPE.edge.leading + 4}
          rx={4}
          fill="var(--page-soft)"
        />
      ) : null}
      {edge.labelLines.map((line, i) => (
        <text
          key={i}
          x={edge.labelX}
          y={edge.labelY + i * TYPE.edge.leading}
          textAnchor={edge.labelAnchor}
          fontSize={TYPE.edge.size}
          fill={kind === 'forward' || kind === 'optional' ? 'var(--ink-faint)' : stroke}
          fontWeight={kind === 'forward' || kind === 'optional' ? 400 : 600}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function FlowDiagram({ flow }: { flow: Flow }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const wide = layoutWide(flow);
  // Below roughly two thirds scale the wide layout stops being readable, so the
  // diagram reflows into a single column instead of shrinking further.
  const stack = width !== null && (width < 700 || width < wide.width * 0.62);
  const layout: FlowLayout = stack ? layoutStacked(flow, width) : wide;

  const connected = new Set<string>();
  if (hovered) {
    connected.add(hovered);
    for (const edge of layout.edges) {
      if (edge.from === hovered) connected.add(edge.to);
      if (edge.to === hovered) connected.add(edge.from);
    }
  }

  return (
    <figure className="my-12">
      <figcaption className="mb-5">
        <h3 className="text-base font-semibold tracking-tight text-[var(--ink)]">{flow.title}</h3>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{flow.subtitle}</p>
      </figcaption>

      <div
        ref={containerRef}
        className="rounded-2xl border border-[var(--rule)] bg-[var(--page-soft)] p-4 sm:p-6"
      >
        <svg
          viewBox={`${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`}
          width="100%"
          height={undefined}
          style={{ maxWidth: layout.width, display: 'block', margin: '0 auto' }}
          role="img"
          aria-label={`${flow.title}. ${flow.subtitle}`}
          fontFamily="var(--font-sans)"
        >
          <defs>
            {(['forward', 'loop', 'success', 'optional'] as const).map((kind) => (
              <marker
                key={kind}
                id={`flow-arrow-${kind}`}
                markerWidth="9"
                markerHeight="9"
                refX="7.5"
                refY="4.5"
                orient="auto"
              >
                <path d="M 0 1 L 8 4.5 L 0 8 z" fill={EDGE_STROKE[kind]} />
              </marker>
            ))}
          </defs>

          {layout.groups.map((group) => (
            <g key={group.id}>
              <rect
                x={group.box.x}
                y={group.box.y}
                width={group.box.w}
                height={group.box.h}
                rx={16}
                fill="none"
                stroke="var(--rule-strong)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
              />
              <text
                x={group.box.x + 18}
                y={group.box.y + 20}
                fontSize={TYPE.group.size}
                fontWeight={700}
                letterSpacing="0.11em"
                fill="var(--ink-faint)"
              >
                {group.label.toUpperCase()}
              </text>
            </g>
          ))}

          {layout.edges.map((edge, i) => (
            <EdgeShape
              key={`${edge.from}-${edge.to}-${i}`}
              edge={edge}
              dimmed={hovered !== null && edge.from !== hovered && edge.to !== hovered}
              active={hovered !== null && (edge.from === hovered || edge.to === hovered)}
            />
          ))}

          {layout.nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              dimmed={hovered !== null && !connected.has(node.id)}
              active={hovered === node.id}
              onHover={setHovered}
            />
          ))}
        </svg>
      </div>

      {flow.footnote ? (
        <p className="mt-4 text-sm text-[var(--ink-faint)]">{flow.footnote}</p>
      ) : null}
    </figure>
  );
}
