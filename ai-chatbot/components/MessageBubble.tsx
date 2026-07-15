'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Check, Copy } from 'lucide-react';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string | null;
  created_at?: string;
};

// Clipboard copy helper component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="p-1 rounded hover:bg-neutral-800 dark:hover:bg-neutral-800 text-neutral-400 hover:text-white dark:hover:text-neutral-100 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-500"
      aria-label="Copy code"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// Check if string is formatted as CSV for chart
function isChartCSV(csvText: string): boolean {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const cols = lines[1].split(',');
  if (cols.length < 2) return false;
  return !isNaN(parseFloat(cols[1]));
}

// Chart data parser
function parseChartData(code: string, lang: string) {
  try {
    if (code.trim().startsWith('{')) {
      const data = JSON.parse(code);
      if (Array.isArray(data.data) && Array.isArray(data.labels)) {
        return {
          type: (data.type || 'bar') as 'bar' | 'line' | 'pie',
          title: data.title || 'Chart',
          labels: data.labels.map(String),
          values: data.data.map((v: unknown) => parseFloat(String(v)))
        };
      }
    }
  } catch {
    // ignore parse errors
  }

  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
  let type: 'bar' | 'line' | 'pie' = 'bar';
  let title = 'Chart';
  let labels: string[] = [];
  let values: number[] = [];

  let hasKeyValue = false;
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const val = line.substring(colonIndex + 1).trim();
      if (key === 'type') {
        type = (val === 'line' || val === 'pie' || val === 'donut' ? val : 'bar') as 'bar' | 'line' | 'pie';
        hasKeyValue = true;
      } else if (key === 'title') {
        title = val;
        hasKeyValue = true;
      } else if (key === 'labels') {
        labels = val.split(',').map(s => s.trim());
        hasKeyValue = true;
      } else if (key === 'data' || key === 'values') {
        values = val.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        hasKeyValue = true;
      }
    }
  }

  if (hasKeyValue && labels.length > 0 && values.length > 0) {
    return { type, title, labels, values };
  }

  if (lines.length >= 2) {
    const headerCols = lines[0].split(',');
    const parsedLabels: string[] = [];
    const parsedValues: number[] = [];
    const csvTitle = headerCols[1] ? headerCols[1].trim() : 'Chart Data';

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        parsedLabels.push(cols[0].trim());
        const val = parseFloat(cols[1].trim());
        parsedValues.push(isNaN(val) ? 0 : val);
      }
    }

    if (parsedLabels.length > 0) {
      return {
        type: (lang.includes('line') ? 'line' : lang.includes('pie') ? 'pie' : 'bar') as 'bar' | 'line' | 'pie',
        title: csvTitle,
        labels: parsedLabels,
        values: parsedValues
      };
    }
  }

  return null;
}

// Table data structure
interface ParsedTable {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

// Normalizes missing newlines in flattened Markdown tables
function normalizeTableNewlines(content: string): string {
  return content
    .replace(/\|\s*\|\s*/g, '|\n| ')
    .replace(/\|\s*\n\s*\|/g, '|\n|');
}

// Custom parser to map raw text table lines into headers and rows
function parseMarkdownTable(tableText: string): ParsedTable | null {
  const lines = tableText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const getCols = (line: string) => {
    const clean = line.replace(/^\|/, '').replace(/\|$/, '');
    return clean.split('|').map(c => c.trim());
  };

  const headers = getCols(lines[0]);
  const alignLine = getCols(lines[1]);
  const alignments = alignLine.map(col => {
    if (col.startsWith(':') && col.endsWith(':')) return 'center';
    if (col.endsWith(':')) return 'right';
    return 'left';
  });

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = getCols(lines[i]);
    if (cols.length > 0 && (cols.length > 1 || cols[0] !== '')) {
      while (cols.length < headers.length) cols.push('');
      rows.push(cols.slice(0, headers.length));
    }
  }

  if (headers.length > 0 && rows.length > 0) {
    return { headers, rows, alignments };
  }
  return null;
}

