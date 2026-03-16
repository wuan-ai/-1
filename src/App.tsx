/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { pinyin } from 'pinyin-pro';
import HanziWriter from 'hanzi-writer';
import domtoimage from 'dom-to-image-more';
import { Download, Plus, Trash2, Type, Layout, Settings2, Printer, Palette, Sliders } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

interface StrokeOrderProps {
  character: string;
  size?: number;
}

const StrokeOrder: React.FC<StrokeOrderProps> = ({ character, size = 40 }) => {
  const [strokes, setStrokes] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await HanziWriter.loadCharacterData(character);
        if (isMounted && data) {
          // Generate cumulative strokes
          const cumulative: string[] = [];
          for (let i = 1; i <= data.strokes.length; i++) {
            cumulative.push(data.strokes.slice(0, i).join(' '));
          }
          setStrokes(cumulative);
        }
      } catch (e) {
        console.error('Failed to load character data', e);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [character]);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {strokes.map((path, idx) => (
        <svg key={idx} width={size} height={size} viewBox="0 0 1024 1024" className="border border-gray-100">
          <g transform="scale(1, -1) translate(0, -900)">
            <path d={path} fill="#555" />
          </g>
        </svg>
      ))}
    </div>
  );
};

interface TianZiGeProps {
  character?: string;
  size?: number;
  faint?: boolean;
  red?: boolean;
}

const TianZiGe: React.FC<TianZiGeProps & { 
  noBorder?: boolean, 
  gridColor?: string, 
  mainColor?: string, 
  tracingOpacity?: number 
}> = ({ 
  character, 
  size = 60, 
  faint = false, 
  red = false, 
  noBorder = false,
  gridColor = '#777',
  mainColor = '#d64040',
  tracingOpacity = 0.3
}) => {
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    if (!character) {
      setPaths([]);
      return;
    }
    let isMounted = true;
    HanziWriter.loadCharacterData(character).then(data => {
      if (isMounted && data) setPaths(data.strokes);
    }).catch(() => {
      if (isMounted) setPaths([]);
    });
    return () => { isMounted = false; };
  }, [character]);

  return (
    <div 
      className={cn(
        "relative box-content bg-white",
        !noBorder && "border"
      )}
      style={{ 
        width: size, 
        height: size,
        borderColor: !noBorder ? gridColor : 'transparent'
      }}
    >
      {/* Grid Lines */}
      <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
        <line x1="0" y1={size / 2} x2={size} y2={size / 2} stroke={gridColor} strokeDasharray="3,2" strokeWidth="0.8" opacity="0.6" />
        <line x1={size / 2} y1="0" x2={size / 2} y2={size} stroke={gridColor} strokeDasharray="3,2" strokeWidth="0.8" opacity="0.6" />
      </svg>
      
      {/* Character */}
      {character && (
        paths.length > 0 ? (
          <svg className="absolute inset-0" width={size} height={size} viewBox="0 0 1024 1024">
            <g transform="scale(1, -1) translate(0, -900)">
              {paths.map((p, i) => (
                <path 
                  key={i} 
                  d={p} 
                  fill={red ? mainColor : faint ? "#333" : "#222"} 
                  opacity={faint ? tracingOpacity : 1}
                />
              ))}
            </g>
          </svg>
        ) : (
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center font-serif leading-none"
            )}
            style={{ 
              fontSize: size * 0.85,
              color: red ? mainColor : faint ? "#333" : "#222",
              opacity: faint ? tracingOpacity : 1
            }}
          >
            {character}
          </div>
        )
      )}
    </div>
  );
};

