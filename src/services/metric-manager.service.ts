import { Metric } from '../types';

export class MetricManager {
  constructor() { }

  createMetric(name: string, event: string): Metric {
    return {
      name,
      __type: 'Primary',
      event,
    };
  }
}
