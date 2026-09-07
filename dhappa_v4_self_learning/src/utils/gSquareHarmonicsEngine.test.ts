import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateGSquareHarmonicGrid, runGSquareHarmonicsWalkForwardTest } from './gSquareHarmonicsEngine';
import { DayMarketEntry } from '../types';

test('generates the 6x4 harmonic grid and 24 cells for X=7', () => {
  const result = generateGSquareHarmonicGrid({ sourceNumber: '47' });

  assert.equal(result.x, 7);
  assert.deepEqual(
    result.verticalDigits.map((item) => item.value),
    [6, 7, 8, 1, 2, 3]
  );
  assert.deepEqual(
    result.horizontalDigits.map((item) => item.value),
    [5, 4, 9, 0]
  );
  assert.deepEqual(result.cells.slice(0, 4).map((cell) => cell.pair), ['65', '64', '69', '60']);
  assert.equal(result.cells.length, 24);
  assert.equal(result.pairs.includes('75'), true);
  assert.equal(result.pairs.includes('30'), true);
});

test('runs G Square Harmonics walk-forward test sequentially across historical entries', () => {
  const mockEntries: DayMarketEntry[] = [
    {
      id: 'day1',
      date: '2026-08-01',
      gali: '47',
      ghaziabad: '12',
      faridabad: '33',
      deshawar: '89',
      createdAt: '2026-08-01',
    },
    {
      id: 'day2',
      date: '2026-08-02',
      // For X=7 from day1 Gali '47', straight pairs include '65', '75', '84', '30'
      gali: '75', // straight hit
      ghaziabad: '56', // palat hit for '65'
      faridabad: '99',
      deshawar: '11',
      createdAt: '2026-08-02',
    },
    {
      id: 'day3',
      date: '2026-08-03',
      gali: '00',
      ghaziabad: '01',
      faridabad: '02',
      deshawar: '03',
      createdAt: '2026-08-03',
    },
  ];

  const report = runGSquareHarmonicsWalkForwardTest({
    records: mockEntries,
    sourceMode: 'gali',
    targetMarket: 'ALL',
    includePalat: true,
  });

  assert.equal(report.evaluatedDays, 2);
  assert.equal(report.totalSteps, 2);
  // Day 2 should be hit
  const step1 = report.steps.find((s) => s.targetDate === '2026-08-02');
  assert.ok(step1);
  assert.equal(step1.x, 7);
  assert.equal(step1.straightHit, true);
  assert.ok(step1.winningPairs.includes('75'));
  assert.equal(report.straightHitDays >= 1, true);
  assert.equal(report.cellEfficacy.length, 24);
});

