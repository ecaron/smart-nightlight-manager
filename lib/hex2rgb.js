'use strict';
module.exports = function(hex) {
  if (hex.length !== 7) {
    throw new Error('hex2rgb only accepts hex values in the #000000 format');
  }
  return [
    parseInt(hex.substring(1,2), 16),
    parseInt(hex.substring(3,4), 16),
    parseInt(hex.substring(5,6), 16)
  ];
}
