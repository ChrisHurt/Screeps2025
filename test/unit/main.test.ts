import { assert } from "chai"
import { loop } from "../../src/main"
import { setupGlobals } from "../helpers/setupGlobals"

describe("main", () => {
  beforeEach(() => {
    setupGlobals()
    loop()
  })

  it("should export a loop function", () => {
    assert.isTrue(typeof loop === "function")
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
