type Env = "dev" | "prod";

export const isDev = () => isEnv("dev");
export const isProd = () => isEnv("prod");

const isEnv = (env: Env) => process.env.ENV === env;
