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

function normalizeBracket(a, b) {
  return a < b ? { from: a, to: b } : { from: b, to: a };
}

function assignBracketColumns(brackets, propOrderMap) {
  const normalized = brackets.map((bracket) => {
    const start = propOrderMap.get(bracket.from) ?? 0;
    const end = propOrderMap.get(bracket.to) ?? 0;
    const topIndex = Math.min(start, end);
    const bottomIndex = Math.max(start, end);
    return { ...bracket, topIndex, bottomIndex, span: bottomIndex - topIndex };
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
    paneWidth: LEFT_MARGIN + nCols * COL_W + 24,
  };
}

function parseInitialProps(rawVerses) {
  return rawVerses.map((verse, index) => ({
    id: index + 1,
    verseNum: verse.verse,
    subLabel: '',
    text: verse.text,
  }));
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

  const propOrderMap = useMemo(() => new Map(props.map((prop, idx) => [prop.id, idx])), [props]);
  const bracketLayout = useMemo(() => assignBracketColumns(brackets, propOrderMap), [brackets, propOrderMap]);

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
    setPendingAnchor(null);
    setSelected((prev) => {
      if (prev.includes(propId)) return prev.filter((id) => id !== propId);
      if (prev.length >= 2) return [prev[1], propId];
      return [...prev, propId];
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

      setBrackets((prev) =>
        prev.filter((br) => br.from !== currentProp.id && br.to !== currentProp.id)
      );

      setSelected((prev) => prev.filter((id) => id !== currentProp.id));

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

      const normalized = normalizeBracket(selected[0], selected[1]);
      const alreadyExists = brackets.some(
        (br) => br.from === normalized.from && br.to === normalized.to && br.code === code
      );
      if (alreadyExists) return;

      setBrackets((prev) => [
        ...prev,
        {
          id: nextBracketId.current++,
          from: normalized.from,
          to: normalized.to,
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
    setBrackets((prev) => prev.filter((br) => br.id !== bracketId));
  }, []);

  const handleAnchorClick = useCallback((propId) => {
    setPendingAnchor((current) => {
      if (!current) return propId;
      if (current === propId) return null;
      setSelected([current, propId]);
      return null;
    });
  }, []);

  const rowAnchors = useMemo(
    () =>
      props.map((prop) => {
        const rect = rowRects[prop.id];
        return {
          propId: prop.id,
          y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
        };
      }),
    [props, rowRects]
  );

  const derivedBrackets = useMemo(
    () =>
      bracketLayout.withCols.map((bracket) => {
        const fromRect = rowRects[bracket.from];
        const toRect = rowRects[bracket.to];
        const rel = REL_BY_CODE[bracket.code];

        const fromMid = (fromRect?.top ?? 0) + (fromRect?.height ?? 0) / 2;
        const toMid = (toRect?.top ?? 0) + (toRect?.height ?? 0) / 2;

        const yTop = Math.min(fromMid, toMid);
        const yBottom = Math.max(fromMid, toMid);

        return {
          ...bracket,
          relation: rel,
          yTop,
          yBottom,
          stemX: LEFT_MARGIN + bracket.col * COL_W + COL_W / 2,
        };
      }),
    [bracketLayout, rowRects]
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