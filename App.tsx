
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLanguage, AppSection, BoardItem, BoardLink } from './types';
import { TRANSLATIONS } from './constants';
import Button from './components/Button';

// Initial Whiteboard Data
const INITIAL_BOARD_ITEMS: BoardItem[] = [
  { id: '1', type: 'objective', content: 'Mission: Alpha Launch', x: 550, y: 50, isCompleted: false },
  { id: '2', type: 'sticky', content: 'Core Task: Develop MVP', x: 600, y: 300, color: 'bg-yellow-200' },
  { id: '3', type: 'idea-strip', content: 'User Auth Flow', x: 250, y: 300 },
  { id: '4', type: 'idea-strip', content: 'Payment Gateway', x: 950, y: 300 },
  { id: '5', type: 'goal', content: 'Public Release', x: 630, y: 600, isCompleted: false },
];

const INITIAL_BOARD_LINKS: BoardLink[] = [
  { id: 'l1', fromId: '1', toId: '2', variant: 'critical' },
  { id: 'l2', fromId: '3', toId: '2', variant: 'neutral' },
  { id: 'l3', fromId: '4', toId: '2', variant: 'neutral' },
  { id: 'l4', fromId: '2', toId: '5', variant: 'positive' }
];

// --- ICONS ---
const CheckeredFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 2H6V22H4V2Z" />
    <path d="M6 2H10V6H6V2Z" className="text-black dark:text-white" />
    <path d="M10 2H14V6H10V2Z" className="text-slate-300 dark:text-slate-600" />
    <path d="M14 2H18V6H14V2Z" className="text-black dark:text-white" />
    
    <path d="M6 6H10V10H6V6Z" className="text-slate-300 dark:text-slate-600" />
    <path d="M10 6H14V10H10V6Z" className="text-black dark:text-white" />
    <path d="M14 6H18V10H14V6Z" className="text-slate-300 dark:text-slate-600" />

    <path d="M6 10H10V14H6V10Z" className="text-black dark:text-white" />
    <path d="M10 10H14V14H10V10Z" className="text-slate-300 dark:text-slate-600" />
    <path d="M14 10H18V14H14V10Z" className="text-black dark:text-white" />
  </svg>
);

// --- COMPONENTS ---

// 1. Scanner/Document Writer Component
interface DocBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
  tag?: 'goal' | 'objective' | 'sticky' | 'idea-strip' | 'image';
}

