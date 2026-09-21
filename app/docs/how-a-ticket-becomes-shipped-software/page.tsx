import type { Metadata } from 'next';

import { A, Code, DocLayout, Item, Lead, List, P, Section, Strong } from '@/components/DocLayout';
import { FlowDiagram } from '@/components/FlowDiagram';
import type { TocEntry } from '@/components/TableOfContents';
import { docBySlug } from '@/lib/docs';

import { refs } from './refs';

import {
  buildFlow,
  contextFlow,
  overviewFlow,
  planFlow,
  researchFlow,
  rhythmFlow,
  setupFlow,
  shipFlow,
  statesFlow,
} from './diagrams';

const doc = docBySlug['how-a-ticket-becomes-shipped-software'];

const standfirst =
  'The four-phase workflow a ticket runs through, from Linear issue to merged pull request.';

export const metadata: Metadata = {
  title: doc.title,
  description: standfirst,
};

const toc: TocEntry[] = [
  { id: 'in-one-minute', label: 'In one minute' },
  {
    id: 'setting-up-the-workspace',
    label: 'Setup — one CLI command',
  },
  {
    id: 'the-rhythm-every-phase-follows',
    label: 'The rhythm every phase follows',
  },
  { id: 'context', label: 'Context Phase' },
  { id: 'codebase-research', label: 'Codebase Research Phase' },
  { id: 'implementation-plan', label: 'Implementation Plan Phase' },
  { id: 'implementation', label: 'Implementation Phase' },
  {
    id: 'review-and-ship',
    label: 'After the Implementation Phase — review, merge and release',
  },
  {
    id: 'how-a-phase-is-tracked',
    label: 'How a phase is tracked',
  },
  { id: 'what-this-buys', label: 'What this buys' },
  { id: 'why-it-is-shaped-this-way', label: 'Why it is shaped this way' },
  { id: 'gaps', label: 'Known Gaps', tone: 'warn' },
  { id: 'tooling', label: 'The tooling' },
];

/**
 * `<name> CLI` as a single link. The name is monospaced but not boxed: a chip's
 * border cannot share a continuous underline with the word beside it.
 */
function Cli({ name }: { name: string }) {
  return (
    <A href={refs[name]}>
      <span className="font-mono text-[0.92em]">{name}</span> CLI
    </A>
  );
}

/** A code chip that links to its source when one is known. */
function R({ name, children }: { name: string; children?: React.ReactNode }) {
  const href = refs[name];
  const chip = <Code>{children ?? name}</Code>;
  return href ? <A href={href}>{chip}</A> : chip;
}

