import {
  ResourceDecorator as Resource,
  Injectable
} from '@nitrostack/core';

@Injectable()
export class FactoryPulseResources {

  @Resource({
    uri: 'factory://machine-data',
    name: 'Machine Dataset',
    description: 'AI4I 2020 predictive maintenance dataset',
    mimeType: 'application/json'
  })
  async machineData() {
    return {
      dataset: 'ai4i2020.csv',
      status: 'loaded',
      purpose: 'Machine telemetry and failure prediction'
    };
  }

  @Resource({
    uri: 'factory://inventory',
    name: 'Inventory Database',
    description: 'Available spare parts inventory',
    mimeType: 'application/json'
  })
  async inventory() {
    return {
      dataset: 'inventory.json',
      status: 'loaded',
      purpose: 'Spare parts availability'
    };
  }

  @Resource({
    uri: 'factory://technicians',
    name: 'Technician Directory',
    description: 'Available technicians and specializations',
    mimeType: 'application/json'
  })
  async technicians() {
    return {
      dataset: 'technicians.json',
      status: 'loaded',
      purpose: 'Technician assignment'
    };
  }

  @Resource({
    uri: 'factory://maintenance-history',
    name: 'Maintenance History',
    description: 'Historical machine maintenance records',
    mimeType: 'application/json'
  })
  async maintenanceHistory() {
    return {
      dataset: 'maintenance_history.json',
      status: 'loaded',
      purpose: 'Previous repairs and failures'
    };
  }
}
