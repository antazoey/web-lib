import {z} from 'zod';
import {addressSchema} from '@builtbymom/web3/types';

import type {TDict, TNDict} from '@builtbymom/web3/types';

const SOLVER = [
	'Vanilla',
	'PartnerContract',
	'ChainCoin',
	'InternalMigration',
	'OptimismBooster',
	'GaugeStakingBooster',
	'.',
	'Cowswap',
	'Portals',
	'None'
] as const;

export const Solver = z.enum(SOLVER);

export type TSolver = z.infer<typeof Solver>;

const yDaemonTokenListBalance = z.object({
	chainID: z.number().optional(),
	decimals: z.number(),
	address: z.string(),
	name: z.string(),
	symbol: z.string(),
	logoURI: z.string().optional(),
	balance: z.string().optional(),
	price: z.string().optional(),
	supportedZaps: Solver.array().optional()
});

export const _yDaemonTokenListBalances = z.record(addressSchema, yDaemonTokenListBalance);
export const yDaemonTokenListBalances = z.record(z.string(), _yDaemonTokenListBalances);
export type TYDaemonTokenListBalances = TNDict<TDict<z.infer<typeof yDaemonTokenListBalance>>>;
export type TSupportedZaps = z.infer<typeof Solver>;
