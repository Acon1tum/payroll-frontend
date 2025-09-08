import { Injectable } from '@angular/core';

export interface DtrEmployeeInfo {
  name: string;
  position: string;
  division: string;
  office: string;
}

export interface DtrRecordRow {
  day: number;
  amArrival?: string;
  amDeparture?: string;
  pmArrival?: string;
  pmDeparture?: string;
  underHours?: string;
  underMinutes?: string;
}

@Injectable({ providedIn: 'root' })
export class DtrPdfService {
  
  // Helper function to parse time string (e.g., "7:30 AM" or "07:30") to minutes since midnight
  private parseTimeToMinutes(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    
    // Remove AM/PM and trim
    const cleanTime = timeStr.replace(/\s*(AM|PM|am|pm)\s*/gi, '').trim();
    
    // Check if original string had PM
    const isPM = /PM/i.test(timeStr);
    
    // Parse hours and minutes
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    // Handle PM times (add 12 hours, except for 12 PM)
    if (isPM && hours !== 12) {
      hours += 12;
    }
    // Handle 12 AM (midnight)
    if (!isPM && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }
  
     // Helper function to calculate undertime based on expected schedule
   private calculateUndertime(
     amArrival?: string,
     amDeparture?: string,
     pmArrival?: string,
     pmDeparture?: string
   ): { hours: number; minutes: number } {
     // Standard government schedule (8:00 AM - 12:00 PM, 1:00 PM - 5:00 PM)
     const EXPECTED_AM_START = 8 * 60; // 8:00 AM
     const EXPECTED_AM_END = 12 * 60;   // 12:00 PM
     const EXPECTED_PM_START = 13 * 60; // 1:00 PM
     const EXPECTED_PM_END = 17 * 60;   // 5:00 PM
     const EXPECTED_DAILY_MINUTES = 8 * 60; // 8 hours
     
     let totalWorkedMinutes = 0;
     
     // Calculate morning session
     const amArrivalMin = this.parseTimeToMinutes(amArrival);
     const amDepartureMin = this.parseTimeToMinutes(amDeparture);
     
     if (amArrivalMin !== null && amDepartureMin !== null) {
       // Calculate actual worked time in morning
       const morningWorked = Math.max(0, amDepartureMin - amArrivalMin);
       totalWorkedMinutes += morningWorked;
     }
     
     // Calculate afternoon session
     const pmArrivalMin = this.parseTimeToMinutes(pmArrival);
     const pmDepartureMin = this.parseTimeToMinutes(pmDeparture);
     
     if (pmArrivalMin !== null && pmDepartureMin !== null) {
       // Calculate actual worked time in afternoon
       const afternoonWorked = Math.max(0, pmDepartureMin - pmArrivalMin);
       totalWorkedMinutes += afternoonWorked;
     }
     
     // Calculate undertime (only if we have some work recorded)
     if (totalWorkedMinutes > 0) {
       const undertimeMinutes = Math.max(0, EXPECTED_DAILY_MINUTES - totalWorkedMinutes);
       return {
         hours: Math.floor(undertimeMinutes / 60),
         minutes: undertimeMinutes % 60
       };
     }
     
     return { hours: 0, minutes: 0 };
   }
  
  // Helper function to clean time display (remove AM/PM)
  private cleanTimeDisplay(timeStr: string | undefined): string {
    if (!timeStr) return '';
    return timeStr.replace(/\s*(AM|PM|am|pm)\s*/gi, '').trim();
  }

  generateDTR(
    employee: DtrEmployeeInfo,
    month: string,
    records: DtrRecordRow[]
  ): void {
    // Lazy-load pdfmake
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('pdfmake/build/pdfmake.js').then(async (pdfMakeModule: any) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts.js');
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      pdfMake.vfs =
        pdfFonts.pdfMake && pdfFonts.pdfMake.vfs
          ? pdfFonts.pdfMake.vfs
          : pdfFonts.vfs;

      const daysInMonth = 31;
      const recordsByDay = new Map<number, DtrRecordRow>();
      for (const r of records) recordsByDay.set(r.day, r);

      let totalUnderHours = 0;
      let totalUnderMinutes = 0;

      const makeRows = () => {
        const rows: any[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const rec = recordsByDay.get(day);
          
          // Calculate undertime based on actual time entries
          let underHours = 0;
          let underMinutes = 0;
          
          if (rec && (rec.amArrival || rec.amDeparture || rec.pmArrival || rec.pmDeparture)) {
            const undertime = this.calculateUndertime(
              rec.amArrival,
              rec.amDeparture,
              rec.pmArrival,
              rec.pmDeparture
            );
            underHours = undertime.hours;
            underMinutes = undertime.minutes;
          }
          
          totalUnderHours += underHours;
          totalUnderMinutes += underMinutes;

          rows.push([
            { text: String(day), alignment: 'center', fontSize: 7 },
            { text: this.cleanTimeDisplay(rec?.amArrival), alignment: 'center', fontSize: 7 },
            { text: this.cleanTimeDisplay(rec?.amDeparture), alignment: 'center', fontSize: 7 },
            { text: this.cleanTimeDisplay(rec?.pmArrival), alignment: 'center', fontSize: 7 },
            { text: this.cleanTimeDisplay(rec?.pmDeparture), alignment: 'center', fontSize: 7 },
                         { text: underHours > 0 ? String(underHours) : '', alignment: 'center', fontSize: 7 },
             { text: (underHours > 0 || underMinutes > 0) ? String(underMinutes) : '', alignment: 'center', fontSize: 7 },
          ]);
        }
        return rows;
      };

      // Handle minutes overflow to hours
      totalUnderHours += Math.floor(totalUnderMinutes / 60);
      totalUnderMinutes = totalUnderMinutes % 60;

      const createTable = (rows: any[]) => ({
        width: '100%',
        alignment: 'center',
        table: {
          headerRows: 2,
          widths: [20, 30, 30, 30, 30, 25, 25],
          body: [
                         // First header row with merged cells
             [
               { text: 'Day', rowSpan: 2, style: 'tableHeader', alignment: 'center', margin: [0, 8, 0, 0] },
               { text: 'A.M.', colSpan: 2, style: 'tableHeader', alignment: 'center' },
               {},
               { text: 'P.M.', colSpan: 2, style: 'tableHeader', alignment: 'center' },
               {},
               { text: 'Undertime', colSpan: 2, style: 'tableHeader', alignment: 'center' },
               {}
             ],
             // Second header row
             [
               {},
               { text: 'Arrival', style: 'tableHeader', alignment: 'center' },
               { text: 'Depar-\nture', style: 'tableHeader', alignment: 'center' },
               { text: 'Arrival', style: 'tableHeader', alignment: 'center' },
               { text: 'Depar-\nture', style: 'tableHeader', alignment: 'center' },
               { text: 'Hours', style: 'tableHeader', alignment: 'center' },
               { text: 'Min-\nutes', style: 'tableHeader', alignment: 'center' }
             ],
            ...rows,
            [
              { text: 'Total', colSpan: 5, alignment: 'right', bold: true, fontSize: 7 },
              {}, {}, {}, {},
              { text: String(totalUnderHours), alignment: 'center', bold: true, fontSize: 7 },
              { text: String(totalUnderMinutes).padStart(2, '0'), alignment: 'center', bold: true, fontSize: 7 },
            ],
          ],
        },
        layout: {
          hLineColor: () => '#000',
          vLineColor: () => '#000',
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingTop: () => 2,
          paddingBottom: () => 2,
          paddingLeft: () => 2,
          paddingRight: () => 2,
        },
      });

      const createSection = () => ({
        stack: [
        { text: 'Civil Service Form No. 48', style: 'headerSmall', margin: [0, 0, 0, 6] },
        { text: 'DAILY TIME RECORD', style: 'title', margin: [0, 0, 0, 2] },
        { text: '-----o0o-----', style: 'subtitle', margin: [0, 0, 0, 4] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 1 }], margin: [0, 2, 0, 2] },
        { text: `(${employee.name || 'Name'})`, alignment: 'center', italics: true, margin: [0, 2, 0, 6] },
        {
          columns: [
            { text: 'For the month of', width: 'auto', style: 'meta' },
            { text: month, width: 100, style: 'meta', decoration: 'underline' },
          ],
          columnGap: 6,
          margin: [0, 0, 0, 2],
        },
        {
          columns: [
            { text: 'Official hours for arrival', width: '*', style: 'meta' },
            { text: 'Regular days', width: 'auto', style: 'meta' },
            { text: '________________', width: 80, style: 'meta' },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 2],
        },
        {
          columns: [
            { text: 'and departure', width: '*', style: 'meta' },
            { text: 'Saturdays', width: 'auto', style: 'meta' },
            { text: '________________', width: 80, style: 'meta' },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 6],
        },
        createTable(makeRows()),
        {
          text: 'I certify on my honor that the above is a true and correct report of the\nhours of work performed, record of which was made daily at the time\nof arrival and departure from office.',
          style: 'certText',
          margin: [0, 12, 0, 6],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 1 }], margin: [0, 8, 0, 4] },
        { text: 'VERIFIED as to the prescribed office hours:', style: 'certText', margin: [0, 10, 0, 6] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 1 }], margin: [0, 8, 0, 4] },
        { text: 'In Charge', alignment: 'center', margin: [0, 10, 0, 2] },
        { text: '(SEE INSTRUCTION ON BACK)', alignment: 'center', fontSize: 6, italics: true },
        ],
        alignment: 'center'
      });

      const docDefinition: any = {
        pageSize: 'LETTER',
        pageMargins: [30, 20, 30, 20],
        footer: () => ({
          columns: [
            { text: 'HRDD-EXT-008 rev0', alignment: 'center', fontSize: 6, bold: true },
          ],
          margin: [0, 5, 0, 0],
        }),
        content: [
          {
            columns: [
              { ...createSection(), width: '45%' },
              { width: '10%', text: '' },
              { ...createSection(), width: '45%' },
            ],
            alignment: 'center',
            margin: [0, 0, 0, 0]
          },
        ],
        styles: {
          headerSmall: { fontSize: 7, alignment: 'center' },
          title: { bold: true, alignment: 'center', fontSize: 9 },
          subtitle: { alignment: 'center', fontSize: 7 },
          meta: { alignment: 'left', fontSize: 7 },
          tableHeader: { bold: true, fontSize: 7 },
          certText: { alignment: 'left', fontSize: 7 },
        },
      };

      const safe = (s: string) => (s || '').toString().replace(/[^a-z0-9_-]/gi, '_');
      const fileName = `${safe('DTR')}_${safe(employee.name || 'Employee')}_${safe(month)}.pdf`;
      
      console.log('Generating DTR PDF with data:', {
        employee: employee.name,
        month,
        recordsCount: records.length,
        docDefinition: docDefinition
      });
      
      pdfMake.createPdf(docDefinition).download(fileName);
    }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load pdfmake:', err);
      alert('Failed to load PDF generator. Please try again.');
    });
  }
}