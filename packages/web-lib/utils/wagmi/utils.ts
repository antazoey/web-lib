import assert from 'assert';
import {createPublicClient, http} from 'viem';
import * as wagmiChains from '@wagmi/chains';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ZERO_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {isEth} from '@yearn-finance/web-lib/utils/isEth';
import {isTAddress} from '@yearn-finance/web-lib/utils/isTAddress';
import {localhost} from '@yearn-finance/web-lib/utils/wagmi/networks';

import type {Chain, PublicClient} from 'viem';
import type {TAddress} from '@yearn-finance/web-lib/types';

type TChainContract = {
	address: TAddress
	blockCreated?: number
}

const partnerContractAddress: {[key: number]: TChainContract} = {
	1: {
		address: toAddress('0x8ee392a4787397126C163Cb9844d7c447da419D8'),
		blockCreated: 14166636
	},
	10: {
		address: toAddress('0x7E08735690028cdF3D81e7165493F1C34065AbA2'),
		blockCreated: 29675215
	},
	250: {
		address: toAddress('0x086865B2983320b36C42E48086DaDc786c9Ac73B'),
		blockCreated: 40499061
	},
	42161: {
		address: toAddress('0x0e5b46E4b2a05fd53F5a4cD974eb98a9a613bcb7'),
		blockCreated: 30385403
	},
	1337: {
		address: toAddress('0x8ee392a4787397126C163Cb9844d7c447da419D8'),
		blockCreated: 14166636
	}
};

type TExtendedChain = Chain & {
	defaultRPC: string
	defaultBlockExplorer: string
	contracts: {
		partnerContract?: TChainContract
	}
}
export const indexedWagmiChains = Object.values(wagmiChains).reduce((acc: {[key: number]: TExtendedChain}, chain: Chain): {[key: number]: TExtendedChain} => {
	let extendedChain = chain as TExtendedChain;
	if (extendedChain.id === 1337) {
		extendedChain = localhost as unknown as TExtendedChain;
	}

	extendedChain.contracts = {
		...chain.contracts,
		partnerContract: partnerContractAddress[chain.id]
	};
	extendedChain.defaultRPC = process.env.JSON_RPC_URL?.[chain.id] || chain.rpcUrls.public.http[0];
	extendedChain.defaultBlockExplorer = chain.blockExplorers?.[0]?.url || 'https://etherscan.io';
	acc[chain.id] = extendedChain;
	return acc;
}, {});

export function getNetwork(chainID: number): TExtendedChain {
	if (!indexedWagmiChains[chainID]) {
		throw new Error(`Chain ${chainID} is not supported`);
	}
	return indexedWagmiChains[chainID];
}

export function getClient(chainID: number): PublicClient {
	if (!indexedWagmiChains[chainID]) {
		throw new Error(`Chain ${chainID} is not supported`);
	}
	return createPublicClient({
		chain: indexedWagmiChains[chainID],
		transport: http(process.env.JSON_RPC_URL?.[chainID] || indexedWagmiChains[chainID].rpcUrls.public.http[0])
	});
}

export function assertAddress(addr: string | TAddress | undefined, name?: string): asserts addr is TAddress {
	assert(addr, `${name || 'Address'} is not set`);
	assert(isTAddress(addr), `${name || 'Address'} provided is invalid`);
	assert(toAddress(addr) !== ZERO_ADDRESS, `${name || 'Address'} is 0x0`);
	assert(!isEth(addr), `${name || 'Address'} is 0xE`);
}