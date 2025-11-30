import type { start } from "elastic-apm-node";

type AgentConfigOptions = Parameters<typeof start>[0];

export interface ApmOptionsInterface extends AgentConfigOptions {
  captureErrorCodes?: "5xx" | "(4|5)xx";
  skipExceptions?: any[];
  codes?: string;
}
