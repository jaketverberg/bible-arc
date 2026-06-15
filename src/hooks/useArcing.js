import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPassage, fetchTranslations } from './useBible';
import { CATEGORY_COLORS, REL_BY_CODE } from '../constants/relationships';
import {
  propNodeId,
  bracketNodeId,
  isPropNode,
  isBracketNode,
  numericNodeId,
  toNodeId,
  getNodeRange,
} from '../utils/nodeIds';

const COL_W = 28;
const LEFT_MARGIN = 4;

// Conjunctions that mark a logical clause boundary. The separator is kept
// with the *following* proposition so it reads as "for he is good", not
// "God so loved the world, for".
const majorSplitPattern =
  /(;|,?\s+(?:and|but|for|because|therefore|so that|in order that|when|before|after|if|unless|although|though|yet|moreover|likewise|then)\s+)/i;

function alphaLabel(index) {
  return 'abcdefghijklmnopqrstuvwxyz'[index] || '';
}

function recomputeSubLabels(props) {
  const grouped = props.reduce((acc, prop) => {
    acc[prop.verseNum] ||= [];
    acc[prop.verseNum].push(prop);
    return acc;
  }, {});

  return props.map((prop) => {
    const siblings = grouped[prop.verseNum] || [];
    if (siblings.length <= 1) return { ...prop, subLabel: '' };
    const siblingIndex = siblings.findIndex((item) => item.id === prop.id);
    return { ...prop, subLabel: alphaLabel(siblingIndex) };
  });
}

function parseInitialProps(rawVerses) {
  return rawVerses.map((verse, index) => ({
    id: index + 1,
    verseNum: verse.verse,
    subLabel: '',
    text: verse.text,
  }));
}

function assignBracketColumns(brackets, propOrderMap) {
  const rawBracketMap = new Map(brackets.map((bracket) => [bracket.id, bracket]));
  const rangeCache = new Map();

  const normalized = brackets.map((bracket) => {
    const range = getNodeRange(bracketNodeId(bracket.id), propOrderMap, rawBracketMap, rangeCache);
    return {
      ...bracket,
      topIndex: range.topIndex,
      bottomIndex: range.bottomIndex,
      span: range.bottomIndex - range.topIndex,
    };
  });

  normalized.sort((a, b) => b.span - a.span || a.topIndex - b.topIndex || a.id - b.id);

  const columns = [];

  const withCols = normalized.map((bracket) => {
    let col = 0;
    while (true) {
      const conflict = (columns[col] || []).some(
        (placed) =>
          !(bracket.bottomIndex < placed.topIndex || bracket.topIndex > placed.bottomIndex)
      );
      if (!conflict) break;
      col += 1;
    }
    columns[col] ||= [];
    columns[col].push(bracket);
    return { ...bracket, col };
  });

  const nCols = Math.max(1, columns.length);

  return {
    withCols,
    nCols,
    paneWidth: LEFT_MARGIN + nCols * COL_W + 28,
  };
}

