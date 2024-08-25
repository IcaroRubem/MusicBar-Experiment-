function select(identification) {
    const element = document.querySelector(identification)
    element.evt = element.addEventListener
    element.add = element.appendChild
    return element
}

/* ======= */
// constrain is dependence of map
/* ======= */
function create(tagName) {
  const element = document.createElement(tagName)
  element.evt = element.addEventListener
  element.add = element.appendChild
  return element
}

function constrain (n, low, high) {
    return Math.max(Math.min(n, high), low);
};

function map(n, start1, stop1, start2, stop2, withinBounds) {
    const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
      return newval;
    }
    if (start2 < stop2) {
      return constrain(newval, start2, stop2);
    } else {
      return constrain(newval, stop2, start2);
    }
};

function map2(value, fromLow, fromHigh, toLow, toHigh) {
  return toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow);
}