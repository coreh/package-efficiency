import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareCells } from '../sort.mjs'
const cell = (grade, ratio, text) => ({ dataset: { grade: String(grade), v: String(ratio) }, textContent: text })
test('cross-task ratings sort before raw displayed time or memory', () => {
  const fastB = cell(1, 1.3, '0.24 µs B')
  const slowA = cell(0, 1.4, '7.8 µs A')
  const otherB = cell(1, 1.2, '16.4 MB B')
  assert.deepEqual([fastB, slowA, otherB].sort((a,b) => compareCells(a,b,{numeric:true})), [slowA,otherB,fastB])
  assert.deepEqual([fastB, slowA, otherB].sort((a,b) => compareCells(a,b,{numeric:true,descending:true})), [fastB,otherB,slowA])
})
test('missing values stay last and ordinary numeric/text columns still sort', () => {
  const empty = { dataset: { v: '' }, textContent: '—' }
  const n = { dataset: { v: '10' }, textContent: '10' }
  for (const descending of [false,true]) assert.ok(compareCells(empty,n,{numeric:true,descending}) > 0)
  assert.ok(compareCells(n,{dataset:{v:'20'},textContent:'20'},{numeric:true}) < 0)
  assert.ok(compareCells({dataset:{},textContent:'Package 2'}, {dataset:{},textContent:'Package 10'}, {numeric:false}) < 0)
})

test('tab sorting follows column meaning when All/Best add columns', async () => {
  const {sortColumnKey,matchingSortColumn}=await import('../sort.mjs')
  const standard=['Package','CPU per operation','Memory'].map(sortColumnKey)
  const all=['Package','Language','Runtime','CPU per operation','Memory'].map(sortColumnKey)
  assert.equal(matchingSortColumn(standard,'memory'),2)
  assert.equal(matchingSortColumn(all,'memory'),4)
  assert.equal(matchingSortColumn(all,sortColumnKey('CPU')),3)
  assert.equal(matchingSortColumn(standard,'runtime'),-1)
})
test('checker sorts retain the chosen compiler where possible and follow native checkers', async () => {
  const {sortColumnKey,matchingSortColumn}=await import('../sort.mjs')
  const js=['Type check, tsc 6.0.3','Type check, tsgo 7.0.2'].map(sortColumnKey)
  const rust=['cargo check, CPU and memory','cargo check, first run, CPU'].map(sortColumnKey)
  assert.equal(matchingSortColumn(js,'types:tsc'),0)
  assert.equal(matchingSortColumn(js,'types:tsgo'),1)
  assert.equal(matchingSortColumn(rust,'types:tsgo'),0)
  assert.equal(matchingSortColumn(js,'types'),1)
  assert.equal(matchingSortColumn(js,'cargo-cold-cpu'),-1)
})
