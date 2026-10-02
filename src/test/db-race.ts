import type { TTestDb } from "@/db/test-db";

type TTx = Parameters<Parameters<TTestDb["transaction"]>[0]>[0];

/**
 * The same db, but `update`, `insert` and `delete` outside a transaction throw:
 * a core that says "one transaction" fails its test if any write escapes it.
 */
export function writesOnlyInTransaction(db: TTestDb): TTestDb {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "update" || prop === "insert" || prop === "delete") {
        return () => {
          throw new Error(`db.${String(prop)} outside the transaction`);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * The same db, but each transaction runs `hook(tx)` at a chosen point, to stand in for a
 * concurrent request: `"start"` before the callback, `"afterFirstSelect"` once the callback's
 * first `select … from … where …` has read its rows (the read the callback acts on).
 */
export function raceInTransaction(db: TTestDb, at: "start" | "afterFirstSelect", hook: (tx: TTx) => Promise<void>): TTestDb {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop !== "transaction") return Reflect.get(target, prop, receiver);
      return (callback: (tx: TTx) => Promise<unknown>) =>
        target.transaction(async (tx) => {
          if (at === "start") {
            await hook(tx);
            return callback(tx);
          }
          let fired = false;
          const racing = new Proxy(tx, {
            get(t, p, r) {
              if (p !== "select" || fired) return Reflect.get(t, p, r);
              return (...fields: Parameters<TTx["select"]>) => ({
                from: (table: Parameters<ReturnType<TTx["select"]>["from"]>[0]) => ({
                  where: (where: Parameters<ReturnType<ReturnType<TTx["select"]>["from"]>["where"]>[0]) =>
                    t
                      .select(...fields)
                      .from(table)
                      .where(where)
                      .then(async (rows) => {
                        fired = true;
                        await hook(t);
                        return rows;
                      }),
                }),
              });
            },
          });
          return callback(racing);
        });
    },
  });
}
