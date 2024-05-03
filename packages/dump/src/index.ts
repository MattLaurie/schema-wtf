import '@dotenv-run/load';

import type { RowDataPacket } from 'mysql2/promise';
import mysql from 'mysql2/promise';

import { env } from './env';

type RawTableType = 'BASE TABLE' | 'VIEW' | 'UNKNOWN';

const isRawTableType = (value: string): value is RawTableType => {
  switch (value) {
    case 'BASE TABLE':
    case 'VIEW':
      return true;
  }
  return false;
};

interface RawTable {
  table_schema: string;
  table_name: string;
  table_type: RawTableType;
}

interface RawConstraint {
  constraint_name: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string | null;
  target_table: string | null;
  target_column: string | null;
  extra: string;
  column_key: string;
}

interface RawColumn {
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: string;
  is_nullable: boolean;
  data_type: string;
  column_type: string;
}

const pool = mysql.createPool({
  host: env.DATABASE_HOST,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  port: env.DATABASE_PORT,
});

const listTables = async (table_schema: string): Promise<RawTable[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
        T.TABLE_NAME AS table_name, 
        T.TABLE_SCHEMA AS table_schema,
        T.TABLE_TYPE AS table_type
     FROM
        INFORMATION_SCHEMA.TABLES AS T
     WHERE
        T.TABLE_SCHEMA = '${table_schema}'`,
  );
  const mapper = (result: RowDataPacket) => ({
    table_name: result.table_name as string,
    table_schema: result.table_schema as string,
    table_type: isRawTableType(result.table_type) ? result.table_type : 'UNKNOWN',
  });
  return rows.map(mapper);
};

const listConstraints = async (table_schema: string, table_name: string): Promise<RawConstraint[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
        K.CONSTRAINT_NAME AS constraint_name,
        K.CONSTRAINT_SCHEMA AS source_schema,
        K.TABLE_NAME AS source_table,
        K.COLUMN_NAME AS source_column,
        K.REFERENCED_TABLE_SCHEMA AS target_schema,
        K.REFERENCED_TABLE_NAME AS target_table,
        K.REFERENCED_COLUMN_NAME AS target_column,
        C.EXTRA AS extra,
        C.COLUMN_KEY AS column_key
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS K
            LEFT JOIN
        INFORMATION_SCHEMA.COLUMNS AS C ON C.TABLE_NAME = K.TABLE_NAME
            AND C.COLUMN_NAME = K.COLUMN_NAME
            AND C.TABLE_SCHEMA = K.CONSTRAINT_SCHEMA
    WHERE
        C.TABLE_SCHEMA = '${table_schema}'
    AND K.TABLE_NAME = '${table_name}'`,
  );
  const mapper = (result: RowDataPacket) => ({
    constraint_name: result.constraint_name as string,
    source_schema: result.source_schema as string,
    source_table: result.source_table as string,
    source_column: result.source_column as string,
    target_schema: result.target_schema ? (result.target_schema as string) : null, // TODO do better than this
    target_table: result.target_table ? (result.target_table as string) : null,
    target_column: result.target_column ? (result.target_column as string) : null,
    extra: result.extra as string,
    column_key: result.column_key as string,
  });
  return rows.map(mapper);
};

const listColumns = async (table_schema: string, table_name: string): Promise<RawColumn[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
        T.TABLE_NAME AS table_name, 
        T.TABLE_SCHEMA AS table_schema,
        T.TABLE_TYPE AS table_type,
        C.COLUMN_NAME AS column_name,
        C.ORDINAL_POSITION AS ordinal_position,
        C.COLUMN_DEFAULT AS column_default,
        C.IS_NULLABLE AS is_nullable,
        C.DATA_TYPE AS data_type,
        C.COLUMN_TYPE AS column_type
    FROM
        INFORMATION_SCHEMA.TABLES AS T
        INNER JOIN INFORMATION_SCHEMA.COLUMNS AS C ON C.TABLE_NAME = T.TABLE_NAME
    WHERE
        T.TABLE_SCHEMA = '${table_schema}'
        AND T.TABLE_NAME = '${table_name}';`,
  );
  const mapper = (result: RowDataPacket) => ({
    table_name: result.table_name as string,
    table_schema: result.table_schema as string,
    column_name: result.column_name as string,
    ordinal_position: Number(result.ordinal_position),
    column_default: result.column_default as string,
    is_nullable: Boolean(result.is_nullable),
    data_type: result.data_type as string,
    column_type: result.column_type as string,
  });
  return rows.map(mapper);
};

const isEmpty = (value: string) => value?.trim().length === 0;

const isForeignKey = (c: RawConstraint) => c.source_column != null && c.target_column != null;
const isUnique = (c: RawConstraint, constraints: RawConstraint[]) => {
  return constraints.some((v) => v.constraint_name === c.constraint_name && v.column_key === 'UNI');
};
const isPrimaryKey = (c: RawConstraint) => {
  return c.constraint_name === 'PRIMARY';
};
const isAutoIncrement = (c: RawConstraint) => {
  return c.extra === 'auto_increment';
};

async function dump() {
  try {
    const output: string[] = [];
    output.push('@startuml', '', 'skinparam linetype ortho', '');

    const tables = await listTables(env.DATABASE_NAME);

    const entities: string[] = [];
    const relations: string[] = [];

    for (const table of tables) {
      const columns = await listColumns(table.table_schema, table.table_name);
      entities.push(
          [
            `entity ${table.table_name} {`,
            ...columns.map((c) => `  ${c.column_name} : ${c.column_type}`),
            '}'
          ].join('\n')
      )
      const constraints = await listConstraints(table.table_schema, table.table_name);
      for (const c of constraints) {
        if (isForeignKey(c)) {
          relations.push(`${c.source_table} ||--|| ${c.target_table}`)
        }
      }
    }
    output.push(...entities);
    output.push(...relations);
    output.push('@enduml');

    console.log(output.join('\n'));
  } catch (error) {
    console.log(error);
  }
}

(async () => {
  await dump();
})().then(() => process.exit());
