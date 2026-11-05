export type Direction = 'L' | 'R';

export type SimulationStatus = 'accepted' | 'rejected' | 'step_limit';

/** A single-tape transition, represented without YAML-specific array fields. */
export interface Transition {
  currentState: string;
  readSymbol: string;
  writeSymbol: string;
  direction: Direction;
  nextState: string;
}

/** Normalized machine definition shared by parser, simulator, and CLI. */
export interface MachineConfig {
  states: string[];
  inputAlphabet: string[];
  tapeAlphabet: string[];
  blankSymbol: string;
  initialState: string;
  acceptStates: string[];
  transitions: Transition[];
  /** Optional examples supplied in the YAML configuration. */
  inputStrings?: string[];
}

/** Snapshot taken before or after a simulation step. */
export interface InstantaneousDescription {
  state: string;
  tape: string[];
  headPosition: number;
  step: number;
}

export interface SimulationResult {
  status: SimulationStatus;
  history: InstantaneousDescription[];
  finalState: string;
  finalTape: string[];
  finalHeadPosition: number;
  steps: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/** Shared simulation options; maxSteps defaults will be decided by the core. */
export interface SimulationOptions {
  maxSteps?: number;
}
