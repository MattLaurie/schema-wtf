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
            T.TABLE_SCHEMA = '${table_schema}';`
    );
    return rows.map((result) => ({
        table_name: result['table_name'],
        table_schema: result['table_schema'],
    }))
}

try {
    const tables = await listTables(env.DATABASE_NAME);
    console.log(tables);
} catch (error) {
    console.log(error);
}
