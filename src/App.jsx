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
  const [showLegend, setShowLegend] = useState(false);
  const [printLegend, setPrintLegend] = useState(true);

  const workspaceRef = useRef(null);

  const textPaneHeight = useMemo(() => {
    const values = Object.values(arcing.rowRects);
    if (!values.length) return 300;
    return Math.max(...values.map((item) => item.top + item.height)) + 30;
  }, [arcing.rowRects]);

  return (
    <div className="min-h-screen bg-paper pb-20 text-stone-900 lg:flex lg:pb-0">
      <Sidebar
        selected={arcing.selected}
        onApplyRelation={arcing.addBracket}
        brackets={arcing.brackets}
        props={arcing.props}
        onFlip={arcing.flipBracket}
        onDelete={arcing.deleteBracket}
        onUndoSplit={arcing.undoSplit}
        onAutoSplit={arcing.autoSplit}
        onResetSplits={arcing.resetSplits}
        workspaceRef={workspaceRef}
        exportBg={exportBg}
        setExportBg={setExportBg}
        exportLegend={exportLegend}
        setExportLegend={setExportLegend}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
        printLegend={printLegend}
        setPrintLegend={setPrintLegend}
      />

      <main className="min-w-0 flex-1">
        <WorkspaceHeader
          currentRef={arcing.currentRef}
          setCurrentRef={arcing.setCurrentRef}
          onLoad={arcing.loadPassage}
          loading={arcing.loading}
          onShowKey={() => setShowKeyModal(true)}
        />

        {arcing.error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {arcing.error}
          </div>
        )}

        <div ref={workspaceRef} style={{ background: exportBg }} className="overflow-x-auto">
          <div className="flex min-w-full items-start">
            <BracketPane
              brackets={arcing.derivedBrackets}
              paneWidth={arcing.workspaceReady ? arcing.bracketLayout.paneWidth : 60}
              paneHeight={textPaneHeight}
              onUpdate={arcing.updateBracket}
              onDelete={arcing.deleteBracket}
              onFlip={arcing.flipBracket}
              rowAnchors={arcing.rowAnchors}
              bracketAnchors={arcing.bracketAnchors}
              pendingAnchor={arcing.pendingAnchor}
              onAnchorClick={arcing.handleAnchorClick}
            />

            <TextPane
              props={arcing.props}
              selected={arcing.selected}
              onMeasure={arcing.setRowMeasurement}
              onSplit={arcing.splitProposition}
              onMerge={arcing.mergeWithPrevious}
            />
          </div>

          {showLegend && (
            <div className="p-4">
              <Legend />
            </div>
          )}

          {printLegend && !showLegend && (
            <div className="hidden print:block p-4">
              <Legend />
            </div>
          )}
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