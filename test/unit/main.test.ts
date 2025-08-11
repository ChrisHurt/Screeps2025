import { assert, expect } from "chai"
import { loop } from "../../src/main"
import { setupGlobals } from "../helpers/setupGlobals"
import * as renderMapConnections from "../../src/renderMapConnections"
import * as sinon from "sinon"
import { CreepRole } from "types"
import { HarvesterState } from "stateMachines/harvester-machine"
import * as harvester from "creepProcessors/harvester"

describe("main", () => {
  let renderMapConnectionsMock: sinon.SinonStubbedInstance<typeof renderMapConnections>
  let runHarvesterCreepMock: sinon.SinonStubbedInstance<typeof harvester.runHarvesterCreep>
  beforeEach(() => {
    setupGlobals()
    loop()
    renderMapConnectionsMock = sinon.stub(renderMapConnections)
    runHarvesterCreepMock = sinon.stub(harvester, "runHarvesterCreep")
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
          state: HarvesterState.harvesting
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
          state: HarvesterState.harvesting
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
          state: HarvesterState.harvesting
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
})
