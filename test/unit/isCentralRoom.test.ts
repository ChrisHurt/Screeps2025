import { expect } from 'chai'
import { isCentralRoom } from 'helpers/isCentralRoom'

describe('isCentralRoom', () => {
  it('returns false for invalid room name format', () => {
    expect(isCentralRoom('')).to.equal(false)
    expect(isCentralRoom('E4N')).to.equal(false)
    expect(isCentralRoom('E4')).to.equal(false)
    expect(isCentralRoom('X4N5')).to.equal(false)
    expect(isCentralRoom('E4Z5')).to.equal(false)
    expect(isCentralRoom('E4N5S6')).to.equal(false)
    expect(isCentralRoom('E4N5S')).to.equal(false)
    expect(isCentralRoom('E4N')).to.equal(false)
    expect(isCentralRoom('E4N5X')).to.equal(false)
  })

  it('returns false for abscissa not E or W', () => {
    expect(isCentralRoom('A4N5')).to.equal(false)
    expect(isCentralRoom('Z4S5')).to.equal(false)
  })

  it('returns false if ordinate cardinal is missing', () => {
    expect(isCentralRoom('E4')).to.equal(false)
    expect(isCentralRoom('W5')).to.equal(false)
    expect(isCentralRoom('E44')).to.equal(false)
    expect(isCentralRoom('W55')).to.equal(false)
  })

  it('returns false for non-numeric coordinates', () => {
    expect(isCentralRoom('EZN5')).to.equal(false)
    expect(isCentralRoom('E4NQ')).to.equal(false)
    expect(isCentralRoom('E4N')).to.equal(false)
  })

  it('returns true for central rooms (x and y in [4,5,6])', () => {
    expect(isCentralRoom('E4N4')).to.equal(true)
    expect(isCentralRoom('W5S5')).to.equal(true)
    expect(isCentralRoom('E6N6')).to.equal(true)
    expect(isCentralRoom('W4S6')).to.equal(true)
    expect(isCentralRoom('E5N4')).to.equal(true)
    expect(isCentralRoom('W6S5')).to.equal(true)
  })

  it('returns false for rooms with only one central coordinate', () => {
    expect(isCentralRoom('E4N7')).to.equal(false)
    expect(isCentralRoom('W7S5')).to.equal(false)
    expect(isCentralRoom('E3N4')).to.equal(false)
    expect(isCentralRoom('W6S3')).to.equal(false)
  })

  it('returns false for rooms with neither coordinate central', () => {
    expect(isCentralRoom('E1N2')).to.equal(false)
    expect(isCentralRoom('W8S9')).to.equal(false)
  })
  it('returns false for invalid numeric coordinates', () => {
    expect(isCentralRoom('EfooNbar')).to.equal(false)
  })
})
