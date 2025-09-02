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
  generateDTR(
    employee: DtrEmployeeInfo,
    month: string,
    records: DtrRecordRow[]
  ): void {
    // Lazy-load pdfmake with explicit .js extensions for Vite compatibility
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('pdfmake/build/pdfmake.js').then(async (pdfMakeModule: any) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts.js');
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      pdfMake.vfs = (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

      const daysInMonth = 31; // As requested, always render 1-31

      const rows: any[] = [];

      const recordsByDay = new Map<number, DtrRecordRow>();
      for (const r of records) recordsByDay.set(r.day, r);

      // Accumulate undertime totals
      let totalUnderHours = 0;
      let totalUnderMinutes = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const rec = recordsByDay.get(day);
        const uh = Number(rec?.underHours || 0);
        const um = Number(rec?.underMinutes || 0);
        totalUnderHours += isNaN(uh) ? 0 : uh;
        totalUnderMinutes += isNaN(um) ? 0 : um;

        rows.push([
          { text: String(day), alignment: 'center' },
          { text: rec?.amArrival || '', alignment: 'center' },
          { text: rec?.amDeparture || '', alignment: 'center' },
          { text: rec?.pmArrival || '', alignment: 'center' },
          { text: rec?.pmDeparture || '', alignment: 'center' },
          { text: rec?.underHours || '', alignment: 'center' },
          { text: rec?.underMinutes || '', alignment: 'center' }
        ]);
      }

      // Normalize undertime minutes to hours/minutes
      totalUnderHours += Math.floor(totalUnderMinutes / 60);
      totalUnderMinutes = totalUnderMinutes % 60;

      const docDefinition: any = {
        pageSize: 'LETTER',
        pageMargins: [40, 40, 40, 40],
        footer: (currentPage: number, pageCount: number) => ({
          columns: [
            { text: 'HRDD-EXT-008 rev0', alignment: 'center', fontSize: 9, bold: true }
          ],
          margin: [0, 10, 0, 0]
        }),
        content: [
          // Header block to mimic official form
          { text: 'Civil Service Form No. 48', style: 'headerSmall', alignment: 'left', margin: [0, 0, 0, 4] },
          { text: 'DAILY TIME RECORD', style: 'title', margin: [0, 0, 0, 2] },
          { text: '----o0o----', style: 'subtitle', margin: [0, 0, 0, 8] },
          { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 } ] },
          { text: `(${employee.name || 'Name'})`, alignment: 'center', italics: true, margin: [0, 4, 0, 10] },

          // Month and official hours lines
          { columns: [ { text: 'For the month of', width: 'auto', style: 'meta' }, { text: month, width: 200, style: 'meta', decoration: 'underline' } ], columnGap: 8, margin: [0, 0, 0, 4] },
          { columns: [ { text: 'Official hours for arrival and departure', width: '*', style: 'meta' }, { text: 'Regular days  __________________', width: 'auto', style: 'meta', alignment: 'right' }, { text: 'Saturdays  __________________', width: 'auto', style: 'meta', alignment: 'right' } ], columnGap: 12, margin: [0, 0, 0, 10] },

          // Official hours section
          //{
            //text: 'OFFICIAL HOURS FOR ARRIVAL AND DEPARTURE',
            //style: 'subheader',
           // margin: [0, 4, 0, 2]
          //},
          //{
            //text: 'Regular days: ____ to ____    Saturdays: ____ to ____',
            //style: 'meta',
           //margin: [0, 0, 0, 10]
         //},

          // Table
          {
            table: {
              headerRows: 1,
              widths: [
                40, // Day
                '*', '*', '*', '*', // AM/PM columns
                60, 70 // Under H/M
              ],
              body: [
                [
                  { text: 'Day', style: 'tableHeader', alignment: 'center' },
                  { text: 'A.M. Arrival', style: 'tableHeader', alignment: 'center' },
                  { text: 'A.M. Departure', style: 'tableHeader', alignment: 'center' },
                  { text: 'P.M. Arrival', style: 'tableHeader', alignment: 'center' },
                  { text: 'P.M. Departure', style: 'tableHeader', alignment: 'center' },
                  { text: 'Undertime Hours', style: 'tableHeader', alignment: 'center' },
                  { text: 'Undertime Minutes', style: 'tableHeader', alignment: 'center' }
                ],
                ...rows,
                [
                  { text: 'Total', colSpan: 5, alignment: 'right', bold: true }, {}, {}, {}, {},
                  { text: String(totalUnderHours), alignment: 'center', bold: true },
                  { text: String(totalUnderMinutes).padStart(2, '0'), alignment: 'center', bold: true }
                ]
              ]
            },
            layout: {
              hLineColor: () => '#BBBBBB',
              vLineColor: () => '#BBBBBB',
              paddingTop: () => 4,
              paddingBottom: () => 4
            }
          },

         // Certification and verification with full-width signature lines
{
  text: 'I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.',
  style: 'certText',
  margin: [0, 30, 0, 12]
},
{
  canvas: [
    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 }
  ],
  margin: [0, 20, 0, 4]
},

{ text: 'VERIFIED as to the prescribed office hours:', style: 'certText', margin: [0, 20, 0, 6] },
{
  canvas: [
    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 }
  ],
  margin: [0, 20, 0, 4]
},

{ text: 'In Charge', alignment: 'center', margin: [0, 8, 0, 4] },
{ text: '(SEE INSTRUCTION ON BACK)', alignment: 'center', fontSize: 9, italics: true }

        ],
        styles: {
          headerSmall: { alignment: 'left', fontSize: 10 },
          header: { bold: true, alignment: 'center', fontSize: 12 },
          title: { bold: true, alignment: 'center', fontSize: 14 },
          subtitle: { alignment: 'center', fontSize: 10 },
          subheader: { bold: true, alignment: 'left', fontSize: 10 },
          meta: { alignment: 'left', fontSize: 10 },
          tableHeader: { bold: true, fontSize: 9 },
          certText: { alignment: 'left', fontSize: 10 }
        }
      };

      const safe = (s: string) => (s || '').toString().replace(/[^a-z0-9_-]/gi, '_');
      const fileName = `${safe('DTR')}_${safe(employee.name || 'Employee')}_${safe(month)}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
    }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load pdfmake:', err);
      alert('Failed to load PDF generator. Please try again.');
    });
  }
}


