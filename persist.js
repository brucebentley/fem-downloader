const curry = require('ramda/src/curry');

const Persist = (function Persist(storage = {}) {
  return {
    persist: curry((label, value) => {
      storage[label] = value;
      return value;
    }),
    restore: label => storage[label],
    dump: () => console.log(storage)
  };
})();

exports.Persist = Persist;