interface DocumentScannerProps {
  t: (key: string) => string;
  onSync: (items: BoardItem[], links: BoardLink[]) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ t, onSync }) => {
  const [blocks, setBlocks] = useState<DocBlock[]>([
    { id: '1', type: 'text', content: 'Start typing your strategy here...' }
  ]);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);

  const addBlock = (type: 'text' | 'image') => {
    const newBlock: DocBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'text' ? '' : 'https://picsum.photos/400/200'
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleRightClick = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, blockId });
  };

  const handleTag = (tag: DocBlock['tag']) => {
    if (contextMenu) {
      setBlocks(prev => prev.map(b => b.id === contextMenu.blockId ? { ...b, tag } : b));
      setContextMenu(null);
    }
  };

  // The Core Logic for Syncing to Board
  const handleSyncToBoard = () => {
    const newItems: BoardItem[] = [];
    const newLinks: BoardLink[] = [];
    
    let lastTaskItemId: string | null = null;
    let gridX = 100;
    let gridY = 100;

    blocks.forEach((block, index) => {
      // If block is tagged, create a board item
      if (block.tag) {
        const newItem: BoardItem = {
          id: `scan-${block.id}`,
          type: block.tag === 'sticky' ? 'sticky' : 
                block.tag === 'image' ? 'image' :
                block.tag === 'goal' ? 'goal' :
                block.tag === 'objective' ? 'objective' : 'idea-strip',
          content: block.content,
          x: gridX,
          y: gridY,
          color: block.tag === 'sticky' ? 'bg-yellow-200' : undefined,
          isCompleted: false
        };

        // If it's a task (sticky), remember it as the potential parent
        if (block.tag === 'sticky') {
            lastTaskItemId = newItem.id;
        }

        // Logic: "if the image is tagged below the task note then the image is related to that task note"
        // We check if this block is an image, and if we have a lastTaskItemId
        if (block.tag === 'image' && lastTaskItemId) {
            newLinks.push({
                id: `link-${Math.random().toString(36).substr(2, 9)}`,
                fromId: lastTaskItemId,
                toId: newItem.id,
                variant: 'neutral'
            });
        }

        newItems.push(newItem);

        // Simple grid positioning logic so they don't stack perfectly on top of each other
        gridX += 220;
        if (gridX > 800) {
            gridX = 100;
            gridY += 220;
        }
      }
    });

    onSync(newItems, newLinks);
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
        case 'goal': return 'bg-black text-white border-black';
        case 'objective': return 'bg-red-600 text-white border-red-600';
        case 'sticky': return 'bg-yellow-400 text-black border-yellow-500';
        case 'idea-strip': return 'bg-purple-500 text-white border-purple-500';
        case 'image': return 'bg-blue-500 text-white border-blue-500';
        default: return 'hidden';
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col" onClick={() => setContextMenu(null)}>
       {/* Toolbar */}
       <div className="p-4 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm z-20">
          <div>
            <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tight">{t('scannerTitle')}</h2>
            <p className="text-xs text-slate-500">{t('scannerSubtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => addBlock('text')}>+ {t('addTextBlock')}</Button>
            <Button size="sm" variant="secondary" onClick={() => addBlock('image')}>+ {t('addImageBlock')}</Button>
            <Button size="sm" variant="primary" onClick={handleSyncToBoard}>{t('syncToBoard')}</Button>
          </div>
       </div>

       {/* Editor Area */}
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4 min-h-[500px] bg-white dark:bg-stone-900 shadow-2xl p-12 rounded-sm relative">
            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>

             {blocks.map((block) => (
               <div 
                 key={block.id} 
                 className="relative group transition-all duration-200"
                 onContextMenu={(e) => handleRightClick(e, block.id)}
               >
                 {/* Tag Indicator */}
                 {block.tag && (
                    <div className={`absolute -left-32 top-1 w-28 text-right`}>
                        <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded-full border shadow-sm ${getTagColor(block.tag)}`}>
                            {block.tag === 'sticky' ? 'Task' : block.tag}
                        </span>
                    </div>
                 )}

                 {/* Content */}
                 <div className={`relative p-2 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${block.tag ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                    {block.type === 'text' ? (
                        <textarea 
                           className="w-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200"
                           rows={Math.max(2, block.content.split('\n').length)}
                           value={block.content}
                           onChange={(e) => updateBlock(block.id, e.target.value)}
                           placeholder="Type here..."
                        />
                    ) : (
                        <div className="relative">
                            <input 
                                className="w-full bg-slate-100 dark:bg-slate-800 p-2 text-xs rounded mb-2 text-slate-500"
                                placeholder="Paste Image URL here..."
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                            />
                            {block.content && (
                                <img src={block.content} alt="Block" className="max-w-full rounded shadow-md max-h-[300px] object-cover" />
                            )}
                        </div>
                    )}
                    
                    {/* Delete Button */}
                    <button 
                        onClick={() => deleteBlock(block.id)}
                        className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
               </div>
             ))}
          </div>
       </div>

       {/* Custom Context Menu */}
       {contextMenu && (
         <div 
            className="fixed z-50 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg shadow-xl py-2 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
         >
            <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">Tag As...</div>
            <button onClick={() => handleTag('goal')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-stone-700 flex items-center gap-2">
                <CheckeredFlagIcon className="w-3 h-3 text-black dark:text-white" /> {t('tagAsGoal')}
            </button>
            <button onClick={() => handleTag('objective')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span> {t('tagAsObjective')}
            </button>
            <button onClick={() => handleTag('sticky')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span> {t('tagAsTask')}
            </button>
            <button onClick={() => handleTag('idea-strip')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> {t('tagAsIdea')}
            </button>
            <button onClick={() => handleTag('image')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('tagAsImage')}
            </button>
            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
            <button onClick={() => handleTag(undefined)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                {t('untag')}
            </button>
         </div>
       )}
    </div>
  );
};

interface PlanningSheetProps {
  boardItems: BoardItem[];
  boardLinks: BoardLink[];
  t: (key: string) => string;
}

const PlanningSheet: React.FC<PlanningSheetProps> = ({ boardItems, boardLinks, t }) => {
  // 1. Group Goals
  const goals = boardItems.filter(i => i.type === 'goal');
  const objectives = boardItems.filter(i => i.type === 'objective');
  const tasks = boardItems.filter(i => i.type === 'sticky');
  const ideas = boardItems.filter(i => i.type === 'idea-strip');
  
  const getDeps = (id: string, type: 'incoming' | 'outgoing') => {
    const links = boardLinks.filter(l => type === 'incoming' ? l.toId === id : l.fromId === id);
    return links.map(l => {
      const targetId = type === 'incoming' ? l.fromId : l.toId;
      return boardItems.find(i => i.id === targetId);
    }).filter(Boolean) as BoardItem[];
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto min-h-full bg-white dark:bg-black shadow-xl">
        <div className="p-12 space-y-12">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-8 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">{t('strategicPlan')}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-serif italic">Generated from Planning Room Board • {new Date().toLocaleDateString()}</p>
          </div>

          {/* Strategic Goals Section */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              {t('strategicGoals')}
            </h2>
            <div className="grid gap-6">
              {goals.length === 0 ? <p className="text-slate-400 italic">{t('noGoals')}</p> : goals.map(goal => {
                const contributors = getDeps(goal.id, 'incoming');
                return (
                  <div key={goal.id} className="p-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <CheckeredFlagIcon className="w-24 h-24 text-black dark:text-white" />
                    </div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <CheckeredFlagIcon className="w-6 h-6 text-slate-900 dark:text-white" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{goal.content}</h3>
                      </div>
                      {goal.isCompleted && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Achieved</span>}
                    </div>
                    
                    {contributors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Dependencies</p>
                        <ul className="space-y-2">
                          {contributors.map(c => (
                            <li key={c.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.type === 'objective' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                              {c.content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Objectives Section */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              {t('missionObjectives')}
            </h2>
            <div className="space-y-4">
              {objectives.length === 0 ? <p className="text-slate-400 italic">{t('noObjectives')}</p> : objectives.map(obj => (
                <div key={obj.id} className="flex items-start gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-black text-slate-300">
                    {obj.id.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{obj.content}</h4>
                    <div className="mt-2 flex gap-2">
                       {getDeps(obj.id, 'incoming').length > 0 && (
                         <span className="text-xs text-slate-500">{t('requires')} {getDeps(obj.id, 'incoming').length} {t('inputs')}</span>
                       )}
                       {getDeps(obj.id, 'outgoing').length > 0 && (
                         <span className="text-xs text-slate-500">{t('contributes')} {getDeps(obj.id, 'outgoing').length} {t('outcomes')}</span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

           {/* Action Items Section */}
           <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              {t('actionItems')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? <p className="text-slate-400 italic">{t('noTasks')}</p> : tasks.map(task => {
                const targets = getDeps(task.id, 'outgoing');
                return (
                  <div key={task.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                    <p className="font-serif text-lg leading-snug text-slate-800 dark:text-slate-200">{task.content}</p>
                    {targets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-200/50 flex flex-wrap gap-2">
                        {targets.map(t => (
                          <span key={t.id} className="text-[10px] font-bold uppercase px-2 py-1 bg-white/50 dark:bg-black/20 rounded text-slate-600 dark:text-slate-400">
                             For: {t.content.substring(0, 15)}...
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ideas Section */}
          {ideas.length > 0 && (
            <section>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                {t('conceptRepository')}
              </h2>
              <div className="flex flex-wrap gap-3">
                {ideas.map(idea => (
                  <div key={idea.id} className="px-4 py-3 bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 relative overflow-hidden">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50"></div>
                    {idea.content}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

interface PlanningBoardProps {
  boardItems: BoardItem[];
  setBoardItems: React.Dispatch<React.SetStateAction<BoardItem[]>>;
  boardLinks: BoardLink[];
  setBoardLinks: React.Dispatch<React.SetStateAction<BoardLink[]>>;
}

const PlanningBoard: React.FC<PlanningBoardProps> = ({ 
  boardItems, 
  setBoardItems, 
  boardLinks, 
  setBoardLinks
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [pendingLinkStart, setPendingLinkStart] = useState<string | null>(null);
    const [activeLinkVariant, setActiveLinkVariant] = useState<BoardLink['variant']>('critical');
    const [activeLinkMenuId, setActiveLinkMenuId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    // Zoom & Pan State
    const [transform, setTransform] = useState({ x: 0, y: 0, s: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [focusModeId, setFocusModeId] = useState<string | null>(null);

    const [isTaskWizardOpen, setIsTaskWizardOpen] = useState(false);
    const [wizardTaskName, setWizardTaskName] = useState('');
    const [wizardGoalId, setWizardGoalId] = useState<string>('');
    const [wizardNewGoalName, setWizardNewGoalName] = useState('');
    const [wizardSourceId, setWizardSourceId] = useState<string | null>(null);

    // --- POSITIONING HELPERS ---
    const getItemDimensions = (type: BoardItem['type']) => {
        switch (type) {
            case 'objective': return { w: 300, h: 200 }; 
            case 'idea-strip': return { w: 280, h: 60 };
            case 'image': return { w: 280, h: 220 };
            case 'goal': return { w: 180, h: 180 };
            case 'sticky': 
            default: return { w: 180, h: 180 };
        }
    };

    const checkOverlap = (x: number, y: number, width: number, height: number, excludeId?: string) => {
        const buffer = 40;
        return boardItems.some(item => {
            if (item.id === excludeId) return false;
            const d = getItemDimensions(item.type);
            return (
                x < item.x + d.w + buffer &&
                x + width + buffer > item.x &&
                y < item.y + d.h + buffer &&
                y + height + buffer > item.y
            );
        });
    };

    const findBestPosition = (refX: number, refY: number, width: number, height: number, mode: 'spiral' | 'grid-below' = 'spiral') => {
        if (mode === 'grid-below') {
             const rowHeight = 250;
             const offsets = [0, 220, -220, 440, -440, 660, -660, 880, -880];
             for (let row = 1; row <= 5; row++) {
                 const targetY = refY + (row * rowHeight);
                 for (const ox of offsets) {
                     const targetX = refX + ox;
                     if (!checkOverlap(targetX, targetY, width, height)) {
                         return { x: targetX, y: targetY };
                     }
                 }
             }
        }

        let angle = 0;
        let radius = 0;
        let x = refX;
        let y = refY;
        let attempts = 0;
        
        while (checkOverlap(x, y, width, height) && attempts < 200) {
             radius += 15;
             angle += 0.8;
             x = refX + Math.cos(angle) * radius;
             y = refY + Math.sin(angle) * radius;
             attempts++;
        }
        return { x, y };
    };

    const getViewportCenter = () => {
        if (!containerRef.current) return { x: 400, y: 300 };
        const rect = containerRef.current.getBoundingClientRect();
        const cx = (rect.width / 2 - transform.x) / transform.s;
        const cy = (rect.height / 2 - transform.y) / transform.s;
        return { x: cx, y: cy };
    };

    const getBoardCoordinates = (clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - transform.x) / transform.s,
            y: (clientY - rect.top - transform.y) / transform.s
        };
    };

    const handleAddItem = (type: BoardItem['type']) => {
      const center = getViewportCenter();
      const dims = getItemDimensions(type);
      const pos = findBestPosition(center.x - dims.w/2, center.y - dims.h/2, dims.w, dims.h, 'spiral');

      const newItem: BoardItem = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: type === 'image' ? 'https://picsum.photos/300/200' : (
          type === 'sticky' ? 'Note' : 
          (type === 'objective' ? 'New Objective' : 
          (type === 'idea-strip' ? 'New Idea Strip' : 
          (type === 'goal' ? 'New Goal' : 'Card')))
        ),
        x: pos.x,
        y: pos.y,
        color: type === 'sticky' ? 'bg-yellow-200' : undefined,
        isCompleted: false,
        isLocked: false
      };
      setBoardItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
      
      if (type === 'objective') {
        enterFocusMode(newItem.id, 'node', newItem.x, newItem.y);
      }
    };

    const openTaskWizard = (sourceId?: string) => {
        setWizardSourceId(sourceId || null);
        const goals = boardItems.filter(i => i.type === 'goal');
        if (goals.length > 0) {
            setWizardGoalId(goals[0].id);
        } else {
            setWizardGoalId('');
        }
        setIsTaskWizardOpen(true);
    };

    const createConnectedIdea = (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation();
        const sourceItem = boardItems.find(i => i.id === sourceId);
        if (!sourceItem) return;

        const dims = getItemDimensions('idea-strip');
        const pos = findBestPosition(sourceItem.x, sourceItem.y, dims.w, dims.h, 'grid-below');

        const newItem: BoardItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'idea-strip',
            content: 'New Idea',
            x: pos.x,
            y: pos.y,
            isCompleted: false,
            isLocked: false
        };

        const newLink: BoardLink = {
             id: Math.random().toString(36).substr(2, 9),
             fromId: sourceItem.id,
             toId: newItem.id,
             variant: 'neutral'
        };

        setBoardItems(prev => [...prev, newItem]);
        setBoardLinks(prev => [...prev, newLink]);
        setActiveLinkMenuId(null);
        setSelectedId(newItem.id);
    };

    const handleCreateLinkedTask = (e: React.FormEvent) => {
        e.preventDefault();
        
        let sourceItem = wizardSourceId ? boardItems.find(i => i.id === wizardSourceId) : null;
        if (!sourceItem) {
             sourceItem = boardItems.find(i => i.type === 'objective') || null;
        }

        const center = getViewportCenter();
        const refX = sourceItem ? sourceItem.x : center.x;
        const refY = sourceItem ? sourceItem.y : center.y;
        
        const taskDims = getItemDimensions('sticky');
        const taskPos = findBestPosition(refX, refY, taskDims.w, taskDims.h, sourceItem ? 'grid-below' : 'spiral');

        const newTask: BoardItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'sticky',
            content: wizardTaskName || 'New Task',
            x: taskPos.x, 
            y: taskPos.y,
            color: 'bg-yellow-200',
            isCompleted: false,
            isLocked: false
        };

        const newItems = [newTask];
        const newLinks: BoardLink[] = [];

        if (sourceItem) {
            newLinks.push({
                id: Math.random().toString(36).substr(2, 9),
                fromId: sourceItem.id,
                toId: newTask.id,
                variant: 'critical'
            });
        }

        let targetGoalId = wizardGoalId;

        if (wizardGoalId === 'new_goal' || (!wizardGoalId && wizardNewGoalName)) {
             const goalDims = getItemDimensions('goal');
             const goalPos = findBestPosition(taskPos.x, taskPos.y, goalDims.w, goalDims.h, 'grid-below');

             const newGoal: BoardItem = {
                 id: Math.random().toString(36).substr(2, 9),
                 type: 'goal',
                 content: wizardNewGoalName || 'New Goal',
                 x: goalPos.x,
                 y: goalPos.y,
                 isCompleted: false,
                 isLocked: false
             };
             newItems.push(newGoal);
             targetGoalId = newGoal.id;
        }

        if (targetGoalId && targetGoalId !== 'new_goal') {
             newLinks.push({
                 id: Math.random().toString(36).substr(2, 9),
                 fromId: newTask.id,
                 toId: targetGoalId,
                 variant: 'positive'
             });
        }

        setBoardItems(prev => [...prev, ...newItems]);
        setBoardLinks(prev => [...prev, ...newLinks]);
        
        setIsTaskWizardOpen(false);
        setWizardTaskName('');
        setWizardGoalId('');
        setWizardNewGoalName('');
        setWizardSourceId(null);
    };

    const handleUpdateItem = (id: string, updates: Partial<BoardItem>) => {
      setBoardItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleDeleteItem = (id: string) => {
        setDeletingIds(prev => { const n = new Set(prev); n.add(id); return n; });
        if (selectedId === id) setSelectedId(null);
        if (focusModeId === id) setFocusModeId(null);
        setTimeout(() => {
            setBoardItems(prev => prev.filter(item => item.id !== id));
            setBoardLinks(prev => prev.filter(l => l.fromId !== id && l.toId !== id));
            setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        }, 300);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (focusModeId) return;
        const zoomSensitivity = 0.001;
        const newScale = Math.min(Math.max(0.1, transform.s - e.deltaY * zoomSensitivity), 5);
        setTransform(prev => ({ ...prev, s: newScale }));
    };

    const handleStartLink = (e: React.MouseEvent, id: string, variant: BoardLink['variant']) => {
        e.stopPropagation();
        const coords = getBoardCoordinates(e.clientX, e.clientY);
        setCursorPos(coords);
        setPendingLinkStart(id);
        setActiveLinkVariant(variant);
        setActiveLinkMenuId(null);
    };

    const createConnectedTask = (e: React.MouseEvent, sourceId: string, variant: BoardLink['variant']) => {
        e.stopPropagation();
        const sourceItem = boardItems.find(i => i.id === sourceId);
        if (!sourceItem) return;

        const dims = getItemDimensions('sticky');
        const pos = findBestPosition(sourceItem.x, sourceItem.y, dims.w, dims.h, 'grid-below');
        
        const newTask: BoardItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'sticky',
            content: 'New Task',
            x: pos.x,
            y: pos.y,
            color: 'bg-yellow-200',
            isCompleted: false,
            isLocked: false
        };

        const newLink: BoardLink = {
             id: Math.random().toString(36).substr(2, 9),
             fromId: sourceItem.id,
             toId: newTask.id,
             variant: variant
        };

        setBoardItems(prev => [...prev, newTask]);
        setBoardLinks(prev => [...prev, newLink]);
        setActiveLinkMenuId(null);
        setSelectedId(newTask.id);
    };

    const handleMouseDown = (e: React.MouseEvent, id?: string) => {
      e.stopPropagation();
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      if (!id) {
        if (e.button === 0) { 
           if (pendingLinkStart) {
             setPendingLinkStart(null);
             return;
           }
           setIsPanning(true);
           setSelectedId(null);
           setActiveLinkMenuId(null);
           if (focusModeId) exitFocusMode(); 
        }
        return;
      }

      if (pendingLinkStart) {
           if (pendingLinkStart !== id) {
               const newLink: BoardLink = {
                 id: Math.random().toString(36).substr(2, 9),
                 fromId: pendingLinkStart,
                 toId: id,
                 variant: activeLinkVariant
               };
               setBoardLinks(prev => [...prev, newLink]);
           }
           setPendingLinkStart(null);
           return;
      }

      const item = boardItems.find(i => i.id === id);
      if (!item) return;
      
      setSelectedId(id);
      setActiveLinkMenuId(null);
      if (!item.isLocked) {
          setDraggingId(id);
      }
    };

    const handleContainerMouseMove = (e: React.MouseEvent) => {
      if (pendingLinkStart) {
         setCursorPos(getBoardCoordinates(e.clientX, e.clientY));
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (isPanning && !focusModeId) {
          const dx = clientX - lastMousePos.current.x;
          const dy = clientY - lastMousePos.current.y;
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          lastMousePos.current = { x: clientX, y: clientY };
          return;
      }

      if (draggingId) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const scale = transform.s;
        
        setBoardItems(prev => prev.map(item => {
          if (item.id === draggingId) {
            return {
              ...item,
              x: item.x + dx / scale,
              y: item.y + dy / scale
            };
          }
          return item;
        }));
        lastMousePos.current = { x: clientX, y: clientY };
      }
    };

    const handleContainerMouseUp = () => {
      setDraggingId(null);
      setIsPanning(false);
    };

    const handleDoubleClickNode = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const item = boardItems.find(i => i.id === id);
        if (item) {
            enterFocusMode(id, 'node', item.x, item.y + 100);
        }
    };

    const enterFocusMode = (id: string, type: 'node' | 'link', targetX: number, targetY: number) => {
        if (!containerRef.current) return;
        setFocusModeId(id);
        setSelectedId(id);
        const rect = containerRef.current.getBoundingClientRect();
        const targetScale = 1.5;
        const newX = (rect.width / 2) - (targetX * targetScale);
        const newY = (rect.height / 2) - (targetY * targetScale);
        setTransform({ x: newX, y: newY, s: targetScale });
    };

    const exitFocusMode = () => {
        setFocusModeId(null);
    };

    const toggleLinkMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveLinkMenuId(prev => prev === id ? null : id);
    };

    const getItemCenter = (item: BoardItem) => {
        let w = 160, h = 160;
        if (item.type === 'image') { w = 256; h = 200; }
        else if (item.type === 'text') { w = 180; h = 60; }
        else if (item.type === 'objective') { w = 256; h = 140; } 
        else if (item.type === 'idea-strip') { w = 280; h = 60; } // Adjusted for new size
        else if (item.type === 'goal') { w = 180; h = 180; }
        return { x: item.x + w/2, y: item.y + h/2 };
    };

    const connections = useMemo(() => {
      const linkGroups: Record<string, BoardLink[]> = {};
      boardLinks.forEach(link => {
          const ids = [link.fromId, link.toId].sort().join('-');
          if (!linkGroups[ids]) linkGroups[ids] = [];
          linkGroups[ids].push(link);
      });

      return boardLinks.map(link => {
        const from = boardItems.find(i => i.id === link.fromId);
        const to = boardItems.find(i => i.id === link.toId);
        if (!from || !to) return null;

        const p1 = getItemCenter(from);
        const p2 = getItemCenter(to);

        const colorMap = {
           critical: '#ef4444', 
           positive: '#22c55e', 
           alternative: '#3b82f6', 
           neutral: '#9ca3af' 
        };

        const pairId = [link.fromId, link.toId].sort().join('-');
        const siblings = linkGroups[pairId] || [link];
        const index = siblings.findIndex(l => l.id === link.id);
        const count = siblings.length;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        let nx = -dy / (dist || 1);
        let ny = dx / (dist || 1);
        const spread = 30;
        const centeredIndex = index - (count - 1) / 2;
        const offset = centeredIndex * spread;
        const controlX = midX + nx * offset;
        const controlY = midY + ny * offset;
        const isFocused = focusModeId === link.id;
        const isDimmed = focusModeId && focusModeId !== link.id;

        return (
          <g key={link.id} 
             className={`${isDimmed ? 'opacity-20 blur-[1px]' : 'opacity-90'} transition-all duration-500`}
             onClick={(e) => { e.stopPropagation(); setSelectedId(link.id); }}
          >
             <path 
                d={`M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
                style={{ cursor: 'pointer' }}
             />
             <path 
              d={`M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`}
              stroke={colorMap[link.variant]}
              strokeWidth={isFocused ? "6" : "2"}
              fill="none"
              className="drop-shadow-sm transition-all duration-300"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }} 
            />
            <circle cx={p1.x} cy={p1.y} r={isFocused ? 6 : 3} fill={colorMap[link.variant]} />
            <circle cx={p2.x} cy={p2.y} r={isFocused ? 6 : 3} fill={colorMap[link.variant]} />
          </g>
        );
      });
    }, [boardItems, boardLinks, transform, focusModeId, selectedId]);

    const pendingConnection = useMemo(() => {
        if (!pendingLinkStart) return null;
        const startItem = boardItems.find(i => i.id === pendingLinkStart);
        if (!startItem) return null;
        const p1 = getItemCenter(startItem);
        const p2 = cursorPos;
        const colorMap = { critical: '#ef4444', positive: '#22c55e', alternative: '#3b82f6', neutral: '#9ca3af' };
        return (
             <g className="pointer-events-none">
                 <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={colorMap[activeLinkVariant]} strokeWidth="3" strokeDasharray="5,5" strokeLinecap="round" className="animate-pulse opacity-80" />
                 <circle cx={p2.x} cy={p2.y} r={5} fill={colorMap[activeLinkVariant]} stroke="white" strokeWidth="2" />
             </g>
        );
    }, [pendingLinkStart, cursorPos, activeLinkVariant, boardItems]);

    return (
      <div className={`flex flex-col h-full relative overflow-hidden font-serif planning-board transition-colors duration-500 bg-[#1c1917]`}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

        {/* Toolbar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 p-2 rounded-xl bg-stone-800 border-2 border-stone-600 shadow-2xl no-print">
          <div className="flex gap-2 pr-4 border-r border-stone-600">
             <button onClick={() => openTaskWizard()} className="flex flex-col items-center group bg-blue-900/50 rounded hover:bg-blue-800 border border-blue-700 transition-colors" title="Add Linked Task">
                <div className="w-10 h-10 flex items-center justify-center text-blue-300">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
             </button>
             <button onClick={() => handleAddItem('objective')} className="flex flex-col items-center group" title="Add Objective">
                 <div className="w-10 h-8 bg-[#1e293b] border border-stone-500 rounded flex flex-col relative overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                    <div className="h-2 bg-stone-600 w-5 rounded-tr-sm ml-0"></div>
                    <div className="flex-1 bg-[#0f172a] border-t border-stone-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-900 border border-red-500"></div>
                    </div>
                </div>
             </button>
             <button onClick={() => handleAddItem('sticky')} className="flex flex-col items-center group" title="Add Note">
                <div className="w-10 h-10 bg-yellow-200 border border-yellow-400 shadow-sm flex items-center justify-center"></div>
             </button>
             <button onClick={() => handleAddItem('idea-strip')} className="flex flex-col items-center group" title="Add Idea">
                <div className="w-10 h-10 bg-stone-100 border border-stone-300 rounded shadow-sm flex items-center justify-center">
                   <div className="w-6 h-2 bg-stone-300 rounded-sm"></div>
                </div>
             </button>
             <button onClick={() => handleAddItem('goal')} className="flex flex-col items-center group" title="Add Goal (Finish Line)">
                <div className="w-10 h-10 bg-white border-2 border-black shadow-sm flex items-center justify-center p-1">
                   <CheckeredFlagIcon className="w-full h-full text-black" />
                </div>
             </button>
          </div>
          <div className="flex gap-2 pl-4 border-l border-stone-600">
             <button onClick={() => setTransform(prev => ({ ...prev, s: Math.min(prev.s + 0.2, 5) }))} className="p-2 hover:bg-stone-700 rounded text-stone-400 hover:text-white" title="Zoom In">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
             </button>
             <button onClick={() => setTransform(prev => ({ ...prev, s: Math.max(prev.s - 0.2, 0.1) }))} className="p-2 hover:bg-stone-700 rounded text-stone-400 hover:text-white" title="Zoom Out">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
             </button>
             <button onClick={() => setTransform({ x: 0, y: 0, s: 1 })} className="p-2 hover:bg-stone-700 rounded text-stone-400 hover:text-white" title="Reset View">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </button>
             <button onClick={() => { setBoardItems([]); setBoardLinks([]); }} className="p-2 hover:bg-stone-700 rounded text-stone-400 hover:text-red-400 transition-colors" title="Clear Board">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
          </div>
        </div>

        {/* Task Wizard Modal */}
        {isTaskWizardOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 border-b border-stone-800 pb-4">Add Linked Task</h3>
                    <form onSubmit={handleCreateLinkedTask} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Task Description</label>
                            <input autoFocus required value={wizardTaskName} onChange={(e) => setWizardTaskName(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium" placeholder="e.g., Secure Funding Round A" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Connect to Goal</label>
                            <select value={wizardGoalId} onChange={(e) => setWizardGoalId(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
                                <option value="" disabled>Select Target Goal...</option>
                                <option value="new_goal">+ Create New Goal</option>
                                {boardItems.filter(i => i.type === 'goal').map(goal => (
                                    <option key={goal.id} value={goal.id}>{goal.content}</option>
                                ))}
                            </select>
                        </div>
                        {wizardGoalId === 'new_goal' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">New Goal Name</label>
                                <input required value={wizardNewGoalName} onChange={(e) => setWizardNewGoalName(e.target.value)} className="w-full bg-stone-800 border border-emerald-500/50 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" placeholder="e.g., IPO Launch" />
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsTaskWizardOpen(false)} className="flex-1 py-3 bg-transparent border border-stone-700 text-stone-400 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-stone-800 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">Create Node</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        
        {/* Exit Focus Mode Button */}
        {focusModeId && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4">
                <button 
                    onClick={exitFocusMode}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-full shadow-2xl transition-all hover:scale-105"
                >
                    Exit Focus Mode
                </button>
            </div>
        )}

        {/* Canvas */}
        <div 
          ref={containerRef}
          className={`flex-1 relative overflow-hidden ${pendingLinkStart ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          onWheel={handleWheel}
        >
          <div 
            style={{ 
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.s})`,
                transformOrigin: '0 0',
                transition: isPanning ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                width: '100%',
                height: '100%'
            }}
            className="w-full h-full"
          >
              <svg className="absolute top-0 left-0 overflow-visible" style={{ width: '10000px', height: '10000px', pointerEvents: 'visibleStroke' }}>{connections} {pendingConnection}</svg>

              {boardItems.map((item, index) => {
                 const rotation = (parseInt(item.id.substr(0, 4), 36) % 6) - 3;
                 const isSelected = selectedId === item.id;
                 const isFocused = focusModeId === item.id;
                 const isBlurred = focusModeId && focusModeId !== item.id;
                 const isMenuOpen = activeLinkMenuId === item.id;
                 const isDeleting = deletingIds.has(item.id);
                 
                 return (
                <div
                  key={item.id}
                  className={`absolute group touch-none select-none transition-all duration-300 z-10 
                    ${isDeleting ? 'opacity-0 scale-75 pointer-events-none' : ''}
                    ${isSelected || isFocused ? 'z-50 scale-105' : ''} 
                    ${isBlurred ? 'blur-[2px] opacity-40 grayscale' : ''}`}
                  style={{ left: item.x, top: item.y, transform: `rotate(${isFocused ? 0 : rotation}deg)` }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onDoubleClick={(e) => handleDoubleClickNode(e, item.id)}
                >
                  <div className={`relative ${isSelected || isFocused ? 'ring-4 ring-blue-500/50 shadow-2xl' : ''}`}>
                    {/* Linker */}
                    <div className={`absolute -right-3 top-1/2 -translate-y-1/2 z-50 transition-all hover:translate-x-1 ${isMenuOpen ? 'opacity-100 z-[60]' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="relative group/linker flex items-center" onMouseDown={(e) => e.stopPropagation()}>
                            <div 
                                onClick={(e) => toggleLinkMenu(e, item.id)}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer shadow-sm transition-colors ${isMenuOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-stone-200 dark:bg-stone-700 border-stone-400 text-stone-600 dark:text-stone-300 hover:bg-blue-100'}`}
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            
                            {isMenuOpen && (
                                <div className="absolute left-full ml-2 z-[100] animate-in slide-in-from-left-2 fade-in">
                                     <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 flex flex-col gap-2 min-w-[140px]">
                                         <div className="flex items-center justify-between gap-3">
                                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Link</span>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => handleStartLink(e, item.id, 'critical')} className="w-5 h-5 rounded-full bg-red-500 border border-white hover:scale-110 transition-transform"></button>
                                                <button onClick={(e) => handleStartLink(e, item.id, 'alternative')} className="w-5 h-5 rounded-full bg-blue-500 border border-white hover:scale-110 transition-transform"></button>
                                                <button onClick={(e) => handleStartLink(e, item.id, 'positive')} className="w-5 h-5 rounded-full bg-green-500 border border-white hover:scale-110 transition-transform"></button>
                                                <button onClick={(e) => handleStartLink(e, item.id, 'neutral')} className="w-5 h-5 rounded-full bg-gray-400 border border-white hover:scale-110 transition-transform"></button>
                                            </div>
                                         </div>
                                         {item.type === 'objective' && (
                                             <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-700">
                                                <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Task</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => createConnectedTask(e, item.id, 'critical')} className="w-5 h-5 rounded-full bg-red-500 border border-white hover:scale-110 transition-transform flex items-center justify-center text-white text-[10px] font-bold">+</button>
                                                    <button onClick={(e) => createConnectedTask(e, item.id, 'alternative')} className="w-5 h-5 rounded-full bg-blue-500 border border-white hover:scale-110 transition-transform flex items-center justify-center text-white text-[10px] font-bold">+</button>
                                                    <button onClick={(e) => createConnectedTask(e, item.id, 'positive')} className="w-5 h-5 rounded-full bg-green-500 border border-white hover:scale-110 transition-transform flex items-center justify-center text-white text-[10px] font-bold">+</button>
                                                </div>
                                             </div>
                                         )}
                                         {(item.type === 'objective' || item.type === 'sticky') && (
                                             <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-700">
                                                <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Idea</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => createConnectedIdea(e, item.id)} className="w-5 h-5 rounded-full bg-purple-100 border border-purple-300 hover:scale-110 transition-transform flex items-center justify-center text-purple-600 text-[10px] font-bold">+</button>
                                                </div>
                                             </div>
                                         )}
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isSelected && !focusModeId && (
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-1 bg-stone-800 p-1.5 rounded shadow-xl border border-stone-600 z-50">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-2 hover:bg-red-900/50 rounded text-stone-400 hover:text-red-400 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}

                    {/* Node Content */}
                    {item.type === 'objective' && (
                       <div className="w-[300px] h-[200px] bg-[#1e293b] text-white p-5 rounded-sm border-l-4 border-red-500 shadow-xl flex flex-col justify-between overflow-hidden">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 block">Objective</span>
                            <textarea 
                                value={item.content}
                                onChange={(e) => handleUpdateItem(item.id, { content: e.target.value })}
                                className="bg-transparent border-none text-xl font-bold font-serif w-full resize-none outline-none placeholder-stone-600"
                                placeholder="Mission Objective..."
                            />
                          </div>
                          <div className="flex justify-between items-end border-t border-stone-700 pt-3">
                              <span className="text-[10px] font-mono text-stone-500">{item.id}</span>
                              <div className="flex gap-1">
                                  <div className={`w-2 h-2 rounded-full ${item.isCompleted ? 'bg-green-500' : 'bg-stone-600'}`}></div>
                              </div>
                          </div>
                       </div>
                    )}
                    
                    {item.type === 'sticky' && (
                        <div className={`w-[180px] h-[180px] p-4 shadow-lg flex flex-col transform rotate-1 ${item.color || 'bg-yellow-200'}`}>
                             <textarea 
                                value={item.content}
                                onChange={(e) => handleUpdateItem(item.id, { content: e.target.value })}
                                className="bg-transparent border-none text-sm font-medium font-handwriting w-full h-full resize-none outline-none text-slate-800 placeholder-slate-500/50"
                                placeholder="Write a note..."
                            />
                        </div>
                    )}

                    {item.type === 'idea-strip' && (
                        <div className="w-[280px] h-[60px] bg-white border border-stone-200 shadow-md flex items-center px-4 rounded-sm">
                             <div className="w-1.5 h-full absolute left-0 top-0 bottom-0 bg-purple-400/50"></div>
                             <input 
                                value={item.content}
                                onChange={(e) => handleUpdateItem(item.id, { content: e.target.value })}
                                className="bg-transparent border-none text-sm font-medium text-stone-700 w-full outline-none font-serif ml-2 italic"
                                placeholder="New Idea..."
                            />
                        </div>
                    )}

                    {item.type === 'goal' && (
                        <div className="w-[180px] h-[180px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-20 group-hover:scale-105 transition-transform">
                            {/* Checkered Strip */}
                            <div className="h-6 w-full border-b-2 border-black" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='10' height='10' fill='black'/%3E%3Crect x='10' y='10' width='10' height='10' fill='black'/%3E%3C/svg%3E")`,
                                backgroundSize: '20px 20px'
                            }}></div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Finish Line</span>
                                <textarea 
                                    value={item.content}
                                    onChange={(e) => handleUpdateItem(item.id, { content: e.target.value })}
                                    className="bg-transparent border-none text-lg font-black uppercase tracking-tight w-full resize-none outline-none text-black placeholder-stone-300 text-center leading-tight"
                                    placeholder="GOAL"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {item.type === 'image' && (
                        <div className="w-[280px] min-h-[220px] bg-white p-2 shadow-lg rotate-1 flex flex-col">
                             <img src={item.content} alt="Board Asset" className="w-full h-auto object-cover rounded-sm" />
                             <div className="mt-2 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400">IMG-{item.id.substr(0,4)}</span>
                             </div>
                        </div>
                    )}
                  </div>
                </div>
              );
              })}
          </div>
        </div>
      </div>
    );
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>('planning');
  const [boardItems, setBoardItems] = useState<BoardItem[]>(INITIAL_BOARD_ITEMS);
  const [boardLinks, setBoardLinks] = useState<BoardLink[]>(INITIAL_BOARD_LINKS);
  const [language, setLanguage] = useState<AppLanguage>('en');

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  const handleSyncFromScanner = (newItems: BoardItem[], newLinks: BoardLink[]) => {
    setBoardItems(prev => [...prev, ...newItems]);
    setBoardLinks(prev => [...prev, ...newLinks]);
    setActiveSection('planning');
  };

  const toggleLanguage = () => {
      const langs = Object.keys(TRANSLATIONS) as AppLanguage[];
      const idx = langs.indexOf(language);
      setLanguage(langs[(idx + 1) % langs.length]);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden font-sans">
      <aside className="w-16 bg-white dark:bg-stone-900 border-r border-slate-200 dark:border-stone-800 flex flex-col items-center py-6 z-50 shadow-sm relative">
        <div className="mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
                P
            </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-3 w-full px-2">
            <button 
                onClick={() => setActiveSection('planning')}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${activeSection === 'planning' ? 'bg-slate-100 dark:bg-stone-800 text-blue-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-stone-800 hover:text-slate-600'}`}
                title={t('planning')}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            </button>
            <button 
                onClick={() => setActiveSection('scan')}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${activeSection === 'scan' ? 'bg-slate-100 dark:bg-stone-800 text-blue-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-stone-800 hover:text-slate-600'}`}
                title={t('scan')}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
                onClick={() => setActiveSection('document')}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${activeSection === 'document' ? 'bg-slate-100 dark:bg-stone-800 text-blue-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-stone-800 hover:text-slate-600'}`}
                title={t('document')}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
        </nav>

        <div className="flex flex-col gap-2 w-full px-2">
            <button 
                onClick={toggleLanguage}
                className="w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-black bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 uppercase tracking-tighter hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors"
                title="Switch Language"
            >
                {language}
            </button>
        </div>
      </aside>

      <main className="flex-1 relative h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        {activeSection === 'planning' && (
            <PlanningBoard 
                boardItems={boardItems} 
                setBoardItems={setBoardItems}
                boardLinks={boardLinks}
                setBoardLinks={setBoardLinks}
            />
        )}
        {activeSection === 'scan' && (
            <DocumentScanner t={t} onSync={handleSyncFromScanner} />
        )}
        {activeSection === 'document' && (
            <PlanningSheet boardItems={boardItems} boardLinks={boardLinks} t={t} />
        )}
      </main>
    </div>
  );
};

export default App;
