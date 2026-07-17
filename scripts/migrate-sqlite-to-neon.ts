import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const SQLITE_PATH = "prisma/dev.db";

const sqlite = new Database(SQLITE_PATH, {
  readonly: true,
});

const prisma = new PrismaClient();

/**
 * 外部キーの依存関係を考慮した移行順です。
 * SQLiteに存在しないテーブルは自動的にスキップします。
 */
const TABLE_ORDER = [
  "User",
  "Spot",
  "Wallet",
  "NFT",
  "ChatRoom",
  "Proposal",
  "ProposalOption",
  "StampLog",
  "SpotRating",
  "LoginHistory",
  "SurveyResponse",
  "ChatMessage",
  "ChatReaction",
  "Vote",
] as const;

type ColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
};

type SqliteRow = Record<string, unknown>;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function sqliteTableExists(tableName: string): boolean {
  const row = sqlite
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `
    )
    .get(tableName);

  return Boolean(row);
}

async function getPostgresColumns(
  tableName: string
): Promise<Map<string, ColumnInfo>> {
  const rows = await prisma.$queryRawUnsafe<ColumnInfo[]>(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    tableName
  );

  return new Map(rows.map((column) => [column.column_name, column]));
}

function convertValue(value: unknown, column?: ColumnInfo): unknown {
  if (value === null || value === undefined || !column) {
    return value;
  }

  // SQLiteの0/1をPostgreSQLのBooleanへ変換
  if (column.data_type === "boolean") {
    if (value === 1 || value === "1" || value === true) {
      return true;
    }

    if (value === 0 || value === "0" || value === false) {
      return false;
    }
  }

  // SQLiteのDateTimeはミリ秒整数で保存されている場合がある
  if (
    column.data_type === "timestamp without time zone" ||
    column.data_type === "timestamp with time zone"
  ) {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (
      typeof value === "number" ||
      typeof value === "bigint" ||
      (typeof value === "string" && /^\d+$/.test(value))
    ) {
      const numericValue = Number(value);

      // 10桁程度なら秒、13桁程度ならミリ秒として処理
      const milliseconds =
        numericValue < 1_000_000_000_000
          ? numericValue * 1000
          : numericValue;

      date = new Date(milliseconds);
    } else {
      date = new Date(String(value));
    }

    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `日時変換に失敗しました: column=${column.column_name}, value=${String(value)}`
      );
    }

    return date;
  }

  if (column.data_type === "bigint") {
    return typeof value === "bigint"
      ? value
      : BigInt(String(value));
  }

  if (column.data_type === "json" || column.data_type === "jsonb") {
    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value));
      } catch {
        return JSON.stringify(value);
      }
    }

    return JSON.stringify(value);
  }

  return value;
}

async function insertRow(
  tableName: string,
  row: SqliteRow,
  postgresColumns: Map<string, ColumnInfo>
) {
  const columns = Object.keys(row).filter((columnName) =>
    postgresColumns.has(columnName)
  );

  if (columns.length === 0) {
    return;
  }

  const values = columns.map((columnName) =>
    convertValue(row[columnName], postgresColumns.get(columnName))
  );

  const columnSql = columns.map(quoteIdentifier).join(", ");
  const placeholders = columns
    .map((_, index) => `$${index + 1}`)
    .join(", ");

  const query = `
    INSERT INTO ${quoteIdentifier(tableName)} (${columnSql})
    VALUES (${placeholders})
    ON CONFLICT DO NOTHING
  `;

  await prisma.$executeRawUnsafe(query, ...values);
}

/**
 * ChatMessageには返信先を示す自己参照があるため、
 * 最初はreplyToMessageIdをNULLで登録し、全メッセージ登録後に更新します。
 */
async function migrateChatMessages(
  rows: SqliteRow[],
  postgresColumns: Map<string, ColumnInfo>
) {
  for (const row of rows) {
    const temporaryRow = {
      ...row,
      replyToMessageId: null,
    };

    await insertRow("ChatMessage", temporaryRow, postgresColumns);
  }

  if (!postgresColumns.has("replyToMessageId")) {
    return;
  }

  for (const row of rows) {
    const id = row.id;
    const replyToMessageId = row.replyToMessageId;

    if (!id || !replyToMessageId) continue;

    await prisma.$executeRawUnsafe(
      `
        UPDATE "ChatMessage"
        SET "replyToMessageId" = $1
        WHERE "id" = $2
      `,
      Number(replyToMessageId),
      Number(id)
    );
  }
}

async function resetSequence(tableName: string) {
  const result = await prisma.$queryRawUnsafe<
    { sequence_name: string | null }[]
  >(
    `
      SELECT pg_get_serial_sequence($1, 'id') AS sequence_name
    `,
    `"${tableName}"`
  );

  const sequenceName = result[0]?.sequence_name;

  if (!sequenceName) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      '${sequenceName.replaceAll("'", "''")}',
      COALESCE(
        (SELECT MAX("id") FROM ${quoteIdentifier(tableName)}),
        1
      ),
      EXISTS (
        SELECT 1 FROM ${quoteIdentifier(tableName)}
      )
    )
  `);
}

async function migrateTable(tableName: string) {
  if (!sqliteTableExists(tableName)) {
    console.log(`- ${tableName}: SQLiteに存在しないためスキップ`);
    return;
  }

  const postgresColumns = await getPostgresColumns(tableName);

  if (postgresColumns.size === 0) {
    console.log(`- ${tableName}: Neonに存在しないためスキップ`);
    return;
  }

  const rows = sqlite
    .prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`)
    .all() as SqliteRow[];

  console.log(`- ${tableName}: ${rows.length}件を移行中`);

  if (tableName === "ChatMessage") {
    await migrateChatMessages(rows, postgresColumns);
  } else {
    for (const row of rows) {
      await insertRow(tableName, row, postgresColumns);
    }
  }

  await resetSequence(tableName);

  console.log(`  ${tableName}: 完了`);
}

async function showCounts() {
  console.log("\n移行後の件数");

  for (const tableName of TABLE_ORDER) {
    if (!sqliteTableExists(tableName)) continue;

    const postgresColumns = await getPostgresColumns(tableName);
    if (postgresColumns.size === 0) continue;

    const sqliteCount = sqlite
      .prepare(
        `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`
      )
      .get() as { count: number };

    const neonResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier(tableName)}`
    );

    const neonCount = Number(neonResult[0]?.count ?? 0);

    const matched = sqliteCount.count === neonCount;

    console.log(
      `${matched ? "✓" : "!"} ${tableName}: SQLite=${sqliteCount.count}, Neon=${neonCount}`
    );
  }
}

async function main() {
  console.log("SQLite → Neon データ移行を開始します");
  console.log(`SQLite: ${SQLITE_PATH}\n`);

  for (const tableName of TABLE_ORDER) {
    await migrateTable(tableName);
  }

  await showCounts();

  console.log("\nデータ移行が完了しました");
}

main()
  .catch((error) => {
    console.error("\nデータ移行に失敗しました");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
