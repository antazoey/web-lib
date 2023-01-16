import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { ModalLogin } from '@yearn-finance/web-lib/components/ModalLogin';
import { deepMerge } from '@yearn-finance/web-lib/contexts/utils';
import { useClientEffect } from '@yearn-finance/web-lib/hooks/useClientEffect';
import { useDebounce } from '@yearn-finance/web-lib/hooks/useDebounce';
import { useInjectedWallet } from '@yearn-finance/web-lib/hooks/useInjectedWallet';
import { useLocalStorage } from '@yearn-finance/web-lib/hooks/useLocalStorage';
import { useWindowInFocus } from '@yearn-finance/web-lib/hooks/useWindowInFocus';
import { toAddress } from '@yearn-finance/web-lib/utils/address';
import { isIframe } from '@yearn-finance/web-lib/utils/helpers';
import { getPartner } from '@yearn-finance/web-lib/utils/partners';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import { chains } from '@yearn-finance/web-lib/utils/web3/chains';
import { connectors } from '@yearn-finance/web-lib/utils/web3/connectors';
import { IFrameEthereumProvider } from '@yearn-finance/web-lib/utils/web3/connectors.eip1193.ledger';
import { getProvider } from '@yearn-finance/web-lib/utils/web3/providers';
const defaultState = {
    address: undefined,
    ens: undefined,
    chainID: 1,
    isDisconnected: false,
    isActive: false,
    isConnecting: false,
    hasProvider: false,
    provider: getProvider(),
    currentPartner: undefined,
    onConnect: async () => undefined,
    onSwitchChain: () => undefined,
    openLoginModal: () => undefined,
    onDesactivate: () => undefined
};
const defaultOptions = {
    shouldUseWallets: true,
    defaultChainID: 1,
    supportedChainID: [1, 4, 5, 10, 56, 100, 137, 250, 420, 1337, 31337, 42161]
};
const Web3Context = createContext(defaultState);
export const Web3ContextApp = ({ children, options = defaultOptions }) => {
    const web3Options = deepMerge(defaultOptions, options);
    const { connector, isActive, provider, account, chainId } = useWeb3React();
    const [chainID, set_chainID] = useLocalStorage('chainId', chainId);
    const debouncedChainID = useDebounce(chainId, 500);
    const hasWindowInFocus = useWindowInFocus();
    const detectedWalletProvider = useInjectedWallet();
    const [ens, set_ens] = useLocalStorage('ens', '');
    const [lastWallet, set_lastWallet] = useLocalStorage('lastWallet', 'NONE');
    const [isConnecting, set_isConnecting] = useState(false);
    const [isDisconnected, set_isDisconnected] = useState(false);
    const [hasDisableAutoChainChange, set_hasDisableAutoChainChange] = useState(false);
    const [isModalLoginOpen, set_isModalLoginOpen] = useState(false);
    const [currentPartner, set_currentPartner] = useState();
    const onSwitchChain = useCallback((newChainID, force) => {
        if (newChainID === debouncedChainID) {
            return;
        }
        if (!force && (!isActive || hasDisableAutoChainChange)) {
            return;
        }
        const supportedChains = web3Options?.supportedChainID || defaultOptions.supportedChainID;
        if (!supportedChains) {
            return;
        }
        const isCompatibleChain = supportedChains.includes(Number(newChainID || 0));
        if (!force && isCompatibleChain) {
            return;
        }
        if (!provider || !isActive) {
            set_chainID(newChainID);
            return;
        }
        if (web3Options.shouldUseWallets) {
            if (Number(newChainID) === 1) {
                provider
                    .send('wallet_switchEthereumChain', [{ chainId: '0x1' }])
                    .then(() => {
                    try {
                        connector.activate({ chainId: 1 });
                    }
                    catch (error) {
                        console.error(error);
                    }
                })
                    .catch(() => set_hasDisableAutoChainChange(true));
            }
            else if (Number(newChainID) === 4) {
                provider
                    .send('wallet_switchEthereumChain', [{ chainId: '0x4' }])
                    .then(() => {
                    try {
                        connector.activate({ chainId: 4 });
                    }
                    catch (error) {
                        console.error(error);
                    }
                })
                    .catch(() => set_hasDisableAutoChainChange(true));
            }
            else if (Number(newChainID) === 5) {
                provider
                    .send('wallet_switchEthereumChain', [{ chainId: '0x5' }])
                    .then(() => {
                    try {
                        connector.activate({ chainId: 5 });
                    }
                    catch (error) {
                        console.error(error);
                    }
                })
                    .catch(() => set_hasDisableAutoChainChange(true));
            }
            else {
                if (newChainID in chains) {
                    const chainSwap = chains[newChainID]?.chain_swap;
                    provider
                        .send('wallet_addEthereumChain', [chainSwap, account])
                        .then(() => {
                        try {
                            connector
                                .activate({
                                ...chainSwap,
                                chainId: Number(chainSwap?.chainId)
                            });
                        }
                        catch (error) {
                            console.error(error);
                        }
                    })
                        .catch((error) => console.error(error));
                }
            }
        }
    }, [debouncedChainID, isActive, hasDisableAutoChainChange, web3Options.supportedChainID, provider, account]);
    useClientEffect(() => {
        if ((chainId || 0) > 0) {
            set_chainID(Number(chainId));
        }
        else if (chainId === 0) {
            set_chainID(Number(options?.defaultChainID || 1));
        }
    }, [chainId]);
    useEffect(() => {
        onSwitchChain(web3Options?.defaultChainID || 1);
    }, [hasWindowInFocus, onSwitchChain, web3Options.defaultChainID]);
    const onConnect = useCallback(async (providerType, onError, onSuccess) => {
        if (!web3Options.shouldUseWallets) {
            return;
        }
        set_isConnecting(true);
        if (providerType === 'INJECTED') {
            if (isActive) {
                await connectors.metamask.connector.deactivate?.();
            }
            try {
                await connectors.metamask.connector.activate();
                set_lastWallet('INJECTED');
                if (onSuccess) {
                    onSuccess();
                }
                set_isConnecting(false);
            }
            catch (error) {
                set_lastWallet('NONE');
                if (onError) {
                    onError(error);
                }
                set_isConnecting(false);
            }
        }
        else if (providerType === 'WALLET_CONNECT') {
            if (isActive) {
                await connectors.walletConnect.connector.deactivate();
            }
            try {
                await connectors.walletConnect.connector.activate(1);
                set_lastWallet('WALLET_CONNECT');
                if (onSuccess) {
                    onSuccess();
                }
                set_isConnecting(false);
            }
            catch (error) {
                set_lastWallet('NONE');
                if (onError) {
                    onError(error);
                }
                set_isConnecting(false);
            }
        }
        else if (providerType === 'EMBED_LEDGER') {
            set_lastWallet('EMBED_LEDGER');
        }
        else if (providerType === 'EMBED_GNOSIS_SAFE') {
            if (isActive) {
                await connectors.gnosisSafe.connector.deactivate?.();
            }
            try {
                await connectors.gnosisSafe.connector.activate();
                set_lastWallet('EMBED_GNOSIS_SAFE');
                if (onSuccess) {
                    onSuccess();
                }
                set_isConnecting(false);
            }
            catch (error) {
                set_lastWallet('NONE');
                if (onError) {
                    onError(error);
                }
                set_isConnecting(false);
            }
        }
        else if (providerType === 'EMBED_COINBASE') {
            if (isActive) {
                await connectors.coinbase.connector.deactivate?.();
            }
            try {
                await connectors.coinbase.connector.activate(1);
                set_lastWallet('EMBED_COINBASE');
                if (onSuccess) {
                    onSuccess();
                }
                set_isConnecting(false);
            }
            catch (error) {
                set_lastWallet('NONE');
                if (onError) {
                    onError(error);
                }
                set_isConnecting(false);
            }
        }
        else if (providerType === 'EMBED_TRUSTWALLET') {
            if (isActive) {
                await connectors.metamask.connector.deactivate?.();
            }
            try {
                await connectors.metamask.connector.activate(1);
                set_lastWallet('EMBED_TRUSTWALLET');
                if (onSuccess) {
                    onSuccess();
                }
                set_isConnecting(false);
            }
            catch (error) {
                set_lastWallet('NONE');
                if (onError) {
                    onError(error);
                }
                set_isConnecting(false);
            }
        }
    }, [isActive, web3Options.shouldUseWallets, detectedWalletProvider]);
    useClientEffect(() => {
        if (isIframe()) {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop.toString())
            });
            let { origin } = params;
            if (!origin && window?.location?.ancestorOrigins?.length > 0) {
                origin = window.location?.ancestorOrigins[0];
            }
            const partnerInformation = getPartner(origin || '');
            if (partnerInformation.id !== ethers.constants.AddressZero) {
                const frameProvider = new IFrameEthereumProvider({ targetOrigin: partnerInformation.originURI });
                const frameWeb3Provider = frameProvider;
                frameWeb3Provider.request = frameProvider.request;
                connectors.eip1193.connector.init(frameWeb3Provider);
                connectors.eip1193.connector.activate();
                set_currentPartner(partnerInformation);
                onConnect(partnerInformation.walletType);
            }
            else {
                try {
                    connectors.gnosisSafe.connector.activate().then(() => {
                        if (connectors.gnosisSafe.connector.provider) {
                            const web3Provider = new ethers.providers.Web3Provider(connectors.gnosisSafe.connector.provider);
                            const signer = web3Provider.getSigner();
                            signer.getAddress().then((signerAddress) => {
                                set_currentPartner({
                                    id: signerAddress,
                                    walletType: 'EMBED_GNOSIS_SAFE'
                                });
                                set_lastWallet('EMBED_GNOSIS_SAFE');
                            });
                        }
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        else if (detectedWalletProvider.type === 'EMBED_COINBASE') {
            connectors.coinbase.connector.activate().then(() => {
                set_lastWallet('EMBED_COINBASE');
            });
        }
        else if (detectedWalletProvider.name === 'EMBED_TRUSTWALLET') {
            connectors.metamask.connector.activate().then(() => {
                set_lastWallet('EMBED_TRUSTWALLET');
            });
        }
    }, [detectedWalletProvider]);
    useClientEffect(() => {
        if (!isActive && lastWallet !== 'NONE') {
            onConnect(lastWallet);
        }
    }, [isActive]);
    useClientEffect(() => {
        if (account && isActive) {
            const provider = getProvider(1);
            provider.lookupAddress(toAddress(account)).then((_ens) => set_ens(_ens || ''));
        }
    }, [account, chainID]);
    const onDesactivate = useCallback(() => {
        performBatchedUpdates(() => {
            set_ens('');
            set_lastWallet('NONE');
            set_isDisconnected(true);
            connector.deactivate?.();
            connector.resetState?.();
        });
        setTimeout(() => set_isDisconnected(false), 100);
    }, [connector]);
    const openLoginModal = useCallback(() => {
        if (isIframe()) {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop.toString())
            });
            let { origin } = params;
            if (!origin && window?.location?.ancestorOrigins?.length > 0) {
                origin = window.location?.ancestorOrigins[0];
            }
            const partnerInformation = getPartner(origin || '');
            if (partnerInformation.id !== ethers.constants.AddressZero) {
                const frameProvider = new IFrameEthereumProvider({ targetOrigin: partnerInformation.originURI });
                const frameWeb3Provider = frameProvider;
                frameWeb3Provider.request = frameProvider.request;
                connectors.eip1193.connector.init(frameWeb3Provider);
                connectors.eip1193.connector.activate();
                set_currentPartner(partnerInformation);
                onConnect(partnerInformation.walletType);
            }
            else {
                try {
                    connectors.gnosisSafe.connector.activate().then(() => {
                        if (connectors.gnosisSafe.connector.provider) {
                            const web3Provider = new ethers.providers.Web3Provider(connectors.gnosisSafe.connector.provider);
                            const signer = web3Provider.getSigner();
                            signer.getAddress().then((signerAddress) => {
                                set_currentPartner({
                                    id: signerAddress,
                                    walletType: 'EMBED_GNOSIS_SAFE'
                                });
                                set_lastWallet('EMBED_GNOSIS_SAFE');
                            });
                        }
                    });
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        else {
            set_isModalLoginOpen(true);
        }
    }, [onConnect, set_lastWallet]);
    const contextValue = useMemo(() => {
        const isReallyActive = isActive && (web3Options?.supportedChainID || defaultOptions.supportedChainID || []).includes(Number(chainId || 0));
        return ({
            address: account,
            ens: isReallyActive ? ens : '',
            isDisconnected,
            isActive: isReallyActive,
            isConnecting,
            hasProvider: !!provider,
            provider: provider,
            chainID,
            currentPartner,
            onConnect,
            onSwitchChain,
            openLoginModal,
            onDesactivate: onDesactivate,
            options: web3Options
        });
    }, [account, ens, isDisconnected, isActive, isConnecting, provider, currentPartner, onConnect, onSwitchChain, openLoginModal, onDesactivate, web3Options, chainId, chainID]);
    return (React.createElement(Web3Context.Provider, { value: contextValue },
        children,
        React.createElement(ModalLogin, { isOpen: isModalLoginOpen, onClose: () => set_isModalLoginOpen(false) })));
};
export const useWeb3 = () => useContext(Web3Context);
export default useWeb3;