import Papa from 'papaparse'

export function parseVocabCSV(text) {
  const { data } = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim()
  })

  return data.map((row, i) => {
    const word    = (row['영단어'] || row['word']    || row['Word']    || '').trim()
    const meaning = (row['뜻']    || row['meaning']  || row['Meaning']  || '').trim()
    const synonym = (row['동의어'] || row['synonym']  || row['Synonym']  || '').trim()
    const id      = parseInt(row['번호'] || row['id'] || i + 1)
    return { id, word, meaning, synonym }
  }).filter(w => w.word)
}
