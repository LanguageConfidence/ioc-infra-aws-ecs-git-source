import * as path from 'path';
import * as dotenv from "dotenv";

// Parsing the env file.
const env_path = path.resolve(".env")
dotenv.config({ path: env_path });

interface ENV {
  GHOWNER: string | undefined;
  GHREPO: string | undefined;
  GHBRANCH: string | undefined;
  APPNAME: string | undefined;
}

interface Config {
  GHBRANCH: string;
  GHOWNER: string;
  GHREPO: string;
  APPNAME: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    GHOWNER: process.env.GHOWNER,
    GHREPO: process.env.GHREPO,
    GHBRANCH: process.env.GHBRANCH,
    APPNAME: process.env.APPNAME,
  };
};

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in ${env_path}`);
    }
  }
  return config as Config;
};

const config = getConfig();

const envConfig = getSanitzedConfig(config);

export default envConfig;
