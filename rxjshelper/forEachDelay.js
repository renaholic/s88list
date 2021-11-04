const { of, concatMap, delay } = require('rxjs');

function forEachDelay(delayTime) {
  return concatMap((x) => of(x).pipe(delay(delayTime)));
}
exports.forEachDelay = forEachDelay;
