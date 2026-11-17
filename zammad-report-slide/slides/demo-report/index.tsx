import type { SlideMeta } from '@open-slide/core';
import ticketsData from './mockTickets.json';
import { createReportSlides, design, transition } from '../../themes/monthlyReportTemplate';

export const meta: SlideMeta = {
  title: 'IT Service Monthly Report (Demo)',
  theme: 'isometric',
};

export { design, transition };
export default createReportSlides(ticketsData as any[]);