// Splits the message body sequentially into text segments and structured tables
function extractTablesAndText(content: string) {
  const normalized = normalizeTableNewlines(content);
  const lines = normalized.split('\n');
  
  const sections: { type: 'text' | 'table'; content: string; tableData?: ParsedTable }[] = [];
  let currentTextLines: string[] = [];
  let inTable = false;
  let currentTableLines: string[] = [];

  const flushText = () => {
    if (currentTextLines.length > 0) {
      sections.push({ type: 'text', content: currentTextLines.join('\n') });
      currentTextLines = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableText = currentTableLines.join('\n');
      const parsed = parseMarkdownTable(tableText);
      if (parsed) {
        sections.push({ type: 'table', content: tableText, tableData: parsed });
      } else {
        currentTextLines.push(...currentTableLines);
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    
    if (isTableRow) {
      if (!inTable) {
        const isSeparator = line.includes('---');
        const nextLine = lines[i + 1];
        const nextIsSeparator = nextLine && nextLine.trim().startsWith('|') && nextLine.includes('---');
        
        if (isSeparator || nextIsSeparator) {
          flushText();
          inTable = true;
          currentTableLines.push(line);
        } else {
          currentTextLines.push(line);
        }
      } else {
        currentTableLines.push(line);
      }
    } else {
      if (inTable) {
        flushTable();
        inTable = false;
      }
      currentTextLines.push(line);
    }
  }
  
  if (inTable) {
    flushTable();
  } else {
    flushText();
  }

  return sections;
}

// Parse assistant message to extract structured components
function parseAssistantMessage(content: string) {
  const codeBlocks: { language: string; code: string }[] = [];
  const charts: { type: 'bar' | 'line' | 'pie'; title: string; labels: string[]; values: number[] }[] = [];
  const diagrams: { content: string; language: string }[] = [];
  const tables: ParsedTable[] = [];

  // Extract structured tables first
  const sections = extractTablesAndText(content);
  for (const sec of sections) {
    if (sec.type === 'table' && sec.tableData) {
      tables.push(sec.tableData);
    }
  }

  const regex = /```(\w*)\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const code = match[2];

    if (['chart', 'csv-chart', 'pie-chart', 'bar-chart', 'line-chart'].includes(lang) || (lang === 'csv' && isChartCSV(code))) {
      const parsedChart = parseChartData(code, lang);
      if (parsedChart) {
        charts.push(parsedChart);
      } else {
        codeBlocks.push({ language: lang, code });
      }
    } else if (['ascii', 'diagram', 'ascii-art', 'flowchart'].includes(lang)) {
      diagrams.push({ content: code, language: lang });
    } else {
      codeBlocks.push({ language: lang, code });
    }
  }

  return {
    codeBlocks,
    charts,
    diagrams,
    tables
  };
}

// Chart Renderer component
function CustomChartRenderer({ chart }: { chart: { type: 'bar' | 'line' | 'pie'; title: string; labels: string[]; values: number[] } }) {
  const { type, title, labels, values } = chart;
  const maxValue = Math.max(...values, 1);

  if (type === 'bar') {
    return (
      <div className="p-4 bg-neutral-900/90 dark:bg-neutral-950/90 rounded-xl border border-neutral-200/20 dark:border-neutral-800/80 text-white w-full select-none my-3 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-neutral-400">{title}</h4>
        <div className="space-y-3">
          {labels.map((label, idx) => {
            const val = values[idx] || 0;
            const percentage = Math.min((val / maxValue) * 100, 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono text-indigo-400 font-semibold">{val}</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const width = 500;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = labels.map((label, idx) => {
      const val = values[idx] || 0;
      const x = padding + (idx / Math.max(labels.length - 1, 1)) * chartWidth;
      const y = padding + chartHeight - (val / maxValue) * chartHeight;
      return { x, y, label, val };
    });

    const pathD = points.length > 0 ? points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '') : '';

    return (
      <div className="p-4 bg-neutral-900/90 dark:bg-neutral-950/90 rounded-xl border border-neutral-200/20 dark:border-neutral-800/80 text-white w-full my-3 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-neutral-400">{title}</h4>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[300px] h-auto">
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#333" strokeDasharray="4 4" />
            <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#333" strokeDasharray="4 4" />
            <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#444" />

            {/* Line Path */}
            {pathD && <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Points and Labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5" className="fill-indigo-500 stroke-neutral-900 stroke-2 hover:r-6 cursor-pointer transition-all" />
                <text x={p.x} y={padding + chartHeight + 15} textAnchor="middle" fill="#888" className="text-[10px] font-mono">{p.label}</text>
                <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#ddd" className="text-[10px] font-mono font-semibold">{p.val}</text>
              </g>
            ))}

            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const size = 200;
    const center = size / 2;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const total = values.reduce((sum, v) => sum + v, 0);

    let currentOffset = 0;
    const colors = [
      '#6366f1',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
    ];

    return (
      <div className="p-4 bg-neutral-900/90 dark:bg-neutral-950/90 rounded-xl border border-neutral-200/20 dark:border-neutral-800/80 text-white w-full my-3 flex flex-col md:flex-row items-center justify-around gap-4 shadow-md">
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-neutral-400 text-center md:text-left">{title}</h4>
          <div className="space-y-2">
            {labels.map((label, idx) => {
              const val = values[idx] || 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-neutral-400">{label}:</span>
                  <span className="font-mono text-neutral-200 font-semibold">{val} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative w-[150px] h-[150px] flex-shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {values.map((val, idx) => {
              const sliceShare = total > 0 ? val / total : 0;
              const strokeLength = sliceShare * circumference;
              const strokeOffset = circumference - strokeLength + currentOffset;
              currentOffset -= strokeLength;
              const color = colors[idx % colors.length];

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-550 hover:stroke-[22px] cursor-pointer"
                />
              );
            })}
            <circle cx={center} cy={center} r={radius - 10} className="fill-neutral-900 dark:fill-neutral-950" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-[9px] text-neutral-500 uppercase font-semibold">Total</span>
            <span className="text-sm font-bold font-mono text-white">{total}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ASCII Diagram Renderer
function ASCIIDiagramRenderer({ diagram }: { diagram: { content: string; language: string } }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-indigo-900/30 dark:border-indigo-900/50 bg-[#030712] font-mono shadow-inner select-all relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/20 border-b border-indigo-900/30 text-[10px] font-semibold text-indigo-400 select-none">
        <span className="tracking-wider flex items-center gap-1.5 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          {diagram.language || 'DIAGRAM'}
        </span>
        <CopyButton text={diagram.content} />
      </div>
      
      <div 
        className="p-5 overflow-x-auto text-[11px] leading-relaxed text-indigo-300 font-mono min-w-full"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <pre className="whitespace-pre overflow-x-auto">
          <code>{diagram.content}</code>
        </pre>
      </div>
    </div>
  );
}

// Premium glassmorphic Markdown table renderer
function CustomTableRenderer({ table }: { table: ParsedTable }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800/90 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-left text-xs">
          <thead className="bg-neutral-50/70 dark:bg-neutral-950/40 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 select-none">
            <tr>
              {table.headers.map((header, idx) => {
                const align = table.alignments[idx] || 'left';
                return (
                  <th
                    key={idx}
                    scope="col"
                    className="px-4 py-3 font-semibold"
                    style={{ textAlign: align }}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/50 text-neutral-800 dark:text-neutral-200">
            {table.rows.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 transition-colors"
              >
                {row.map((cell, cellIdx) => {
                  const align = table.alignments[cellIdx] || 'left';
                  return (
                    <td
                      key={cellIdx}
                      className="px-4 py-3 font-normal whitespace-pre-wrap break-words"
                      style={{ textAlign: align }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [activeTab, setActiveTab] = useState<'text' | 'code' | 'charts' | 'diagrams' | 'tables'>('text');

  // Parse structured elements for assistant messages
  const parsed = !isUser 
    ? parseAssistantMessage(message.content) 
    : { codeBlocks: [], charts: [], diagrams: [], tables: [] };
    
  const hasCode = parsed.codeBlocks.length > 0;
  const hasCharts = parsed.charts.length > 0;
  const hasDiagrams = parsed.diagrams.length > 0;
  const hasTables = parsed.tables.length > 0;
  const showTabs = !isUser && (hasCode || hasCharts || hasDiagrams || hasTables);

  return (
    <div className={`flex w-full items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar Circle */}
      <div 
        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm select-none transition-all ${
          isUser 
            ? 'bg-white/40 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-300 border border-white/20 dark:border-neutral-750/30 glass-border' 
            : 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/10'
        }`}
      >
        {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
      </div>
      
      {/* Message Bubble Column */}
      <div className={`flex flex-col max-w-[82%] lg:max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Actual bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed transition-all w-full ${
            isUser
              ? 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-950 dark:text-indigo-100 border border-indigo-400/30 dark:border-indigo-500/30 rounded-2xl rounded-tr-none font-normal shadow-sm backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
              : 'bg-white/60 dark:bg-neutral-900/45 text-neutral-850 dark:text-neutral-200 border border-white/25 dark:border-neutral-800/45 rounded-2xl rounded-tl-none shadow-sm backdrop-blur-md glass-border'
          }`}
        >
          {showTabs && (
            <div className="flex flex-wrap gap-1 mb-3.5 pb-2 border-b border-neutral-200/30 dark:border-neutral-800/50">
              <button
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  activeTab === 'text'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                }`}
              >
                Response
              </button>
              {hasCode && (
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'code'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  Code
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    activeTab === 'code' ? 'bg-indigo-700 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {parsed.codeBlocks.length}
                  </span>
                </button>
              )}
              {hasCharts && (
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'charts'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  Charts
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    activeTab === 'charts' ? 'bg-indigo-700 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {parsed.charts.length}
                  </span>
                </button>
              )}
              {hasDiagrams && (
                <button
                  onClick={() => setActiveTab('diagrams')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'diagrams'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  Diagrams
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    activeTab === 'diagrams' ? 'bg-indigo-700 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {parsed.diagrams.length}
                  </span>
                </button>
              )}
              {hasTables && (
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'tables'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  Tables
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    activeTab === 'tables' ? 'bg-indigo-700 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {parsed.tables.length}
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {activeTab === 'text' && (
              <div className="space-y-4">
                {extractTablesAndText(message.content).map((sec, idx) => {
                  if (sec.type === 'table' && sec.tableData) {
                    return <CustomTableRenderer key={idx} table={sec.tableData} />;
                  }

                  return (
                    <ReactMarkdown
                      key={idx}
                      components={{
                        pre: ({ children }) => <>{children}</>,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const codeString = String(children).replace(/\n$/, '');

                          if (isInline) {
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono border border-neutral-200/50 dark:border-neutral-750"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          if (['chart', 'csv-chart', 'pie-chart', 'bar-chart', 'line-chart'].includes(lang) || (lang === 'csv' && isChartCSV(codeString))) {
                            const parsedChart = parseChartData(codeString, lang);
                            if (parsedChart) {
                              return <CustomChartRenderer chart={parsedChart} />;
                            }
                          } else if (['ascii', 'diagram', 'ascii-art', 'flowchart'].includes(lang)) {
                            return <ASCIIDiagramRenderer diagram={{ content: codeString, language: lang }} />;
                          }

                          return (
                            <div className="my-3 overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800/90 bg-neutral-900 dark:bg-neutral-950">
                              <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/50 dark:bg-neutral-900/50 border-b border-neutral-200/80 dark:border-neutral-800/90 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 font-mono select-none">
                                <span>{lang ? lang.toUpperCase() : 'CODE'}</span>
                                <CopyButton text={codeString} />
                              </div>
                              <pre className="p-4 overflow-x-auto text-neutral-100 text-xs font-mono bg-neutral-900 dark:bg-neutral-950">
                                <code className="text-neutral-200" {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {sec.content}
                    </ReactMarkdown>
                  );
                })}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-4">
                {parsed.codeBlocks.map((block, idx) => (
                  <div key={idx} className="overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800/90 bg-neutral-900 dark:bg-neutral-950">
                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/50 dark:bg-neutral-900/50 border-b border-neutral-200/80 dark:border-neutral-800/90 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 font-mono select-none">
                      <span>{block.language ? block.language.toUpperCase() : 'CODE'}</span>
                      <CopyButton text={block.code} />
                    </div>
                    <pre className="p-4 overflow-x-auto text-neutral-100 text-xs font-mono bg-neutral-900 dark:bg-neutral-950">
                      <code className="text-neutral-200">
                        {block.code}
                      </code>
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-4">
                {parsed.charts.map((chart, idx) => (
                  <CustomChartRenderer key={idx} chart={chart} />
                ))}
              </div>
            )}

            {activeTab === 'diagrams' && (
              <div className="space-y-4">
                {parsed.diagrams.map((diag, idx) => (
                  <ASCIIDiagramRenderer key={idx} diagram={diag} />
                ))}
              </div>
            )}

            {activeTab === 'tables' && (
              <div className="space-y-4">
                {parsed.tables.map((table, idx) => (
                  <CustomTableRenderer key={idx} table={table} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Model Meta Indicator (Assistant only) */}
        {!isUser && message.model_used && (
          <div className="mt-1.5 ml-1.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider select-none">
            via {message.model_used}
          </div>
        )}
      </div>

    </div>
  );
}

