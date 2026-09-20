/**
 * Data model and layout engine behind <FlowDiagram>.
 *
 * A diagram is described as nodes on a grid plus edges between them. Nothing in
 * a diagram's data mentions pixels: this file turns the grid into coordinates,
 * once for the wide layout and once for the single-column layout used on narrow
 * screens, so every diagram on the site is drawn by the same code.
 */

export type FlowRole = 'grey' | 'amber' | 'blue' | 'purple' | 'green' | 'red';

export type FlowNode = {
  id: string;
  /** Small all-caps label above the title, e.g. "STEP 1". */
  kicker?: string;
  title: string;
  body?: string;
  role: FlowRole;
  /** Grid position used by the wide layout. */
  col: number;
  row: number;
  /** How many grid columns this node spans. */
  colSpan?: number;
  /** `panel` is a wide, centred summary box; `state` is a rounded state badge. */
  variant?: 'box' | 'panel' | 'state';
  /** Turns the node into a link — used to jump from an overview to a section. */
  href?: string;
};

export type FlowEdgeKind = 'forward' | 'loop' | 'success' | 'optional';

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
  kind?: FlowEdgeKind;
  /**
   * Which lane a non-forward edge travels in. `below` goes underneath the row it
   * starts in, `above` goes through the gap over it — used when the target sits
   * in an earlier row.
   */
  lane?: 'below' | 'above' | 'right';
  /** Pushes this edge's lane further from the row, to stack several loops. */
  laneOffset?: number;
};

/** A dashed container drawn around a set of nodes. */
export type FlowGroup = {
  id: string;
  label: string;
  nodes: string[];
};

export type Flow = {
  id: string;
  title: string;
  subtitle: string;
  footnote?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups?: FlowGroup[];
  /** Number of grid columns in the wide layout. */
  columns: number;
  /** Overrides for unusually wide or narrow diagrams. */
  nodeWidth?: number;
  gapX?: number;
  gapY?: number;
};

/* ------------------------------------------------------------------ text --- */

const CHAR_WIDTH = { title: 0.545, body: 0.505, kicker: 0.62 } as const;

