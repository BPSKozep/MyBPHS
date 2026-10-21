// ts-migrate-mongoose config (`pnpm migrate <command>`). It loads `.env` itself.
export default {
  uri: process.env.MONGODB_URI,
  collection: "migrations",
  migrationsPath: "./migrations",
  autosync: true,
  connectOptions: {
    dbName: process.env.MONGODB_DATABASE,
  },
};
