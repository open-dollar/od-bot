const logger = {
  log: (...args) => {
    console.log(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    console.info(...args);
  },
  debug: (...args) => {
    console.debug(...args);
  }
};

export { logger };
