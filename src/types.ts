export type CouncilMode = 'NORMAL' | 'ADVANCED';

export type ModelOptionId = 
  | 'gemini-3.6-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-1.5-pro'
  | 'claude-3.5-sonnet'
  | 'claude-3-opus'
  | 'claude-3.5-haiku'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'deepseek-r1'
  | 'llama-3.3-70b'
  | 'mistral-large'
  | 'custom';

export interface ModelOption {
  id: ModelOptionId;
  name: string;
  provider: string;
  description: string;
  badge: string;
}

export type VoteType = 'AGREE' | 'DISAGREE' | 'AMEND' | 'VETO';

export type NodeState = 'STANDBY' | 'DELIBERATING' | 'OK' | 'COMPROMISED';

export interface SubAspect {
  label: string;
  assessment: string;
  status: 'OK' | 'CONCERN' | 'CRITICAL';
}

export interface SelfVerification {
  consistent: boolean;
  flaggedIssue?: string;
}

export interface CouncilNodeConfig {
  id: 'node1' | 'node2' | 'node3';
  codeName: string; // e.g. "MELCHIOR-1", "BALTHASAR-2", "CASPER-3"
  archetype: string; // e.g. "Logical Scientist", "Protective Mother", "Pragmatic Woman"
  modelId: ModelOptionId;
  customSystemPrompt?: string;
  temperature: number;
  colorHex: string; // e.g. "#FF9900" (Amber), "#00FF66" (Green), "#00E5FF" (Cyan)
  accentBg: string;
}

export interface SpeechTurn {
  id: string;
  round: number;
  nodeId: 'node1' | 'node2' | 'node3';
  codeName: string;
  modelUsed: string;
  statement: string;
  reasoning: string;
  vote: VoteType;
  proposedResolution?: string;
  subAspects?: SubAspect[];
  selfVerification?: SelfVerification;
  nodeState?: NodeState;
  vetoReason?: string;
  timestamp: string;
}

export interface FinalVerdict {
  summary: string;
  consensusPoints: string[];
  dissentingViews?: string[];
  unanimous: boolean;
  finalScore: string; // e.g., "3-0 UNANIMOUS" or "2-1 MAJORITY"
  timestamp: string;
}

export interface DeliberationSession {
  id: string;
  topic: string;
  status: 'IDLE' | 'DELIBERATING' | 'CONSENSUS_REACHED' | 'SPLIT_DECISION' | 'MANUAL_OVERRIDE' | 'ERROR';
  currentRound: number;
  maxRounds: number;
  turns: SpeechTurn[];
  finalVerdict?: FinalVerdict;
  createdAt: string;
}

export interface DeliberationRequest {
  topic: string;
  context?: string;
  mode?: CouncilMode;
  nodes: CouncilNodeConfig[];
  currentTurns?: SpeechTurn[];
  round: number;
  maxRounds?: number;
}
