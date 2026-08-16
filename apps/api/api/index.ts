/**
 * Entrypoint Vercel Serverless Function.
 * Reexporta o Express app já configurado em src/ — sem listen().
 */
import app from "../src/index.js";

export default app;
