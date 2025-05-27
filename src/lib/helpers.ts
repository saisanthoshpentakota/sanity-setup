export const TallUsCitizen = (attributeUid: string) => {
  return {
    name: 'Tall US Citizen',
    description: 'defines US citizens taller than 6 feet',
    definition: {
      __type: 'RuleCombination',
      combinationType: 'OR',
      rules: [
        {
          __type: 'Rule',
          attribute: {
            __type: 'PresetAttributeReference',
            ref: 'COUNTRY',
          },
          attributeMatchCondition: 'STRING_EQUALS',
          attributeMatchOptions: {
            __type: 'StringMatchOptions',
            value: 'US',
          },
          invertCondition: false,
        },
        {
          __type: 'Rule',
          attribute: {
            __type: 'CustomAttributeReference',
            ref: attributeUid,
          },
          attributeMatchCondition: 'NUMBER_GREATER_THAN',
          attributeMatchOptions: {
            __type: 'NumberMatchOptions',
            value: 6,
          },
          invertCondition: false,
        },
      ],
    },
  };
};

export const ShortUsCitizen = (attributeUid: string) => {
  return {
    name: 'Short US Citizen',
    description: 'defines US citizens shorter than 6 feet',
    definition: {
      __type: 'RuleCombination',
      combinationType: 'AND',
      rules: [
        {
          __type: 'Rule',
          attribute: {
            __type: 'PresetAttributeReference',
            ref: 'COUNTRY',
          },
          attributeMatchCondition: 'STRING_EQUALS',
          attributeMatchOptions: {
            __type: 'StringMatchOptions',
            value: 'US',
          },
          invertCondition: false,
        },
        {
          __type: 'Rule',
          attribute: {
            __type: 'CustomAttributeReference',
            ref: attributeUid,
          },
          attributeMatchCondition: 'NUMBER_LESS_THAN',
          attributeMatchOptions: {
            __type: 'NumberMatchOptions',
            value: 6,
          },
          invertCondition: false,
        },
      ],
    },
  };
};
