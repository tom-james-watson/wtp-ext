const logger = {
  debug: function() {
    console.debug(`wtp:`, ...arguments)
  },
  info: function() {
    console.log(`wtp:`, ...arguments)
  },
  warn: function() {
    console.warn(`wtp:`, ...arguments)
  },
  error: function() {
    console.error(`wtp:`, ...arguments)
  },
}

export default logger
