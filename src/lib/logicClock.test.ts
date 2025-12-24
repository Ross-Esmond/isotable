import { beforeEach, expect, test } from 'vitest';
import {
  setSourceCode,
  takeSnowportId,
  extractTimestampFromSnowportId,
  extractSourceCodeFromSnowportId,
  resetLogicClock,
} from './logicClock';

beforeEach(async () => {
  resetLogicClock();
  setSourceCode(1);
});

test('creates snowportId and extracts correct timestamp', () => {
  const snowportId = takeSnowportId();
  const extractedTimestamp = extractTimestampFromSnowportId(snowportId);
  expect(extractedTimestamp).toBeGreaterThan(0);
  const snowportId2 = takeSnowportId();
  const extractedTimestamp2 = extractTimestampFromSnowportId(snowportId2);
  expect(Math.abs(extractedTimestamp2 - extractedTimestamp)).toBeLessThan(10);
});

test('extracts correct source code from snowportId', () => {
  const testSourceCode = 42;
  setSourceCode(testSourceCode);

  const snowportId = takeSnowportId();
  const extractedSourceCode = extractSourceCodeFromSnowportId(snowportId);

  expect(extractedSourceCode).toBe(testSourceCode);
});

test('snowportId format preserves all parts', () => {
  const sourceCode = 123;
  setSourceCode(sourceCode);

  const snowportId = takeSnowportId();

  const extractedTimestamp = extractTimestampFromSnowportId(snowportId);
  const extractedSourceCode = extractSourceCodeFromSnowportId(snowportId);

  expect(extractedSourceCode).toBe(sourceCode);
  expect(extractedTimestamp).toBeGreaterThan(0);

  const indexPart = snowportId % 256;
  expect(indexPart).toBe(0);
});
