import React, { useMemo } from 'react';
import type { Page, DesignSystem } from '@open-slide/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// --- Theme setup ---
export const design: DesignSystem = {
  palette: {
    bg: '#0b132b',
    text: '#f8fafc',
    accent: '#38bdf8',
  },
  fonts: {
    display: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  typeScale: {
    hero: 120,
    body: 32,
  },
  radius: 16,
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#0b132b',
  color: '#f8fafc',
  fontFamily: 'var(--osd-font-body)',
  padding: '70px 90px',
  display: 'flex',
  flexDirection: 'column' as const,
  boxSizing: 'border-box' as const,
};

// Vibrant, accessible high-contrast palette
const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#f472b6', '#22d3ee'];

// Others → 簡潔直觀英文名稱
const GROUP_DISPLAY_NAME: Record<string, string> = {
  'Others': 'General Support',
};

// 狀態正規化：pending close 視為 closed；open 與 pending reminder 歸為 Work in Progress
const normalizeStatus = (rawStatus: string): string => {
  const s = (rawStatus || '').trim().toLowerCase();
  if (s === 'pending close' || s === 'closed') {
    return 'closed';
  }
  if (s === 'open' || s === 'pending reminder' || s === 'new') {
    return 'Work in Progress';
  }
  return rawStatus;
};

// 狀態專屬色彩配置 (綠色代表已結案，琥珀黃代表本月在辦，珊瑚紅代表過去累積)
const STATUS_COLORS: Record<string, string> = {
  'closed': '#34d399',
  'Work in Progress (本月)': '#fbbf24',
  'Work in Progress (過去)': '#f87171',
  'Work in Progress': '#fbbf24',
};

// 服務領域歸類：直觀且易於理解的商業名稱
const DOMAIN_MAP: Record<string, string> = {
  'iScala': 'ERP 與業務系統',
  'LinkMyGoods': 'ERP 與業務系統',
  'Redsun': 'ERP 與業務系統',
  'Software': '電腦硬體與辦公軟體',
  'Hardware': '電腦硬體與辦公軟體',
  'Peripherals & Printing': '電腦硬體與辦公軟體',
  'Email Security': '資安防護與帳號權限',
  'Account & Access': '資安防護與帳號權限',
  'On/Offboarding': '資安防護與帳號權限',
  'Network': '辦公網路與通訊設備',
  'IP-Phone': '辦公網路與通訊設備',
  'Development': '辦公網路與通訊設備',
  'IT Request & Project': '辦公網路與通訊設備',
  'Others': '日常維運與行政事務',
  'General Support': '日常維運與行政事務',
};

const DOMAIN_COLORS: Record<string, string> = {
  'ERP 與業務系統': '#fbbf24',
  '電腦硬體與辦公軟體': '#38bdf8',
  '資安防護與帳號權限': '#f87171',
  '辦公網路與通訊設備': '#34d399',
  '日常維運與行政事務': '#818cf8',
};

// --- Factory function to generate slides from any tickets array ---
export function createReportSlides(ticketsData: any[]): Page[] {
  // --- Data Aggregation Hook for this specific deck ---
  const useAggregatedData = () => {
    return useMemo(() => {
      // 1. 排除 merged 重複計算工單，取得真實有效服務工單
      const validTickets = ticketsData.filter((t: any) => (t['狀態'] || '').toLowerCase() !== 'merged');
      const totalTickets = validTickets.length;
      
      let reportMonth = '本月';
      let targetYM = '';
      if (validTickets.length > 0) {
        // 計算出現頻率最高之目標月份 (排除跨月歷史工單干擾封面標題)
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
          reportMonth = `${year} 年 ${month} 月`;
        }
      }

      // Group by status (區分為 closed, 本月新開未結, 之前累積未結)
      const statusMap = new Map<string, number>();
      const groupMap = new Map<string, number>();
      const domainMap = new Map<string, number>();
      
      const featuredTickets: any[] = [];
      const sopTickets: any[] = [];
      const inProgressTickets: any[] = [];
      let closedCount = 0;
      let newUnclosedCount = 0;
      let accumulatedUnclosedCount = 0;
      let emailSecurityCount = 0;
      
      validTickets.forEach((t: any) => {
        const rawStatus = (t['狀態'] || 'Unknown').trim().toLowerCase();
        const rawGroup = t['群組'] || 'Unknown';
        const displayGroup = GROUP_DISPLAY_NAME[rawGroup] || rawGroup;
        const tags = t['標籤'] || '';
        const title = t['主旨'] || '';
        const isCurrentMonth = t['建立時間']?.startsWith(targetYM);
        
        let displayStatus = 'closed';
        if (rawStatus === 'closed') {
          displayStatus = 'closed';
          closedCount++;
          statusMap.set('closed', (statusMap.get('closed') || 0) + 1);
        } else {
          if (isCurrentMonth) {
            displayStatus = 'Work in Progress (本月)';
            newUnclosedCount++;
          } else {
            displayStatus = 'Work in Progress (過去)';
            accumulatedUnclosedCount++;
          }
          statusMap.set(displayStatus, (statusMap.get(displayStatus) || 0) + 1);
        }
        
        groupMap.set(displayGroup, (groupMap.get(displayGroup) || 0) + 1);

        // Service domain aggregation
        const domain = DOMAIN_MAP[rawGroup] || '日常維運與行政事務';
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);

        // Email Security count
        if (rawGroup === 'Email Security') {
          emailSecurityCount++;
        }
        
        // In-progress tickets (not closed)
        if (rawStatus !== 'closed') {
          inProgressTickets.push({ 
            ...t, 
            displayGroup, 
            displayStatus,
            isAccumulated: !isCurrentMonth
          });
        }
        
        // 標記 跨國/總部支援 相關重點工單
        const hqEmail = (import.meta as any).env?.VITE_HQ_EMAIL || '';
        if ((hqEmail && (tags.includes(hqEmail) || t['提單人'] === hqEmail)) || (t['提單人'] && t['提單人'].includes('Group-IT Support'))) {
           featuredTickets.push({ ...t, displayGroup, displayStatus });
        }
        
        if (title.toUpperCase().includes('SOP')) {
           sopTickets.push({ ...t, displayGroup, displayStatus });
        }
      });

      // 排序進行中工單：歷史累積未結置頂示警，接著依建立時間排列
      inProgressTickets.sort((a, b) => {
        if (a.isAccumulated && !b.isAccumulated) return -1;
        if (!a.isAccumulated && b.isAccumulated) return 1;
        return (b['建立時間'] || '').localeCompare(a['建立時間'] || '');
      });

      const resolutionRate = totalTickets > 0 ? ((closedCount / totalTickets) * 100).toFixed(1) : '0';

      const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => {
        if (a.name === 'closed') return -1;
        if (b.name === 'closed') return 1;
        return b.value - a.value;
      });
      const groupData = Array.from(groupMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const domainData = Array.from(domainMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      // --- Dynamic Monthly Milestones Generation (聚焦非例行之具體專案與待辦事項) ---
      const dynamicMilestones: { icon: string; text: string; color: string }[] = [];

      // 1. 歷史累積未結攻堅里程碑
      if (accumulatedUnclosedCount > 0) {
        dynamicMilestones.push({
          icon: '⏳',
          text: `優先排程處理並結案 ${accumulatedUnclosedCount} 筆過去累積之 Work in Progress 工單`,
          color: '#f87171'
        });
      }

      // 2. 本月新開進行中工單追蹤 (明確待辦責任)
      const newUnclosedList = inProgressTickets.filter(t => !t.isAccumulated);
      if (newUnclosedList.length === 1) {
        const single = newUnclosedList[0];
        const cleanSubj = single['主旨']?.length > 30 ? single['主旨'].slice(0, 30) + '...' : single['主旨'];
        dynamicMilestones.push({
          icon: '🔧',
          text: `持續追蹤並完成本月 Work in Progress 工單：#${single['工單編號']} ${cleanSubj}`,
          color: '#fbbf24'
        });
      } else if (newUnclosedList.length > 1) {
        dynamicMilestones.push({
          icon: '🔧',
          text: `追蹤並完成本月新開 ${newUnclosedList.length} 筆 Work in Progress 工單之後續處理與驗收`,
          color: '#fbbf24'
        });
      }

      // 3. SOP 標準化作業 (當月有具體發起 SOP 探討或制定時)
      if (sopTickets.length > 0) {
        dynamicMilestones.push({
          icon: '📝',
          text: `推動 IT 服務標準化，落實並宣導當月發起之 ${sopTickets.length} 項 SOP 作業規範`,
          color: '#34d399'
        });
      }

      // 4. 人事新進/離調職環境預排 (On/Offboarding 具體任務)
      const onboardingCount = validTickets.filter((t: any) => 
        t['群組'] === 'On/Offboarding' || 
        (t['主旨'] && (t['主旨'].includes('新人') || t['主旨'].includes('報到') || t['主旨'].includes('離職') || t['主旨'].includes('Offboarding')))
      ).length;

      if (onboardingCount > 0) {
        dynamicMilestones.push({
          icon: '👥',
          text: `配合新進與調職同仁之辦公環境部署與帳號權限設定 (本月 ${onboardingCount} 筆)`,
          color: '#38bdf8'
        });
      }

      // 5. 硬體設備與備用機庫存清點 (當月有硬體維護或更換需求時)
      const hardwareCount = validTickets.filter((t: any) => t['群組'] === 'Hardware' || t['群組'] === 'Peripherals & Printing').length;
      if (hardwareCount >= 3) {
        dynamicMilestones.push({
          icon: '💻',
          text: `落實同仁電腦硬體設備維護、定期健檢與 IT 備品庫存盤點 (本月 ${hardwareCount} 筆)`,
          color: '#818cf8'
        });
      }

      // 6. 軟體授權盤點 (若軟體工單較多時)
      const softwareCount = validTickets.filter((t: any) => t['群組'] === 'Software').length;
      if (softwareCount >= 3 && dynamicMilestones.length < 5) {
        dynamicMilestones.push({
          icon: '🖥️',
          text: `盤點與優化常用辦公軟體授權 (License) 與軟體配置流程 (本月 ${softwareCount} 筆)`,
          color: '#a78bfa'
        });
      }

      // 7. 當無特殊異常時的品質維護
      if (dynamicMilestones.length === 0) {
        dynamicMilestones.push({
          icon: '🎉',
          text: `落實當月 100% 結案之各項服務滿意度調查與 IT 基礎維運巡檢`,
          color: '#34d399'
        });
        dynamicMilestones.push({
          icon: '📝',
          text: `梳理高頻 IT 服務問題，制定並完善常見問題排除之標準作業程序 (SOP)`,
          color: '#a78bfa'
        });
      }

      const finalMilestones = dynamicMilestones.slice(0, 5);

      return {
        totalTickets,
        reportMonth,
        statusData,
        groupData,
        domainData,
        featuredTickets,
        sopTickets,
        inProgressTickets,
        newUnclosedCount,
        accumulatedUnclosedCount,
        resolutionRate,
        closedCount,
        emailSecurityCount,
        finalMilestones
      };
    }, [ticketsData]);
  };

  // --- Slide 1: Title ---
  const TitleSlide: Page = () => {
    const { reportMonth, totalTickets } = useAggregatedData();
    const companyTitle = (import.meta as any).env?.VITE_COMPANY_NAME || 'ENTERPRISE IT SERVICE REPORT';

    return (
      <div style={{ ...fill, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 30, letterSpacing: 6, textTransform: 'uppercase', color: '#38bdf8', marginBottom: 20, fontWeight: 600 }}>
          {companyTitle}
        </div>
        <h1 style={{ fontSize: 'var(--osd-size-hero)', color: '#ffffff', marginBottom: 20, textShadow: '0 4px 20px rgba(56,189,248,0.2)' }}>
          IT Support {reportMonth} 月報
        </h1>
        <h2 style={{ fontSize: 52, fontWeight: 500, color: '#e2e8f0' }}>
          Monthly IT Operations & Service Overview
        </h2>
        <div style={{ marginTop: 70, fontSize: 30, color: '#f8fafc', background: '#1c2a4a', padding: '18px 48px', borderRadius: 40, border: '1px solid #38bdf855', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          📊 當月有效服務工單總計：<strong style={{ color: '#38bdf8', fontSize: 34 }}>{totalTickets}</strong> 筆
        </div>
      </div>
    );
  };

  // --- Slide 2: Core Service Metrics ---
  const CoreMetricsSlide: Page = () => {
    const { totalTickets, resolutionRate, closedCount, emailSecurityCount, statusData, newUnclosedCount, accumulatedUnclosedCount } = useAggregatedData();
    
    const summaryCards = [
      { label: '有效服務工單', value: `${totalTickets}`, unit: '筆', color: '#38bdf8', icon: '📋' },
      { label: '當月結案率', value: `${resolutionRate}`, unit: '%', color: '#34d399', icon: '🎯' },
      { label: '資安與郵件防護', value: `${emailSecurityCount}`, unit: '筆', color: '#f87171', icon: '🛡️' },
    ];

    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 36, fontWeight: 700, color: '#ffffff' }}>核心服務指標</h2>
        
        {/* 3 Summary Cards */}
        <div style={{ display: 'flex', gap: 36, marginBottom: 36 }}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{
              flex: 1,
              background: 'linear-gradient(135deg, #1c2a4a 0%, #0e1726 100%)',
              borderRadius: 20,
              padding: '36px 32px',
              border: `2px solid ${card.color}55`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 44 }}>{card.icon}</div>
              <div style={{ fontSize: 72, fontWeight: 'bold', color: card.color, lineHeight: 1 }}>
                {card.value}<span style={{ fontSize: 32, marginLeft: 8, color: '#e2e8f0' }}>{card.unit}</span>
              </div>
              <div style={{ fontSize: 28, color: '#e2e8f0', textAlign: 'center', fontWeight: 600 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Status Breakdown compact chart */}
        <div style={{ flex: 1, display: 'flex', gap: 50, background: '#17223b', borderRadius: 'var(--osd-radius)', padding: '28px 40px', alignItems: 'center', border: '1px solid #2d3e63' }}>
          <div style={{ flex: 1.2, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={135}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: 20, outline: 'none', fill: '#ffffff', fontWeight: 600 }}
                >
                  {statusData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#38bdf8'} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0b132b', border: '1px solid #38bdf8', borderRadius: 12, color: '#ffffff', fontSize: 22 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 30, color: '#f8fafc', marginBottom: 6, fontWeight: 700 }}>工單狀態結算</div>
            {statusData.map((s) => {
              const color = STATUS_COLORS[s.name] || '#38bdf8';
              return (
                <div key={s.name} style={{ fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#0e1726', borderRadius: 10, border: '1px solid #233354' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 18, height: 18, backgroundColor: color, borderRadius: '50%' }} />
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <strong style={{ color: '#ffffff', fontSize: 28 }}>{s.value} <span style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 400 }}>筆</span></strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Slide 3: Groups (Others renamed to General Support) ---
  const GroupSlide: Page = () => {
    const { groupData } = useAggregatedData();
    
    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 24, fontWeight: 700, color: '#ffffff' }}>各服務類別工單統計</h2>
        
        <div style={{ flex: 1, background: '#17223b', borderRadius: 'var(--osd-radius)', padding: '36px 44px 16px', border: '1px solid #2d3e63' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupData} margin={{ top: 20, right: 30, left: 10, bottom: 95 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3e63" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#cbd5e1" 
                tick={{ fill: '#e2e8f0', fontSize: 22, fontWeight: 500 }}
                angle={-35}
                textAnchor="end"
                height={115}
                tickMargin={14}
              />
              <YAxis stroke="#cbd5e1" tick={{ fill: '#e2e8f0', fontSize: 24 }} tickMargin={12} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0b132b', border: '1px solid #38bdf8', borderRadius: 12, color: '#ffffff', fontSize: 24 }}
                cursor={{ fill: '#2d3e63', opacity: 0.5 }}
              />
              <Bar dataKey="value" fill="#38bdf8" radius={[10, 10, 0, 0]} barSize={64}>
                {groupData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // --- Slide 4: Service Domain Analysis ---
  const DomainAnalysisSlide: Page = () => {
    const { domainData, totalTickets } = useAggregatedData();
    
    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 24, fontWeight: 700, color: '#ffffff' }}>IT 服務領域佔比分析</h2>
        <div style={{ flex: 1, display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ flex: 1, height: '90%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={domainData}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={180}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {domainData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={DOMAIN_COLORS[entry.name] || '#818cf8'} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0b132b', border: '1px solid #38bdf8', borderRadius: 12, color: '#ffffff', fontSize: 24 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {domainData.map((d) => {
              const pct = totalTickets > 0 ? ((d.value / totalTickets) * 100).toFixed(1) : '0';
              const color = DOMAIN_COLORS[d.name] || '#818cf8';
              return (
                <div key={d.name} style={{ background: '#17223b', padding: '16px 24px', borderRadius: 14, border: '1px solid #2d3e63', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ width: 20, height: 20, backgroundColor: color, borderRadius: 6 }} />
                    <span style={{ fontSize: 26, color: '#ffffff', fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: color }}>{d.value} <span style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 400 }}>筆</span></span>
                    <span style={{ fontSize: 22, color: '#cbd5e1' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Slide 5: In-Progress Tracking ---
  const InProgressSlide: Page = () => {
    const { inProgressTickets, newUnclosedCount, accumulatedUnclosedCount } = useAggregatedData();

    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 16, fontWeight: 700, color: '#ffffff' }}>進行中工單追蹤 (Work in Progress)</h2>
        <div style={{ fontSize: 28, color: '#fbbf24', marginBottom: 24, fontWeight: 600 }}>
          尚未結案工單 (共計 {inProgressTickets.length} 筆{accumulatedUnclosedCount > 0 ? `：含 ${accumulatedUnclosedCount} 筆過去累積、${newUnclosedCount} 筆本月新開` : ''}) — 掌握處理進度與後續時程
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {inProgressTickets.map((t, i) => {
            const isAccum = t.displayStatus === 'Work in Progress (過去)' || t.isAccumulated;
            const sColor = isAccum ? '#f87171' : '#fbbf24';
            return (
              <div key={i} style={{
                background: '#17223b',
                padding: '20px 28px',
                borderRadius: 'var(--osd-radius)',
                borderLeft: `8px solid ${sColor}`,
                borderTop: '1px solid #2d3e63',
                borderRight: '1px solid #2d3e63',
                borderBottom: '1px solid #2d3e63',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t['主旨']}
                  </div>
                  <div style={{ fontSize: 22, color: '#cbd5e1' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>#{t['工單編號']}</span>　|　提單人: <strong style={{ color: '#f8fafc' }}>{t['提單人']}</strong>　|　處理人: <strong style={{ color: '#f8fafc' }}>{t['處理人']}</strong>　|　建立日: {t['建立時間']}
                  </div>
                </div>
                <div style={{
                  fontSize: 22,
                  padding: '6px 18px',
                  borderRadius: 20,
                  backgroundColor: `${sColor}33`,
                  color: sColor,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${sColor}88`,
                }}>
                  {isAccum ? '⏳ Work in Progress (過去)' : '📌 Work in Progress (本月)'}
                </div>
                <div style={{ fontSize: 22, color: '#e2e8f0', width: 220, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {t.displayGroup || t['群組']}
                </div>
              </div>
            );
          })}
          {inProgressTickets.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 32, color: '#34d399', marginTop: 80, fontWeight: 600 }}>
              🎉 本月所有工單皆已結案處理完畢！
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Slide 6: Featured / HQ Support Tickets ---
  const FeaturedTicketsSlide: Page = () => {
    const { featuredTickets } = useAggregatedData();
    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 16, fontWeight: 700, color: '#ffffff' }}>總部支援工單</h2>
        <div style={{ fontSize: 28, color: '#38bdf8', marginBottom: 30, fontWeight: 600 }}>
          包含總部與跨國協同標記之重點工單 (共計 {featuredTickets.length} 筆)
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {featuredTickets.slice(0, 5).map((t, i) => (
            <div key={i} style={{ background: '#17223b', padding: '24px 32px', borderRadius: 'var(--osd-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2d3e63' }}>
               <div style={{ fontSize: 26, fontWeight: 600, color: '#ffffff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 30 }}>{t['主旨']}</div>
               <div style={{ fontSize: 24, color: '#cbd5e1', width: 260, textAlign: 'right', fontWeight: 500 }}>{t.displayGroup || t['群組']}</div>
               <div style={{ fontSize: 22, color: (t.displayStatus || t['狀態']) === 'closed' ? '#34d399' : '#fbbf24', width: 180, textAlign: 'right', fontWeight: 700 }}>{t.displayStatus || t['狀態']}</div>
            </div>
          ))}
          {featuredTickets.length > 5 && (
            <div style={{ textAlign: 'center', fontSize: 24, color: '#cbd5e1', marginTop: 16 }}>...以及其他 {featuredTickets.length - 5} 筆</div>
          )}
          {featuredTickets.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 28, color: '#cbd5e1', marginTop: 80 }}>本月無總部相關支援工單。</div>
          )}
        </div>
      </div>
    );
  };

  // --- Slide 7: SOP Tickets ---
  const SopTicketsSlide: Page = () => {
    const { sopTickets } = useAggregatedData();
    return (
      <div style={fill}>
        <h2 style={{ fontSize: 64, marginBottom: 16, fontWeight: 700, color: '#ffffff' }}>SOP 建立與標準化流程</h2>
        <div style={{ fontSize: 28, color: '#34d399', marginBottom: 30, fontWeight: 600 }}>
          標題包含 "SOP" 之作業指引工單 (共計 {sopTickets.length} 筆)
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {sopTickets.slice(0, 5).map((t, i) => (
            <div key={i} style={{ background: '#17223b', padding: '24px 32px', borderRadius: 'var(--osd-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2d3e63' }}>
               <div style={{ fontSize: 26, fontWeight: 600, color: '#ffffff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 30 }}>{t['主旨']}</div>
               <div style={{ fontSize: 24, color: '#cbd5e1', width: 180, textAlign: 'right' }}>{t['建立時間']}</div>
               <div style={{ fontSize: 22, color: (t.displayStatus || t['狀態']) === 'closed' ? '#34d399' : '#fbbf24', width: 180, textAlign: 'right', fontWeight: 700 }}>{t.displayStatus || t['狀態']}</div>
            </div>
          ))}
          {sopTickets.length > 5 && (
            <div style={{ textAlign: 'center', fontSize: 24, color: '#cbd5e1', marginTop: 16 }}>...以及其他 {sopTickets.length - 5} 筆</div>
          )}
          {sopTickets.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 28, color: '#cbd5e1', marginTop: 80 }}>本月無 SOP 相關工單。</div>
          )}
        </div>
      </div>
    );
  };

  // --- Slide 8: Dynamic Next Month Key Milestones ---
  const NextMonthTasksSlide: Page = () => {
    const { finalMilestones } = useAggregatedData();

    return (
      <div style={{ ...fill, justifyContent: 'center' }}>
        <h2 style={{ fontSize: 68, marginBottom: 40, fontWeight: 700, color: '#a78bfa' }}>下月關鍵里程碑與重點規劃</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginLeft: 20 }}>
          {finalMilestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, background: '#17223b', padding: '20px 28px', borderRadius: 16, border: '1px solid #2d3e63', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                background: `${m.color}22`,
                border: `2px solid ${m.color}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
              }}>
                {m.icon}
              </div>
              <div style={{ fontSize: 28, color: '#f8fafc', fontWeight: 600 }}>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return [
    TitleSlide,           // 1. 封面
    CoreMetricsSlide,     // 2. 核心服務指標
    GroupSlide,           // 3. 各服務類別工單統計
    DomainAnalysisSlide,  // 4. IT 服務領域佔比分析
    InProgressSlide,      // 5. 進行中工單追蹤 (In-Progress)
    FeaturedTicketsSlide, // 6. 總部支援工單
    SopTicketsSlide,      // 7. SOP 建立與更新
    NextMonthTasksSlide,  // 8. 動態下月關鍵里程碑
  ];
}
