import { Clock, install as installFakeTimer, timers } from '@sinonjs/fake-timers';
import { expect, fetch, nodeOnly } from '../test-utils';

import { getLocal } from '../..';

describe('Compatibility with mock timers', () => {
  const server = getLocal();
  let clock: Clock;

  beforeEach(() => server.start());
  afterEach(() => {
    return server.stop();
  });

  it('works with Sinon', async () => {
    await server.forGet('/mocked-endpoint').thenReply(200, 'mocked data');

    clock = installFakeTimer({ now: 0, toFake: Object.keys(timers) as any });
    expect(Date.now()).to.eq(0);
    try {
      const p = fetch(server.urlFor('/mocked-endpoint'));
      clock.runAll();
      await expect(p).to.have.responseText('mocked data');
    } finally {
      clock.reset();
    }
  });

  if (+process.version.split('.')[0] >= 19) {
    it('works with Node timers', async () => {
      const { mock } = await import('node:test');

      await server.forGet('/mocked-endpoint').thenReply(200, 'mocked data');

      mock.timers.enable({ now: 0, apis: ['Date', 'setImmediate', 'setInterval', 'setTimeout'] });
      expect(Date.now()).to.eq(0);
      try {
        await expect(fetch(server.urlFor('/mocked-endpoint'))).to.have.responseText('mocked data');
      } finally {
        mock.timers.reset();
      }
    });
  }
});
