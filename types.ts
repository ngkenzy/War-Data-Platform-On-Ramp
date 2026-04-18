export type DataFlowDirection = 'Sending' | 'Receiving' | 'Both';
export type DeliveryMethod = 'S3' | 'API' | 'SFG' | 'Other';
export type Network = 'NIPR' | 'SIPR' | 'JWICS';
export type SensitivityType = 'PII' | 'PHI' | 'CUI' | 'PAI' | 'CAI' | 'None';

export type ExtractionStatus = 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';

export interface ExtractedField<T> {
  value: T;
  status: ExtractionStatus;
  source?: string;
}

export interface InterviewData {
  // Group 1: Entity Identity
  dataOwner?: ExtractedField<string>;
  parentAgency?: ExtractedField<string>;
  sourceSystemName?: ExtractedField<string>;
  sourceSystemAcronym?: ExtractedField<string>;
  businessUseCase?: ExtractedField<string>;

  // Group 2: Data Flow
  flowDirection?: ExtractedField<DataFlowDirection>;
  deliveryMethod?: ExtractedField<DeliveryMethod>;
  frequency?: ExtractedField<string>;

  // Group 3: Sensitivity & Security
  sensitivityTypes?: ExtractedField<SensitivityType[]>;
  isFinanciallySignificant?: ExtractedField<boolean>; // CFO Act
  network?: ExtractedField<Network>;

  // Group 4: Identifiers & POCs
  eMassId?: ExtractedField<string>;
  ditprId?: ExtractedField<string>;
  dataStewardName?: ExtractedField<string>;
  dataStewardEmail?: ExtractedField<string>;
  issmName?: ExtractedField<string>;
  issmEmail?: ExtractedField<string>;
  engineers?: ExtractedField<{ name: string; email: string }[]>;

  // Hard Blocker
  hasDataDictionary?: ExtractedField<boolean>;
  
  // Security
  hasAtoAtd?: ExtractedField<boolean>;
}

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Risk {
  severity: RiskSeverity;
  message: string;
}

export interface ReadinessReport {
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  blockers: string[]; // High severity risks
  risks: Risk[]; // Medium/Low severity
  recommendedPath: string;
  pathJustification: string;
  prioritizedActions: string[];
  finalRecommendation: 'READY TO SUBMIT' | 'HOLD – NEEDS WORK' | 'HIGH RISK – ESCALATE';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
