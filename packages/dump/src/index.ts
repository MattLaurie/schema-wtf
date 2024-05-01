import "@dotenv-run/load";
import mysql from "mysql2/promise";

import {env} from "./env";

type Table = {
    table_schema: string;
    table_name: string;
}

type ForeignKeys = {
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

const pool = mysql.createPool({
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    port: env.DATABASE_PORT,
});

const listTables = async (table_schema: string): Promise<Table[]> => {
    const [rows, fields] = await pool.query<mysql.RowDataPacket[]>(
        `SELECT 
            T.TABLE_NAME AS table_name, T.TABLE_SCHEMA AS table_schema
         FROM
            INFORMATION_SCHEMA.TABLES AS T
         WHERE
            T.TABLE_SCHEMA = '${table_schema}'`
    );
    return rows.map((result) => ({
        table_name: result['table_name'],
        table_schema: result['table_schema'],
    }))
}

const listForeignKeys = async (table_schema: string, table_name: string): Promise<ForeignKeys[]> => {
    const [rows, fields] = await pool.query<mysql.RowDataPacket[]>(
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
            K.TABLE_NAME = '${table_name}'
        AND C.TABLE_SCHEMA = '${table_schema}';`
    );
    return rows.map((result) => ({
        constraint_name: result['constraint_name'],
        source_schema: result['source_schema'],
        source_table: result['source_table'],
        source_column: result['source_column'],
        target_schema: result['target_schema'],
        target_table: result['target_table'],
        target_column: result['target_column'],
        extra: result['extra'],
        column_key: result['column_key'],
    }))
}

try {
    const tables = await listTables(env.DATABASE_NAME);
    for (const table of tables) {
        console.log(`Table: ${table.table_schema}.${table.table_name}`);
        const foreignKeys = await listForeignKeys(table.table_schema, table.table_name);
        console.log(`- ForeignKeys`, foreignKeys);
    }
} catch (error) {
    console.log(error);
}
