import {
  ABTestVariant,
  SegmentedVariant,
} from './types';

export class VariantManager {
  constructor() {}

  createSegmentedVariant(
    name: string,
    audienceCombinationType: SegmentedVariant['audienceCombinationType'],
    audiences: SegmentedVariant['audiences']
  ): SegmentedVariant {
    return {
      name,
      __type: 'SegmentedVariant',
      audienceCombinationType,
      audiences,
    };
  }

  createABTestVariant(name: string, trafficDistribution: number): ABTestVariant {
    return {
      name,
      __type: 'ABTestVariant',
      trafficDistribution,
    };
  }
}
