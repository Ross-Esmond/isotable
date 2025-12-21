let currentTime = 0;
let offsetTime = -1;
// the next index that should be used
let nextIndex = 0;
let sourceCode = -1; // Will be set when client connects

// uses only 52 bits of the number to maintain percision with floating point
// 36 bits for time in milliseconds (little over 2 years)
// 8 bits for 256 possible sources (usually players)
// 8 bits for 256 events per source per millisecond

export function setSourceCode(code: number) {
  if (code < 0 || code >= 256) {
    throw new Error(
      `Source code must be between 0 and 255, got ${code}`,
    );
  }
  sourceCode = code;
}

export function getSourceCode(): number {
  return sourceCode;
}

export function takeSnowportId(): number {
  if (offsetTime < 0) {
    offsetTime = performance.now();
  }
  if (sourceCode < 0) {
    throw new Error('Source code not set. Call setSourceCode() first.');
  } else if (sourceCode === 0) {
    throw new Error('Source code is 0, which is reserved.');
  }
  const now = performance.now() - offsetTime;
  if (now > currentTime) {
    currentTime = now;
    nextIndex = 0;
  }
  if (nextIndex >= 256) {
    currentTime += 1;
    nextIndex = 0;
  }
  const time = currentTime * 2 ** 16 + sourceCode * 2 ** 8 + nextIndex;
  if (time < 0) {
    throw new Error(
      `time was negative: currentTime ${currentTime}, sourceCode ${sourceCode}, nextIndex ${nextIndex}`,
    );
  }
  nextIndex += 1;
  return time;
}

export function ingestSnowportId(snowportId: number) {
  const indexPart = snowportId % 256;
  const timePart = Math.floor(snowportId / 2 ** 16);
  if (timePart > currentTime) {
    currentTime = timePart;
    offsetTime = performance.now() - currentTime;
    nextIndex = 0;
  } else if (snowportId === currentTime) {
    nextIndex = Math.max(nextIndex, indexPart + 1);
  }
}
