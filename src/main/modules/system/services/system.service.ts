import { arch, platform } from 'process';
import type { SystemInfo } from '@root/common/types';

export class SystemService {
  getSystemInfo(): SystemInfo {
    return {
      platform,
      arch,
      versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        v8: process.versions.v8,
      },
      uptimeMs: Math.round(process.uptime() * 1000),
    };
  }
}
