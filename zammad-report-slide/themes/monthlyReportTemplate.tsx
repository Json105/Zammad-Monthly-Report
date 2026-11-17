import coverImg from '@assets/isometric/cover-city.jpg';
import thanksImg from '@assets/isometric/thanks.jpg';
import {
  type DesignSystem,
  type Page,
  type SlideTransition,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

// --- Webfont setup (Merriweather Sans + Noto Sans TC) ---
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@400;500;700;800&family=Noto+Sans+TC:wght@400;500;700;800&display=swap';
const FONT_LINK_ID = 'osd-webfont-isometric-monthly-report';
if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;

  const PRINT_STYLE_ID = 'osd-print-style-isometric-monthly-report';
  if (!document.getElementById(PRINT_STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = PRINT_STYLE_ID;
    styleEl.textContent = '@media print { .osd-no-print { display: none !important; } }';
    document.head.appendChild(styleEl);
  }
}

// --- Corporate Isometric Design System ---
export const design: DesignSystem = {
  palette: {
    bg: '#FFFEEF',
    text: '#00418F',
    accent: '#1368C9',
  },
  fonts: {
    display: '"Merriweather Sans", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
    body: '"Merriweather Sans", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
  },
  typeScale: {
    hero: 112,
    body: 34,
  },
  radius: 16,
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const C = {
  navy: '#00418F',
  blue: '#1368C9',
  ink: '#17191B',
  muted: '#5B6B85',
  sky: '#3FA1E6',
  cyan: '#AAFFFE',
  card: '#FFFFFF',
  line: '#C9D3E6',
  brand: '#252571',
  red: '#D9363E',
  amber: '#F2A900',
  green: '#2DA44E',
};

const gridBg: CSSProperties = {
  backgroundColor: 'var(--osd-bg)',
  backgroundImage:
    'repeating-linear-gradient(30deg, rgba(110,104,80,0.13) 0 1.5px, transparent 1.5px 72px), repeating-linear-gradient(150deg, rgba(110,104,80,0.13) 0 1.5px, transparent 1.5px 72px)',
};

const fill: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
};

const bgImg: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

// Generic Isometric Cube Mark (portfolio-safe brand emblem)
const LogoMark = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-label="IT Service Portal">
    <polygon points="32,6 56,19 32,32 8,19" fill={C.sky} />
    <polygon points="8,19 32,32 32,58 8,45" fill={C.blue} />
    <polygon points="56,19 56,45 32,58 32,32" fill={C.navy} />
    <path
      d="M32 6 L56 19 L56 45 L32 58 L8 45 L8 19 Z M8 19 L32 32 L56 19 M32 32 L32 58"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const LogoLockup = ({ size = 56 }: { size?: number }) => {
  const brandName = (import.meta as any).env?.VITE_BRAND_NAME || 'IT Service Portal';
  const orgName = (import.meta as any).env?.VITE_ORG_NAME || 'Enterprise IT Operations';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: 'var(--osd-font-display)', fontWeight: 800, fontSize: size * 0.54, color: C.ink }}>
          {brandName}
        </div>
        <div style={{ fontWeight: 700, fontSize: size * 0.24, letterSpacing: '0.1em', color: C.muted, marginTop: size * 0.1 }}>
          {orgName}
        </div>
      </div>
    </div>
  );
};

const Pill = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 58,
      padding: '0 32px',
      border: `2.5px solid ${C.navy}`,
      borderRadius: 999,
      background: C.card,
      color: C.navy,
      fontFamily: 'var(--osd-font-display)',
      fontWeight: 800,
      fontSize: 28,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const NumBadge = ({ n, size = 58 }: { n: ReactNode; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: C.navy,
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--osd-font-display)',
      fontWeight: 800,
      fontSize: size * 0.48,
      flexShrink: 0,
    }}
  >
    {n}
  </div>
);

const Header = ({ label, n }: { label: ReactNode; n?: ReactNode }) => (
  <div style={{ position: 'absolute', top: 64, left: 100, display: 'flex', alignItems: 'center', gap: 18 }}>
    {n !== undefined && <NumBadge n={n} />}
    <Pill>{label}</Pill>
  </div>
);

const Title = ({ children, top = 156 }: { children: ReactNode; top?: number }) => (
  <h1
    style={{
      position: 'absolute',
      top,
      left: 100,
      right: 100,
      margin: 0,
      fontFamily: 'var(--osd-font-display)',
      fontSize: 60,
      fontWeight: 800,
      lineHeight: 1.2,
      color: 'var(--osd-text)',
    }}
  >
    {children}
  </h1>
);

const Card = ({
  title,
  children,
  highlight = false,
  style,
}: {
  title?: ReactNode;
  children?: ReactNode;
  highlight?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      background: highlight ? '#F2FFFF' : C.card,
      border: `2px solid ${highlight ? C.blue : C.navy}`,
      borderRadius: 'var(--osd-radius)',
      padding: '28px 34px',
      boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
      ...style,
    }}
  >
    {title && (
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 800,
          fontSize: 30,
          lineHeight: 1.25,
          color: C.navy,
          marginBottom: children ? 14 : 0,
        }}
      >
        {title}
      </div>
    )}
    {children && <div style={{ fontSize: 28, lineHeight: 1.5, color: C.ink }}>{children}</div>}
  </div>
);

