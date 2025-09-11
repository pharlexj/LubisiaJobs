import { db } from "./db";
import { eq, inArray, Table, Column } from "drizzle-orm";
import { normalizeDates, autoDateFields } from "../client/src/lib/sanitizeDates";

// 🔹 Option A: Table WITH FK
interface UpsertWithFK<T> {
  table: Table;
  records: T[];
  primaryKeyColumn: Column<any>;        // PK required
  foreignKeyColumn: Column<any>;        // FK required
  foreignKeyValue: number | string;     // e.g. applicantId
  diagnostics?: boolean;
  label?: string;
}

// 🔹 Option B: Table WITHOUT FK
interface UpsertWithoutFK<T> {
  table: Table;
  records: T[];
  primaryKeyColumn: Column<any>;        // PK required
  diagnostics?: boolean;
  label?: string;
}

// 🔹 Union type
type UpsertOptions<T> = UpsertWithFK<T> | UpsertWithoutFK<T>;

/**
 * Generic upsert helper
 * - Deletes rows that are missing in incoming payload
 * - Updates rows that have an `id`
 * - Inserts rows that don’t have an `id`
 */
export async function upsertRecordsByPK<T extends Record<string, any>>(
  options: UpsertOptions<T>
): Promise<{ success: boolean; inserted: number; updated: number; deleted: number }> {
  const { table, records, primaryKeyColumn, diagnostics = false, label } = options;

  const hasFK = "foreignKeyColumn" in options;
  const foreignKeyColumn = hasFK ? options.foreignKeyColumn : undefined;
  const foreignKeyValue = hasFK ? options.foreignKeyValue : undefined;

  const tableLabel = label ?? (table as any)._?.name ?? "unknown";
  const dateFields = autoDateFields[tableLabel] || [];

  if (diagnostics) {
    console.log(`🔄 Upserting ${records.length} records into ${tableLabel}`);
  }

  return await db.transaction(async (trx) => {
    // 1️⃣ Fetch existing IDs
    let existing: { id: any }[] = [];
    if (hasFK && foreignKeyColumn && foreignKeyValue !== undefined) {
      existing = await trx
        .select({ id: primaryKeyColumn })
        .from(table)
        .where(eq(foreignKeyColumn, foreignKeyValue));
    } else {
      existing = await trx.select({ id: primaryKeyColumn }).from(table);
    }

    const existingIds = new Set(existing.map((r) => r.id));
    const incomingIds = new Set(records.map((r) => r.id).filter(Boolean));

    // 2️⃣ Delete rows not in incoming payload
    const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));
    if (idsToDelete.length > 0) {
      await trx.delete(table).where(inArray(primaryKeyColumn, idsToDelete));
      if (diagnostics) console.log("🗑️ Deleted IDs:", idsToDelete);
    }

    // 3️⃣ Insert/Update
    let insertedCount = 0;
    let updatedCount = 0;

    for (const r of records) {
      const payload = normalizeDates(
        hasFK && foreignKeyColumn && foreignKeyValue !== undefined
          ? { ...r, [foreignKeyColumn.name]: foreignKeyValue }
          : { ...r },
        { dateFields, setUpdatedAt: true }
      );

      if (r.id && existingIds.has(r.id)) {
        await trx.update(table).set(payload).where(eq(primaryKeyColumn, r.id));
        updatedCount++;
        if (diagnostics) console.log(`✏️ Updated row id=${r.id}`);
      } else {
        await trx.insert(table).values(payload);
        insertedCount++;
        if (diagnostics) console.log("➕ Inserted new row:", payload);
      }
    }

    return {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: idsToDelete.length,
    };
  });
}
