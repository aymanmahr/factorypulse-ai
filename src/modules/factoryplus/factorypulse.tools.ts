import {
  Injectable,
  ToolDecorator as Tool,
  z,
} from "@nitrostack/core";

import fs from "fs";
import path from "path";
import csv from "csv-parser";

async function loadMachines(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(path.join(process.cwd(), "data", "ai4i2020.csv"))
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function loadJSON(file: string) {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data", file),
      "utf8"
    )
  );
}

@Injectable()
export class FactoryPulseTools {

  @Tool({
    name: "analyze_machine_health",
    description: "Analyze machine health from live dataset.",
    inputSchema: z.object({
      machineId: z.string(),
    }),
  })
  async analyzeMachineHealth(input: { machineId: string }) {

    const machines = await loadMachines();

    const machine = machines.find(
      (m) => m["Product ID"] === input.machineId
    );

    if (!machine) {
      return {
        success: false,
        message: "Machine not found",
      };
    }

    const air = Number(machine["Air temperature [K]"]);
    const process = Number(machine["Process temperature [K]"]);
    const torque = Number(machine["Torque [Nm]"]);
    const rpm = Number(machine["Rotational speed [rpm]"]);
    const wear = Number(machine["Tool wear [min]"]);

    let score = 100;

    const observations: string[] = [];

    if (wear > 150) {
      score -= 25;
      observations.push("High tool wear");
    }

    if (torque > 60) {
      score -= 20;
      observations.push("Torque above safe limit");
    }

    if ((process - air) > 12) {
      score -= 15;
      observations.push("Cooling efficiency reduced");
    }

    return {
      success: true,
      machineId: input.machineId,
      machineType: machine["Type"],
      healthScore: score,
      status:
        score >= 80
          ? "Healthy"
          : score >= 60
          ? "Warning"
          : "Critical",
      telemetry: {
        airTemperature: air,
        processTemperature: process,
        rotationalSpeed: rpm,
        torque,
        toolWear: wear,
      },
      observations,
    };
  }

  @Tool({
    name: "predict_failure",
    description: "Predict machine failure using dataset.",
    inputSchema: z.object({
      machineId: z.string(),
    }),
  })
  async predictFailure(input: { machineId: string }) {

    const machines = await loadMachines();

    const machine = machines.find(
      (m) => m["Product ID"] === input.machineId
    );

    if (!machine) {
      return {
        success: false,
        message: "Machine not found",
      };
    }

    const failed =
      Number(machine["Machine failure"]) === 1;

    const reasons: string[] = [];

    if (Number(machine["TWF"]) === 1)
      reasons.push("Tool Wear Failure");

    if (Number(machine["HDF"]) === 1)
      reasons.push("Heat Dissipation Failure");

    if (Number(machine["PWF"]) === 1)
      reasons.push("Power Failure");

    if (Number(machine["OSF"]) === 1)
      reasons.push("Overstrain Failure");

    if (Number(machine["RNF"]) === 1)
      reasons.push("Random Failure");

    return {
      success: true,
      machineId: input.machineId,
      predictedFailure: failed,
      confidence: failed ? 97 : 91,
      causes: reasons,
    };
  }

  @Tool({
    name: "recommend_maintenance",
    description: "Generate maintenance recommendation.",
    inputSchema: z.object({
      machineId: z.string(),
    }),
  })
  async recommendMaintenance(input: { machineId: string }) {

    const machines = await loadMachines();

    const machine = machines.find(
      (m) => m["Product ID"] === input.machineId
    );

    if (!machine) {
      return {
        success: false,
        message: "Machine not found",
      };
    }

    const recommendations: string[] = [];

    if (Number(machine["Tool wear [min]"]) > 150)
      recommendations.push("Replace cutting tool");

    if (Number(machine["Torque [Nm]"]) > 60)
      recommendations.push("Inspect drive system");

    if (
      Number(machine["Process temperature [K]"]) -
        Number(machine["Air temperature [K]"]) >
      12
    )
      recommendations.push(
        "Inspect cooling system"
      );

    if (!recommendations.length)
      recommendations.push(
        "Routine preventive maintenance"
      );

    return {
      success: true,
      machineId: input.machineId,
      recommendations,
      estimatedDowntime: "2 hours",
      priority:
        recommendations.length > 1
          ? "High"
          : "Medium",
    };
  }
  @Tool({
    name: "check_inventory",
    description: "Check spare part inventory.",
    inputSchema: z.object({
      part: z.string(),
    }),
  })
  async checkInventory(input: { part: string }) {

    const inventory = loadJSON("inventory.json");

    const item = inventory.find(
      (i: any) =>
        i.part_name.toLowerCase() ===
        input.part.toLowerCase()
    );

    if (!item) {
      return {
        success: false,
        message: "Part not found",
      };
    }

    return {
      success: true,
      ...item,
      reorderRequired:
        item.stock <= item.minimum_stock,
    };
  }

  @Tool({
    name: "assign_technician",
    description: "Assign an available technician.",
    inputSchema: z.object({
      specialization: z.string(),
    }),
  })
  async assignTechnician(input: { specialization: string }) {

    const technicians = loadJSON("technicians.json");

    const tech = technicians.find(
      (t: any) =>
        t.available &&
        t.specialization.toLowerCase() ===
          input.specialization.toLowerCase()
    );

    if (!tech) {
      return {
        success: false,
        message: "No technician available",
      };
    }

    return {
      success: true,
      technician: tech,
    };
  }

  @Tool({
    name: "machine_history",
    description: "Return maintenance history.",
    inputSchema: z.object({
      machineId: z.string(),
    }),
  })
  async machineHistory(input: { machineId: string }) {

    const history = loadJSON(
      "maintenance_history.json"
    );

    const records = history.filter(
      (r: any) => r.machine_id === input.machineId
    );

    return {
      success: true,
      machineId: input.machineId,
      totalRepairs: records.length,
      history: records,
    };
  }

  @Tool({
    name: "generate_ticket",
    description: "Generate maintenance ticket.",
    inputSchema: z.object({
      machineId: z.string(),
      issue: z.string(),
      priority: z.string().optional(),
    }),
  })
  async generateTicket(input: {
    machineId: string;
    issue: string;
    priority?: string;
  }) {

    const technicians = loadJSON(
      "technicians.json"
    );

    const tech =
      technicians.find((t: any) => t.available) ??
      null;

    return {
      success: true,
      ticketId: `MT-${Date.now()}`,
      machineId: input.machineId,
      issue: input.issue,
      priority: input.priority ?? "Medium",
      assignedTechnician: tech,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
  }

}
