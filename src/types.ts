export type Project = {
  uid: string;
  organizationUid: string;
  name: string;
  description: string;
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
  lyticsAudiences?: string[]
};

export type ABTestVariant = {
  name: string;
  __type: 'ABTestVariant';
  trafficDistribution: number;
};

export type Variant = {
  name: string;
};

export type Metric = {
  __type: 'Primary';
  name: string;
  event: string;
};
