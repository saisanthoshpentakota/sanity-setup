export type Project = {
  uid: string;
  organizationUid: string;
  name: string;
  description: string;
  connectedStackApiKey?: string;
  _existed: boolean;
};

export type Stack = {
  api_key: string;
  name: string;
  description: string;
  org_uid: string;
  _existed: boolean;
};

export type Event = {
  uid: string;
  key: string;
  description: string;
  project: string;
};

export type Attribute = {
  uid: string;
  key: string;
  name: string;
  description: string;
  project: string;
};

export type Audience = {
  uid: string;
  name: string;
  description: string;
  project: string;
  slug?: string;
  source: string
};

export type Experience = {
  uid: string;
  name: string;
  shortUid: string;
  description: string;
  project: string;
};

export type ExperienceVersion = {
  uid: string;
  experienceUid: string;
  variants: Variant[];
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
};

export type SegmentedVariant = {
  __type: 'SegmentedVariant';
  name: string;
  audiences: string[];
  audienceCombinationType: 'AND' | 'OR';
  lyticsAudiences?: string[];
  target?: RuleCombination;
};

export type ABTestVariant = {
  name: string;
  __type: 'ABTestVariant';
  trafficDistribution: number;
};

// Inline (v2) targeting for an A/B test experience version lives at the
// version level (sibling to `variants`), not on an individual variant.
export type Targeting = {
  target: RuleCombination;
};

// Inline (v2) targeting rules, as used both for standalone Audience definitions
// and for a variant's inline `target` / `Targeting.target`.
export type PresetAttributeReference = {
  __type: 'PresetAttributeReference';
  ref: string;
};

export type CustomAttributeReference = {
  __type: 'CustomAttributeReference';
  ref: string;
};

export type LyticsAttributeReference = {
  __type: 'LyticsAttributeReference';
  ref: 'LYTICS_AUDIENCE' | 'LYTICS_FLOW_STATE';
};

export type AttributeReference =
  | PresetAttributeReference
  | CustomAttributeReference
  | LyticsAttributeReference;

export type StringMatchOptions = {
  __type: 'StringMatchOptions';
  value: string;
};

export type NumberMatchOptions = {
  __type: 'NumberMatchOptions';
  value: number;
};

export type AudienceMatchOptions = {
  __type: 'AudienceMatchOptions';
  value: string;
};

export type FlowStateMatchOptions = {
  __type: 'FlowStateMatchOptions';
  flowId: string;
  flowState: string;
};

export type AttributeMatchOptions =
  | StringMatchOptions
  | NumberMatchOptions
  | AudienceMatchOptions
  | FlowStateMatchOptions;

export type AttributeMatchCondition =
  | 'STRING_EQUALS'
  | 'NUMBER_GREATER_THAN'
  | 'NUMBER_LESS_THAN'
  | 'IS_MEMBER_OF'
  | 'IS_IN_FLOW_STATE';

export type Rule = {
  __type: 'Rule';
  attribute: AttributeReference;
  attributeMatchCondition: AttributeMatchCondition;
  attributeMatchOptions: AttributeMatchOptions;
  invertCondition: boolean;
};

export type RuleCombination = {
  __type: 'RuleCombination';
  combinationType: 'AND' | 'OR';
  rules: Rule[];
};

export type Variant = {
  name: string;
};

export type Metric = {
  __type: 'Primary';
  name: string;
  event: string;
};

// Lytics API gateway (<app-host>/lytics-api/api-gateway/v2)
// response shapes - only the fields this repo actually reads.
export type LyticsSegment = {
  id: string;
  name: string;
  slug_name: string;
  kind: string;
};

export type LyticsFlow = {
  id: string;
  label: string;
};
