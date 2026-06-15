export function propNodeId(propId) {
  return `p:${propId}`;
}

export function bracketNodeId(bracketId) {
  return `b:${bracketId}`;
}

export function isPropNode(nodeId) {
  return String(nodeId).startsWith('p:');
}

export function isBracketNode(nodeId) {
  return String(nodeId).startsWith('b:');
}

export function numericNodeId(nodeId) {
  return Number(String(nodeId).split(':')[1]);
}

export function toNodeId(value) {
  if (typeof value === 'string' && (value.startsWith('p:') || value.startsWith('b:'))) {
    return value;
  }
  return propNodeId(value);
}

export function getNodeRange(nodeId, propOrderMap, bracketMap, cache = new Map()) {
  if (cache.has(nodeId)) return cache.get(nodeId);

  if (isPropNode(nodeId)) {
    const propId = numericNodeId(nodeId);
    const index = propOrderMap.get(propId) ?? 0;
    const result = { topIndex: index, bottomIndex: index, startPropId: propId, endPropId: propId };
    cache.set(nodeId, result);
    return result;
  }

  if (isBracketNode(nodeId)) {
    const bracketId = numericNodeId(nodeId);
    const bracket = bracketMap.get(bracketId);

    if (!bracket) {
      const fallback = { topIndex: 0, bottomIndex: 0, startPropId: null, endPropId: null };
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

  const fallback = { topIndex: 0, bottomIndex: 0, startPropId: null, endPropId: null };
  cache.set(nodeId, fallback);
  return fallback;
}