const Footer = ({ year = '2026' }: { year?: string }) => {
  const { current, total } = useSlidePageNumber();
  const orgName = (import.meta as any).env?.VITE_ORG_NAME || 'IT Service Operations';
  return (
    <div
      style={{
        position: 'absolute',
        left: 100,
        right: 100,
        bottom: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 22,
        fontWeight: 500,
        color: C.muted,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <LogoMark size={30} />
        <span>© {year} {orgName}. All rights reserved.</span>
      </div>
      <span style={{ fontFamily: 'var(--osd-font-display)', fontWeight: 800, color: C.navy }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Dot = ({ color }: { color: string }) => (
  <span
    style={{
      display: 'inline-block',
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: color,
      marginRight: 12,
      verticalAlign: 'middle',
      flexShrink: 0,
    }}
  />
);

const th: CSSProperties = {
  background: C.navy,
  color: '#FFFFFF',
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 800,
  fontSize: 26,
  padding: '16px 24px',
  textAlign: 'left',
};

const td: CSSProperties = {
  background: C.card,
  color: C.ink,
  fontSize: 25,
  lineHeight: 1.4,
  padding: '16px 24px',
  borderBottom: `1.5px solid ${C.line}`,
  verticalAlign: 'middle',
};

const tableWrap: CSSProperties = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  width: '100%',
  border: `2px solid ${C.navy}`,
  borderRadius: 'var(--osd-radius)',
  overflow: 'hidden',
  boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
};

// Blue-centric corporate chart series palette (no neon/off-brand colors)
const CHART_BLUE_SERIES = [
  '#1368C9',
  '#00418F',
  '#3FA1E6',
  '#0E7490',
  '#2563EB',
  '#5B6B85',
  '#2DA44E',
  '#F2A900',
  '#D9363E',
];

// Others -> General Support
const GROUP_DISPLAY_NAME: Record<string, string> = {
  'Others': 'General Support',
};

// Status colors strictly aligned with traffic-light semantics
const STATUS_COLORS: Record<string, string> = {
  'closed': C.green,
  'Work in Progress (本月)': C.amber,
  'Work in Progress (過去)': C.red,
  'Work in Progress': C.amber,
};

// Service domain mapping (must stay aligned with zammad_utils/report_metrics.py)
const DOMAIN_MAP: Record<string, string> = {
  'ERP / Core': 'ERP 與業務系統',
  'ERP System': 'ERP 與業務系統',
  'Software': '電腦硬體與辦公軟體',
  'Hardware': '電腦硬體與辦公軟體',
  'Peripherals & Printing': '電腦硬體與辦公軟體',
  'Email Security': '資安防護與帳號權限',
  'Security': '資安防護與帳號權限',
  'Account & Access': '資安防護與帳號權限',
  'On/Offboarding': '資安防護與帳號權限',
  'Network': '辦公網路與通訊設備',
  'IP-Phone': '辦公網路與通訊設備',
  'Development': '辦公網路與通訊設備',
  'IT Request & Project': '辦公網路與通訊設備',
  'Others': '日常維運與行政事務',
  'Users / General': '日常維運與行政事務',
  'General Support': '日常維運與行政事務',
};

const DOMAIN_COLORS: Record<string, string> = {
  'ERP 與業務系統': C.amber,
  '電腦硬體與辦公軟體': C.blue,
  '資安防護與帳號權限': C.red,
  '辦公網路與通訊設備': C.sky,
  '日常維運與行政事務': C.navy,
};

function chunkItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

// --- Ticket Data Aggregation Helper (Single source of truth for slide deck) ---
export function aggregateTicketData(ticketsData: any[]) {
  // 1. 排除 merged 重複計算工單，取得真實有效服務工單
  const excludedTickets = ticketsData
    .filter((t: any) => (t['狀態'] || '').toLowerCase() === 'merged')
    .map((t: any) => ({
      ...t,
      是否計入有效工單: '否 (merged 排除)',
    }));
  const validTickets = ticketsData.filter((t: any) => (t['狀態'] || '').toLowerCase() !== 'merged');
  const totalTickets = validTickets.length;
  const totalRaw = ticketsData.length;

  let reportMonth = '本月';
  let reportYear = '2026';
  let targetYM = '';
  if (validTickets.length > 0) {
    const ymCounts = new Map<string, number>();
    validTickets.forEach((t: any) => {
      const d = t['建立時間'] || t['最後更新時間'];
      if (d && d.length >= 7) {
        const ym = d.slice(0, 7);
        ymCounts.set(ym, (ymCounts.get(ym) || 0) + 1);
      }
    });
    let maxCount = 0;
    ymCounts.forEach((c, ym) => {
      if (c > maxCount) {
        maxCount = c;
        targetYM = ym;
      }
    });
    if (targetYM) {
      const [year, month] = targetYM.split('-');
      reportYear = year;
      reportMonth = `${year} 年 ${month} 月`;
    }
  }

  const statusMap = new Map<string, number>();
  const groupMap = new Map<string, number>();
  const domainMap = new Map<string, number>();

  const featuredTickets: any[] = [];
  const sopTickets: any[] = [];
  const inProgressTickets: any[] = [];
  const validAuditTickets: any[] = [];
  let closedCount = 0;
  let newUnclosedCount = 0;
  let accumulatedUnclosedCount = 0;
  let emailSecurityCount = 0;
  let currentMonthSourceCount = 0;
  let crossMonthClosedSourceCount = 0;
  let historicalOpenSourceCount = 0;

  validTickets.forEach((t: any) => {
    const rawStatus = (t['狀態'] || 'Unknown').trim().toLowerCase();
    const rawGroup = t['群組'] || 'Unknown';
    const displayGroup = GROUP_DISPLAY_NAME[rawGroup] || rawGroup;
    const tags = t['標籤'] || '';
    const title = t['主旨'] || '';
    const isCurrentMonth = targetYM ? t['建立時間']?.startsWith(targetYM) : false;

    let displayStatus = 'closed';
    let dataSource = '當月新進';
    if (rawStatus === 'closed') {
      displayStatus = 'closed';
      closedCount++;
      statusMap.set('closed', (statusMap.get('closed') || 0) + 1);
      if (isCurrentMonth) {
        dataSource = '當月新進';
        currentMonthSourceCount++;
      } else {
        dataSource = '跨月結案/異動';
        crossMonthClosedSourceCount++;
      }
    } else {
      if (isCurrentMonth) {
        displayStatus = 'Work in Progress (本月)';
        newUnclosedCount++;
        dataSource = '當月新進';
        currentMonthSourceCount++;
      } else {
        displayStatus = 'Work in Progress (過去)';
        accumulatedUnclosedCount++;
        dataSource = '歷史在辦';
        historicalOpenSourceCount++;
      }
      statusMap.set(displayStatus, (statusMap.get(displayStatus) || 0) + 1);
    }

    groupMap.set(displayGroup, (groupMap.get(displayGroup) || 0) + 1);

    const domain = DOMAIN_MAP[rawGroup] || '日常維運與行政事務';
    domainMap.set(domain, (domainMap.get(domain) || 0) + 1);

    const isEmailSec = rawGroup === 'Email Security';
    if (isEmailSec) {
      emailSecurityCount++;
    }

    if (rawStatus !== 'closed') {
      inProgressTickets.push({
        ...t,
        displayGroup,
        displayStatus,
        isAccumulated: !isCurrentMonth,
      });
    }

    const hqEmail = ((import.meta as any).env?.VITE_HQ_EMAIL || '').trim().toLowerCase();
    const requesterLower = (t['提單人'] || '').trim().toLowerCase();
    const isFeatured = Boolean(
      (hqEmail && (tags.toLowerCase().includes(hqEmail) || requesterLower === hqEmail)) ||
        requesterLower.includes('group-it support')
    );
    if (isFeatured) {
      featuredTickets.push({ ...t, displayGroup, displayStatus });
    }

    const isSop = title.toUpperCase().includes('SOP');
    if (isSop) {
      sopTickets.push({ ...t, displayGroup, displayStatus });
    }

    validAuditTickets.push({
      ...t,
      是否計入有效工單: '是',
      簡報狀態分類: displayStatus,
      簡報服務類別: displayGroup,
      IT服務領域: domain,
      資安郵件: isEmailSec ? '是' : '否',
      SOP工單: isSop ? '是' : '否',
      總部支援: isFeatured ? '是' : '否',
      資料來源: dataSource,
    });
  });

  validAuditTickets.sort((a, b) => {
    const sCmp = (a['簡報狀態分類'] || '').localeCompare(b['簡報狀態分類'] || '');
    if (sCmp !== 0) return sCmp;
    return (b['建立時間'] || '').localeCompare(a['建立時間'] || '');
  });

inProgressTickets.sort((a, b) => {
  if (a.isAccumulated && !b.isAccumulated) return -1;
  if (!a.isAccumulated && b.isAccumulated) return 1;
  return (b['建立時間'] || '').localeCompare(a['建立時間'] || '');
});

const resolutionRate = totalTickets > 0 ? ((closedCount / totalTickets) * 100).toFixed(1) : '0.0';

const statusData = Array.from(statusMap.entries())
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => {
    if (a.name === 'closed') return -1;
    if (b.name === 'closed') return 1;
    return b.value - a.value;
  });

const groupData = Array.from(groupMap.entries())
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

const domainData = Array.from(domainMap.entries())
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

// --- Dynamic Monthly Milestones (clean minimalist style) ---
const dynamicMilestones: { tag: string; text: string; color: string }[] = [];

if (accumulatedUnclosedCount > 0) {
  dynamicMilestones.push({
    tag: '積壓清理',
    text: `優先排程處理並結案 ${accumulatedUnclosedCount} 筆過去累積之 Work in Progress 工單`,
    color: C.red,
  });
}

const newUnclosedList = inProgressTickets.filter((t) => !t.isAccumulated);
if (newUnclosedList.length === 1) {
  const single = newUnclosedList[0];
  const cleanSubj = single['主旨']?.length > 30 ? single['主旨'].slice(0, 30) + '...' : single['主旨'];
  dynamicMilestones.push({
    tag: '當月追蹤',
    text: `持續追蹤並完成本月 Work in Progress 工單：#${single['工單編號']} ${cleanSubj}`,
    color: C.amber,
  });
} else if (newUnclosedList.length > 1) {
  dynamicMilestones.push({
    tag: '當月追蹤',
    text: `追蹤並完成本月新開 ${newUnclosedList.length} 筆 Work in Progress 工單之後續處理與驗收`,
    color: C.amber,
  });
}

if (sopTickets.length > 0) {
  dynamicMilestones.push({
    tag: '標準規範',
    text: `推動 IT 服務標準化，落實並宣導當月發起之 ${sopTickets.length} 項 SOP 作業規範`,
    color: C.green,
  });
}

const onboardingCount = validTickets.filter(
  (t: any) =>
    t['群組'] === 'On/Offboarding' ||
    (t['主旨'] &&
      (t['主旨'].includes('新人') ||
        t['主旨'].includes('報到') ||
        t['主旨'].includes('離職') ||
        t['主旨'].includes('Offboarding')))
).length;

if (onboardingCount > 0) {
  dynamicMilestones.push({
    tag: '人員異動',
    text: `配合新進與調職同仁之辦公環境部署與帳號權限設定（本月 ${onboardingCount} 筆）`,
    color: C.blue,
  });
}

const hardwareCount = validTickets.filter(
  (t: any) => t['群組'] === 'Hardware' || t['群組'] === 'Peripherals & Printing'
).length;
if (hardwareCount >= 3) {
  dynamicMilestones.push({
    tag: '設備維運',
    text: `落實同仁電腦硬體設備維護、定期健檢與 IT 備品庫存盤點（本月 ${hardwareCount} 筆）`,
    color: C.navy,
  });
}

const softwareCount = validTickets.filter((t: any) => t['群組'] === 'Software').length;
if (softwareCount >= 3 && dynamicMilestones.length < 5) {
  dynamicMilestones.push({
    tag: '授權優化',
    text: `盤點與優化常用辦公軟體授權 (License) 與軟體配置流程（本月 ${softwareCount} 筆）`,
    color: C.sky,
  });
}

if (dynamicMilestones.length === 0) {
  dynamicMilestones.push({
    tag: '品質維護',
    text: '落實當月 100% 結案之各項服務滿意度追蹤與 IT 基礎維運巡檢',
    color: C.green,
  });
  dynamicMilestones.push({
    tag: '流程規範',
    text: '梳理高頻 IT 服務問題，制定並完善常見問題排除之標準作業程序 (SOP)',
    color: C.blue,
  });
}

const finalMilestones = dynamicMilestones.slice(0, 5);

  return {
    totalTickets,
    totalRaw,
    targetYM,
    reportMonth,
    reportYear,
    statusData,
    groupData,
    domainData,
    featuredTickets,
    sopTickets,
    inProgressTickets,
    validAuditTickets,
    excludedTickets,
    sourceCounts: {
      currentMonth: currentMonthSourceCount,
      crossMonthClosed: crossMonthClosedSourceCount,
      historicalOpen: historicalOpenSourceCount,
    },
    newUnclosedCount,
    accumulatedUnclosedCount,
    resolutionRate,
    closedCount,
    emailSecurityCount,
    finalMilestones,
  };
}

export interface ReportSlideOptions {
  excelReportUrl?: string;
  excelFilename?: string;
}

// --- Factory function to generate isometric slides from any tickets array ---
export function createReportSlides(ticketsData: any[], options?: ReportSlideOptions): Page[] {
  const aggregated = aggregateTicketData(ticketsData);
  const useAggregatedData = () => aggregated;
  const excelReportUrl = options?.excelReportUrl;
  const excelFilename =
    options?.excelFilename ||
    (aggregated.targetYM ? `Zammad_Report_${aggregated.targetYM}.xlsx` : 'Zammad_Report.xlsx');

  const actionBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    height: 54,
    padding: '0 24px',
    borderRadius: 999,
    border: `2.5px solid ${C.navy}`,
    background: C.card,
    color: C.navy,
    fontFamily: 'var(--osd-font-display)',
    fontWeight: 800,
    fontSize: 22,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 4px 0 rgba(0,65,143,0.08)',
    whiteSpace: 'nowrap',
  };

  const primaryBtnStyle: CSSProperties = {
    ...actionBtnStyle,
    background: C.navy,
    color: '#FFFFFF',
  };

  // Interactive Excel Table Modal rendered inside the same Open-Slide window
  const ExcelPreviewModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [tab, setTab] = useState<'valid' | 'excluded' | 'all'>('valid');
    const [sourceFilter, setSourceFilter] = useState<string>('全部');
    const [keyword, setKeyword] = useState<string>('');

    const allAuditRows = useMemo(
      () => [...aggregated.validAuditTickets, ...aggregated.excludedTickets],
      []
    );

    const activeRows = useMemo(() => {
      const base =
        tab === 'valid'
          ? aggregated.validAuditTickets
          : tab === 'excluded'
            ? aggregated.excludedTickets
            : allAuditRows;

      const kw = keyword.trim().toLowerCase();
      return base.filter((row: any) => {
        if (tab === 'valid' && sourceFilter !== '全部' && row['資料來源'] !== sourceFilter) {
          return false;
        }
        if (!kw) return true;
        const haystack = [
          row['工單編號'],
          row['主旨'],
          row['提單人'],
          row['處理人'],
          row['簡報服務類別'] || row['群組'],
          row['IT服務領域'],
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(kw);
      });
    }, [tab, sourceFilter, keyword, allAuditRows]);

    if (!open) return null;

    return (
      <div
        className="osd-no-print"
        data-wheel-nav-ignore="true"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onWheel={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: 'rgba(11, 19, 43, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 64px',
        }}
      >
        <div
          data-wheel-nav-ignore="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            background: '#FFFEEF',
            border: `3px solid ${C.navy}`,
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              background: C.navy,
              color: '#FFFFFF',
              padding: '20px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 32, fontWeight: 800 }}>
                Excel 報表資料驗證檢視 ({excelFilename})
              </div>
              <div style={{ fontSize: 20, color: '#DCEBFF', marginTop: 4 }}>
                有效服務工單 {aggregated.totalTickets} 筆 ｜ 已排除 merged {aggregated.excludedTickets.length} 筆 ｜ 總計 {aggregated.totalRaw} 筆
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {excelReportUrl && (
                <a
                  href={excelReportUrl}
                  download={excelFilename}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    ...actionBtnStyle,
                    background: C.cyan,
                    borderColor: '#FFFFFF',
                    color: C.navy,
                    height: 48,
                    fontSize: 20,
                  }}
                >
                  下載完整 Excel (.xlsx)
                </a>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{
                  ...actionBtnStyle,
                  height: 48,
                  fontSize: 20,
                  borderColor: '#FFFFFF',
                }}
              >
                關閉預覽
              </button>
            </div>
          </div>

          {/* Tabs & Filter Bar */}
          <div
            style={{
              padding: '16px 32px',
              background: C.card,
              borderBottom: `2px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {[
                { id: 'valid' as const, label: `有效服務工單 (${aggregated.totalTickets})` },
                { id: 'excluded' as const, label: `已排除 merged (${aggregated.excludedTickets.length})` },
                { id: 'all' as const, label: `全部工單 (${aggregated.totalRaw})` },
              ].map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    style={{
                      height: 44,
                      padding: '0 20px',
                      borderRadius: 999,
                      border: `2px solid ${C.navy}`,
                      background: active ? C.navy : C.card,
                      color: active ? '#FFFFFF' : C.navy,
                      fontFamily: 'var(--osd-font-display)',
                      fontWeight: 800,
                      fontSize: 20,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}

              {tab === 'valid' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                  {['全部', '當月新進', '跨月結案/異動', '歷史在辦'].map((src) => {
                    const active = sourceFilter === src;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setSourceFilter(src)}
                        style={{
                          height: 40,
                          padding: '0 16px',
                          borderRadius: 999,
                          border: `1.5px solid ${active ? C.blue : C.line}`,
                          background: active ? '#E8F3FF' : C.card,
                          color: active ? C.blue : C.ink,
                          fontWeight: 700,
                          fontSize: 18,
                          cursor: 'pointer',
                        }}
                      >
                        {src}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋工單編號、主旨、人員或類別..."
              style={{
                width: 360,
                height: 44,
                padding: '0 16px',
                borderRadius: 10,
                border: `2px solid ${C.navy}`,
                fontSize: 19,
                color: C.ink,
                background: '#FFFFFF',
                outline: 'none',
              }}
            />
          </div>

          {/* Scrollable Table Body */}
          <div
            data-wheel-nav-ignore="true"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'auto',
              padding: '20px 32px',
            }}
          >
            <table style={{ ...tableWrap, fontSize: 18 }}>
              <thead>
                <tr>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>工單編號</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px' }}>主旨</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>狀態</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>簡報狀態分類</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>簡報服務類別</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>IT 服務領域</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>資料來源</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>處理人</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>提單人</th>
                  <th style={{ ...th, fontSize: 19, padding: '12px 16px', whiteSpace: 'nowrap' }}>建立日</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r: any, idx: number) => {
                  const isExcluded = r['是否計入有效工單'] !== '是';
                  const rowStyle: CSSProperties = {
                    ...td,
                    fontSize: 18,
                    padding: '10px 16px',
                    background: isExcluded ? '#FFF1F2' : idx % 2 === 1 ? '#F8FBFF' : C.card,
                  };
                  return (
                    <tr key={`${r['工單編號']}-${idx}`}>
                      <td style={{ ...rowStyle, fontWeight: 800, color: C.blue, whiteSpace: 'nowrap' }}>
                        #{r['工單編號']}
                      </td>
                      <td style={{ ...rowStyle, maxWidth: 420, fontWeight: 600 }}>{r['主旨']}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['狀態']}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap', fontWeight: 700 }}>
                        {isExcluded ? '已排除 (merged)' : r['簡報狀態分類']}
                      </td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>
                        {r['簡報服務類別'] || r['群組']}
                      </td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['IT服務領域'] || '—'}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['資料來源'] || '—'}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['處理人']}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['提單人']}</td>
                      <td style={{ ...rowStyle, whiteSpace: 'nowrap' }}>{r['建立時間']}</td>
                    </tr>
                  );
                })}
                {activeRows.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>
                      查無符合篩選條件之工單資料。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Slide 1: Cover (cover-city.jpg + Hero Title + Pills + LogoLockup) ---
  const TitleSlide: Page = () => {
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const { reportMonth, totalTickets, resolutionRate } = useAggregatedData();
    const companyTitle =
      (import.meta as any).env?.VITE_COMPANY_NAME || 'ENTERPRISE IT SERVICE REPORT';

    return (
      <div style={fill}>
        <img src={coverImg} alt="" style={bgImg} />
        <div
          className="osd-no-print"
          style={{
            position: 'absolute',
            top: 48,
            right: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExcelModalOpen(true);
            }}
            style={actionBtnStyle}
          >
            檢視有效工單明細
          </button>
          {excelReportUrl && (
            <a
              href={excelReportUrl}
              download={excelFilename}
              onClick={(e) => e.stopPropagation()}
              style={primaryBtnStyle}
            >
              下載 Excel (.xlsx)
            </a>
          )}
        </div>
        <div style={{ position: 'absolute', top: 110, left: 100, width: 1060 }}>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: C.blue,
            }}
          >
            {companyTitle}
          </div>
          <h1
            style={{
              margin: '18px 0 0',
              fontFamily: 'var(--osd-font-display)',
              fontSize: 'var(--osd-size-hero)',
              fontWeight: 800,
              lineHeight: 1.12,
              color: C.navy,
            }}
          >
            IT Support
            <br />
            {reportMonth} 月報
          </h1>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 18,
              marginTop: 44,
            }}
          >
            <Pill>有效服務工單總計：{totalTickets} 筆</Pill>
            <Pill>當月結案率：{resolutionRate}%</Pill>
            <Pill>Monthly IT Operations Overview</Pill>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 100,
            bottom: 70,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 48,
          }}
        >
          <LogoLockup size={72} />
          <div style={{ fontSize: 26, fontWeight: 500, color: C.muted, paddingBottom: 6 }}>
            {reportMonth}
          </div>
        </div>
        <ExcelPreviewModal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
      </div>
    );
  };

  // --- Slide 2: Core Service Metrics ---
  const CoreMetricsSlide: Page = () => {
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const {
      totalTickets,
      resolutionRate,
      closedCount,
      emailSecurityCount,
      statusData,
      reportYear,
    } = useAggregatedData();

    return (
      <div style={{ ...fill, ...gridBg }}>
        <Header n={1} label="核心服務指標" />
        <div
          className="osd-no-print"
          style={{
            position: 'absolute',
            top: 64,
            right: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExcelModalOpen(true);
            }}
            style={actionBtnStyle}
          >
            檢視有效工單明細
          </button>
          {excelReportUrl && (
            <a
              href={excelReportUrl}
              download={excelFilename}
              onClick={(e) => e.stopPropagation()}
              style={primaryBtnStyle}
            >
              下載 Excel (.xlsx)
            </a>
          )}
        </div>
        <Title>當月維運總覽與工單結算</Title>

        {/* Top 3 KPI Cards */}
        <div
          style={{
            position: 'absolute',
            top: 262,
            left: 100,
            right: 100,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          <Card title="有效服務工單" highlight style={{ padding: '24px 32px' }}>
            <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 64, fontWeight: 800, color: C.blue, lineHeight: 1.1 }}>
              {totalTickets}
              <span style={{ fontSize: 28, marginLeft: 8, color: C.navy }}>筆</span>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>已排除 merged 重複工單</div>
          </Card>

          <Card title="當月結案率" style={{ padding: '24px 32px' }}>
            <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 64, fontWeight: 800, color: C.green, lineHeight: 1.1 }}>
              {resolutionRate}
              <span style={{ fontSize: 28, marginLeft: 6, color: C.navy }}>%</span>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>
              已結案 {closedCount} / {totalTickets} 筆
            </div>
          </Card>

          <Card title="資安與郵件防護" style={{ padding: '24px 32px' }}>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 64,
                fontWeight: 800,
                color: emailSecurityCount > 0 ? C.red : C.navy,
                lineHeight: 1.1,
              }}
            >
              {emailSecurityCount}
              <span style={{ fontSize: 28, marginLeft: 8, color: C.navy }}>筆</span>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>Email Security 異常與通報</div>
          </Card>
        </div>

        {/* Bottom Status Donut + Breakdown Card */}
        <div
          style={{
            position: 'absolute',
            top: 492,
            left: 100,
            right: 100,
            bottom: 112,
            background: C.card,
            border: `2px solid ${C.navy}`,
            borderRadius: 'var(--osd-radius)',
            padding: '24px 36px',
            boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 44,
          }}
        >
          <div style={{ flex: 1.15, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={135}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: C.muted, strokeWidth: 1.5 }}
                  style={{ fontSize: 20, outline: 'none', fill: C.navy, fontWeight: 700 }}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={STATUS_COLORS[entry.name] || C.blue}
                      style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: C.card,
                    border: `2px solid ${C.navy}`,
                    borderRadius: 12,
                    color: C.ink,
                    fontSize: 22,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 28,
                fontWeight: 800,
                color: C.navy,
                marginBottom: 4,
              }}
            >
              工單狀態結算
            </div>
            {statusData.map((s) => {
              const color = STATUS_COLORS[s.name] || C.blue;
              const pct = totalTickets > 0 ? ((s.value / totalTickets) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={s.name}
                  style={{
                    fontSize: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    background: '#FFFEEF',
                    borderRadius: 12,
                    border: `1.5px solid ${C.line}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Dot color={color} />
                    <span style={{ color: C.ink, fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--osd-font-display)', fontWeight: 800, color: C.navy }}>
                    {s.value} 筆{' '}
                    <span style={{ fontSize: 20, fontWeight: 500, color: C.muted }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Footer year={reportYear} />
        <ExcelPreviewModal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
      </div>
    );
  };

  // --- Slide 3: Service Group Breakdown ---
  const GroupSlide: Page = () => {
    const { groupData, reportYear } = useAggregatedData();

    return (
      <div style={{ ...fill, ...gridBg }}>
        <Header n={2} label="服務類別統計" />
        <Title>各服務類別工單分佈</Title>

        <div
          style={{
            position: 'absolute',
            top: 262,
            left: 100,
            right: 100,
            bottom: 112,
            background: C.card,
            border: `2px solid ${C.navy}`,
            borderRadius: 'var(--osd-radius)',
            padding: '28px 36px 12px',
            boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupData} margin={{ top: 36, right: 30, left: 10, bottom: 95 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={C.navy}
                tick={{ fill: C.ink, fontSize: 22, fontWeight: 600 }}
                angle={-30}
                textAnchor="end"
                height={115}
                tickMargin={14}
              />
              <YAxis stroke={C.navy} tick={{ fill: C.ink, fontSize: 22, fontWeight: 500 }} tickMargin={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: C.card,
                  border: `2px solid ${C.navy}`,
                  borderRadius: 12,
                  color: C.ink,
                  fontSize: 22,
                }}
                cursor={{ fill: 'rgba(19, 104, 201, 0.08)' }}
              />
              <Bar dataKey="value" fill={C.blue} radius={[8, 8, 0, 0]} barSize={64} isAnimationActive={false}>
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fill: C.navy, fontSize: 22, fontWeight: 800 }}
                />
                {groupData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={CHART_BLUE_SERIES[index % CHART_BLUE_SERIES.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Footer year={reportYear} />
      </div>
    );
  };

  // --- Slide 4: IT Service Domain Analysis ---
  const DomainAnalysisSlide: Page = () => {
    const { domainData, totalTickets, reportYear } = useAggregatedData();

    return (
      <div style={{ ...fill, ...gridBg }}>
        <Header n={3} label="服務領域佔比" />
        <Title>IT 服務領域資源投入分析</Title>

        <div
          style={{
            position: 'absolute',
            top: 268,
            left: 100,
            right: 100,
            bottom: 112,
            display: 'flex',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flex: 0.95,
              height: '100%',
              background: C.card,
              border: `2px solid ${C.navy}`,
              borderRadius: 'var(--osd-radius)',
              boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
              padding: 20,
              boxSizing: 'border-box',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={domainData}
                  cx="50%"
                  cy="50%"
                  innerRadius={105}
                  outerRadius={180}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {domainData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={DOMAIN_COLORS[entry.name] || C.navy}
                      style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: C.card,
                    border: `2px solid ${C.navy}`,
                    borderRadius: 12,
                    color: C.ink,
                    fontSize: 22,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {domainData.map((d) => {
              const pct = totalTickets > 0 ? ((d.value / totalTickets) * 100).toFixed(1) : '0.0';
              const color = DOMAIN_COLORS[d.name] || C.navy;
              return (
                <div
                  key={d.name}
                  style={{
                    background: C.card,
                    padding: '20px 28px',
                    borderRadius: 'var(--osd-radius)',
                    border: `2px solid ${C.navy}`,
                    borderLeft: `12px solid ${color}`,
                    boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Dot color={color} />
                    <span
                      style={{
                        fontFamily: 'var(--osd-font-display)',
                        fontSize: 28,
                        color: C.navy,
                        fontWeight: 800,
                      }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span
                      style={{
                        fontFamily: 'var(--osd-font-display)',
                        fontSize: 34,
                        fontWeight: 800,
                        color: C.blue,
                      }}
                    >
                      {d.value} <span style={{ fontSize: 22, color: C.ink, fontWeight: 500 }}>筆</span>
                    </span>
                    <span style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Footer year={reportYear} />
      </div>
    );
  };

  // --- Slide 5..N: In-Progress Tracking (自動分頁：每頁上限 5 筆，避免 PDF 截斷) ---
  const IN_PROGRESS_PAGE_SIZE = 5;
  const inProgressChunks = chunkItems(aggregated.inProgressTickets, IN_PROGRESS_PAGE_SIZE);

  const inProgressSlides: Page[] = inProgressChunks.map((chunk, pageIdx) => {
    const totalPages = inProgressChunks.length;
    const pageSuffix = totalPages > 1 ? ` (${pageIdx + 1}/${totalPages})` : '';

    const InProgressSlidePage: Page = () => {
      const { inProgressTickets, newUnclosedCount, accumulatedUnclosedCount, reportYear } =
        useAggregatedData();

      return (
        <div style={{ ...fill, ...gridBg }}>
          <Header n={4} label="進行中工單追蹤" />
          <Title>尚未結案工單追蹤{pageSuffix}</Title>
          <div
            style={{
              position: 'absolute',
              top: 238,
              left: 100,
              right: 100,
              fontSize: 26,
              fontWeight: 600,
              color: C.muted,
            }}
          >
            共計 <strong style={{ color: C.navy }}>{inProgressTickets.length}</strong> 筆
            {accumulatedUnclosedCount > 0
              ? `（含 ${accumulatedUnclosedCount} 筆過去累積、${newUnclosedCount} 筆本月新開`
              : ''}
            {accumulatedUnclosedCount > 0 && totalPages > 1
              ? `；本頁顯示第 ${pageIdx * IN_PROGRESS_PAGE_SIZE + 1} ~ ${Math.min(
                (pageIdx + 1) * IN_PROGRESS_PAGE_SIZE,
                inProgressTickets.length
              )} 筆）`
              : accumulatedUnclosedCount > 0
                ? '）'
                : totalPages > 1
                  ? `（第 ${pageIdx * IN_PROGRESS_PAGE_SIZE + 1} ~ ${Math.min(
                    (pageIdx + 1) * IN_PROGRESS_PAGE_SIZE,
                    inProgressTickets.length
                  )} 筆）`
                  : ''}
            — 掌握處理進度與後續時程
          </div>

          <div
            style={{
              position: 'absolute',
              top: 294,
              left: 100,
              right: 100,
              bottom: 112,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {chunk.map((t, i) => {
              const isAccum = t.displayStatus === 'Work in Progress (過去)' || t.isAccumulated;
              const sColor = isAccum ? C.red : C.amber;
              const badgeBg = isAccum ? '#FFF1F2' : '#FFFBEB';
              return (
                <div
                  key={i}
                  style={{
                    background: C.card,
                    padding: '16px 26px',
                    borderRadius: 'var(--osd-radius)',
                    border: `2px solid ${C.navy}`,
                    borderLeft: `12px solid ${sColor}`,
                    boxShadow: '0 4px 0 rgba(0,65,143,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 20,
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--osd-font-display)',
                        fontSize: 26,
                        fontWeight: 800,
                        color: C.navy,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t['主旨']}
                    </div>
                    <div style={{ fontSize: 21, color: C.ink }}>
                      <span style={{ color: C.blue, fontWeight: 800 }}>#{t['工單編號']}</span>
                      {'　|　提單人: '}
                      <strong>{t['提單人']}</strong>
                      {'　|　處理人: '}
                      <strong>{t['處理人']}</strong>
                      {'　|　建立日: '}
                      {t['建立時間']}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 21,
                      padding: '6px 18px',
                      borderRadius: 999,
                      backgroundColor: badgeBg,
                      color: C.ink,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: `1.5px solid ${sColor}`,
                    }}
                  >
                    <Dot color={sColor} />
                    {isAccum ? 'Work in Progress (過去)' : 'Work in Progress (本月)'}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      color: C.navy,
                      width: 220,
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                    }}
                  >
                    {t.displayGroup || t['群組']}
                  </div>
                </div>
              );
            })}

            {inProgressTickets.length === 0 && (
              <Card highlight style={{ marginTop: 40, textAlign: 'center', padding: '48px 36px' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>
                  本月所有有效服務工單皆已結案處理完畢，無待辦積壓工單。
                </div>
              </Card>
            )}
          </div>

          <Footer year={reportYear} />
        </div>
      );
    };

    return InProgressSlidePage;
  });

  // --- Slide N+1: Featured / HQ Support Tickets (Isometric Table, auto-paginated at 6 rows/page) ---
  const TABLE_PAGE_SIZE = 6;
  const featuredChunks = chunkItems(aggregated.featuredTickets, TABLE_PAGE_SIZE);
  const featuredSlides: Page[] = featuredChunks.map((chunk, pageIdx) => {
    const totalPages = featuredChunks.length;
    const suffix = totalPages > 1 ? ` (${pageIdx + 1}/${totalPages})` : '';

    const FeaturedPage: Page = () => {
      const { featuredTickets, reportYear } = useAggregatedData();
      return (
        <div style={{ ...fill, ...gridBg }}>
          <Header n={5} label="總部支援工單" />
          <Title>跨國協同與總部支援工單{suffix}</Title>
          <div style={{ position: 'absolute', top: 238, left: 100, right: 100, fontSize: 26, fontWeight: 600, color: C.muted }}>
            包含總部與跨國協同標記之重點工單（共計 <strong style={{ color: C.navy }}>{featuredTickets.length}</strong> 筆）
          </div>

          <div style={{ position: 'absolute', top: 294, left: 100, right: 100 }}>
            {featuredTickets.length > 0 ? (
              <table style={tableWrap}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '13%' }}>工單編號</th>
                    <th style={th}>工單主旨</th>
                    <th style={{ ...th, width: '20%' }}>服務類別</th>
                    <th style={{ ...th, width: '20%' }}>處理狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((t, i) => {
                    const st = t.displayStatus || t['狀態'];
                    const isClosed = st === 'closed';
                    return (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 800, color: C.blue }}>#{t['工單編號']}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{t['主旨']}</td>
                        <td style={td}>{t.displayGroup || t['群組']}</td>
                        <td style={{ ...td, fontWeight: 700, color: isClosed ? C.green : C.amber }}>
                          <Dot color={isClosed ? C.green : C.amber} />
                          {st}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <Card style={{ marginTop: 40, textAlign: 'center', padding: '48px 36px' }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>本月無總部相關支援工單。</div>
              </Card>
            )}
          </div>

          <Footer year={reportYear} />
        </div>
      );
    };

    return FeaturedPage;
  });

  // --- Slide N+2: SOP Standardization Tickets (Isometric Table, auto-paginated at 6 rows/page) ---
  const sopChunks = chunkItems(aggregated.sopTickets, TABLE_PAGE_SIZE);
  const sopSlides: Page[] = sopChunks.map((chunk, pageIdx) => {
    const totalPages = sopChunks.length;
    const suffix = totalPages > 1 ? ` (${pageIdx + 1}/${totalPages})` : '';

    const SopPage: Page = () => {
      const { sopTickets, reportYear } = useAggregatedData();
      return (
        <div style={{ ...fill, ...gridBg }}>
          <Header n={6} label="標準化流程" />
          <Title>SOP 建立與作業規範追蹤{suffix}</Title>
          <div style={{ position: 'absolute', top: 238, left: 100, right: 100, fontSize: 26, fontWeight: 600, color: C.muted }}>
            標題包含 &quot;SOP&quot; 之作業指引工單（共計 <strong style={{ color: C.navy }}>{sopTickets.length}</strong> 筆）
          </div>

          <div style={{ position: 'absolute', top: 294, left: 100, right: 100 }}>
            {sopTickets.length > 0 ? (
              <table style={tableWrap}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '13%' }}>工單編號</th>
                    <th style={th}>SOP 作業指引主旨</th>
                    <th style={{ ...th, width: '16%' }}>建立日期</th>
                    <th style={{ ...th, width: '24%' }}>處理狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((t, i) => {
                    const st = t.displayStatus || t['狀態'];
                    const isClosed = st === 'closed';
                    const isAccum = st === 'Work in Progress (過去)';
                    const stColor = isClosed ? C.green : isAccum ? C.red : C.amber;
                    return (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 800, color: C.blue }}>#{t['工單編號']}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{t['主旨']}</td>
                        <td style={td}>{t['建立時間']}</td>
                        <td style={{ ...td, fontWeight: 700, color: stColor }}>
                          <Dot color={stColor} />
                          {st}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <Card style={{ marginTop: 40, textAlign: 'center', padding: '48px 36px' }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>本月無 SOP 相關工單。</div>
              </Card>
            )}
          </div>

          <Footer year={reportYear} />
        </div>
      );
    };

    return SopPage;
  });

  // --- Slide N+3: Dynamic Next Month Key Milestones ---
  const NextMonthTasksSlide: Page = () => {
    const { finalMilestones, reportYear } = useAggregatedData();

    return (
      <div style={{ ...fill, ...gridBg }}>
        <Header n={7} label="下月重點規劃" />
        <Title>下月關鍵里程碑與維運計畫</Title>

        <div
          style={{
            position: 'absolute',
            top: 280,
            left: 100,
            right: 100,
            bottom: 112,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {finalMilestones.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                background: C.card,
                padding: '20px 28px',
                borderRadius: 'var(--osd-radius)',
                border: `2px solid ${C.navy}`,
                borderLeft: `12px solid ${m.color}`,
                boxShadow: '0 6px 0 rgba(0,65,143,0.08)',
              }}
            >
              <NumBadge n={i + 1} size={50} />
              <div
                style={{
                  padding: '6px 18px',
                  borderRadius: 999,
                  border: `1.5px solid ${m.color}`,
                  color: m.color,
                  fontFamily: 'var(--osd-font-display)',
                  fontWeight: 800,
                  fontSize: 21,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {m.tag}
              </div>
              <div style={{ fontSize: 27, color: C.ink, fontWeight: 600, lineHeight: 1.4 }}>{m.text}</div>
            </div>
          ))}
        </div>

        <Footer year={reportYear} />
      </div>
    );
  };

  // --- Slide N+4: Data Verification & Built-in Excel Download ---
  const DataAuditSlide: Page = () => {
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const {
      totalTickets,
      totalRaw,
      excludedTickets,
      sourceCounts,
      closedCount,
      newUnclosedCount,
      accumulatedUnclosedCount,
      reportYear,
    } = useAggregatedData();

    return (
      <div style={{ ...fill, ...gridBg }}>
        <Header n={8} label="資料驗證與 Excel 匯出" />
        <div
          className="osd-no-print"
          style={{
            position: 'absolute',
            top: 64,
            right: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExcelModalOpen(true);
            }}
            style={actionBtnStyle}
          >
            展開完整 Excel 明細表
          </button>
          {excelReportUrl && (
            <a
              href={excelReportUrl}
              download={excelFilename}
              onClick={(e) => e.stopPropagation()}
              style={primaryBtnStyle}
            >
              下載完整 Excel (.xlsx)
            </a>
          )}
        </div>
        <Title>有效服務工單口徑與核對摘要</Title>

        {/* Top 3 Reconciliation KPI Cards */}
        <div
          style={{
            position: 'absolute',
            top: 262,
            left: 100,
            right: 100,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          <Card title="原始擷取工單" style={{ padding: '22px 30px' }}>
            <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 56, fontWeight: 800, color: C.navy, lineHeight: 1.1 }}>
              {totalRaw}
              <span style={{ fontSize: 26, marginLeft: 8, color: C.muted }}>筆</span>
            </div>
            <div style={{ fontSize: 21, color: C.muted, marginTop: 8 }}>已通過授權網域過濾</div>
          </Card>

          <Card title="排除重複工單 (merged)" style={{ padding: '22px 30px' }}>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 56,
                fontWeight: 800,
                color: excludedTickets.length > 0 ? C.amber : C.muted,
                lineHeight: 1.1,
              }}
            >
              {excludedTickets.length}
              <span style={{ fontSize: 26, marginLeft: 8, color: C.muted }}>筆</span>
            </div>
            <div style={{ fontSize: 21, color: C.muted, marginTop: 8 }}>避免合併工單重複計數</div>
          </Card>

          <Card title="有效服務工單總計" highlight style={{ padding: '22px 30px' }}>
            <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 56, fontWeight: 800, color: C.blue, lineHeight: 1.1 }}>
              {totalTickets}
              <span style={{ fontSize: 26, marginLeft: 8, color: C.navy }}>筆</span>
            </div>
            <div style={{ fontSize: 21, color: C.muted, marginTop: 8 }}>
              已結案 {closedCount} 筆 ＋ 進行中 {newUnclosedCount + accumulatedUnclosedCount} 筆
            </div>
          </Card>
        </div>

        {/* Reconciliation Breakdown Table */}
        <div style={{ position: 'absolute', top: 486, left: 100, right: 100 }}>
          <table style={tableWrap}>
            <thead>
              <tr>
                <th style={{ ...th, width: '28%' }}>資料來源口徑</th>
                <th style={{ ...th, width: '14%', textAlign: 'right' }}>工單筆數</th>
                <th style={{ ...th, width: '14%', textAlign: 'right' }}>佔有效比</th>
                <th style={th}>對應 Excel 工作表與統計說明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 800, color: C.navy }}>當月新進</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.blue }}>{sourceCounts.currentMonth}</td>
                <td style={{ ...td, textAlign: 'right', color: C.muted }}>
                  {totalTickets > 0 ? `${((sourceCounts.currentMonth / totalTickets) * 100).toFixed(1)}%` : '0.0%'}
                </td>
                <td style={td}>當月建立之有效工單（包含已結案與 Work in Progress 本月）</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 800, color: C.navy }}>跨月結案 / 異動</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.green }}>{sourceCounts.crossMonthClosed}</td>
                <td style={{ ...td, textAlign: 'right', color: C.muted }}>
                  {totalTickets > 0 ? `${((sourceCounts.crossMonthClosed / totalTickets) * 100).toFixed(1)}%` : '0.0%'}
                </td>
                <td style={td}>當月前開立、於查詢月份內結案之服務交付工單</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 800, color: C.navy }}>歷史在辦未結</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.red }}>{sourceCounts.historicalOpen}</td>
                <td style={{ ...td, textAlign: 'right', color: C.muted }}>
                  {totalTickets > 0 ? `${((sourceCounts.historicalOpen / totalTickets) * 100).toFixed(1)}%` : '0.0%'}
                </td>
                <td style={td}>當月前開立且目前仍為 open 之累積追蹤項目</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700, color: C.muted, background: '#FFF9F0' }}>merged 重複工單（排除）</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: C.muted, background: '#FFF9F0' }}>
                  {excludedTickets.length}
                </td>
                <td style={{ ...td, textAlign: 'right', color: C.muted, background: '#FFF9F0' }}>—</td>
                <td style={{ ...td, color: C.muted, background: '#FFF9F0' }}>
                  已併入其他主工單，留存於「全部工單 / merged」工作表供核對
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Footer year={reportYear} />
        <ExcelPreviewModal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
      </div>
    );
  };

  // --- Final Slide: Closing (thanks.jpg + Contact Card + LogoLockup) ---
  const ClosingSlide: Page = () => {
    const orgName = (import.meta as any).env?.VITE_ORG_NAME || 'Enterprise IT Operations';
    const contactName = (import.meta as any).env?.VITE_CONTACT_NAME || 'IT Support Team';
    const contactEmail = (import.meta as any).env?.VITE_CONTACT_EMAIL || 'support@example.com';

    return (
      <div style={fill}>
        <img src={thanksImg} alt="" style={bgImg} />
        <Card style={{ position: 'absolute', top: 48, right: 48, width: 490 }}>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.25,
              color: C.navy,
              paddingBottom: 20,
              borderBottom: `2px solid ${C.line}`,
            }}
          >
            一起打造更穩定、
            <br />
            更安心的 IT 環境
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: 'var(--osd-font-display)',
              fontWeight: 800,
              fontSize: 26,
              color: C.navy,
              lineHeight: 1.8,
            }}
          >
            {orgName}
            <br />
            {contactName}
            <br />
            {contactEmail}
          </div>
        </Card>
        <div style={{ position: 'absolute', left: 64, bottom: 52 }}>
          <LogoLockup size={64} />
        </div>
      </div>
    );
  };

  return [
    TitleSlide,
    CoreMetricsSlide,
    GroupSlide,
    DomainAnalysisSlide,
    ...inProgressSlides,
    ...featuredSlides,
    ...sopSlides,
    NextMonthTasksSlide,
    DataAuditSlide,
    ClosingSlide,
  ];
}
