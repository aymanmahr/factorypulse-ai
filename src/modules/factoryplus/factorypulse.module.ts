import { Module } from '@nitrostack/core';
import { FactoryPulseTools } from './factorypulse.tools.js';
import { FactoryPulseResources } from './factorypulse.resources.js';

@Module({
    name: 'factorypulse',
    description: 'Industry 4.0 predictive maintenance platform',
    controllers: [
        FactoryPulseTools,
        FactoryPulseResources
    ]
})
export class FactoryPulseModule {}
