import {
  parseQParam,
  formatQParam,
  getPrevQuarter,
  getNextQuarter,
  getQuarterString,
  getQuarterFromWeek,
  getWeekOfYear,
  getQuarterDates,
  isCurrentQuarter,
  generateQuarterOptions,
} from '../quarterUtils'

describe('quarterUtils', () => {
  describe('parseQParam', () => {
    it('should parse valid quarter parameter', () => {
      expect(parseQParam('2025-Q2')).toEqual({ year: 2025, quarter: 2 })
      expect(parseQParam('2024-Q4')).toEqual({ year: 2024, quarter: 4 })
    })

    it('should handle null parameter', () => {
      const result = parseQParam(null)
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('quarter')
      expect(result.quarter).toBeGreaterThanOrEqual(1)
      expect(result.quarter).toBeLessThanOrEqual(4)
    })

    it('should handle invalid parameter', () => {
      const result = parseQParam('invalid')
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('quarter')
    })
  })

  describe('formatQParam', () => {
    it('should format quarter parameter correctly', () => {
      expect(formatQParam(2025, 2)).toBe('2025-Q2')
      expect(formatQParam(2024, 4)).toBe('2024-Q4')
    })
  })

  describe('getPrevQuarter', () => {
    it('should get previous quarter within same year', () => {
      expect(getPrevQuarter(2025, 2)).toEqual({ year: 2025, quarter: 1 })
      expect(getPrevQuarter(2025, 4)).toEqual({ year: 2025, quarter: 3 })
    })

    it('should handle year transition', () => {
      expect(getPrevQuarter(2025, 1)).toEqual({ year: 2024, quarter: 4 })
    })
  })

  describe('getNextQuarter', () => {
    it('should get next quarter within same year', () => {
      expect(getNextQuarter(2025, 1)).toEqual({ year: 2025, quarter: 2 })
      expect(getNextQuarter(2025, 3)).toEqual({ year: 2025, quarter: 4 })
    })

    it('should handle year transition', () => {
      expect(getNextQuarter(2025, 4)).toEqual({ year: 2026, quarter: 1 })
    })
  })

  describe('getQuarterString', () => {
    it('should format quarter string correctly', () => {
      expect(getQuarterString(2025, 2)).toBe('Q2 2025')
      expect(getQuarterString(2024, 4)).toBe('Q4 2024')
    })
  })

  describe('getQuarterFromWeek', () => {
    it('should return correct quarter for week numbers', () => {
      expect(getQuarterFromWeek(1)).toBe(1)
      expect(getQuarterFromWeek(13)).toBe(1)
      expect(getQuarterFromWeek(14)).toBe(2)
      expect(getQuarterFromWeek(26)).toBe(2)
      expect(getQuarterFromWeek(27)).toBe(3)
      expect(getQuarterFromWeek(39)).toBe(3)
      expect(getQuarterFromWeek(40)).toBe(4)
      expect(getQuarterFromWeek(52)).toBe(4)
    })
  })

  describe('getWeekOfYear', () => {
    it('should calculate week number correctly', () => {
      // Test with known dates
      const jan1 = new Date(2025, 0, 1) // January 1, 2025
      const week1 = getWeekOfYear(jan1)
      expect(week1).toBeGreaterThanOrEqual(1)
      expect(week1).toBeLessThanOrEqual(53)
    })
  })

  describe('getQuarterDates', () => {
    it('should return correct start and end dates for quarter', () => {
      const { startDate, endDate } = getQuarterDates(2025, 2)
      
      expect(startDate).toBeInstanceOf(Date)
      expect(endDate).toBeInstanceOf(Date)
      expect(startDate.getTime()).toBeLessThan(endDate.getTime())
    })

    it('should handle all quarters', () => {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const { startDate, endDate } = getQuarterDates(2025, quarter)
        expect(startDate).toBeInstanceOf(Date)
        expect(endDate).toBeInstanceOf(Date)
      }
    })
  })

  describe('isCurrentQuarter', () => {
    it('should identify current quarter', () => {
      const currentQuarter = parseQParam(null)
      expect(isCurrentQuarter(currentQuarter.year, currentQuarter.quarter)).toBe(true)
    })

    it('should identify non-current quarter', () => {
      expect(isCurrentQuarter(2020, 1)).toBe(false)
    })
  })

  describe('generateQuarterOptions', () => {
    it('should generate options for current quarter', () => {
      const current = { year: 2025, quarter: 2 }
      const options = generateQuarterOptions(current)
      
      expect(options).toBeInstanceOf(Array)
      expect(options.length).toBeGreaterThan(0)
      
      // Should include current quarter
      const hasCurrent = options.some(opt => 
        opt.year === current.year && opt.quarter === current.quarter
      )
      expect(hasCurrent).toBe(true)
    })

    it('should generate options in descending order', () => {
      const current = { year: 2025, quarter: 2 }
      const options = generateQuarterOptions(current)
      
      for (let i = 0; i < options.length - 1; i++) {
        const current = options[i]
        const next = options[i + 1]
        
        if (current.year !== next.year) {
          expect(current.year).toBeGreaterThan(next.year)
        } else {
          expect(current.quarter).toBeGreaterThan(next.quarter)
        }
      }
    })
  })
}) 