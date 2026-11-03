import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateAddress } from '../src/lib/ipAddress.js';

describe('isPrivateAddress (server-side fetch guard)', () => {
  it('allows public IPv4 and IPv6 addresses', () => {
    for (const ip of ['104.20.23.154', '172.66.147.243', '8.8.8.8', '2606:4700::6812:179a', '2a00:1450:4001:80b::200e', '2001:4860:4860::8888']) {
      assert.equal(isPrivateAddress(ip), false, ip);
    }
  });

  it('refuses loopback, private, link-local and reserved IPv4', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '198.18.0.1', '192.0.2.10', '224.0.0.1', '255.255.255.255']) {
      assert.equal(isPrivateAddress(ip), true, ip);
    }
  });

  it('refuses private and special IPv6, including IPv4 hidden inside IPv6', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1%eth0', 'fec0::1', 'ff02::1', '2001:db8::1', '100::1',
      '::ffff:127.0.0.1', '::ffff:169.254.169.254', '::ffff:7f00:1', '::127.0.0.1', '64:ff9b::a9fe:a9fe', '2002:c0a8:0101::1', '2001:0:4136:e378::1', '[::1]']) {
      assert.equal(isPrivateAddress(ip), true, ip);
    }
  });

  it('allows IPv4-mapped public addresses and refuses anything that is not an IP', () => {
    assert.equal(isPrivateAddress('::ffff:8.8.8.8'), false);
    for (const value of ['', 'localhost', 'example.com', '1.2.3', '999.1.1.1', null, undefined]) {
      assert.equal(isPrivateAddress(value), true, String(value));
    }
  });
});
