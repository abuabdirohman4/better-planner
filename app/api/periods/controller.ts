import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export interface Period {
  id: number;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
}

export interface CreatePeriodData {
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
}

export interface UpdatePeriodData {
  name?: string;
  year?: number;
  quarter?: number;
  startDate?: string;
  endDate?: string;
}

export interface FetchPeriodsParams {
  name?: string;
  year?: number;
  quarter?: number;
}

export const fetchPeriods = async (
  params: FetchPeriodsParams = {}
): Promise<{ status: number; data: Period[] }> => {
  try {
    const periods = await googleSheetsService.getAll(SHEET_NAMES.PERIODS);

    // Filter based on parameters
    let filteredPeriods = periods;

    if (params.name) {
      filteredPeriods = filteredPeriods.filter(
        (period: Period) => period.name === params.name
      );
    }

    if (params.year) {
      filteredPeriods = filteredPeriods.filter(
        (period: Period) => Number(period.year) === params.year
      );
    }

    if (params.quarter) {
      filteredPeriods = filteredPeriods.filter(
        (period: Period) => period.quarter === params.quarter
      );
    }

    return { status: 200, data: filteredPeriods };
  } catch (error) {
    console.error("Error fetching periods:", error);
    return { status: 500, data: [] };
  }
};

export const fetchPeriod = async (
  id: number
): Promise<{ status: number; data: Period | null }> => {
  try {
    const period = await googleSheetsService.getById(SHEET_NAMES.PERIODS, id);
    if (!period) {
      return { status: 404, data: null };
    }
    return { status: 200, data: period };
  } catch (error) {
    console.error("Error fetching period:", error);
    return { status: 500, data: null };
  }
};

export const createPeriod = async (
  data: CreatePeriodData
): Promise<{ status: number; data: Period | null }> => {
  try {
    const newPeriod = await googleSheetsService.create(
      SHEET_NAMES.PERIODS,
      data
    );
    return { status: 201, data: newPeriod };
  } catch (error) {
    console.error("Error creating period:", error);
    return { status: 500, data: null };
  }
};

export const updatePeriod = async (
  id: number,
  data: UpdatePeriodData
): Promise<{ status: number; data: Period | null }> => {
  try {
    const updatedPeriod = await googleSheetsService.update(
      SHEET_NAMES.PERIODS,
      id,
      data
    );
    return { status: 200, data: updatedPeriod };
  } catch (error) {
    console.error("Error updating period:", error);
    return { status: 500, data: null };
  }
};

export const deletePeriod = async (
  id: number
): Promise<{ status: number; message: string }> => {
  try {
    await googleSheetsService.delete(SHEET_NAMES.PERIODS, id);
    return { status: 204, message: "Period deleted successfully" };
  } catch (error) {
    console.error("Error deleting period:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

// Helper function to add periods for a specific year
export const addPeriodsForYear = async (
  year: number
): Promise<{ status: number; message: string }> => {
  try {
    const periods = [];

    for (let quarter = 1; quarter <= 4; quarter++) {
      const startDate = getStartDateOfQuarter(year, quarter);
      const endDate = getEndDateOfQuarter(startDate);
      const name = `Q${quarter}-${year}`;

      periods.push({ name, year, quarter, startDate, endDate });
    }

    for (const period of periods) {
      await googleSheetsService.create(SHEET_NAMES.PERIODS, period);
    }

    return {
      status: 200,
      message: `Added ${periods.length} periods for year ${year}`,
    };
  } catch (error) {
    console.error("Error adding periods for year:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

// Helper functions for date calculations
function getStartDateOfQuarter(year: number, quarter: number): string {
  const month = (quarter - 1) * 3;
  return new Date(year, month, 1).toISOString();
}

function getEndDateOfQuarter(startDate: string): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 3);
  date.setDate(0); // Last day of the month
  return date.toISOString();
}
