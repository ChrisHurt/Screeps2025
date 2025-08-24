import { expect } from "chai";
import { calculateRoomEnergyProduction } from "../../src/helpers/calculateRoomEnergyProduction";
import { setupGlobals } from "../helpers/setupGlobals";
import { CreepEnergyImpact } from "../../src/types";

describe("calculateRoomEnergyProduction", () => {
    beforeEach(() => {
        setupGlobals()
    });

    it("should return 0 if no energy impacts exist", () => {
        expect(calculateRoomEnergyProduction("W1N1")).to.equal(0);
    });

    it("should sum perTickAmount for matching roomName", () => {
        Memory.production.energy = {
            a: { roomNames: ["W1N1"], perTickAmount: 10, role: "harvester", type: "creep" } as CreepEnergyImpact,
            b: { roomNames: ["W2N2"], perTickAmount: 20, role: "upgrader", type: "creep" } as CreepEnergyImpact
        };
        expect(calculateRoomEnergyProduction("W1N1")).to.equal(10);
        expect(calculateRoomEnergyProduction("W2N2")).to.equal(20);
    });

    it("should split perTickAmount among multiple rooms", () => {
        Memory.production.energy = {
            a: { roomNames: ["W1N1", "W2N2"], perTickAmount: 30, role: "harvester", type: "creep" } as CreepEnergyImpact
        };
        expect(calculateRoomEnergyProduction("W1N1")).to.equal(15);
        expect(calculateRoomEnergyProduction("W2N2")).to.equal(15);
    });

    it("should return 0 for room not present in any impact", () => {
        Memory.production.energy = {
            a: { roomNames: ["W1N1"], perTickAmount: 10, role: "harvester", type: "creep" } as CreepEnergyImpact
        };
        expect(calculateRoomEnergyProduction("W3N3")).to.equal(0);
    })

    it("should handle multiple impacts for the same room", () => {
        Memory.production.energy = {
            a: { roomNames: ["W1N1"], perTickAmount: 10, role: "harvester", type: "creep" } as CreepEnergyImpact,
            b: { roomNames: ["W2N2"], perTickAmount: 20, role: "upgrader", type: "creep" } as CreepEnergyImpact
        };
        expect(calculateRoomEnergyProduction("W1N1")).to.equal(10);
        expect(calculateRoomEnergyProduction("W2N2")).to.equal(20);
    });
});
