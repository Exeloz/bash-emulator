function adjustFontSize (body, multiplicativeDelta) {
  const currentSize = parseFloat(getComputedStyle(body).fontSize)
  body.style.fontSize = Math.max(currentSize * multiplicativeDelta, 8) + 'px'
}

export default adjustFontSize
