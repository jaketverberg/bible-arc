import { BIBLE_BOOKS, SINGLE_CHAPTER_BOOK_IDS } from '../constants/bibleBooks';

const API_BASE = 'https://bolls.life';
const TRANSLATIONS_URL = `${API_BASE}/static/bolls/app/views/languages.json`;

const booksCache = new Map();
let translationsPromise = null;

function normalizeBookName(value) {
  return value
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBookReference(reference) {
  const normalized = normalizeBookName(reference.replace(/[\u2013\u2014]/g, '-'));

  const match = BIBLE_BOOKS
    .flatMap((book) =>
      book.aliases.map((alias) => ({
        book,
        alias,
      }))
    )
    .sort((a, b) => b.alias.length - a.alias.length)
    .find(({ alias }) => normalized === alias || normalized.startsWith(`${alias} `));

  if (!match) {
    throw new Error('Could not recognize that Bible reference.');
  }

  const remainder = normalized.slice(match.alias.length).trim();

  return {
    book: match.book,
    remainder,
  };
}

function parseReferenceRange(reference, booksById) {
  const trimmed = reference.trim();
  if (!trimmed) throw new Error('Enter a Bible reference first.');

  const { book, remainder } = parseBookReference(trimmed);
  const translationBook = booksById.get(book.id);

  if (!translationBook) {
    throw new Error(`The selected translation does not include ${book.name}.`);
  }

  if (!remainder) {
    throw new Error('Add a chapter or verse reference, for example Romans 1:1-5.');
  }

  const singleChapter = SINGLE_CHAPTER_BOOK_IDS.has(book.id);

  let parsed;

  if (singleChapter) {
    parsed = parseSingleChapterRange(remainder, translationBook);
  } else {
    parsed = parseStandardRange(remainder, translationBook);
  }

  return {
    bookId: book.id,
    bookName: book.name,
    ...parsed,
  };
}

function parseSingleChapterRange(remainder, translationBook) {
  const normalized = remainder.replace(/\s+/g, '');

  let match = normalized.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (match) {
    const [, startChapter, startVerse, endChapter, endVerse] = match.map(Number);
    if (startChapter !== 1 || endChapter !== 1) {
      throw new Error(`${translationBook.name} has only one chapter.`);
    }
    return buildRange({
      translationBook,
      startChapter: 1,
      startVerse,
      endChapter: 1,
      endVerse,
    });
  }

  match = normalized.match(/^(\d+):(\d+)-(\d+)$/);
  if (match) {
    const [, chapter, startVerse, endVerse] = match.map(Number);
    if (chapter !== 1) {
      throw new Error(`${translationBook.name} has only one chapter.`);
    }
    return buildRange({
      translationBook,
      startChapter: 1,
      startVerse,
      endChapter: 1,
      endVerse,
    });
  }

  match = normalized.match(/^(\d+)-(\d+)$/);
  if (match) {
    const [, startVerse, endVerse] = match.map(Number);
    return buildRange({
      translationBook,
      startChapter: 1,
      startVerse,
      endChapter: 1,
      endVerse,
    });
  }

  match = normalized.match(/^(\d+):(\d+)$/);
  if (match) {
    const [, chapter, verse] = match.map(Number);
    if (chapter !== 1) {
      throw new Error(`${translationBook.name} has only one chapter.`);
    }
    return buildRange({
      translationBook,
      startChapter: 1,
      startVerse: verse,
      endChapter: 1,
      endVerse: verse,
    });
  }

  match = normalized.match(/^(\d+)$/);
  if (match) {
    const verse = Number(match[1]);
    return buildRange({
      translationBook,
      startChapter: 1,
      startVerse: verse,
      endChapter: 1,
      endVerse: verse,
    });
  }

  throw new Error('Use a reference like Jude 3-5 or Jude 1:3-5.');
}

function parseStandardRange(remainder, translationBook) {
  const normalized = remainder.replace(/\s+/g, '');

  let match = normalized.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (match) {
    const [, startChapter, startVerse, endChapter, endVerse] = match.map(Number);
    return buildRange({
      translationBook,
      startChapter,
      startVerse,
      endChapter,
      endVerse,
    });
  }

  match = normalized.match(/^(\d+):(\d+)-(\d+)$/);
  if (match) {
    const [, chapter, startVerse, endVerse] = match.map(Number);
    return buildRange({
      translationBook,
      startChapter: chapter,
      startVerse,
      endChapter: chapter,
      endVerse,
    });
  }

  match = normalized.match(/^(\d+)-(\d+)$/);
  if (match) {
    const [, startChapter, endChapter] = match.map(Number);
    return buildRange({
      translationBook,
      startChapter,
      startVerse: null,
      endChapter,
      endVerse: null,
    });
  }

  match = normalized.match(/^(\d+):(\d+)$/);
  if (match) {
    const [, chapter, verse] = match.map(Number);
    return buildRange({
      translationBook,
      startChapter: chapter,
      startVerse: verse,
      endChapter: chapter,
      endVerse: verse,
    });
  }

  match = normalized.match(/^(\d+)$/);
  if (match) {
    const chapter = Number(match[1]);
    return buildRange({
      translationBook,
      startChapter: chapter,
      startVerse: null,
      endChapter: chapter,
      endVerse: null,
    });
  }

  throw new Error('Use a reference like Romans 1, Romans 1:1-5, or Romans 1:1-2:3.');
}

function buildRange({ translationBook, startChapter, startVerse, endChapter, endVerse }) {
  if (startChapter < 1 || endChapter < 1) {
    throw new Error('Chapter numbers must be 1 or greater.');
  }

  if (startChapter > translationBook.chapters || endChapter > translationBook.chapters) {
    throw new Error(`${translationBook.name} has ${translationBook.chapters} chapters in this translation.`);
  }

  if (startVerse != null && startVerse < 1) {
    throw new Error('Verse numbers must be 1 or greater.');
  }

  if (endVerse != null && endVerse < 1) {
    throw new Error('Verse numbers must be 1 or greater.');
  }

  if (startChapter > endChapter || (startChapter === endChapter && startVerse != null && endVerse != null && startVerse > endVerse)) {
    throw new Error('The reference range start must come before the end.');
  }

  return { startChapter, startVerse, endChapter, endVerse };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load Bible data from Bolls Life.');
  }
  return response.json();
}