export function wrapText(
  text: string,
  fontSize: number,
  maxWidth: number,
  kind: keyof typeof CHAR_WIDTH,
) {
  const perChar = fontSize * CHAR_WIDTH[kind];
  const maxChars = Math.max(6, Math.floor(maxWidth / perChar));
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------------------------------------------------------------- layout --- */

export const TYPE = {
  kicker: { size: 10, leading: 13 },
  title: { size: 14, leading: 18 },
  body: { size: 12, leading: 16 },
  edge: { size: 11, leading: 14 },
  group: { size: 10, leading: 13 },
} as const;

const PAD_X = 14;
const PAD_Y = 13;

export type Box = { x: number; y: number; w: number; h: number };

export type PlacedNode = FlowNode & {
  box: Box;
  kickerLines: string[];
  titleLines: string[];
  bodyLines: string[];
};

export type PlacedEdge = FlowEdge & {
  points: Array<[number, number]>;
  labelLines: string[];
  labelX: number;
  labelY: number;
  labelAnchor: 'middle' | 'start' | 'end';
  /** Estimated label width, used to mask the line running under it. */
  labelWidth: number;
};

export type PlacedGroup = FlowGroup & { box: Box; labelLines: string[] };

export type FlowLayout = {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  groups: PlacedGroup[];
  width: number;
  height: number;
  minX: number;
  minY: number;
};

function measure(node: FlowNode, innerWidth: number) {
  const kickerLines = node.kicker
    ? wrapText(node.kicker, TYPE.kicker.size, innerWidth, 'kicker')
    : [];
  const titleLines = wrapText(node.title, TYPE.title.size, innerWidth, 'title');
  const bodyLines = node.body ? wrapText(node.body, TYPE.body.size, innerWidth, 'body') : [];

  const height =
    PAD_Y * 2 +
    (kickerLines.length ? kickerLines.length * TYPE.kicker.leading + 4 : 0) +
    titleLines.length * TYPE.title.leading +
    (bodyLines.length ? 4 + bodyLines.length * TYPE.body.leading : 0);

  return { kickerLines, titleLines, bodyLines, height };
}

const GROUP_PAD = 20;
const GROUP_LABEL_SPACE = 24;

function groupBoxes(
  flow: Flow,
  placed: Map<string, PlacedNode>,
  innerWidth: number,
  edges: PlacedEdge[],
): PlacedGroup[] {
  return (flow.groups ?? []).map((group) => {
    const members = new Set(group.nodes);
    const boxes = group.nodes.map((id) => placed.get(id)!.box).filter(Boolean);
    // An edge that stays inside the group — a repeat loop, say — is part of the
    // group, so the dashed container has to grow around it.
    const inner = edges.filter((e) => members.has(e.from) && members.has(e.to));
    const points = inner.flatMap((e) => e.points);
    const xs = [...boxes.flatMap((b) => [b.x, b.x + b.w]), ...points.map((p) => p[0])];
    const ys = [...boxes.flatMap((b) => [b.y, b.y + b.h]), ...points.map((p) => p[1])];
    const x = Math.min(...xs) - GROUP_PAD;
    const y = Math.min(...ys) - GROUP_PAD - GROUP_LABEL_SPACE;
    const right = Math.max(...xs) + GROUP_PAD;
    const bottom = Math.max(...ys) + GROUP_PAD;
    return {
      ...group,
      box: { x, y, w: right - x, h: bottom - y },
      labelLines: wrapText(group.label, TYPE.group.size, innerWidth * 2, 'kicker'),
    };
  });
}

function edgeLabel(
  edge: FlowEdge,
  points: Array<[number, number]>,
  maxWidth: number,
  anchor: 'middle' | 'start' | 'end',
): Pick<PlacedEdge, 'labelLines' | 'labelX' | 'labelY' | 'labelAnchor' | 'labelWidth'> {
  if (!edge.label)
    return { labelLines: [], labelX: 0, labelY: 0, labelAnchor: anchor, labelWidth: 0 };

  // Anchor the label to the middle of the longest straight run, which is the
  // part of the route with the most free space around it.
  let best = 0;
  let bestLength = -1;
  for (let i = 0; i < points.length - 1; i += 1) {
    const length =
      Math.abs(points[i][0] - points[i + 1][0]) + Math.abs(points[i][1] - points[i + 1][1]);
    if (length > bestLength) {
      bestLength = length;
      best = i;
    }
  }
  const [ax, ay] = points[best];
  const [bx, by] = points[best + 1];
  const horizontal = Math.abs(ax - bx) >= Math.abs(ay - by);
  // A label sits on top of its line, so it must stay inside the straight run:
  // any wider and its background would cover the elbows and the arrowhead.
  // Beside a vertical run there is no line to measure against, so the label is
  // kept narrow enough not to reach whatever sits in the next column.
  const runWidth = horizontal ? Math.abs(ax - bx) - 26 : 170;
  const lines = wrapText(
    edge.label,
    TYPE.edge.size,
    Math.max(120, Math.min(maxWidth, runWidth)),
    'body',
  );
  const labelWidth =
    Math.max(...lines.map((line) => line.length)) * TYPE.edge.size * CHAR_WIDTH.body;

  if (horizontal) {
    return {
      labelLines: lines,
      labelWidth,
      labelX: (ax + bx) / 2,
      labelY: (ay + by) / 2 - 7 - (lines.length - 1) * TYPE.edge.leading,
      labelAnchor: 'middle',
    };
  }
  return {
    labelLines: lines,
    labelWidth,
    labelX: ax + 8,
    labelY: (ay + by) / 2 - ((lines.length - 1) * TYPE.edge.leading) / 2,
    labelAnchor: 'start',
  };
}

function bounds(layout: Omit<FlowLayout, 'width' | 'height' | 'minX' | 'minY'>): FlowLayout {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const node of layout.nodes) {
    xs.push(node.box.x, node.box.x + node.box.w);
    ys.push(node.box.y, node.box.y + node.box.h);
  }
  for (const group of layout.groups) {
    xs.push(group.box.x, group.box.x + group.box.w);
    ys.push(group.box.y, group.box.y + group.box.h);
  }
  for (const edge of layout.edges) {
    for (const [x, y] of edge.points) {
      xs.push(x);
      ys.push(y);
    }
    if (edge.labelLines.length) {
      const width =
        Math.max(...edge.labelLines.map((l) => l.length)) * TYPE.edge.size * CHAR_WIDTH.body;
      const shift =
        edge.labelAnchor === 'middle' ? width / 2 : edge.labelAnchor === 'end' ? width : 0;
      xs.push(edge.labelX - shift, edge.labelX - shift + width);
      ys.push(
        edge.labelY - TYPE.edge.size,
        edge.labelY + edge.labelLines.length * TYPE.edge.leading,
      );
    }
  }

  const pad = 8;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return {
    ...layout,
    minX,
    minY,
    width: Math.max(...xs) + pad - minX,
    height: Math.max(...ys) + pad - minY,
  };
}

