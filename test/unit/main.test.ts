import { assert, expect } from "chai"
import { loop } from "../../src/main"
import { setupGlobals } from "../helpers/setupGlobals"
import * as renderMapConnections from "../../src/renderMapConnections"
import * as sinon from "sinon"
import { CreepRole, SharedCreepState } from "types"
import * as harvester from "creepProcessors/harvester"
import * as builder from "creepProcessors/builder"
import * as upgrader from "creepProcessors/upgrader"
import * as guard from "creepProcessors/guard"
import * as generateContainerTasks from "../../src/generateContainerTasks"

describe("main", () => {
  let renderMapConnectionsMock: sinon.SinonStubbedInstance<typeof renderMapConnections>
  let runHarvesterCreepMock: sinon.SinonStubbedInstance<typeof harvester.runHarvesterCreep>
  let runBuilderCreepMock: sinon.SinonStubbedInstance<typeof builder.runBuilderCreep>
  let runUpgraderCreepMock: sinon.SinonStubbedInstance<typeof upgrader.runUpgraderCreep>
  let runGuardCreepMock: sinon.SinonStubbedInstance<typeof guard.runGuardCreep>
  let generateContainerTasksMock: sinon.SinonStubbedInstance<typeof generateContainerTasks.generateContainerTasks>

  beforeEach(() => {
    setupGlobals()
    loop()
    renderMapConnectionsMock = sinon.stub(renderMapConnections)
    runHarvesterCreepMock = sinon.stub(harvester, "runHarvesterCreep")
    runBuilderCreepMock = sinon.stub(builder, "runBuilderCreep")
    runUpgraderCreepMock = sinon.stub(upgrader, "runUpgraderCreep")
    runGuardCreepMock = sinon.stub(guard, "runGuardCreep")
    generateContainerTasksMock = sinon.stub(generateContainerTasks, "generateContainerTasks")
  })

  afterEach(()=>{
    sinon.restore()
  })

  it("should export a loop function", () => {
    assert.isTrue(typeof loop === "function")
  })

  it("should call renderConnections if they are populated", () => {
    // @ts-ignore : Permit invalid memory for testing
    Memory.mapConnections = [{ from: "W1N1", to: "W1N2" }]
    // @ts-ignore : Permit invalid memory for testing
    Memory.rooms = { W1N1: { name: "W1N1" } as Room }
    loop()
    expect(renderMapConnectionsMock.renderMapConnections).to.have.been.calledOnce
  })

  it("should call runHarvesterCreep for harvester creeps", () => {
    Game.creeps = {
      harvester1: {
        name: "harvester1",
        memory: {
          role: CreepRole.HARVESTER,
          state: SharedCreepState.harvesting
        }
      } as Creep
    }
    loop()
    expect(runHarvesterCreepMock).to.have.been.calledOnceWithExactly(Game.creeps.harvester1)
  })

  it("should not call runHarvesterCreep for creep missing a role", () => {
    Game.creeps = {
      harvester1: {
        name: "harvester1",
        memory: {
          state: SharedCreepState.harvesting
        }
      } as Creep
    }

    loop()
    expect(runHarvesterCreepMock).to.not.have.been.called
  })

  it("should not call runHarvesterCreep for creep missing with a different role", () => {
    // @ts-ignore : Permit invalid memory for testing
    Game.creeps = {
      harvester1: {
        name: "harvester1",
        memory: {
          role: CreepRole.UPGRADER,
          state: SharedCreepState.harvesting
        }
      } as Creep
    }

    loop()
    expect(runHarvesterCreepMock).to.not.have.been.called
  })

  it("should return void when called with no context", () => {
    assert.isUndefined(loop())
  })

  it("Automatically delete memory of missing creeps", () => {
    // @ts-ignore : Permit invalid memory for testing
    Memory.creeps.persistValue = "any value"
    // @ts-ignore : Permit invalid memory for testing
    Memory.creeps.notPersistValue = "any value"

    // @ts-ignore : allow adding Game to global
    Game.creeps.persistValue = "any value"

    loop()

    assert.isDefined(Memory.creeps.persistValue)
    assert.isUndefined(Memory.creeps.notPersistValue)
  })

    it("should log and skip creeps with invalid roles", () => {
      const logStub = sinon.stub(console, "log")
      // @ts-ignore : Permit invalid memory for testing
      Game.creeps = {
        invalidRoleCreep: ({
          name: "invalidRoleCreep",
          memory: {
            role: "INVALID_ROLE",
            state: "anyState"
          }
        } as unknown) as Creep
      }
      loop()
      expect(logStub).to.have.been.calledWithExactly("Creep invalidRoleCreep has invalid role, skipping")
      logStub.restore()
    })

  it("should call runBuilderCreep for builder creeps", () => {
    Game.creeps = {
      builder1: {
        name: "builder1",
        memory: {
          role: CreepRole.BUILDER,
          state: SharedCreepState.idle
        }
      } as Creep
    }
    loop()
    expect(runBuilderCreepMock).to.have.been.calledOnceWithExactly(Game.creeps.builder1)
  })

  it("should call runUpgraderCreep for upgrader creeps", () => {
    Game.creeps = {
      upgrader1: {
        name: "upgrader1",
        memory: {
          role: CreepRole.UPGRADER,
          state: SharedCreepState.idle
        }
      } as Creep
    }
    loop()
    expect(runUpgraderCreepMock).to.have.been.calledOnceWithExactly(Game.creeps.upgrader1)
  })

  it("should call runGuardCreep for guard creeps", () => {
    Game.creeps = {
      guard1: {
        name: "guard1",
        memory: {
          role: CreepRole.GUARD,
          state: SharedCreepState.idle
        }
      } as Creep
    }
    loop()
    expect(runGuardCreepMock).to.have.been.calledOnceWithExactly(Game.creeps.guard1)
  })

  it("should call generateContainerTasks when room has no source containers", () => {
    const mockRoom = {
      name: "W1N1",
      controller: { id: "controller1" },
      find: sinon.stub().returns([])
    } as unknown as Room
    
    Game.rooms = { W1N1: mockRoom }
    Memory.rooms = {
      W1N1: {
        name: "W1N1",
        structures: {
          containers: {
            sources: undefined
          }
        }
      } as unknown as RoomMemory
    }

    loop()
    expect(generateContainerTasksMock).to.have.been.calledOnceWithExactly({
      room: mockRoom,
      roomMemory: Memory.rooms.W1N1
    })
  })

  it("should not call generateContainerTasks when room has source containers", () => {
    const mockRoom = {
      name: "W1N1",
      controller: { id: "controller1" },
      find: sinon.stub().returns([])
    } as unknown as Room
    
    Game.rooms = { W1N1: mockRoom }
    Memory.rooms = {
      W1N1: {
        name: "W1N1",
        structures: {
          containers: {
            sources: { source1: { id: "container1" } }
          }
        }
      } as unknown as RoomMemory
    }

    loop()
    expect(generateContainerTasksMock).to.not.have.been.called
  })
})
