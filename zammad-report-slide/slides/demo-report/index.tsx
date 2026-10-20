import type { SlideMeta, Page } from '@open-slide/core';
import ticketsData from './mockTickets.json';
import { createReportSlides, design } from '../../themes/monthlyReportTemplate';

export const meta: SlideMeta = {
  title: 'IT Service Monthly Report (Demo)',
};

export { design };
export default createReportSlides(ticketsData as any[]);
