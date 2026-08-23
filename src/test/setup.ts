import { beforeEach, vi } from 'vitest';
import { installTemporalGlobal } from './temporal-global';

// runs before the test files are imported, so content scripts can capture the original Temporal
installTemporalGlobal();

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
