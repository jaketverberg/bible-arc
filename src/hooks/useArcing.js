import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPassage } from './useESV';
import { CATEGORY_COLORS, REL_BY_CODE } from '../constants/relationships';

const COL_W = 28;
const LEFT_MARGIN = 4;

const majorSplitPattern =
  /(;|,?\s+(?:and|but|for|because|therefore|so that|in order that|when|before|after|if|unless|although|though|yet|moreover|likewise|then)\s+)/i;

function alphaLabel(index) {
  return 'abcdefghijklmnopqrstuvwxyz'[index] || '';
}

function propNodeId(propId) {
  return `p:${propId}`;
}

function bracketNodeId(bracketId) {
  return `b:${bracketId}`;
}

function isPropNode(nodeId) {
  return String(nodeId).startsWith('p:');
}

function isBracketNode(nodeId) {
  return String(nodeId).startsWith('b:');
}

function numericNodeId(nodeId) {
  return Number(String(nodeId).split(':')[1]);
}

function toNodeId(value) {
  if (typeof value === 'string' && (value.startsWith('p:') || value.startsWith('b:'))) {
    return value;
  }
  return propNodeId(value);
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

function getNodeRange(nodeId, propOrderMap, bracketMap, cache = new Map()) {
  if (cache.has(nodeId)) return cache.get(nodeId);

  if (isPropNode(nodeId)) {
    const propId = numericNodeId(nodeId);
    const index = propOrderMap.get(propId) ?? 0;
    const result = {
      topIndex: index,
      bottomIndex: index,
      startPropId: propId,
      endPropId: propId,
    };
    cache.set(nodeId, result);
    return result;
  }

  if (isBracketNode(nodeId)) {
    const bracketId = numericNodeId(nodeId);
    const bracket = bracketMap.get(bracketId);

    if (!bracket) {
      const fallback = {
        topIndex: 0,
        bottomIndex: 0,
        startPropId: null,
        endPropId: null,
      };
      cache.set(nodeId, fallback);
      return fallback;
    }

    const fromNode = toNodeId(bracket.fromId ?? bracket.from);
    const toNode = toNodeId(bracket.toId ?? bracket.to);

    const a = getNodeRange(fromNode, propOrderMap, bracketMap, cache);
    const b = getNodeRange(toNode, propOrderMap, bracketMap, cache);

    const result = {
      topIndex: Math.min(a.topIndex, b.topIndex),
      bottomIndex: Math.max(a.bottomIndex, b.bottomIndex),
      startPropId: a.topIndex <= b.topIndex ? a.startPropId : b.startPropId,
      endPropId: a.bottomIndex >= b.bottomIndex ? a.endPropId : b.endPropId,
    };

    cache.set(nodeId, result);
    return result;
  }

  const fallback = {
    topIndex: 0,
    bottomIndex: 0,
    startPropId: null,
    endPropId: null,
  };
  cache.set(nodeId, fallback);
  return fallback;
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
        (placed) => !(bracket.bottomIndex < placed.topIndex || bracket.topIndex > placed.bottomIndex)
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

export function useArcing() {
  const [props, setProps] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [selected, setSelected] = useState([]);
  const [splitHistory, setSplitHistory] = useState([]);
  const [rawVerses, setRawVerses] = useState([]);
  const [currentRef, setCurrentRef] = useState('');
  const [esvKey, setEsvKey] = useState(() => localStorage.getItem('esv-api-key') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rowRects, setRowRects] = useState({});
  const [pendingAnchor, setPendingAnchor] = useState(null);

  const nextPropId = useRef(1000);
  const nextBracketId = useRef(1);

  useEffect(() => {
    if (esvKey) localStorage.setItem('esv-api-key', esvKey);
  }, [esvKey]);

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
      if (!esvKey) {
        setError('Please add an ESV API key first.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const verses = await fetchPassage(reference, esvKey);
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
    [esvKey]
  );

  const setRowMeasurement = useCallback((propId, measurement) => {
    setRowRects((prev) => ({ ...prev, [propId]: measurement }));
  }, []);

  const toggleSelection = useCallback((propId) => {
    const nodeId = propNodeId(propId);
    setPendingAnchor(null);
    setSelected((prev) => {
      if (prev.includes(nodeId)) return prev.filter((id) => id !== nodeId);
      if (prev.length >= 2) return [prev[1], nodeId];
      return [...prev, nodeId];
    });
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
    setProps((current) => {
      const idx = current.findIndex((prop) => prop.id === propId);
      if (idx === -1) return current;

      const target = current[idx];
      const words = target.text.split(/\s+/).filter(Boolean);
      if (wordIndex <= 0 || wordIndex >= words.length) return current;

      setSplitHistory((prev) => [...prev, current.map((prop) => ({ ...prop }))]);

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
    setProps((current) => {
      const idx = current.findIndex((prop) => prop.id === propId);
      if (idx <= 0) return current;

      const currentProp = current[idx];
      const prevProp = current[idx - 1];

      if (currentProp.verseNum !== prevProp.verseNum) return current;

      setSplitHistory((prev) => [...prev, current.map((prop) => ({ ...prop }))]);

      const mergedProps = [
        ...current.slice(0, idx - 1),
        {
          ...prevProp,
          text: `${prevProp.text} ${currentProp.text}`.replace(/\s+/g, ' ').trim(),
        },
        ...current.slice(idx + 1),
      ];

      const removedNode = propNodeId(currentProp.id);

      setBrackets((prev) =>
        prev.filter((br) => {
          const fromNode = toNodeId(br.fromId ?? br.from);
          const toNode = toNodeId(br.toId ?? br.to);
          return fromNode !== removedNode && toNode !== removedNode;
        })
      );

      setSelected((prev) => prev.filter((id) => id !== removedNode));
      setPendingAnchor((prev) => (prev === removedNode ? null : prev));

      return recomputeSubLabels(mergedProps);
    });
  }, []);

  const autoSplit = useCallback(() => {
    setProps((current) => {
      setSplitHistory((prev) => [...prev, current.map((prop) => ({ ...prop }))]);

      const next = [];
      current.forEach((prop) => {
        const bits = prop.text
          .split(majorSplitPattern)
          .map((part) => part?.trim())
          .filter(Boolean);

        if (bits.length <= 1) {
          next.push(prop);
          return;
        }

        const merged = [];
        for (let i = 0; i < bits.length; i += 2) {
          const first = bits[i] || '';
          const second = bits[i + 1] || '';
          merged.push(`${first}${second}`.trim());
        }

        if (merged.length <= 1) {
          next.push(prop);
          return;
        }

        merged.forEach((text, index) => {
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
      const restored = prev[prev.length - 1];
      setProps(restored);
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
          ((a === fromId && b === toId) || (a === toId && b === fromId)) &&
          br.code === code
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
        return {
          ...bracket,
          ...updates,
          color: CATEGORY_COLORS[rel.category],
        };
      })
    );
  }, []);

  const flipBracket = useCallback((bracketId) => {
    setBrackets((prev) =>
      prev.map((br) => (br.id === bracketId ? { ...br, flipped: !br.flipped } : br))
    );
  }, []);

  const deleteBracket = useCallback((bracketId) => {
    const removedNode = bracketNodeId(bracketId);
    setBrackets((prev) =>
      prev.filter((br) => {
        const fromNode = toNodeId(br.fromId ?? br.from);
        const toNode = toNodeId(br.toId ?? br.to);
        return br.id !== bracketId && fromNode !== removedNode && toNode !== removedNode;
      })
    );
    setSelected((prev) => prev.filter((id) => id !== removedNode));
    setPendingAnchor((prev) => (prev === removedNode ? null : prev));
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

      const anchor = {
        x: stemX,
        y: (yTop + yBottom) / 2,
      };

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
    esvKey,
    loading,
    error,
    rowRects,
    bracketLayout,
    derivedBrackets,
    rowAnchors,
    bracketAnchors,
    pendingAnchor,
    workspaceReady,
    setEsvKey,
    loadPassage,
    setRowMeasurement,
    toggleSelection,
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