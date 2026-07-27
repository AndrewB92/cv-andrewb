import { Db, MongoClient } from "mongodb";

const DEFAULT_DATABASE_NAME = "cv-andrewb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to .env.local or your deployment environment.",
    );
  }

  return uri;
}

function getClientPromise(): Promise<MongoClient> {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const client = new MongoClient(getMongoUri(), {
    monitorCommands: false,
  });

  global._mongoClientPromise = client.connect().catch((error) => {
    global._mongoClientPromise = undefined;

    console.error("Failed to initialize MongoDB client", error);

    throw error;
  });

  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  const databaseName =
    process.env.MONGODB_DB?.trim() || DEFAULT_DATABASE_NAME;

  return client.db(databaseName);
}