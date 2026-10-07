const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
export const operation = (text) => Array.from(segmenter.segment(text), (part) => part.segment)
