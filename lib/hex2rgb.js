module.exports = function (hex) {
  if (hex.length !== 6) {
    throw new Error('hex2rgb only accepts hex values in the 000000 format')
  }
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ]
}