async function getBooks(translation) {
  if (!booksCache.has(translation)) {
    booksCache.set(translation, fetchJson(`${API_BASE}/get-books/${translation}/`));
  }
  return booksCache.get(translation);
}

async function getChapter(translation, bookId, chapter) {
  return fetchJson(`${API_BASE}/get-text/${translation}/${bookId}/${chapter}/`);
}

export async function fetchTranslations() {
  if (!translationsPromise) {
    translationsPromise = fetchJson(TRANSLATIONS_URL).then((languages) =>
      languages
        .flatMap((languageGroup) =>
          (languageGroup.translations || []).map((translation) => ({
            code: translation.short_name,
            label: `${translation.short_name} - ${translation.full_name}`,
            language: languageGroup.language,
            dir: translation.dir || 'ltr',
          }))
        )
        .sort((a, b) => {
          if (a.code === 'ESV') return -1;
          if (b.code === 'ESV') return 1;
          return a.label.localeCompare(b.label);
        })
    );
  }

  return translationsPromise;
}

export async function fetchPassage(reference, translation = 'ESV') {
  const books = await getBooks(translation);
  const booksById = new Map(books.map((book) => [book.bookid, book]));
  const parsed = parseReferenceRange(reference, booksById);

  const chapterNumbers = [];
  for (let chapter = parsed.startChapter; chapter <= parsed.endChapter; chapter += 1) {
    chapterNumbers.push(chapter);
  }

  const chapters = await Promise.all(
    chapterNumbers.map((chapter) => getChapter(translation, parsed.bookId, chapter))
  );

  const verses = chapters
    .flatMap((chapterVerses, index) =>
      chapterVerses.map((verse) => ({
        ...verse,
        chapter: chapterNumbers[index],
      }))
    )
    .filter((verse) => {
      if (verse.chapter < parsed.startChapter || verse.chapter > parsed.endChapter) {
        return false;
      }

      if (verse.chapter === parsed.startChapter && parsed.startVerse != null && verse.verse < parsed.startVerse) {
        return false;
      }

      if (verse.chapter === parsed.endChapter && parsed.endVerse != null && verse.verse > parsed.endVerse) {
        return false;
      }

      return true;
    })
    .map((verse) => ({
      verse: Number(verse.verse),
      text: decodeHtml(verse.text || ''),
    }))
    .filter((verse) => verse.text);

  if (!verses.length) {
    throw new Error('No verses were returned for that reference.');
  }

  return verses;
}