/** Grid layout: nodes sit where their `col`/`row` put them. */
export function layoutWide(flow: Flow): FlowLayout {
  const nodeWidth = flow.nodeWidth ?? 196;
  const gapX = flow.gapX ?? 40;
  const gapY = flow.gapY ?? 78;
  const pitch = nodeWidth + gapX;
  const innerWidth = nodeWidth - PAD_X * 2;

  const rowHeights: number[] = [];
  const measured = flow.nodes.map((node) => {
    const span = node.colSpan ?? 1;
    const m = measure(node, innerWidth * span + (span - 1) * (gapX + PAD_X * 2));
    rowHeights[node.row] = Math.max(rowHeights[node.row] ?? 0, m.height);
    return { node, m };
  });

  const rowTop: number[] = [];
  let y = 0;
  for (let r = 0; r < rowHeights.length; r += 1) {
    rowTop[r] = y;
    y += (rowHeights[r] ?? 0) + gapY;
  }

  const nodes: PlacedNode[] = measured.map(({ node, m }) => {
    const span = node.colSpan ?? 1;
    return {
      ...node,
      kickerLines: m.kickerLines,
      titleLines: m.titleLines,
      bodyLines: m.bodyLines,
      box: {
        x: node.col * pitch,
        y: rowTop[node.row],
        w: nodeWidth * span + gapX * (span - 1),
        h: rowHeights[node.row],
      },
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rightEdge = Math.max(...nodes.map((n) => n.box.x + n.box.w));

  const edges: PlacedEdge[] = flow.edges.map((edge) => {
    const a = byId.get(edge.from)!;
    const b = byId.get(edge.to)!;
    const kind = edge.kind ?? 'forward';
    const points = routeWide(a, b, edge, kind, gapY, rightEdge);
    return {
      ...edge,
      points,
      ...edgeLabel(edge, points, Math.min(pitch * 1.6, 300), 'middle'),
    };
  });

  const groups = groupBoxes(flow, byId, innerWidth, edges);

  return bounds({ nodes, edges, groups });
}

function centre(box: Box) {
  return { cx: box.x + box.w / 2, cy: box.y + box.h / 2 };
}

function routeWide(
  a: PlacedNode,
  b: PlacedNode,
  edge: FlowEdge,
  kind: FlowEdgeKind,
  gapY: number,
  rightEdge: number,
): Array<[number, number]> {
  const A = a.box;
  const B = b.box;
  const ca = centre(A);
  const cb = centre(B);
  const offset = edge.laneOffset ?? 0;
  const sameColumn = Math.abs(ca.cx - cb.cx) < 2;

  // A vertical run needs no elbows, whichever way it points.
  if (sameColumn && a.row !== b.row) {
    return b.row > a.row
      ? [
          [ca.cx, A.y + A.h],
          [cb.cx, B.y],
        ]
      : [
          [ca.cx, A.y],
          [cb.cx, B.y + B.h],
        ];
  }

  // An edge only takes a lane if its data asks for one; everything else is
  // drawn as a straight run, whatever colour it is.
  if (kind === 'forward' || !edge.lane) {
    // Straight across a row.
    if (a.row === b.row) {
      return B.x > A.x
        ? [
            [A.x + A.w, ca.cy],
            [B.x, cb.cy],
          ]
        : [
            [A.x, ca.cy],
            [B.x + B.w, cb.cy],
          ];
    }
    // Moving right but changing row — a fan-out or a merge. Leave sideways,
    // change row halfway, arrive sideways.
    if (B.x > A.x) {
      const midX = (A.x + A.w + B.x) / 2;
      return [
        [A.x + A.w, ca.cy],
        [midX, ca.cy],
        [midX, cb.cy],
        [B.x, cb.cy],
      ];
    }
    // Moving left and up — the same elbow, mirrored.
    if (b.row < a.row) {
      const midX = (A.x + B.x + B.w) / 2;
      return [
        [A.x, ca.cy],
        [midX, ca.cy],
        [midX, cb.cy],
        [B.x + B.w, cb.cy],
      ];
    }
    // Wrapping from the end of one row to the start of the next.
    const midY = (A.y + A.h + B.y) / 2;
    return [
      [ca.cx, A.y + A.h],
      [ca.cx, midY],
      [cb.cx, midY],
      [cb.cx, B.y],
    ];
  }

  // Loop-backs and hand-offs travel in an empty lane: between two rows, or
  // around the right-hand margin when the rows in between are full.
  const lane = edge.lane;

  if (lane === 'right') {
    const laneX = rightEdge + 34 + offset;
    return [
      [A.x + A.w, ca.cy],
      [laneX, ca.cy],
      [laneX, cb.cy],
      [B.x + B.w, cb.cy],
    ];
  }

  if (lane === 'below') {
    const laneY = A.y + A.h + gapY / 2 + offset;
    return [
      [ca.cx, A.y + A.h],
      [ca.cx, laneY],
      [cb.cx, laneY],
      // A target further down is entered from above; one on this row from below.
      [cb.cx, b.row > a.row ? B.y : B.y + B.h],
    ];
  }

  const laneY = A.y - gapY / 2 - offset;
  return [
    [ca.cx, A.y],
    [ca.cx, laneY],
    [cb.cx, laneY],
    [cb.cx, b.row < a.row ? B.y + B.h : B.y],
  ];
}

/** Single column, for narrow screens. Nodes are drawn in authoring order. */
export function layoutStacked(flow: Flow, availableWidth: number): FlowLayout {
  const laneWidth = 92;
  const nodeWidth = Math.min(440, Math.max(210, availableWidth - laneWidth - 12));
  const gapY = 54;
  const innerWidth = nodeWidth - PAD_X * 2;
  const left = laneWidth;

  let y = 0;
  const nodes: PlacedNode[] = flow.nodes.map((node) => {
    const m = measure(node, innerWidth);
    const placed: PlacedNode = {
      ...node,
      kickerLines: m.kickerLines,
      titleLines: m.titleLines,
      bodyLines: m.bodyLines,
      box: { x: left, y, w: nodeWidth, h: m.height },
    };
    y += m.height + gapY;
    return placed;
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const order = new Map(flow.nodes.map((n, i) => [n.id, i]));

  let loopIndex = 0;
  const edges: PlacedEdge[] = flow.edges.map((edge) => {
    const a = byId.get(edge.from)!;
    const b = byId.get(edge.to)!;
    const ca = centre(a.box);
    const cb = centre(b.box);

    // Only neighbours are joined directly; anything that skips a node would
    // otherwise be drawn straight through it.
    if (order.get(edge.to)! - order.get(edge.from)! === 1) {
      const points: Array<[number, number]> = [
        [ca.cx, a.box.y + a.box.h],
        [cb.cx, b.box.y],
      ];
      return {
        ...edge,
        points,
        ...edgeLabel(edge, points, nodeWidth * 0.7, 'start'),
      };
    }

    // Everything else runs along the lane on the left.
    const laneX = Math.max(12, left - 20 - (loopIndex % 3) * 19);
    loopIndex += 1;
    const points: Array<[number, number]> = [
      [a.box.x, ca.cy],
      [laneX, ca.cy],
      [laneX, cb.cy],
      [b.box.x, cb.cy],
    ];
    const label = edgeLabel(edge, points, laneWidth - 10, 'end');
    return {
      ...edge,
      points,
      ...label,
      // Hung off the lane and growing left, so it never reaches the boxes.
      labelX: laneX - 7,
      labelY: (ca.cy + cb.cy) / 2 - ((label.labelLines.length - 1) * TYPE.edge.leading) / 2,
      labelAnchor: 'end' as const,
    };
  });

  const groups = groupBoxes(flow, byId, innerWidth, edges);

  return bounds({ nodes, edges, groups });
}