export default function Page() {
  return (
    <DocLayout doc={doc} standfirst={standfirst} toc={toc}>
      <Section id="in-one-minute" title="In one minute">
        <Lead>
          A ticket is a single unit of work: a bug to fix, a change to make, a small feature to add.
          This document describes the path every ticket takes, from the moment someone files it to
          the moment the change is live for customers.
        </Lead>
        <P>
          Four phases, each a Claude Code session driven by a skill, all inside a git worktree
          created for that ticket. Each phase produces one document, signed off before the next
          begins. Code is written only in the last phase.
        </P>
        <P>
          The last two phases loop. The current plan is built to completion first — never abandoned
          halfway. If more is needed, the next iteration gets a new plan file; earlier ones are
          kept.
        </P>
        <FlowDiagram flow={overviewFlow} />
      </Section>

      <Section id="setting-up-the-workspace" title="Setup — one CLI command">
        <P>
          One command, no further input:{' '}
          <R name="ks-start-ticket">ks-start-ticket &lt;linear-issue-url&gt;</R>.
        </P>
        <List>
          <Item>
            <Strong>Reads the issue</Strong> — the ticket details, through the in-house{' '}
            <Cli name="linear" /> built on <R name="@linear/sdk" />.
          </Item>
          <Item>
            <Strong>Writes the state file</Strong> — <Code>state.yaml</Code>, the ticket&apos;s
            workflow state. Shape enforced by a JSON schema.
          </Item>
          <Item>
            <Strong>Creates a git worktree</Strong> —{' '}
            <R name="git worktree">git worktree add -b &lt;branch&gt;</R> off the base branch,
            beside the main checkout. Own tree, own branch, so several tickets can be open at once.
          </Item>
          <Item>
            <Strong>Copies the local files across</Strong> — the <Code>.env</Code> files and{' '}
            <Code>CLAUDE.local.md</Code>.
          </Item>
          <Item>
            <Strong>Makes it ready to develop in</Strong> — <Code>pnpm install</Code>, workspace
            packages built in dependency order.
          </Item>
          <Item>
            <Strong>Launches the session and sends the first message</Strong> —{' '}
            <R name="claude-ks" /> starts Claude Code in the worktree; the first message loads{' '}
            <R name="/ks:project-manager" /> and starts the workflow.
          </Item>
        </List>
        <FlowDiagram flow={setupFlow} />
      </Section>

      <Section id="the-rhythm-every-phase-follows" title="The rhythm every phase follows">
        <P>
          Different documents, identical wrapper — driven by <R name="/ks:project-manager" />, one
          session per phase:
        </P>
        <List>
          <Item>
            <Strong>Ask before running</Strong> — the phase can be run or skipped.
          </Item>
          <Item>
            <Strong>Mark in progress</Strong> — status and a start timestamp in{' '}
            <Code>state.yaml</Code>.
          </Item>
          <Item>
            <Strong>Run the skill</Strong> — one skill per phase, writing its document into{' '}
            <Code>resources/</Code>.
          </Item>
          <Item>
            <Strong>Human review</Strong> — sign it off, or send it back.
          </Item>
          <Item>
            <Strong>Mark complete</Strong> — <Code>COMPLETED</Code> or <Code>SKIPPED</Code>.
          </Item>
          <Item>
            <Strong>Write a handoff</Strong> — <R name="/ks:create_handoff" /> records what was
            decided, so the next session starts warm.
          </Item>
        </List>
        <FlowDiagram flow={rhythmFlow} />
      </Section>

      <Section id="context" title="Context Phase">
        <P>
          <R name="/ks:user-context-generator" /> — a conversation, not an analysis. Five questions,
          one at a time:
        </P>
        <List>
          <Item>
            <Strong>The problem</Strong> — what is going wrong for the customer, in their words.
          </Item>
          <Item>
            <Strong>The workaround</Strong> — how they cope today.
          </Item>
          <Item>
            <Strong>The idea</Strong> — what we are thinking of building.
          </Item>
          <Item>
            <Strong>The assumptions</Strong> — what we are taking on trust.
          </Item>
          <Item>
            <Strong>The summary</Strong> — the whole thing in one paragraph.
          </Item>
        </List>
        <P>
          The answers often need more than memory. <R name="/ks:linear" /> reads the ticket and its
          comments, <R name="/ks:slack" /> reads the conversation around it, and{' '}
          <R name="/ks:grain-cli" /> watches the call the request came from. When the problem is
          easier to see than to describe,{' '}
          <A href="https://github.com/neondatabase/mcp-server-neon">Neon MCP</A> reads a branch
          copied from the production database, and{' '}
          <A href="https://claude.com/chrome">Claude in Chrome</A> opens the affected page directly.
        </P>
        <P>
          Answers are read back for confirmation, then written to{' '}
          <Code>resources/user-context.md</Code>. Everything later rests on it: a misunderstanding
          caught here costs a conversation; caught after the code is written, a rebuild.
        </P>
        <FlowDiagram flow={contextFlow} />
      </Section>

      <Section id="codebase-research" title="Codebase Research Phase">
        <P>
          <R name="/ks:research_codebase" /> answers one question: how does this part of the system
          work today? The research plan is agreed, then decomposed and fanned out to subagents in
          parallel:
        </P>
        <List>
          <Item>
            <R name="codebase-locator" /> — finds where things live.
          </Item>
          <Item>
            <R name="codebase-analyzer" /> — explains how they work, without critiquing them.
          </Item>
          <Item>
            <R name="codebase-pattern-finder" /> — finds existing patterns worth copying.
          </Item>
        </List>
        <P>
          They query through Serena MCP rather than grepping, so symbol references are resolved, not
          guessed. Findings are synthesised into <Code>resources/codebase-research.md</Code> with
          file and line references.
        </P>
        <P>
          The rule is strict: describe what exists, never propose what should change. The document
          is incremental — re-running updates it rather than replacing it, so there is one shared
          account of the system instead of a dozen stale ones.
        </P>
        <FlowDiagram flow={researchFlow} />
      </Section>

      <Section id="implementation-plan" title="Implementation Plan Phase">
        <P>
          <R name="/ks:create_plan" /> designs the change on paper. It reads the ticket, the context
          and the research, investigates what is unclear, and puts the rest back to you as
          questions. The outline is agreed before the detail is written. Output:{' '}
          <Code>resources/implementation-plan-NN.md</Code>, numbered by iteration.
        </P>
        <P>
          The plan covers the current state, the desired end state, what is explicitly out of scope,
          the changes as ordered steps, how each step is verified — automated and manual — and the
          questions still open.
        </P>
        <P>
          No code is written here. The plan is the deliverable, and it is meant to be argued with:
          an argument about a document is cheaper than the same argument over half-built software.
        </P>
        <FlowDiagram flow={planFlow} />
      </Section>

      <Section id="implementation" title="Implementation Phase">
        <P>
          <R name="/ks:implement-plan" /> runs as an orchestrator. It delegates reading and code
          changes to subagents, and keeps sequencing, verification and commits to itself.
        </P>
        <List>
          <Item>
            <Strong>Analyse</Strong> — a subagent turns the plan into a structured task list, plus
            any clarifying questions.
          </Item>
          <Item>
            <Strong>Create every task first</Strong> — implementation starts only once the full list
            exists, so the size of the work is visible up front.
          </Item>
          <Item>
            <Strong>Group by file overlap</Strong> — tasks touching different files run in parallel;
            tasks sharing a file are split into sequential groups.
          </Item>
          <Item>
            <Strong>Run the group</Strong> — one implementation subagent per task.
          </Item>
          <Item>
            <Strong>Verify before moving on</Strong> — the orchestrator reviews cross-cutting
            changes and runs the step&apos;s automated verification.
          </Item>
          <Item>
            <Strong>Commit</Strong> — only the orchestrator, and only after your approval.
          </Item>
        </List>
        <P>
          Finishing this phase is not always finishing the ticket. The current plan is carried to
          completion first. Another iteration starts when building surfaced something that needs
          rethinking, when scope changed, or when the work was split into iterations on purpose.
          Each iteration gets a new plan file — earlier ones are never overwritten — and{' '}
          <Code>state.yaml</Code> records every iteration on both phases.
        </P>
        <FlowDiagram flow={buildFlow} />
      </Section>

      <Section
        id="review-and-ship"
        title="After the Implementation Phase — review, merge and release"
      >
        <P>Two reviewers, one automated and one human:</P>
        <List>
          <Item>
            <Strong>Open the pull request</Strong> — <R name="/ks:create_pr" />, linked to the
            Linear ticket and recorded in <Code>state.yaml</Code>.
          </Item>
          <Item>
            <Strong>Automated review</Strong> — <Code>/code-review</Code> reads the diff and reports
            bugs and convention violations.
          </Item>
          <Item>
            <Strong>Fix and re-review</Strong> — apply its findings, run it again.
          </Item>
          <Item>
            <Strong>CI review</Strong> — <A href="https://www.greptile.com">Greptile</A> reviews the
            pull request on GitHub and comments inline. A second opinion, outside the session that
            wrote the code.
          </Item>
          <Item>
            <Strong>Request human review</Strong> — posted to Slack through the internal{' '}
            <Cli name="slack" />; the thread stays linked to the PR.
          </Item>
          <Item>
            <Strong>Merge and close</Strong> — the branch merges, the Linear ticket and the phase
            tracker end in the same state: done.
          </Item>
        </List>
        <FlowDiagram flow={shipFlow} />

        <P>
          Merging puts the change on <Code>main</Code>. Shipping it to customers is a separate step,
          and the announcement follows the deployment rather than driving it:
        </P>
        <List>
          <Item>
            <Strong>Wait for the production deployment</Strong> — nothing is announced until the
            change is actually live.
          </Item>
          <Item>
            <Strong>
              Announce with <R name="/ks:slack" />
            </Strong>{' '}
            — it reads the release announcement template, fills it from the ticket, and writes the
            message in the template&apos;s tone: customer-facing, not a commit list.
          </Item>
          <Item>
            <Strong>Confirm, then post</Strong> — the drafted message is shown first, and it goes to
            the release channel only once approved. The thread reference is recorded in{' '}
            <Code>state.yaml</Code>.
          </Item>
        </List>
        <P>
          The template is what keeps releases readable: the same shape every time, written for the
          people who use the product rather than the people who built it.
        </P>
      </Section>

      <Section id="how-a-phase-is-tracked" title="How a phase is tracked">
        <P>
          Every phase in <Code>state.yaml</Code> sits in exactly one status:
        </P>
        <List>
          <Item>
            <Code>NOT_STARTED</Code>, <Code>IN_PROGRESS</Code>, <Code>COMPLETED</Code>,{' '}
            <Code>SKIPPED</Code> — the ordinary path.
          </Item>
          <Item>
            <Code>REVISITING</Code> — a completed phase being redone, with the reason recorded.
            Rarely used.
          </Item>
          <Item>
            <Code>INVALIDATED</Code> — set automatically on downstream phases when an earlier one is
            revisited, so stale work cannot quietly survive. Rarely used.
          </Item>
        </List>
        <P>
          Revisiting and iterating are different mechanisms. A revisit is corrective: it invalidates
          what was built on top of it. An iteration is incremental: it builds on the last one and
          invalidates nothing.
        </P>
        <FlowDiagram flow={statesFlow} />
      </Section>

      <Section id="what-this-buys" title="What this buys">
        <P>
          Four documents, four sign-offs, one loop. The cost is real: slower than opening the code
          and typing.
        </P>
        <P>
          What it buys: every decision has a written owner and reason, a stranger can pick the work
          up mid-flight, the expensive mistakes are caught while they are still cheap, and the AI
          works inside a boundary somebody drew on purpose.
        </P>
      </Section>

      <Section id="why-it-is-shaped-this-way" title="Why it is shaped this way">
        <P>
          Most of the cost of software is not typing the code. It is building the wrong thing, or
          building on a misunderstanding of how the system works. Every phase before the last
          removes one of those risks while it is still cheap. The risk each one removes:
        </P>
        <List>
          <Item>
            <Strong>Context Phase</Strong> — solving the wrong problem.
          </Item>
          <Item>
            <Strong>Codebase Research Phase</Strong> — misunderstanding what already exists.
          </Item>
          <Item>
            <Strong>Implementation Plan Phase</Strong> — discovering the design halfway through
            building it.
          </Item>
          <Item>
            <Strong>Implementation Phase</Strong> — the only phase that changes anything, and it
            checks itself after every step.
          </Item>
        </List>
        {/* Hidden for now — restore by uncommenting.
        <P>
          The same discipline is what makes AI assistance safe to lean on. An AI handed a vague
          ticket produces work that is plausible, confident and wrong. An AI handed an agreed
          problem statement, an accurate description of the existing system and an approved plan is
          doing something far narrower, and every step it takes is checked against a document a
          human has already read.
        </P>
        */}
      </Section>

      <Section id="gaps" title="Known Gaps" tone="warn">
        <P>What the workflow does not do yet:</P>
        <List>
          <Item>
            <Strong>Tests follow the code</Strong> — the plan names the tests each step needs, and
            verification runs them, but they are written alongside the change. Test-driven would
            write them first and let them drive the implementation.
          </Item>
          <Item>
            <Strong>Documentation is never updated</Strong> — no step creates or updates
            documentation once a change lands, so the next ticket starts colder than it needs to.
          </Item>
          <Item>
            <Strong>The research document decays</Strong> — it describes the system as it was before
            the change. Nothing refreshes it after the merge, so the next reader inherits a
            description that is one ticket out of date.
          </Item>
          <Item>
            <Strong>Nothing checks the outcome</Strong> — the context document records the customer
            problem and the assumptions taken on trust. Neither is revisited once the change is
            live, so a wrong assumption is never formally caught.
          </Item>
        </List>
      </Section>

      <Section id="tooling" title="The tooling">
        <P>
          The workflow is a <A href="https://github.com/Jassu225/ks">Claude Code plugin</A>. The
          services it runs against are ordinary; the skills and scripts below are internal.
        </P>

        <P>
          <Strong>Services</Strong>
        </P>
        <List>
          <Item>
            <A href="https://linear.app">Linear</A> — the issue tracker. The ticket, its status and
            its comments live here.
          </Item>
          <Item>
            <A href="https://slack.com">Slack</A> — where review requests and deploy notices are
            posted, threaded against the PR.
          </Item>
          <Item>
            <A href="https://github.com">GitHub</A> — the repository, the branch and the pull
            request.
          </Item>
          <Item>
            <A href="https://www.greptile.com">Greptile</A> — automated pull request review in CI,
            commenting on the diff in GitHub.
          </Item>
          <Item>
            <A href="https://claude.com/claude-code">Claude Code</A> — runs every phase.
          </Item>
          <Item>
            <A href="https://grain.com">Grain</A> — meeting recordings and transcripts, when the
            ticket needs context from a call.
          </Item>
          <Item>
            <A href="https://neon.com">Neon</A> — the Postgres host. Branching gives a copy of the
            production database that is safe to read.
          </Item>
          <Item>
            <A href="https://github.com/oraios/serena">Serena MCP</A> — semantic, symbol-level code
            navigation, used by the research subagents.
          </Item>
          <Item>
            <A href="https://github.com/neondatabase/mcp-server-neon">Neon MCP</A> — queries those
            branches from inside a session, so a question about real data is answered without
            leaving it.
          </Item>
          <Item>
            <A href="https://claude.com/chrome">Claude in Chrome</A> — drives the browser: opens a
            page, clicks through it, reads the console.
          </Item>
        </List>

        <P>
          <Strong>Scripts</Strong>
        </P>
        <List>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/scripts/ks-start-ticket.ts">
              <Code>ks-start-ticket</Code>
            </A>{' '}
            — bootstraps a ticket: reads the issue, writes the state file, creates the worktree,
            launches the first session.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/scripts/claude-ks">
              <Code>claude-ks</Code>
            </A>{' '}
            — launches Claude Code with the internal plugins loaded, which is what provides the{' '}
            <Code>/ks:*</Code> skills.
          </Item>
          <Item>
            <Cli name="grain" /> — in-house, over the Grain API: recordings, transcripts, summaries.
            Its <Code>watch</Code> command downloads the call and hands it to{' '}
            <R name="crv">claude-real-video</R>, which turns it into scene-detected keyframes — for
            when the answer is on screen rather than in the transcript.
          </Item>
          <Item>
            <Cli name="linear" /> — in-house, over <Code>@linear/sdk</Code>. Every Linear operation
            goes through it: issues, comments, projects, documents, labels, cycles.
          </Item>
          <Item>
            <Cli name="slack" /> — in-house, over the Slack Web API. Every Slack operation goes
            through it, including the review request.
          </Item>
        </List>

        <P>
          <Strong>Skills</Strong>
        </P>
        <List>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/project-manager.md">
              <Code>/ks:project-manager</Code>
            </A>{' '}
            — orchestrates the workflow and owns the phase wrapper.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/user-context-generator.md">
              <Code>/ks:user-context-generator</Code>
            </A>{' '}
            — the Context Phase.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/research_codebase.md">
              <Code>/ks:research_codebase</Code>
            </A>{' '}
            — the Codebase Research Phase.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/create_plan.md">
              <Code>/ks:create_plan</Code>
            </A>{' '}
            — the Implementation Plan Phase.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/implement-plan.md">
              <Code>/ks:implement-plan</Code>
            </A>{' '}
            — the Implementation Phase.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/create_pr.md">
              <Code>/ks:create_pr</Code>
            </A>{' '}
            and{' '}
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/create_handoff.md">
              <Code>/ks:create_handoff</Code>
            </A>{' '}
            — the bookends: the pull request, and the note between phases.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/linear.md">
              <Code>/ks:linear</Code>
            </A>
            ,{' '}
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/commands/slack.md">
              <Code>/ks:slack</Code>
            </A>{' '}
            and{' '}
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/skills/grain-cli/SKILL.md">
              <Code>/ks:grain-cli</Code>
            </A>{' '}
            — drive those CLIs. Used in any phase that needs to read more.
          </Item>
          <Item>
            <Code>/code-review</Code> — built into Claude Code; reads the diff and reports bugs.
          </Item>
        </List>

        <P>
          <Strong>Research subagents</Strong>
        </P>
        <List>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/agents/codebase-locator.md">
              <Code>codebase-locator</Code>
            </A>{' '}
            — where things live.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/agents/codebase-analyzer.md">
              <Code>codebase-analyzer</Code>
            </A>{' '}
            — how they work.
          </Item>
          <Item>
            <A href="https://github.com/Jassu225/ks/blob/main/plugins/ks/agents/codebase-pattern-finder.md">
              <Code>codebase-pattern-finder</Code>
            </A>{' '}
            — patterns worth copying.
          </Item>
        </List>
      </Section>
    </DocLayout>
  );
}
