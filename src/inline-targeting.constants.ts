// ECL-2252: shared between setup-inline-targeting-project (creates the
// standing project) and setup-inline-targeting-fixtures (populates its data).
export const PROJECT_NAME = 'e2e-sanity-inline-targeting';

// Standing Lytics flow (see LyticsGatewayService) used for the
// LYTICS_FLOW_STATE inline targeting rule. Named by constant, not env var,
// so the script only needs to know its human-readable identity - its actual
// flow id/state slug are looked up live from Lytics.
export const LYTICS_FLOW_NAME = 'Sanity Flow';
export const LYTICS_FLOW_STATE = 'wait_personalize_step';
