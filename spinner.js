const debounce = require('debounce');

const spinner = (function() {
  const frames = ['|', '/', '—', '\\'];
  let index = 0;
  function next() {
    if (index > 3) index = 0;
    return frames[index++];
  }
  return debounce(next, 50);
})();

module.exports = { spinner };
