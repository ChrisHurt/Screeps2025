import { assert } from "chai"
import { loop } from "../../src/main"
import { mockGame, mockMemory } from "./mock"
import { clone } from 'lodash'

describe("main", () => {
  before(() => {
    // runs before all tests in this block
  })

  beforeEach(() => {
    // runs before each test in this block
    // @ts-ignore : allow adding Game to global
    global.Game = clone(mockGame)
    // @ts-ignore : allow adding Memory to global
    global.Memory = clone(mockMemory)
    // @ts-ignore
    global.Game.map.visual = { line: function() { (Game.map.visual.calls = Game.map.visual.calls || []).push([...arguments]) } }
    loop()
  })

  it("should export a loop function", () => {
    assert.isTrue(typeof loop === "function")
  })

  it("should return void when called with no context", () => {
    assert.isUndefined(loop())
  })

  it("Automatically delete memory of missing creeps", () => {
    Memory.creeps.persistValue = "any value"
    Memory.creeps.notPersistValue = "any value"

    // @ts-ignore : allow adding Game to global
    Game.creeps.persistValue = "any value"

    loop()

    assert.isDefined(Memory.creeps.persistValue)
    assert.isUndefined(Memory.creeps.notPersistValue)
  })
})
