import { PrismaClient } from "./generated/client";

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: "ap-northeast-1",
});
const secret_name = process.env.DATA_BASE_SECRET_NAME;

let secret: Record<string, string>;

try {
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );
  secret = JSON.parse(response.SecretString ?? "");
} catch (error) {
  // For a list of exceptions thrown, see
  // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  console.warn(
    "The secret is not found. Use default database URL",
    process.env.DATABASE_HOST,
    process.env.DATABASE_PORT,
    process.env.DATABASE_NAME,
    process.env.DATABASE_SCHEMA,
    error
  );
}

let prisma: PrismaClient;

/**
 * Initializes and returns a PrismaClient instance configured with credentials
 * fetched from AWS Secrets Manager.
 * @returns {Promise<PrismaClient>} A promise that resolves to the PrismaClient instance.
 */
async function getPrismaClient(): Promise<PrismaClient> {
  if (prisma) {
    return prisma;
  }

  try {
    const databaseName = process.env.DATABASE_NAME ?? "";
    const databaseHost = process.env.DATABASE_HOST ?? "";
    const databasePort = process.env.DATABASE_PORT ?? "";
    const databaseSchema = process.env.DATABASE_SCHEMA ?? "public";
    if (secret) {
      // Ensure these keys match what's stored in your Secrets Manager secret
      const { username, password } = secret;

      if (!username || !password) {
        throw new Error("Database credentials missing from secret");
      }

      const encodedUsername = encodeURIComponent(username);
      const encodedPassword = encodeURIComponent(password);
      const databaseUrl = `postgresql://${encodedUsername}:${encodedPassword}@${databaseHost}:${databasePort}/${databaseName}?schema=${databaseSchema}`;

      prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });
      console.log(
        "PrismaClient initialized with credentials from Secrets Manager."
      );
      return prisma;
    } else {
      const encodedUsername = encodeURIComponent(
        process.env.DATABASE_USER ?? ""
      );
      const encodedPassword = encodeURIComponent(
        process.env.DATABASE_PASSWORD ?? ""
      );
      const databaseUrl = `postgresql://${encodedUsername}:${encodedPassword}@${databaseHost}:${databasePort}/${databaseName}?schema=${databaseSchema}`;
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });
      console.warn("PrismaClient initialized with default database URL.");
      return prisma;
    }
  } catch (error) {
    console.error(
      "Failed to fetch secret from AWS Secrets Manager or initialize Prisma Client:",
      error
    );
    throw error;
  }
}

export default await getPrismaClient();

export type { PrismaClient };
