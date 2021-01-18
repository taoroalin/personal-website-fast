const globalVariable = window || globals;
globalVariable.recordedGlobals = Array.from(Object.keys(globalVariable));

const profileNewTopLevelFunctions = () => {
  Object.entries(globalVariable).forEach(([name, global]) => {
    if (
      !recordedGlobals.includes(name) &&
      typeof global === "function" &&
      global.timeStats === undefined
    ) {
      const [timedGlobal, globalTimeStats] = timeFunc(global);
      timedGlobal.timeStats = globalTimeStats;
      globalVariable[name] = timedGlobal;
    }
  });
};

/**
 * Creates a version of a function that keeps track of avg and variance in runtime.
 * Meant to be used like this:
 * const [func, funcTimeStats]=timeFunc(()=>{...}, "func")
 * Optionally prints time stats every time func is called
 */
const timeFunc = (f, n = "", print = false) => {
  const timeStats = { avg: 0, timesCalled: 0, std: 0, variance: 0 };
  return [
    (...args) => {
      const stime = performance.now();
      const result = f.apply({}, args);
      const duration = performance.now() - stime;
      if (timeStats.avg === 0) {
        timeStats.avg = duration;
      } else {
        timeStats.avg =
          (timeStats.avg * timeStats.timesCalled + duration) /
          (timeStats.timesCalled + 1);
        const deviationNow =
          (timeStats.avg - duration) * (timeStats.avg - duration);
        timeStats.variance =
          (timeStats.variance * timeStats.timesCalled + deviationNow) /
          (timeStats.timesCalled + 1);
        timeStats.std = Math.sqrt(timeStats.variance);
      }
      timeStats.timesCalled += 1;
      if (print) {
        console.log(`Function ${n} took ${duration} avg ${timeStats.avg}`);
      }
      return result;
    },
    timeStats,
  ];
};
