import { DataSource, DataSourceOptions } from "typeorm";
import { GlobalSettings } from "./globalSettings";

const dataStoreOptions:DataSourceOptions={
    type:"postgres",
    url:GlobalSettings.database.url,
    synchronize :false,
    logging: false,
    entities:[__dirname + '/entity/**/*.entity.{js,ts}'],
    migrations: [__dirname+ '/migrations/**/*.{js,ts}'],
    extra: {
      connectionLimit:25,
      connectTimeout: 60000, 
    }
}
export const AppDataSource = new DataSource(dataStoreOptions)