function loadSavedWorkspace() {
  try {
    const raw = localStorage.getItem('bible-arc-workspace');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useArcing() {
  const saved = useMemo(loadSavedWorkspace, []);

  const [props, setProps] = useState(() => saved?.props || []);
  const [brackets, setBrackets] = useState(() => saved?.brackets || []);
  const [selected, setSelected] = useState([]);
  const [splitHistory, setSplitHistory] = useState([]);
  const [rawVerses, setRawVerses] = useState(() => saved?.rawVerses || []);
  const [currentRef, setCurrentRef] = useState(() => saved?.currentRef || '');
  const [translation, setTranslation] = useState(
    () => localStorage.getItem('bible-translation') || 'ESV'
  );
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rowRects, setRowRects] = useState({});
  const [pendingAnchor, setPendingAnchor] = useState(null);

  // Derive safe starting IDs from saved state to prevent reuse after restore.
  const savedMaxPropId = useMemo(
    () => (saved?.props || []).reduce((max, p) => Math.max(max, p.id), 0),
    []
  );
  const savedMaxBracketId = useMemo(
    () => (saved?.brackets || []).reduce((max, b) => Math.max(max, b.id), 0),
    []
  );

  const nextPropId = useRef(Math.max(saved?.nextPropId || 1000, savedMaxPropId + 1));
  const nextBracketId = useRef(Math.max(saved?.nextBracketId || 1, savedMaxBracketId + 1));

  // Keep refs to latest props/brackets so stable callbacks can read current values
  // without those values appearing in their dependency arrays (avoiding cascading re-renders).
  const propsRef = useRef(props);
  const bracketsRef = useRef(brackets);
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(() => { bracketsRef.current = brackets; }, [brackets]);

  // Persist translation preference.
  useEffect(() => {
    localStorage.setItem('bible-translation', translation);
  }, [translation]);

  // Persist full workspace state so work survives a page refresh.
  useEffect(() => {
    if (!props.length) return;
    try {
      localStorage.setItem(
        'bible-arc-workspace',
        JSON.stringify({
          currentRef,
          props,
          brackets,
          rawVerses,
          nextPropId: nextPropId.current,
          nextBracketId: nextBracketId.current,
        })
      );
    } catch {
      // Ignore storage errors (quota exceeded, private browsing, etc.)
    }
  }, [currentRef, props, brackets, rawVerses]);

  // Fetch available translation list once on mount.
  useEffect(() => {
    let active = true;

    fetchTranslations()
      .then((items) => {
        if (!active) return;
        setTranslations(items);
        if (!items.some((item) => item.code === translation)) {
          setTranslation('ESV');
        }
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load Bible translation choices.');
      });

    return () => {
      active = false;
    };
  }, []);

  const propOrderMap = useMemo(
    () => new Map(props.map((prop, idx) => [prop.id, idx])),
    [props]
  );

  const bracketLayout = useMemo(
    () => assignBracketColumns(brackets, propOrderMap),
    [brackets, propOrderMap]
  );

  const loadPassage = useCallback(
    async (reference) => {
      setLoading(true);
      setError('');

      try {
        const verses = await fetchPassage(reference, translation);
        const initialProps = parseInitialProps(verses);
        setRawVerses(verses);
        setProps(initialProps);
        setBrackets([]);
        setSelected([]);
        setSplitHistory([]);
        setRowRects({});
        setPendingAnchor(null);
        setCurrentRef(reference);
        nextPropId.current = 1000;
        nextBracketId.current = 1;
      } catch (err) {
        setError(err.message || 'Failed to load passage.');
      } finally {
        setLoading(false);
      }
    },
    [translation]
  );

  const setRowMeasurement = useCallback((propId, measurement) => {
    setRowRects((prev) => ({ ...prev, [propId]: measurement }));
  }, []);

  const handleAnchorClick = useCallback((nodeId) => {
    setPendingAnchor((current) => {
      if (!current) return nodeId;
      if (current === nodeId) return null;
      setSelected([current, nodeId]);
      return null;
    });
  }, []);

  const splitProposition = useCallback((propId, wordIndex) => {
    // Capture bracket state before the split for undo purposes.
    const bracketSnapshot = bracketsRef.current.map((b) => ({ ...b }));

    setProps((current) => {
      const idx = current.findIndex((prop) => prop.id === propId);
      if (idx === -1) return current;

      const target = current[idx];
      const words = target.text.split(/\s+/).filter(Boolean);
      if (wordIndex <= 0 || wordIndex >= words.length) return current;

      setSplitHistory((prev) => [
        ...prev,
        { props: current.map((p) => ({ ...p })), brackets: bracketSnapshot },
      ]);

      const left = words.slice(0, wordIndex).join(' ').trim();
      const right = words.slice(wordIndex).join(' ').trim();

      const replacement = [
        { ...target, text: left },
        { ...target, id: nextPropId.current++, text: right },
      ];

      const merged = [...current.slice(0, idx), ...replacement, ...current.slice(idx + 1)];
      return recomputeSubLabels(merged);
    });
  }, []);

  const mergeWithPrevious = useCallback((propId) => {
    const currentProps = propsRef.current;
    const currentBrackets = bracketsRef.current;

    const idx = currentProps.findIndex((prop) => prop.id === propId);
    if (idx <= 0) return;

    const currentProp = currentProps[idx];
    const prevProp = currentProps[idx - 1];

    if (currentProp.verseNum !== prevProp.verseNum) return;

    setSplitHistory((prev) => [
      ...prev,
      {
        props: currentProps.map((p) => ({ ...p })),
        brackets: currentBrackets.map((b) => ({ ...b })),
      },
    ]);

    const mergedProps = [
      ...currentProps.slice(0, idx - 1),
      {
        ...prevProp,
        text: `${prevProp.text} ${currentProp.text}`.replace(/\s+/g, ' ').trim(),
      },
      ...currentProps.slice(idx + 1),
    ];

    const removedNode = propNodeId(currentProp.id);

    setProps(recomputeSubLabels(mergedProps));
    setBrackets((prev) =>
      prev.filter((br) => {
        const fromNode = toNodeId(br.fromId ?? br.from);
        const toNode = toNodeId(br.toId ?? br.to);
        return fromNode !== removedNode && toNode !== removedNode;
      })
    );
    setSelected((prev) => prev.filter((id) => id !== removedNode));
    setPendingAnchor((prev) => (prev === removedNode ? null : prev));
  }, []);

  const autoSplit = useCallback(() => {
    const bracketSnapshot = bracketsRef.current.map((b) => ({ ...b }));

    setProps((current) => {
      setSplitHistory((prev) => [
        ...prev,
        { props: current.map((p) => ({ ...p })), brackets: bracketSnapshot },
      ]);

      const next = [];

      current.forEach((prop) => {
        const raw = prop.text.split(majorSplitPattern);
        // raw[even] = text segments, raw[odd] = captured separators.
        // Build propositions putting the separator with the *following* text
        // so "for he is good" stays together rather than the conjunction
        // dangling at the end of the preceding proposition.
        const parts = [];
        let pendingSep = '';

        for (let i = 0; i < raw.length; i++) {
          if (i % 2 === 0) {
            // Text segment — prepend any pending separator, strip leading punctuation.
            const combined = (pendingSep + (raw[i] || ''))
              .replace(/^[,;]\s*/, '')
              .trim();
            pendingSep = '';
            if (combined) parts.push(combined);
          } else {
            // Separator — hold for next text segment.
            pendingSep = raw[i] || '';
          }
        }

        if (parts.length <= 1) {
          next.push(prop);
          return;
        }

        parts.forEach((text, index) => {
          next.push({
            ...prop,
            id: index === 0 ? prop.id : nextPropId.current++,
            text,
          });
        });
      });

      return recomputeSubLabels(next);
    });
  }, []);

  const resetSplits = useCallback(() => {
    const reset = parseInitialProps(rawVerses);
    setProps(reset);
    setSplitHistory([]);
    setSelected([]);
    setBrackets([]);
    setPendingAnchor(null);
    setRowRects({});
  }, [rawVerses]);

  const undoSplit = useCallback(() => {
    setSplitHistory((prev) => {
      if (!prev.length) return prev;
      const lastEntry = prev[prev.length - 1];

      if (lastEntry && typeof lastEntry === 'object' && !Array.isArray(lastEntry)) {
        // New format: { props, brackets }
        setProps(lastEntry.props);
        if (lastEntry.brackets !== null) {
          setBrackets(lastEntry.brackets);
        }
      } else {
        // Legacy format: plain props array (backward compatibility)
        setProps(lastEntry);
      }

      return prev.slice(0, -1);
    });
  }, []);

  const addBracket = useCallback(
    (code) => {
      if (selected.length !== 2) return;

      const rel = REL_BY_CODE[code];
      if (!rel) return;

      const fromId = selected[0];
      const toId = selected[1];

      const exists = brackets.some((br) => {
        const a = toNodeId(br.fromId ?? br.from);
        const b = toNodeId(br.toId ?? br.to);
        return (
          ((a === fromId && b === toId) || (a === toId && b === fromId)) && br.code === code
        );
      });

      if (exists) return;

      setBrackets((prev) => [
        ...prev,
        {
          id: nextBracketId.current++,
          fromId,
          toId,
          code,
          color: CATEGORY_COLORS[rel.category],
          flipped: false,
        },
      ]);

      setSelected([]);
      setPendingAnchor(null);
    },
    [selected, brackets]
  );

  const updateBracket = useCallback((bracketId, updates) => {
    setBrackets((prev) =>
      prev.map((bracket) => {
        if (bracket.id !== bracketId) return bracket;
        const code = updates.code || bracket.code;
        const rel = REL_BY_CODE[code];
        return { ...bracket, ...updates, color: CATEGORY_COLORS[rel.category] };
      })
    );
  }, []);

  const flipBracket = useCallback((bracketId) => {
    setBrackets((prev) =>
      prev.map((br) => (br.id === bracketId ? { ...br, flipped: !br.flipped } : br))
    );
  }, []);

  const deleteBracket = useCallback((bracketId) => {
    setBrackets((prev) => {
      // Collect all bracket IDs to remove, cascading through nested references.
      const idsToRemove = new Set([bracketId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const br of prev) {
          if (idsToRemove.has(br.id)) continue;
          const fromNode = toNodeId(br.fromId ?? br.from);
          const toNode = toNodeId(br.toId ?? br.to);
          const fromBrId = isBracketNode(fromNode) ? numericNodeId(fromNode) : null;
          const toBrId = isBracketNode(toNode) ? numericNodeId(toNode) : null;
          if (
            (fromBrId !== null && idsToRemove.has(fromBrId)) ||
            (toBrId !== null && idsToRemove.has(toBrId))
          ) {
            idsToRemove.add(br.id);
            changed = true;
          }
        }
      }

      const removedNodes = new Set([...idsToRemove].map(bracketNodeId));
      setSelected((s) => s.filter((id) => !removedNodes.has(id)));
      setPendingAnchor((p) => (p !== null && removedNodes.has(p) ? null : p));

      return prev.filter((br) => !idsToRemove.has(br.id));
    });
  }, []);

  const rowAnchors = useMemo(
    () =>
      props.map((prop) => {
        const rect = rowRects[prop.id];
        return {
          id: propNodeId(prop.id),
          propId: prop.id,
          y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
        };
      }),
    [props, rowRects]
  );

  const derivedBrackets = useMemo(() => {
    const rawBracketMap = new Map(brackets.map((br) => [br.id, br]));
    const colMap = new Map(bracketLayout.withCols.map((br) => [br.id, br.col]));
    const rangeCache = new Map();
    const anchorMap = new Map();
    const derived = [];

    const getAnchorForNode = (nodeId) => {
      if (isPropNode(nodeId)) {
        const propId = numericNodeId(nodeId);
        const rect = rowRects[propId];
        return {
          x: bracketLayout.paneWidth - 10,
          y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
        };
      }
      if (isBracketNode(nodeId)) {
        return anchorMap.get(nodeId) || { x: 0, y: 0 };
      }
      return { x: 0, y: 0 };
    };

    for (const raw of brackets) {
      const fromId = toNodeId(raw.fromId ?? raw.from);
      const toId = toNodeId(raw.toId ?? raw.to);
      const rel = REL_BY_CODE[raw.code];
      const col = colMap.get(raw.id) ?? 0;
      const stemX = LEFT_MARGIN + col * COL_W + COL_W / 2;

      const fromAnchor = getAnchorForNode(fromId);
      const toAnchor = getAnchorForNode(toId);

      const yTop = Math.min(fromAnchor.y, toAnchor.y);
      const yBottom = Math.max(fromAnchor.y, toAnchor.y);

      const range = getNodeRange(bracketNodeId(raw.id), propOrderMap, rawBracketMap, rangeCache);

      const anchor = { x: stemX, y: (yTop + yBottom) / 2 };
      anchorMap.set(bracketNodeId(raw.id), anchor);

      derived.push({
        ...raw,
        fromId,
        toId,
        relation: rel,
        col,
        topIndex: range.topIndex,
        bottomIndex: range.bottomIndex,
        startPropId: range.startPropId,
        endPropId: range.endPropId,
        yTop,
        yBottom,
        stemX,
        anchorX: anchor.x,
        anchorY: anchor.y,
      });
    }

    return derived;
  }, [brackets, bracketLayout, propOrderMap, rowRects]);

  const bracketAnchors = useMemo(
    () =>
      derivedBrackets.map((bracket) => ({
        id: bracketNodeId(bracket.id),
        bracketId: bracket.id,
        x: bracket.anchorX,
        y: bracket.anchorY,
      })),
    [derivedBrackets]
  );

  const workspaceReady = props.length > 0;

  return {
    props,
    brackets,
    selected,
    splitHistory,
    rawVerses,
    currentRef,
    translation,
    translations,
    loading,
    error,
    rowRects,
    bracketLayout,
    derivedBrackets,
    rowAnchors,
    bracketAnchors,
    pendingAnchor,
    workspaceReady,
    setTranslation,
    loadPassage,
    setRowMeasurement,
    splitProposition,
    mergeWithPrevious,
    autoSplit,
    resetSplits,
    undoSplit,
    addBracket,
    updateBracket,
    flipBracket,
    deleteBracket,
    handleAnchorClick,
    setCurrentRef,
  };
}
