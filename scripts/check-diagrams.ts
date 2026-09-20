/**
 * Layout regression check for the flow diagrams.
 *
 * The diagrams are laid out by code, so a change to the engine can quietly push
 * a box on top of an arrow. This walks every diagram in both layouts and fails
 * on the geometry a reader would notice: overlapping boxes, an arrow running
 * through an unrelated box, or a label landing on one.
 *
 *   node --experimental-strip-types scripts/check-diagrams.ts
 */
import { layoutStacked, layoutWide, type Box, type Flow, type FlowLayout } from '../lib/flow.ts';
import { diagrams } from '../app/docs/how-a-ticket-becomes-shipped-software/diagrams.ts';

function overlaps(a: Box, b: Box, slack = 0) {
  return (
    a.x < b.x + b.w - slack &&
    a.x + a.w - slack > b.x &&
    a.y < b.y + b.h - slack &&
    a.y + a.h - slack > b.y
  );
}

/** Does a straight run pass through the middle of a box? */
function segmentHitsBox(p: [number, number], q: [number, number], box: Box, slack = 3) {
  const x0 = Math.min(p[0], q[0]);
  const x1 = Math.max(p[0], q[0]);
  const y0 = Math.min(p[1], q[1]);
  const y1 = Math.max(p[1], q[1]);
  return (
    x0 < box.x + box.w - slack &&
    x1 > box.x + slack &&
    y0 < box.y + box.h - slack &&
    y1 > box.y + slack
  );
}

function check(layout: FlowLayout, mode: string) {
  const problems: string[] = [];

  for (let i = 0; i < layout.nodes.length; i += 1) {
    for (let j = i + 1; j < layout.nodes.length; j += 1) {
      if (overlaps(layout.nodes[i].box, layout.nodes[j].box)) {
        problems.push(`${mode}: nodes overlap — ${layout.nodes[i].id} / ${layout.nodes[j].id}`);
      }
    }
  }

  for (const edge of layout.edges) {
    for (const node of layout.nodes) {
      if (node.id === edge.from || node.id === edge.to) continue;
      for (let k = 0; k < edge.points.length - 1; k += 1) {
        if (segmentHitsBox(edge.points[k], edge.points[k + 1], node.box)) {
          problems.push(`${mode}: edge ${edge.from}→${edge.to} crosses node ${node.id}`);
        }
      }
    }
  }

  for (const edge of layout.edges) {
    if (!edge.labelLines.length) continue;
    const width = Math.max(...edge.labelLines.map((l) => l.length)) * 11 * 0.505;
    const box: Box = {
      x:
        edge.labelAnchor === 'middle'
          ? edge.labelX - width / 2
          : edge.labelAnchor === 'end'
            ? edge.labelX - width
            : edge.labelX,
      y: edge.labelY - 11,
      w: width,
      h: edge.labelLines.length * 14,
    };
    for (const node of layout.nodes) {
      if (overlaps(box, node.box, 4)) {
        problems.push(`${mode}: label of ${edge.from}→${edge.to} sits on node ${node.id}`);
      }
    }
  }

  return problems;
}

let failures = 0;
for (const flow of Object.values(diagrams) as Flow[]) {
  const wide = layoutWide(flow);
  const problems = [
    ...new Set([...check(wide, 'wide'), ...check(layoutStacked(flow, 380), 'stacked')]),
  ];
  const size = `${Math.round(wide.width)}×${Math.round(wide.height)}`;
  if (problems.length) {
    failures += problems.length;
    console.log(`✗ ${flow.id} (${size})`);
    for (const problem of problems) console.log(`   ${problem}`);
  } else {
    console.log(`✓ ${flow.id} (${size})`);
  }
}

console.log(failures ? `\n${failures} problems` : '\nall clear');
process.exit(failures ? 1 : 0);
