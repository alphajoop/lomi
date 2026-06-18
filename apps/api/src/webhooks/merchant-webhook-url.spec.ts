import { lookup as dnsLookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import * as https from 'node:https';
import axios from 'axios';
import {
  buildSafeMerchantWebhookAxiosConfig,
  deliverMerchantWebhook,
  getSafeWwwApexRedirectUrl,
  getWwwApexAlternateUrl,
  isWwwApexHostnamePair,
  isBlockedWebhookAddress,
  parseMerchantWebhookUrl,
  resolveSafeMerchantWebhookTarget,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockedLookup = dnsLookup as jest.MockedFunction<typeof dnsLookup>;
const mockedAxiosPost = axios.post as jest.MockedFunction<typeof axios.post>;

describe('merchant-webhook-url', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isBlockedWebhookAddress', () => {
    it('blocks loopback, private, link-local, and metadata IPv4 ranges', () => {
      expect(isBlockedWebhookAddress('127.0.0.1')).toBe(true);
      expect(isBlockedWebhookAddress('10.0.0.5')).toBe(true);
      expect(isBlockedWebhookAddress('172.16.0.1')).toBe(true);
      expect(isBlockedWebhookAddress('192.168.1.10')).toBe(true);
      expect(isBlockedWebhookAddress('169.254.169.254')).toBe(true);
      expect(isBlockedWebhookAddress('100.64.0.1')).toBe(true);
    });

    it('allows public IPv4 addresses', () => {
      expect(isBlockedWebhookAddress('8.8.8.8')).toBe(false);
      expect(isBlockedWebhookAddress('93.184.216.34')).toBe(false);
    });

    it('blocks IPv6 loopback and link-local addresses', () => {
      expect(isBlockedWebhookAddress('::1')).toBe(true);
      expect(isBlockedWebhookAddress('fe80::1')).toBe(true);
    });
  });

  describe('parseMerchantWebhookUrl', () => {
    it('requires HTTPS without embedded credentials', () => {
      expect(() =>
        parseMerchantWebhookUrl('http://example.com/webhook'),
      ).toThrow(UnsafeWebhookUrlError);
      expect(() =>
        parseMerchantWebhookUrl('https://user:pass@example.com/webhook'),
      ).toThrow(UnsafeWebhookUrlError);
    });

    it('rejects literal private targets at parse time', () => {
      expect(() =>
        parseMerchantWebhookUrl('https://127.0.0.1/webhook'),
      ).toThrow(UnsafeWebhookUrlError);
      expect(() =>
        parseMerchantWebhookUrl('https://169.254.169.254/latest/meta-data'),
      ).toThrow(UnsafeWebhookUrlError);
    });

    it('rejects localhost and metadata hostnames', () => {
      expect(() =>
        parseMerchantWebhookUrl('https://localhost/webhook'),
      ).toThrow(UnsafeWebhookUrlError);
      expect(() =>
        parseMerchantWebhookUrl(
          'https://metadata.google.internal/computeMetadata/v1/',
        ),
      ).toThrow(UnsafeWebhookUrlError);
    });
  });

  describe('www/apex hostname helpers', () => {
    it('detects apex and www as the same site', () => {
      expect(isWwwApexHostnamePair('example.com', 'www.example.com')).toBe(
        true,
      );
      expect(isWwwApexHostnamePair('www.example.com', 'example.com')).toBe(
        true,
      );
      expect(isWwwApexHostnamePair('example.com', 'api.example.com')).toBe(
        false,
      );
    });

    it('builds the alternate webhook URL', () => {
      expect(getWwwApexAlternateUrl('https://example.com/hook')).toBe(
        'https://www.example.com/hook',
      );
      expect(getWwwApexAlternateUrl('https://www.example.com/hook')).toBe(
        'https://example.com/hook',
      );
    });

    it('accepts safe redirect locations that only add or remove www', () => {
      expect(
        getSafeWwwApexRedirectUrl(
          'https://example.com/hook?x=1',
          'https://www.example.com/hook?x=1',
        ),
      ).toBe('https://www.example.com/hook?x=1');
      expect(
        getSafeWwwApexRedirectUrl(
          'https://example.com/hook',
          'https://evil.com/hook',
        ),
      ).toBeNull();
    });
  });

  describe('resolveSafeMerchantWebhookTarget', () => {
    it('accepts public hostnames that resolve to public addresses', async () => {
      mockedLookup.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
      ] as unknown as LookupAddress);

      const target = await resolveSafeMerchantWebhookTarget(
        'https://example.com/webhooks/lomi',
      );

      expect(target.hostname).toBe('example.com');
      expect(target.pinnedAddresses).toEqual(['93.184.216.34']);
    });

    it('rejects hostnames that resolve to private addresses', async () => {
      mockedLookup.mockResolvedValue([
        { address: '10.0.0.8', family: 4 },
      ] as unknown as LookupAddress);

      await expect(
        resolveSafeMerchantWebhookTarget('https://attacker.example/webhook'),
      ).rejects.toThrow(UnsafeWebhookUrlError);
    });

    it('rejects hostnames with mixed public and private resolution', async () => {
      mockedLookup.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.8', family: 4 },
      ] as unknown as LookupAddress);

      await expect(
        resolveSafeMerchantWebhookTarget('https://dual.example/webhook'),
      ).rejects.toThrow(UnsafeWebhookUrlError);
    });
  });

  describe('deliverMerchantWebhook', () => {
    it('retries www when apex responds with a redirect', async () => {
      mockedLookup.mockImplementation(async (hostname: string) => {
        if (hostname === 'example.com' || hostname === 'www.example.com') {
          return [
            { address: '93.184.216.34', family: 4 },
          ] as unknown as LookupAddress;
        }
        throw new Error(`unexpected hostname ${hostname}`);
      });

      mockedAxiosPost.mockImplementation(async (url: string) => {
        if (url.startsWith('https://example.com/')) {
          return {
            status: 307,
            data: { status: '307' },
            headers: { location: 'https://www.example.com/hook' },
          };
        }
        return { status: 200, data: { ok: true }, headers: {} };
      });

      const result = await deliverMerchantWebhook(
        'https://example.com/hook',
        '{}',
        { 'Content-Type': 'application/json' },
      );

      expect(result.status).toBe(200);
      expect(result.deliveredUrl).toBe('https://www.example.com/hook');
      expect(result.usedAlternateHost).toBe(true);
      expect(mockedAxiosPost).toHaveBeenCalledTimes(2);
    });
  });

  describe('buildSafeMerchantWebhookAxiosConfig', () => {
    it('supports Node DNS lookup with options.all', async () => {
      mockedLookup.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
      ] as unknown as LookupAddress);

      const target = await resolveSafeMerchantWebhookTarget(
        'https://example.com/webhooks/lomi',
      );
      const config = buildSafeMerchantWebhookAxiosConfig(target);
      const lookup = (
        config.httpsAgent as https.Agent & { options?: https.AgentOptions }
      ).options?.lookup;

      expect(typeof lookup).toBe('function');

      await new Promise<void>((resolve, reject) => {
        lookup!('example.com', { all: true }, (err, addresses) => {
          if (err) {
            reject(err);
            return;
          }
          expect(addresses).toEqual([{ address: '93.184.216.34', family: 4 }]);
          resolve();
        });
      });
    });
  });
});
