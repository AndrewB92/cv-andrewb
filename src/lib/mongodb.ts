import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing. Set it in your environment to load portfolio data.",
  );
}

const dbName = process.env.MONGODB_DB ?? "cv-andrewb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, {
  monitorCommands: false,
});

const clientPromise =
  global._mongoClientPromise ?? client.connect().catch((error) => {
    console.error("Failed to initialize MongoDB client", error);
    throw error;
  });

global._mongoClientPromise = clientPromise;

export async function getDatabase(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
