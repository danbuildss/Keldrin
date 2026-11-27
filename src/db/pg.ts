import pg from "pg";

// Read-only Postgres access for the deployed API (Supabase `keldrin_reader` login via the pooler).
// Defence in depth: the role has SELECT-only grants AND every session is forced read-only.
// TLS certificate verification is ON; set DATABASE_CA_CERT (PEM, from the Supabase dashboard) if the
// default trust store does not cover it. PGSSL_NO_VERIFY=1 disables verification (explicit opt-in only).

export type ReadDb = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  /** One statement in an explicit READ WRITE transaction. Used only for the free-try counter function, the one
   *  write the reader role is granted (supabase/010_trial_grants.sql); table grants stay SELECT-only. */
  writeOne?<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

function tls() {
  return process.env.PGSSL_NO_VERIFY === "1" ? { rejectUnauthorized: false } : { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {}) };
}

export function openPg(connectionString: string): ReadDb {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const ssl = tls();
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
    async writeOne<T>(sql: string, params: unknown[] = []) {
      if (!/^SELECT trial_consume\(\$1, \$2\)/.test(sql)) throw new Error("writeOne only runs the free-try counter");
      const c = await pool.connect();
      try {
        await c.query("BEGIN READ WRITE");
        const r = await c.query(sql, params as unknown[]);
        await c.query("COMMIT");
        return { rows: r.rows as T[] };
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}

/**
 * Writer connection for scheduled research runs (Supabase `keldrin_writer` login, Phase 4).
 * The role itself limits what can be written (append + asset upsert); search_path and timeouts are
 * pinned on the role because the transaction pooler drops per-connection SETs. Statements run one at
 * a time over one connection, so the pipeline's read-after-write steps see their own inserts.
 */
export function openPgWriter(connectionString: string): ReadDb {
  if (!connectionString) throw new Error("KELDRIN_WRITER_URL is not set");
  const pool = new pg.Pool({ connectionString, ssl: tls(), max: 1, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000, statement_timeout: 60_000 });
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const r = await pool.query(sql, params.map((v) => (typeof v === "bigint" ? v.toString() : v)) as unknown[]);
      return { rows: r.rows as T[] };
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    },
  };
}
