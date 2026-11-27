import pg from "pg";

// Read-only Postgres access for the deployed API (Supabase `keldrin_reader` login via the pooler).
// Defence in depth: the role has SELECT-only grants AND every session is forced read-only.
// TLS certificate verification is ON; set DATABASE_CA_CERT (PEM, from the Supabase dashboard) if the
// default trust store does not cover it. PGSSL_NO_VERIFY=1 disables verification (explicit opt-in only).

export type ReadDb = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
};

export function openPg(connectionString: string): ReadDb {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const ssl = process.env.PGSSL_NO_VERIFY === "1" ? { rejectUnauthorized: false } : { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {}) };
  const pool = new pg.Pool({ connectionString, ssl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000, statement_timeout: 8_000 });
  pool.on("connect", (c) => {
    void c.query("SET search_path TO keldrin, public; SET default_transaction_read_only = on");
  });
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const r = await pool.query(sql, params as unknown[]);
      return { rows: r.rows as T[] };
    },
    async exec() {
      throw new Error("read-only connection: exec is not allowed");
    },
    async close() {
      await pool.end();
    },
  };
}
