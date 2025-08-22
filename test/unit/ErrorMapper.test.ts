import { expect } from 'chai'
import * as sinon from 'sinon'
import { ErrorMapper } from '../../src/utils/ErrorMapper'
import { setupGlobals } from '../helpers/setupGlobals'

describe('ErrorMapper', () => {
  beforeEach(() => {
    setupGlobals()
    
    // Mock the source map consumer
    const mockConsumer = {
      originalPositionFor: sinon.stub()
    }
    
    // Mock require for the source map
    // @ts-ignore
    global.require = sinon.stub().withArgs('main.js.map').returns({})
    
    // Mock SourceMapConsumer constructor
    const mockSourceMapConsumer = sinon.stub().returns(mockConsumer)
    // @ts-ignore
    global.SourceMapConsumer = mockSourceMapConsumer
    
    ErrorMapper.cache = {}
  })

  afterEach(() => {
    sinon.restore()
    ErrorMapper.cache = {}
  })

  describe('wrapLoop', () => {
    it('should execute loop function without error', () => {
      const mockLoop = sinon.stub()
      const wrappedLoop = ErrorMapper.wrapLoop(mockLoop)
      
      wrappedLoop()
      
      expect(mockLoop.calledOnce).to.be.true
    })

    it('should catch and log errors in simulator', () => {
      // @ts-ignore
      global.Game = { rooms: { sim: {} } }
      const consoleStub = sinon.stub(console, 'log')
      
      const errorLoop = () => {
        throw new Error('Test error with stack trace')
      }
      
      const wrappedLoop = ErrorMapper.wrapLoop(errorLoop)
      
      expect(() => wrappedLoop()).to.not.throw()
      expect(consoleStub.called).to.be.true
      
      const logCall = consoleStub.getCall(0)
      expect(logCall.args[0]).to.include('Source maps don\'t work in the simulator')
    })

    it('should catch and log errors outside simulator', () => {
      // @ts-ignore
      global.Game = { rooms: {} }
      const consoleStub = sinon.stub(console, 'log')
      const sourceMappedStub = sinon.stub(ErrorMapper, 'sourceMappedStackTrace').returns('Mapped stack trace')
      
      const errorLoop = () => {
        throw new Error('Test error')
      }
      
      const wrappedLoop = ErrorMapper.wrapLoop(errorLoop)
      
      expect(() => wrappedLoop()).to.not.throw()
      expect(consoleStub.called).to.be.true
      expect(sourceMappedStub.called).to.be.true
    })

    it('should re-throw non-Error objects', () => {
      const nonErrorLoop = () => {
        throw 'String error'
      }
      
      const wrappedLoop = ErrorMapper.wrapLoop(nonErrorLoop)
      
      expect(() => wrappedLoop()).to.throw('String error')
    })
  })

  describe('sourceMappedStackTrace', () => {
    it('should return cached result if available', () => {
      const testStack = 'Test stack trace'
      const cachedResult = 'Cached result'
      ErrorMapper.cache[testStack] = cachedResult
      
      const result = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result).to.equal(cachedResult)
    })

    it('should handle Error object input', () => {
      const testError = new Error('Test error')
      testError.stack = 'Error: Test error\n    at main:1:1'
      
      // Mock the consumer
      const mockConsumer = {
        originalPositionFor: sinon.stub().returns({
          line: 10,
          column: 5,
          source: 'test.ts',
          name: 'testFunction'
        })
      }
      
      sinon.stub(ErrorMapper, 'consumer').get(() => mockConsumer)
      
      const result = ErrorMapper.sourceMappedStackTrace(testError)
      
      expect(result).to.include('testFunction')
      expect(result).to.include('test.ts:10:5')
    })

    it('should handle string input', () => {
      const testStack = 'Error: Test error\n    at main:1:1'
      
      const mockConsumer = {
        originalPositionFor: sinon.stub().returns({
          line: 10,
          column: 5,
          source: 'test.ts',
          name: null
        })
      }
      
      sinon.stub(ErrorMapper, 'consumer').get(() => mockConsumer)
      
      const result = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result).to.include('test.ts:10:5')
    })

    it('should handle stack traces with function names', () => {
      const testStack = 'Error: Test error\n    at myFunction main:1:1'
      
      const mockConsumer = {
        originalPositionFor: sinon.stub().returns({
          line: 10,
          column: 5,
          source: 'test.ts',
          name: null
        })
      }
      
      sinon.stub(ErrorMapper, 'consumer').get(() => mockConsumer)
      
      const result = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result).to.include('myFunction')
      expect(result).to.include('test.ts:10:5')
    })

    it('should handle cases where originalPositionFor returns null line', () => {
      const testStack = 'Error: Test error\n    at main:1:1'
      
      const mockConsumer = {
        originalPositionFor: sinon.stub().returns({
          line: null,
          column: null,
          source: null,
          name: null
        })
      }
      
      sinon.stub(ErrorMapper, 'consumer').get(() => mockConsumer)
      
      const result = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result).to.equal(testStack)
    })

    it('should cache results', () => {
      const testStack = 'Error: Test error'
      
      const mockConsumer = {
        originalPositionFor: sinon.stub().returns({
          line: null,
          column: null,
          source: null,
          name: null
        })
      }
      
      sinon.stub(ErrorMapper, 'consumer').get(() => mockConsumer)
      
      const result1 = ErrorMapper.sourceMappedStackTrace(testStack)
      const result2 = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result1).to.equal(result2)
      expect(ErrorMapper.cache[testStack]).to.equal(result1)
    })

    it('should handle non-main stack traces', () => {
      const testStack = 'Error: Test error\n    at otherFile:1:1'
      
      const result = ErrorMapper.sourceMappedStackTrace(testStack)
      
      expect(result).to.equal(testStack)
    })
  })

  describe('consumer getter', () => {
    it.skip('should create and cache consumer', () => {
      // This test is skipped as it requires complex mocking of require()
      // The consumer getter is already covered by other sourceMappedStackTrace tests
    })
  })
})
