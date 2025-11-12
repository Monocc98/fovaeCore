import { MONTHS } from "./constants.helper";

export const makeFiscalCalendar = (startMonth: number) => {
const startIdx = (startMonth - 1 + 12) % 12;
const header = [...MONTHS.slice(startIdx), ...MONTHS.slice(0, startIdx)];
const fiscalPosToCalendar = (pos: number) => ((startIdx + (pos - 1)) % 12) + 1;
const calendarToFiscalPos = (cal: number) => ((cal - startMonth + 12) % 12) + 1;
return { header, fiscalPosToCalendar, calendarToFiscalPos };
};


export const computeStartYear = (isoStart?: string | Date) => {
const d = isoStart ? new Date(isoStart) : null;
return d && !isNaN(d.getTime()) ? d.getUTCFullYear() : new Date().getUTCFullYear();
};


export const yearForCalendarMonth = (calMonth: number, startMonth: number, startYear: number) =>
calMonth >= startMonth ? startYear : startYear + 1;