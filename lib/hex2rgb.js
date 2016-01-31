'use strict';
module.exports = function (hex) {
  if (hex.length !== 6) {
    throw new Error('hex2rgb only accepts hex values in the 000000 format');
  }
  return [
    parseInt(hex.substring(0, 1), 16),
    parseInt(hex.substring(2, 3), 16),
    parseInt(hex.substring(4, 5), 16)
  ];
};
