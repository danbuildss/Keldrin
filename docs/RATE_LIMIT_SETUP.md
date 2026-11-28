# Vercel rate-limit rule (Phase 13, set by the founder)

Why: the API already limits each caller inside the server (120 requests per minute per server copy), but Vercel runs
many copies, so a heavy caller can still get through. A Firewall rule at Vercel's edge stops that before it costs
anything. Vercel Pro includes rate limiting. Screen names can change slightly; if one differs, look for the closest.

1. vercel.com → the **keldrin** project → **Firewall** (top menu).
2. **Configure** (or **Edit rules**) → **New Rule** (or **Add Rule**).
3. Name: `API fair use`.
4. **If**: `Request Path` → `Starts with` → `/v1`. Add an **OR** condition: `Request Path` → `Starts with` → `/mcp`.
5. **Then**: **Rate Limit** → **Fixed Window**, `300` requests per `60` seconds, keyed on **IP Address**. (Not lower: one paid snapshot on Bankr makes about 28 calls to our API from Bankr's servers.)
   When exceeded: **Too Many Requests (429)**.
6. **Save**, then **Review changes** → **Publish**.

Leave the website pages, `/llms.txt`, `/skill.md` and `/openapi.json` outside the rule (they are cached files).
After publishing, tell Claude; it will check from outside that normal use still works.
