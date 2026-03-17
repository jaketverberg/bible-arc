import { useMemo, useRef, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import WorkspaceHeader from './components/WorkspaceHeader';
import BracketPane from './components/BracketPane';
import TextPane from './components/TextPane';
import Legend from './components/Legend';
import KeyModal from './components/KeyModal';
import { useArcing } from './hooks/useArcing';

function WorkspacePage() {
  const arcing = useArcing();
  const [showKeyModal, setShowKeyModal] = useState(!arcing.esvKey);
  const [exportBg, setExportBg] = useState('#f8f5ef');
  const [exportLegend, setExportLegend] = useState(true);
  const workspaceRef = useRef(null);
  const textPaneHeight = useMemo(() => {
    const values = Object.values(arcing.rowRects);
    if (!values.length) return 300;
    return Math.max(...values.map((item) => item.top + item.height)) + 30;
  }, [arcing.rowRects]);

  return (
    <div className="min-h-screen bg-paper text-stone-900 lg:flex">
      <Sidebar
        currentRef={arcing.currentRef}
        setCurrentRef={arcing.setCurrentRef}
        onLoad={arcing.loadPassage}
        loading={arcing.loading}
        selected={arcing.selected}
        onApplyRelation={arcing.addBracket}
        brackets={arcing.brackets}
        props={arcing.props}
        onFlip={arcing.flipBracket}
        onDelete={arcing.deleteBracket}
        onUndoSplit={arcing.undoSplit}
        onAutoSplit={arcing.autoSplit}
        onResetSplits={arcing.resetSplits}
        onShowKey={() => setShowKeyModal(true)}
        workspaceRef={workspaceRef}
        exportBg={exportBg}
        setExportBg={setExportBg}
        exportLegend={exportLegend}
        setExportLegend={setExportLegend}
      />
      <main className="min-w-0 flex-1">
        <WorkspaceHeader currentRef={arcing.currentRef} />
        {arcing.error && <div className="mx-4 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{arcing.error}</div>}
        <div ref={workspaceRef} style={{ background: exportBg }} className="overflow-x-auto">
          <div className="flex min-w-full items-start">
            <BracketPane
              brackets={arcing.derivedBrackets}
              paneWidth={arcing.workspaceReady ? arcing.bracketLayout.paneWidth : 60}
              paneHeight={textPaneHeight}
              onUpdate={arcing.updateBracket}
              onDelete={arcing.deleteBracket}
              onFlip={arcing.flipBracket}
            />
            <TextPane
              props={arcing.props}
              selected={arcing.selected}
              onSelect={arcing.toggleSelection}
              onMeasure={arcing.setRowMeasurement}
              onSplit={arcing.splitProposition}
            />
          </div>
          {exportLegend && <div className="p-4"><Legend /></div>}
        </div>
      </main>
      <KeyModal
        open={showKeyModal}
        value={arcing.esvKey}
        onChange={arcing.setEsvKey}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkspacePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
