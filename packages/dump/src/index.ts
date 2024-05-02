import "@dotenv-run/load";
import mysql, {type RowDataPacket} from "mysql2/promise";

import {env} from "./env";

interface RawTable {
    table_schema: string;
    table_name: string;
}

interface RawForeignKey {
    constraint_name: string;
    source_schema: string;
    source_table: string;
    source_column: string;
    target_schema: string;
    target_table: string;
    target_column: string;
    extra: string;
    column_key: string;
}

const isPrimaryKey = (key: RawForeignKey) => key?.constraint_name === 'PRIMARY';
const isAutoIncrement = (key: RawForeignKey) => key?.extra === 'auto_increment';
const isUniqueKey = (key: RawForeignKey) => key?.column_key === 'UNI';

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
            T.TABLE_SCHEMA AS table_schema
         FROM
            INFORMATION_SCHEMA.TABLES AS T
         WHERE
            T.TABLE_SCHEMA = '${table_schema}'
        `
    );
    const mapper = (result: RowDataPacket) => ({
        table_name: result.table_name as string,
        table_schema: result.table_schema as string,
    });
    return rows.map(mapper);
}

const listForeignKeys = async (table_schema: string, table_name: string): Promise<RawForeignKey[]> => {
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
        AND K.TABLE_NAME = '${table_name}'
        `
    );
    const mapper = (result: RowDataPacket) => ({
        constraint_name: result.constraint_name as string,
        source_schema: result.source_schema as string,
        source_table: result.source_table as string,
        source_column: result.source_column as string,
        target_schema: result.target_schema as string,
        target_table: result.target_table as string,
        target_column: result.target_column as string,
        extra: result.extra as string,
        column_key: result.column_key as string,
    })
    return rows.map(mapper)
}

const IGNORE_TABLES = [
    'SequelizeMeta'
];

const isIgnoredTable = (table: RawTable) => IGNORE_TABLES.indexOf(table.table_name) !== -1;

async function dump() {
    try {
        const tables = await listTables(env.DATABASE_NAME);

        const entities: string[] = [];
        const relations: string[] = [];

        for (const table of tables) {
            if (isIgnoredTable(table)) {
                continue;
            }
            const foreignKeys = await listForeignKeys(table.table_schema, table.table_name);

            entities.push(
                [
                    `entity ${table.table_name} {`,
                    ...foreignKeys.map((key) => `  * ${key.source_column}`),
                    `}`
                ].join('\n')
            )
            for (const key of foreignKeys) {
                if (!isPrimaryKey(key) && !isUniqueKey(key)) {
                    relations.push(`${key.source_table} ||--|| ${key.target_table}`);
                }
            }
        }

        console.log(
            [
                '@startuml',
                '\' hide the spot',
                '\' hide circle',
                '',
                '\' avoid problems with angled crows feet',
                'skinparam linetype ortho',
                ''
            ].join('\n')
        )
        entities.forEach((str) => console.log(str));
        relations.forEach((str) => console.log(str));

        console.log('@enduml')
    } catch (error) {
        console.log(error);
    }
}

(async () => {
    await dump();
})().then(() => process.exit());
