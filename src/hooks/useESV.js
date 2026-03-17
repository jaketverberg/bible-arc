const buildParams = (reference) => {
  const params = new URLSearchParams({
    q: reference,
    'include-headings': 'false',
    'include-footnotes': 'false',
    'include-verse-numbers': 'true',
    'include-short-copyright': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
    'line-length': '0',
  });
  return params.toString();
};

export async function fetchPassage(reference, esvKey) {
  const params = buildParams(reference);
  const target = `https://api.esv.org/v3/passage/text/?${params}`;
  const parseResponse = async (response) => {
    if (!response.ok) throw new Error('Unable to load passage from ESV API.');
    const data = await response.json();
    const combined = (data.passages || []).join('\n').replace(/\s+/g, ' ').trim();
    return parseVerses(combined);
  };

  try {
    const response = await fetch(target, {
      headers: { Authorization: `Token ${esvKey}` },
    });
    return await parseResponse(response);
  } catch (error) {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
    const fallback = await fetch(proxied, {
      headers: { Authorization: `Token ${esvKey}` },
    });
    return await parseResponse(fallback);
  }
}

export function parseVerses(text) {
  const matches = [...text.matchAll(/\[(\d+)\]\s*([^\[]*)/g)];
  return matches.map((match) => ({
    verse: Number(match[1]),
    text: match[2].trim(),
  }));
}
