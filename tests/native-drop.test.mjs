import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeDropBridge } from '../lib/native-drop.js';

// Protocol/lifecycle checks. OS drag acceptance is a separate desktop verification.
test('receiver enforces one consumer and consumes cancellation once', async t => {
  const bridge = new NativeDropBridge(); t.after(() => bridge.dispose());
  bridge.state = 'ready';
  const { id } = bridge.arm();
  assert.throws(() => bridge.arm(), /Another workspace drag/);
  await assert.rejects(bridge.consume('wrong'), /expired/);
  const pending = bridge.consume(id);
  await assert.rejects(bridge.consume(id), /already has a consumer/);
  bridge.cancel(id);
  assert.deepEqual(await pending, { state: 'cancelled' });
  await assert.rejects(bridge.consume(id), /expired/);
});
test('disconnect cancels native request and frees the receiver', async t => {
  const bridge = new NativeDropBridge(); t.after(() => bridge.dispose()); bridge.state = 'ready';
  const { id } = bridge.arm(), controller = new AbortController();
  const pending = bridge.consume(id, controller.signal); controller.abort();
  assert.deepEqual(await pending, { state: 'cancelled' });
  assert.equal(bridge.active, null); assert.ok(bridge.arm().id);
});
test('stopped or unavailable receiver cannot report an armed drag', () => {
  const bridge = new NativeDropBridge();
  assert.throws(() => bridge.arm(), /unavailable/);
  bridge.state = 'ready'; bridge.dispose();
  assert.equal(bridge.status().available, false);
  assert.throws(() => bridge.arm(), /unavailable/);
});
test('native helper startup, no-button cancellation and shutdown on macOS', { skip: process.platform !== 'darwin' }, async t => {
  const bridge = new NativeDropBridge(); t.after(() => bridge.dispose());
  await bridge.start();
  for (let i = 0; bridge.status().state === 'starting' && i < 80; i++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(bridge.status().available, true, 'Run npm run build:native before this native test');
  const { id } = bridge.arm();
  assert.deepEqual(await bridge.consume(id), { state: 'cancelled' });
  const child = bridge.child;
  const exited = new Promise(resolve => child.once('exit', resolve));
  bridge.dispose(); await exited;
  assert.equal(bridge.active, null);
});
