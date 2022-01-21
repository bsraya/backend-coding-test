/**
 * A Utility class that promisify sqlite3
 * 
 * @param {Object} options - The options.
 * @param {sqlite} options.db - The sqlite instance.
 */
function PromisifyDB(options) {
  this.db = options.db;
}

/**
 * The promisify `db.all` function.
 * 
 * @param {String} query - The sql query string.
 * @param  {...any} args - The sql arguments.
 * 
 * @returns A promise that resolves the result of the query.
 */
PromisifyDB.prototype.all = function (query, ...args) {
  return new Promise((resolve, reject) => {
    this.db.all(query, ...args, (err, result) => {
      if (err) {
          reject(err);
          return;
      }

      resolve(result);
    })
  });
};

/**
 * The promisify `db.run` function.
 * 
 * @param {String} query - The sql query string.
 * @param  {...any} args - The sql arguments.
 *  
 * @returns A promise that resolves the context of run callback.
 */
PromisifyDB.prototype.run = function (query, ...args) {
  const that = this;
  return new Promise((resolve, reject) => {
    that.db.run(query, ...args, function (err, result) {
      if (err) {
          reject(err);
          return;
      }

      resolve(this);
    })
  });
};

module.exports = PromisifyDB;
