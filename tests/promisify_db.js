'use strict';

const assert = require('assert');
const PromisifyDB = require('../src/promisify_db');

describe('PromisifyDB', () => {
  describe('`all`', () => {
    it('should resolve the correct result', async () => {
      const db = {
        all: (query, argument, cb) => {
          cb(null, true);
        }
      }
      const promisifyDB = new PromisifyDB({db});
      const result = await promisifyDB.all('query', 'argument');

      assert.equal(result, true);
    });
  
    it('should reject when there is an error', async () => {
      const db = {
        all: (query, argument, cb) => {
          cb(true, true);
        }
      }
      const promisifyDB = new PromisifyDB({db});
      try {
        await promisifyDB.all('query', 'argument');
        throw new Error('Unexpected success');
      } catch (err) {
        assert.equal(err, true);
      }

    });
  })

  describe('`run`', () => {
    it('should resolve the correct result', async () => {
      function run (query, argument, cb) {
        // Custom `this`
        const boundCb = cb.bind({hello: true});
        boundCb(null, true);
      }

      const db = {run};

      const promisifyDB = new PromisifyDB({db});
      const result = await promisifyDB.run('query', 'argument');

      assert.deepEqual(result, {hello: true});
    });
  
    it('should reject when there is an error', async () => {
      const db = {
        run: (query, argument, cb) => {
          cb(true, true);
        }
      }
      const promisifyDB = new PromisifyDB({db});
      try {
        await promisifyDB.run('query', 'argument');
        throw new Error('Unexpected success');
      } catch (err) {
        assert.equal(err, true);
      }

    });
  })

})
