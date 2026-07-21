const logger = {
    info: (msg, meta = '') => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
    warn: (msg, meta = '') => console.warn(`[${new Date().toISOString()}] [WARN] ⚠️ ${msg}`, meta ? JSON.stringify(meta) : ''),
    error: (msg, err = '') => console.error(`[${new Date().toISOString()}] [ERROR] ❌ ${msg}`, err.stack || err || '')
  };

  module.exports = logger;