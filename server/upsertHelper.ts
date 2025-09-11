import { db } from "./db";
import { eq, inArray, Table, Column } from "drizzle-orm";
import { normalizeDates, autoDateFields } from "../client/src/lib/sanitizeDates";

interface UpsertOptions<T> {
  table: Table;
  primaryKey: Column<any>;
  foreignKey: Column<any>;
  foreignKeyValue: number | string;
  records: T[];
  label?: string;
  diagnostics?: boolean;
}

export async function upsertByPKAndFK<T extends Record<string, any>>({
  table,
  primaryKey,
  foreignKey,
  foreignKeyValue,
  records,
  label,
  diagnostics = false,
}: UpsertOptions<T>): Promise<{
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
}> {
  const tableLabel = label ?? (table as any)._?.name ?? "unknown";
  const dateFields = autoDateFields[tableLabel] || [];

  if (diagnostics) {
    console.log(`🔄 Upserting ${records.length} records into ${tableLabel}`);
  }

  return await db.transaction(async (trx) => {
    // 1️⃣ Fetch existing records for this applicant
    const existing = await trx
      .select({ id: primaryKey })
      .from(table)
      .where(eq(foreignKey, foreignKeyValue));

    const existingIds = new Set(existing.map((r) => r.id));
    const incomingIds = new Set(records.map((r) => r.id).filter(Boolean));

    // 2️⃣ Delete only rows that are no longer in incoming payload
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id)
    );
      if (idsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${idsToDelete.length} IDs from ${tableLabel}`);
      //   await trx.delete(table).where(inArray(primaryKey, idsToDelete));
      if (diagnostics) console.log("🗑️ Deleted IDs:", idsToDelete);
    }

    // 3️⃣ Insert or Update
    let inserted = 0;
    let updated = 0;

    for (const r of records) {
      const payload = normalizeDates(
        { ...r, [foreignKey.name]: foreignKeyValue },
        { dateFields, setUpdatedAt: true }
      );

      if (r.id && existingIds.has(r.id)) {
        await trx.update(table).set(payload).where(eq(primaryKey, r.id));
        updated++;
        if (diagnostics) console.log(`✏️ Updated row id=${r.id}`, payload);
      } else {
        await trx.insert(table).values(payload);
        inserted++;
        if (diagnostics) console.log(`➕ Inserted new row ${table}`, payload);
      }
    }

    return { success: true, inserted, updated, deleted: idsToDelete.length };
  });
}