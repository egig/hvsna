export type InputMode = "toggle" | "add" | "set";

export interface EvaluationConfig {
  id: string;
  name: string;
  condition: string;
  target?: string;
}
