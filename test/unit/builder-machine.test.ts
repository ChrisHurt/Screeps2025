import { expect } from 'chai'
import { interpret, Service } from 'robot3'
import { createBuilderMachine, BuilderContext, BuilderEventType, BuilderMachine } from '../../src/stateMachines/builder-machine'
import { SharedCreepState, SharedCreepEventType } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('builderMachine', () => {
  let service: Service<BuilderMachine>
  let context: BuilderContext

  beforeEach(() => {
    setupGlobals()
    // @ts-ignore
    global.Game = { time: 12345 }

    context = {
      energy: 0,
      capacity: 100,
      idleStarted: undefined
    }
    
    service = interpret(createBuilderMachine(() => context, SharedCreepState.idle), () => {})
  })

  it('should start in idle state and idleStarted should be undefined', () => {
    expect(service.machine.current).to.equal(SharedCreepState.idle)
    expect(context.idleStarted).to.be.undefined
  })

  it('should transition to building on buildTarget and clear idleStarted', () => {
    context.idleStarted = 10000
    
    // Create a new service to capture the context state
    service = interpret(createBuilderMachine(() => context, SharedCreepState.idle), () => {})

    service.send({ type: BuilderEventType.buildTarget })
    
    expect(service.machine.current).to.equal(SharedCreepState.building)
    expect(service.context.idleStarted).to.be.undefined
  })

  it('should transition to recycling on recycleSelf and clear idleStarted', () => {
    context.idleStarted = 10000
    
    // Create a new service to capture the context state
    service = interpret(createBuilderMachine(() => context, SharedCreepState.idle), () => {})

    service.send({ type: SharedCreepEventType.recycleSelf })
    
    expect(service.machine.current).to.equal(SharedCreepState.recycling)
    expect(service.context.idleStarted).to.be.undefined
  })

  it('should transition to collectingEnergy from building on empty', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.building), () => {})

    service.send({ type: SharedCreepEventType.empty })
    
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)
  })

  it('should transition to idle from building and set idleStarted', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.building), () => {})

    service.send({ type: SharedCreepEventType.idle })
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
    expect(service.context.idleStarted).to.equal(12345)
  })

  it('should transition to building from collectingEnergy on full', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.collectingEnergy), () => {})

    service.send({ type: SharedCreepEventType.full })
    
    expect(service.machine.current).to.equal(SharedCreepState.building)
  })

  it('should transition to idle from collectingEnergy and set idleStarted', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.collectingEnergy), () => {})

    service.send({ type: SharedCreepEventType.idle })
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
    expect(service.context.idleStarted).to.equal(12345)
  })

  it('should remain in error state (final state)', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.error), () => {})

    service.send({ type: SharedCreepEventType.idle })
    
    expect(service.machine.current).to.equal(SharedCreepState.error)
  })

  it('should remain in recycling state (final state)', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.recycling), () => {})

    service.send({ type: SharedCreepEventType.idle })
    
    expect(service.machine.current).to.equal(SharedCreepState.recycling)
  })

  it('should transition from idle to building on buildTarget', () => {
    service.send({ type: BuilderEventType.buildTarget })
    
    expect(service.machine.current).to.equal(SharedCreepState.building)
  })

  it('should transition from building to collectingEnergy on empty', () => {
    service.send({ type: BuilderEventType.buildTarget })
    expect(service.machine.current).to.equal(SharedCreepState.building)

    service.send({ type: SharedCreepEventType.empty })
    
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)
  })

  it('should transition from collectingEnergy to building on full', () => {
    service.send({ type: BuilderEventType.buildTarget })
    service.send({ type: SharedCreepEventType.empty })
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)

    service.send({ type: SharedCreepEventType.full })
    
    expect(service.machine.current).to.equal(SharedCreepState.building)
  })

  it('should allow starting in building state', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.building), () => {})
    
    expect(service.machine.current).to.equal(SharedCreepState.building)
  })

  it('should allow starting in collectingEnergy state', () => {
    service = interpret(createBuilderMachine(() => context, SharedCreepState.collectingEnergy), () => {})
    
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)
  })

  it('should default to idle if initialState is not provided', () => {
    service = interpret(createBuilderMachine(() => context), () => {})
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
  })

  it('should handle invalid transitions gracefully', () => {
    service.send({ type: SharedCreepEventType.empty })
    
    // Should remain in idle since empty is not a valid transition from idle
    expect(service.machine.current).to.equal(SharedCreepState.idle)
  })

  it('should not set idleStarted if Game.time is undefined', () => {
    // @ts-ignore
    global.Game = { time: undefined }
    
    service = interpret(createBuilderMachine(() => context, SharedCreepState.building), () => {})

    service.send({ type: SharedCreepEventType.idle })
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
    expect(service.context.idleStarted).to.be.undefined
  })

  it('should clear idleStarted when transitioning from idle to building', () => {
    context.idleStarted = 10000
    
    // Create a new service to capture the context state
    service = interpret(createBuilderMachine(() => context, SharedCreepState.idle), () => {})

    service.send({ type: BuilderEventType.buildTarget })

    expect(service.machine.current).to.equal(SharedCreepState.building)
    expect(service.context.idleStarted).to.be.undefined
  })

  it('should handle noBuildTarget event type', () => {
    // Test that noBuildTarget is a valid event type
    const noBuildTargetEvent = { type: BuilderEventType.noBuildTarget }
    
    // This event doesn't trigger any transitions in the current state machine
    // but should be handled without errors
    service.send(noBuildTargetEvent)
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
  })

  it('should handle energyDepleted event type', () => {
    // Test that energyDepleted is a valid event type
    const energyDepletedEvent = { type: BuilderEventType.energyDepleted }
    
    // This event doesn't trigger any transitions in the current state machine
    // but should be handled without errors
    service.send(energyDepletedEvent)
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
  })

  it('should handle energyCollected event type', () => {
    // Test that energyCollected is a valid event type
    const energyCollectedEvent = { type: BuilderEventType.energyCollected }
    
    // This event doesn't trigger any transitions in the current state machine
    // but should be handled without errors
    service.send(energyCollectedEvent)
    
    expect(service.machine.current).to.equal(SharedCreepState.idle)
  })

  it('should handle context with different initial values', () => {
    context = {
      energy: 50,
      capacity: 200,
      idleStarted: 5000
    }
    
    service = interpret(createBuilderMachine(() => context, SharedCreepState.collectingEnergy), () => {})
    
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)
    expect(service.context.energy).to.equal(50)
    expect(service.context.capacity).to.equal(200)
    expect(service.context.idleStarted).to.equal(5000)
  })

  it('should test all BuilderEventType enums', () => {
    // Ensure all event types are defined
    expect(BuilderEventType.buildTarget).to.equal('buildTarget')
    expect(BuilderEventType.noBuildTarget).to.equal('noBuildTarget')
    expect(BuilderEventType.energyDepleted).to.equal('energyDepleted')
    expect(BuilderEventType.energyCollected).to.equal('energyCollected')
  })

  it('should handle complex state transitions with multiple events', () => {
    // Start in idle, transition through multiple states
    service.send({ type: BuilderEventType.buildTarget })
    expect(service.machine.current).to.equal(SharedCreepState.building)
    
    service.send({ type: SharedCreepEventType.empty })
    expect(service.machine.current).to.equal(SharedCreepState.collectingEnergy)
    
    service.send({ type: SharedCreepEventType.full })
    expect(service.machine.current).to.equal(SharedCreepState.building)
    
    service.send({ type: SharedCreepEventType.idle })
    expect(service.machine.current).to.equal(SharedCreepState.idle)
    expect(service.context.idleStarted).to.equal(12345)
  })
})
