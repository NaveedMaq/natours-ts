import dotenv from 'dotenv';
dotenv.config({ path: `./config.env` });

function getEnvironmentVariable(variableName: string): string {
  const value = process.env[variableName];
  if (!value) throw new Error(`Environment variable ${variableName} not found`);
  return value;
}

const NODE_ENV = getEnvironmentVariable('NODE_ENV');
const PORT = getEnvironmentVariable('PORT');
const DATABASE = getEnvironmentVariable('DATABASE');
const DATABASE_PASSWORD = getEnvironmentVariable('DATABASE_PASSWORD');
const JWT_SECRET = getEnvironmentVariable('JWT_SECRET');
const JWT_EXPIRES_IN = getEnvironmentVariable('JWT_EXPIRES_IN');

export const env = { NODE_ENV, PORT, DATABASE, DATABASE_PASSWORD, JWT_SECRET, JWT_EXPIRES_IN };
