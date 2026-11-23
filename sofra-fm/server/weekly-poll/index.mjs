import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const maxBody = 350;
const siteOrigin = "https://fatihyaylacimk.github.io";
const voterId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateId = /^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

function postgresPoll(sql) {
  async function results() {
    const rounds = await sql`
      WITH visible AS (
        SELECT r.*, r.closes_at > statement_timestamp() AS active
        FROM sofra_poll.rounds AS r
        WHERE r.opens_at <= statement_timestamp()
          AND r.closes_at + interval '7 days' > statement_timestamp()
      )
      SELECT v.id::text, v.active, v.closes_at AS closes_at,
             v.left_drink, v.right_drink,
             count(b.choice) FILTER (WHERE b.choice = 0)::int AS left_votes,
             count(b.choice) FILTER (WHERE b.choice = 1)::int AS right_votes
      FROM visible AS v LEFT JOIN sofra_poll.ballots AS b ON b.round_id = v.id
      GROUP BY v.id, v.active, v.closes_at, v.left_drink, v.right_drink
      ORDER BY v.closes_at DESC
    `;
    return {
      current: toPublicRound(rounds.find(round => round.active)),
      previous: toPublicRound(rounds.find(round => !round.active)),
    };
  }

  async function cast({ round, visitor, choice }) {
    const hash = createHash("sha256").update(round + ":" + visitor.toLowerCase()).digest("hex");
    const [inserted, stored] = await sql.transaction([
      sql`
        INSERT INTO sofra_poll.ballots (round_id, voter_hash, choice)
        SELECT id, ${hash}, ${choice} FROM sofra_poll.rounds
        WHERE id::text = ${round} AND opens_at <= statement_timestamp() AND closes_at > statement_timestamp()
        ON CONFLICT (round_id, voter_hash) DO NOTHING
        RETURNING choice
      `,
      sql`SELECT choice FROM sofra_poll.ballots WHERE round_id::text = ${round} AND voter_hash = ${hash}`,
    ]);
    return (inserted[0] || stored[0])?.choice;
  }
  return { results, cast };
}

function toPublicRound(round) {
  if (!round) return null;
  return {
    id: round.id,
    closesAt: round.closes_at,
    options: [round.left_drink, round.right_drink],
    counts: [round.left_votes, round.right_votes],
  };
}

async function readBallot(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > maxBody) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    const ballot = JSON.parse(body + decoder.decode());
    if (typeof ballot?.round === "string" && dateId.test(ballot.round) &&
        typeof ballot.visitor === "string" && voterId.test(ballot.visitor) &&
        (ballot.choice === 0 || ballot.choice === 1)) return ballot;
  } catch {
    return null;
  }
  return null;
}

export function createPollHandler(store, origin = siteOrigin) {
  return {
    async fetch(request) {
      const allowed = request.headers.get("origin") === origin;
      const headers = {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Origin",
        ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
      };
      const reply = (body, status = 200) => Response.json(body, { headers, status });
      if (new URL(request.url).pathname !== "/") return reply({ error: "not_found" }, 404);
      if (request.method === "OPTIONS" && allowed) {
        return new Response(null, { status: 204, headers: {
          ...headers,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Max-Age": "600",
        } });
      }
      try {
        if (request.method === "GET") return reply(await store.results());
        if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
        if (!allowed) return reply({ error: "origin_forbidden" }, 403);
        const ballot = await readBallot(request);
        if (!ballot) return reply({ error: "invalid_ballot" }, 400);
        const choice = await store.cast(ballot);
        return choice === undefined
          ? reply({ error: "round_closed", ...await store.results() }, 409)
          : reply({ choice, ...await store.results() });
      } catch {
        console.error("Sofra FM voting request failed.");
        return reply({ error: "vote_service_unavailable" }, 503);
      }
    },
  };
}

const store = process.env.DATABASE_URL ? postgresPoll(neon(process.env.DATABASE_URL)) : null;
const handler = createPollHandler({
  results: () => store.results(),
  cast: ballot => store.cast(ballot),
}, process.env.SOFRAPOLL_ORIGIN || siteOrigin);

export default handler;
