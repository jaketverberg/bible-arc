export const CATEGORY_COLORS = {
  Coordinate: '#3a72a8',
  Restatement: '#3d8050',
  'Distinct Statement': '#b86e20',
  'Contrary Statement': '#a83838',
};

export const RELATIONSHIPS = [
  { code: 'S', name: 'Series', category: 'Coordinate', conjunctions: 'and, moreover, likewise', flippable: false, labels: ['S'] },
  { code: 'P', name: 'Progression', category: 'Coordinate', conjunctions: 'then, and, furthermore', flippable: false, labels: ['P'] },
  { code: 'A', name: 'Alternative', category: 'Coordinate', conjunctions: 'or, but, on the other hand', flippable: false, labels: ['A'] },
  { code: 'Ac/Mn', name: 'Action-Manner', category: 'Restatement', conjunctions: 'by, in that, participles', flippable: true, labels: ['Ac', 'Mn'] },
  { code: 'Cf', name: 'Comparison', category: 'Restatement', conjunctions: 'as, just as, like', flippable: true, labels: ['Cf'] },
  { code: '-/+', name: 'Negative-Positive', category: 'Restatement', conjunctions: 'not…but', flippable: true, labels: ['−', '+'] },
  { code: 'Id/Exp', name: 'Idea-Explanation', category: 'Restatement', conjunctions: 'that is, in other words', flippable: true, labels: ['Id', 'Exp'] },
  { code: 'Q/A', name: 'Question-Answer', category: 'Restatement', conjunctions: '?', flippable: true, labels: ['Q', 'A'] },
  { code: 'G', name: 'Ground', category: 'Distinct Statement', conjunctions: 'for, because, since', flippable: true, labels: ['G'] },
  { code: '∴', name: 'Inference', category: 'Distinct Statement', conjunctions: 'therefore, accordingly', flippable: true, labels: ['∴'] },
  { code: 'BL', name: 'Bilateral', category: 'Distinct Statement', conjunctions: 'for/therefore (supports both sides)', flippable: false, labels: ['BL'] },
  { code: 'Ac/Res', name: 'Action-Result', category: 'Distinct Statement', conjunctions: 'so that, with the result that', flippable: true, labels: ['Ac', 'Res'] },
  { code: 'Ac/Pur', name: 'Action-Purpose', category: 'Distinct Statement', conjunctions: 'in order that, lest', flippable: true, labels: ['Ac', 'Pur'] },
  { code: 'If/Th', name: 'Conditional', category: 'Distinct Statement', conjunctions: 'if…then, unless', flippable: true, labels: ['If', 'Th'] },
  { code: 'T', name: 'Temporal', category: 'Distinct Statement', conjunctions: 'when, whenever, after, before', flippable: true, labels: ['T'] },
  { code: 'L', name: 'Locative', category: 'Distinct Statement', conjunctions: 'where, wherever', flippable: true, labels: ['L'] },
  { code: 'Csv', name: 'Concessive', category: 'Contrary Statement', conjunctions: 'although, though, yet, nevertheless', flippable: true, labels: ['Csv'] },
  { code: 'Sit/R', name: 'Situation-Response', category: 'Contrary Statement', conjunctions: 'and (with surprising response)', flippable: true, labels: ['Sit', 'R'] },
];

export const REL_BY_CODE = Object.fromEntries(RELATIONSHIPS.map((item) => [item.code, item]));

export const REL_GROUPS = Object.entries(
  RELATIONSHIPS.reduce((acc, rel) => {
    acc[rel.category] ||= [];
    acc[rel.category].push(rel);
    return acc;
  }, {})
).map(([category, items]) => ({ category, color: CATEGORY_COLORS[category], items }));