const CopybookRow: React.FC<{ 
  char: string, 
  gridColor: string, 
  mainColor: string, 
  tracingOpacity: number 
}> = ({ char, gridColor, mainColor, tracingOpacity }) => {
  const charPinyin = pinyin(char, { toneType: 'symbol' });
  
  return (
    <div className="flex border-b h-[120px] break-inside-avoid" style={{ borderColor: gridColor }}>
      {/* Column 1: Large Red Character */}
      <div className="w-[100px] flex items-center justify-center border-r" style={{ borderColor: gridColor }}>
        <TianZiGe character={char} size={80} red gridColor={gridColor} mainColor={mainColor} />
      </div>

      {/* Column 2: Pinyin (Top) + Character & Empty Grid for Word Formation (Bottom) */}
      <div className="w-[150px] flex flex-col border-r" style={{ borderColor: gridColor }}>
        <div className="h-[35px] flex items-center justify-center border-b text-sm font-medium text-gray-700 bg-stone-50/30" style={{ borderColor: gridColor }}>
          {charPinyin}
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <TianZiGe character={char} size={60} gridColor={gridColor} mainColor={mainColor} />
          <TianZiGe size={60} gridColor={gridColor} />
        </div>
      </div>

      {/* Column 3: Stroke Order (Top) + Tracing Grids (Bottom) */}
      <div className="flex-1 flex flex-col">
        {/* Top: Stroke Order */}
        <div className="h-[35px] flex items-center px-4 border-b overflow-hidden bg-stone-50/10" style={{ borderColor: gridColor }}>
          <StrokeOrder character={char} size={24} />
        </div>
        {/* Bottom: Tracing/Empty Grids */}
        <div className="flex-1 flex items-center px-4 overflow-hidden">
          <div className="flex border" style={{ borderColor: gridColor }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="border-r" style={{ borderColor: i === 6 ? 'transparent' : gridColor }}>
                <TianZiGe 
                  character={i === 0 ? char : undefined} 
                  size={60} 
                  faint={i === 0} 
                  noBorder 
                  gridColor={gridColor} 
                  mainColor={mainColor}
                  tracingOpacity={tracingOpacity}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [inputText, setInputText] = useState('古胡双言青清晴苗');
  const [title, setTitle] = useState('新一年级下册语文同步生字字帖');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [name, setName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Configuration states
  const [gridColor, setGridColor] = useState('#777777');
  const [mainCharColor, setMainCharColor] = useState('#d64040');
  const [tracingOpacity, setTracingOpacity] = useState(0.3);
  
  const copybookRef = useRef<HTMLDivElement>(null);

  const characters = Array.from(new Set(inputText.replace(/[^\u4e00-\u9fa5]/g, '').split('')));

  const handleDownload = async () => {
    if (!copybookRef.current || isExporting) return;
    setIsExporting(true);
    
    try {
      // dom-to-image-more is generally more reliable for SVGs
      const dataUrl = await domtoimage.toPng(copybookRef.current, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: copybookRef.current.offsetWidth,
        height: copybookRef.current.offsetHeight,
      });
      
      const link = document.createElement('a');
      link.download = `${title || '汉字字帖'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('图片导出失败。建议使用“直接打印”功能，在打印选项中选择“另存为 PDF”，这是获取最高清晰度字帖的最佳方式。');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8 font-sans text-gray-900 print:p-0 print:bg-white">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        {/* Sidebar / Controls */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 space-y-6 sticky top-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Settings2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">字帖配置面板</h2>
                <p className="text-xs text-gray-400">支持自定义颜色与下载导出</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" /> 字帖标题
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5" /> 汉字内容
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full h-32 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-sm font-medium"
                    placeholder="输入想要生成的汉字..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">年级</label>
                    <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">班级</label>
                    <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">姓名</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">外观配置</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> 网格颜色
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={gridColor} 
                        onChange={(e) => setGridColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono text-gray-400 uppercase">{gridColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> 演示字颜色
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={mainCharColor} 
                        onChange={(e) => setMainCharColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono text-gray-400 uppercase">{mainCharColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
                    <span>描红透明度</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">{Math.round(tracingOpacity * 100)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.8" 
                    step="0.05" 
                    value={tracingOpacity} 
                    onChange={(e) => setTracingOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 space-y-3">
              <button
                onClick={handleDownload}
                disabled={isExporting || characters.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                下载高清图片
              </button>
              <button
                onClick={handlePrint}
                disabled={characters.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-stone-200 hover:border-emerald-600 hover:text-emerald-600 text-gray-600 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98]"
              >
                <Printer className="w-5 h-5" />
                直接打印 / 另存为 PDF
              </button>
              <p className="text-[10px] text-center text-gray-400 px-4">
                提示：若下载失败，请点击“直接打印”并在打印设置中选择“另存为 PDF”，可获得矢量级清晰度。
              </p>
            </div>
          </div>
        </div>

        {/* Preview Area (A4 Size) */}
        <div className="lg:col-span-8 print:w-full overflow-x-auto custom-scrollbar pb-8">
          <div className="bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none mx-auto origin-top" style={{ width: '210mm', minHeight: '297mm' }}>
            <div 
              ref={copybookRef}
              className="bg-white p-[15mm] w-full h-full"
              style={{ 
                fontFamily: '"Noto Sans SC", sans-serif',
              }}
            >
              {/* Header Section */}
              <div className="text-center mb-6">
                <h1 className="text-[28pt] font-bold text-gray-800 mb-4 tracking-wider">
                  {title}
                </h1>
                
                <div className="flex justify-center gap-6 text-[11pt] text-gray-700 items-center">
                  <div>
                    年级：<span className="inline-block border-b border-gray-500 w-10 text-center">{grade}</span> 年
                  </div>
                  <div>
                    班级：<span className="inline-block border-b border-gray-500 w-10 text-center">{className}</span> 班
                  </div>
                  <div className="flex items-center">
                    姓名：
                    <div className="inline-flex border border-gray-500 ml-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-6 h-6 border-r border-gray-500 last:border-r-0 flex items-center justify-center">
                          {name[i]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Content */}
              <div className="border-t border-l border-r border-gray-500">
                {characters.length > 0 ? (
                  characters.map((char) => (
                    <CopybookRow key={char} char={char} gridColor={gridColor} mainColor={mainCharColor} tracingOpacity={tracingOpacity} />
                  ))
                ) : (
                  <div className="py-40 text-center text-gray-300">
                    在左侧输入汉字开始生成
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center text-[9pt] text-gray-400">
                第 1 页，共 1 页
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-hidden {
            display: none;
          }
          div[style*="width: 210mm"] {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
