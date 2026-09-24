import {
  ABTestVariant,
  AttributeMatchCondition,
  Rule,
  RuleCombination,
  SegmentedVariant,
  Targeting,
} from './types';

export class VariantManager {
  constructor() {}

  createSegmentedVariant(
    name: string,
    audienceCombinationType: SegmentedVariant['audienceCombinationType'],
    audiences: SegmentedVariant['audiences'],
    lyticsAudiences?: string[]
  ): SegmentedVariant {
    return {
      name,
      __type: 'SegmentedVariant',
      audienceCombinationType,
      audiences,
      lyticsAudiences,
    };
  }

  createABTestVariant(name: string, trafficDistribution: number): ABTestVariant {
    return {
      name,
      __type: 'ABTestVariant',
      trafficDistribution,
    };
  }

  // Inline (v2) targeting: a Segmented variant carries its rules directly on `target`.
  createInlineTargetSegmentedVariant(name: string, target: RuleCombination): SegmentedVariant {
    return {
      name,
      __type: 'SegmentedVariant',
      audienceCombinationType: target.combinationType,
      audiences: [],
      target,
    };
  }

  // Inline (v2) targeting: for an A/B test, rules live at the experience
  // version level (see `targeting()`) rather than on the variant itself.
  createInlineTargetABTestVariant(name: string, trafficDistribution: number): ABTestVariant {
    return {
      name,
      __type: 'ABTestVariant',
      trafficDistribution,
    };
  }

  targeting(target: RuleCombination): Targeting {
    return { target };
  }

  presetAttributeRule(
    ref: string,
    condition: AttributeMatchCondition,
    value: string,
    invertCondition = false
  ): Rule {
    return {
      __type: 'Rule',
      attribute: { __type: 'PresetAttributeReference', ref },
      attributeMatchCondition: condition,
      attributeMatchOptions: { __type: 'StringMatchOptions', value },
      invertCondition,
    };
  }

  customAttributeRule(
    attributeUid: string,
    condition: AttributeMatchCondition,
    value: number,
    invertCondition = false
  ): Rule {
    return {
      __type: 'Rule',
      attribute: { __type: 'CustomAttributeReference', ref: attributeUid },
      attributeMatchCondition: condition,
      attributeMatchOptions: { __type: 'NumberMatchOptions', value },
      invertCondition,
    };
  }

  lyticsAudienceRule(audienceUid: string, invertCondition = false): Rule {
    return {
      __type: 'Rule',
      attribute: { __type: 'LyticsAttributeReference', ref: 'LYTICS_AUDIENCE' },
      attributeMatchCondition: 'IS_MEMBER_OF',
      attributeMatchOptions: { __type: 'AudienceMatchOptions', value: audienceUid },
      invertCondition,
    };
  }

  lyticsFlowStateRule(flowId: string, flowState: string, invertCondition = false): Rule {
    return {
      __type: 'Rule',
      attribute: { __type: 'LyticsAttributeReference', ref: 'LYTICS_FLOW_STATE' },
      attributeMatchCondition: 'IS_IN_FLOW_STATE',
      attributeMatchOptions: { __type: 'FlowStateMatchOptions', flowId, flowState },
      invertCondition,
    };
  }

  ruleCombination(combinationType: RuleCombination['combinationType'], rules: Rule[]): RuleCombination {
    return {
      __type: 'RuleCombination',
      combinationType,
      rules,
    };
  }
}
