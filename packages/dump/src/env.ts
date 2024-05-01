import {createEnv} from "@t3-oss/env-core";
import {z} from "zod";

export const env = createEnv({
    server: {
        DATABASE_HOST: z.string(),
        DATABASE_NAME: z.string(),
        DATABASE_USERNAME: z.string(),
        DATABASE_PASSWORD: z.string(),
        DATABASE_PORT: z.coerce.number()
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
