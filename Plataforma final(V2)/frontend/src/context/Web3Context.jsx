import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractData from '../config/contractData.json';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

const Web3Context = createContext(null);

export function useWeb3() {
 const ctx = useContext(Web3Context);
 if (!ctx) throw new Error('useWeb3 debe usarse dentro de <Web3Provider>');
 return ctx;
}

export function Web3Provider({ children }) {
 const [account, setAccount] = useState(null);
 const [balance, setBalance] = useState(null);
 const [provider, setProvider] = useState(null);
 const [signer, setSigner] = useState(null);
 const [contract, setContract] = useState(null);
 const [readContract, setReadContract] = useState(null);
 const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
 const [isConnecting, setIsConnecting] = useState(false);

 // ── Provider público de solo lectura (siempre disponible) ──
 useEffect(() => {
 const publicProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
 const readOnly = new ethers.Contract(
 contractData.proxyAddress,
 contractData.abi,
 publicProvider
 );
 setReadContract(readOnly);
 }, []);

 // ── Actualizar balance ──
 const updateBalance = useCallback(async (prov, addr) => {
 if (!prov || !addr) return;
 try {
 const bal = await prov.getBalance(addr);
 setBalance(ethers.formatEther(bal));
 } catch {
 setBalance(null);
 }
 }, []);

 // ── Verificar red ──
 const checkNetwork = useCallback(async (prov) => {
 try {
 const network = await prov.getNetwork();
 const correct = Number(network.chainId) === 11155111;
 setIsCorrectNetwork(correct);
 return correct;
 } catch {
 setIsCorrectNetwork(false);
 return false;
 }
 }, []);

 // ── Cambiar a Sepolia ──
 const switchToSepolia = useCallback(async () => {
 if (!window.ethereum) return false;
 try {
 await window.ethereum.request({
 method: 'wallet_switchEthereumChain',
 params: [{ chainId: SEPOLIA_CHAIN_ID }],
 });
 return true;
 } catch (error) {
 // Si Sepolia no existe en MetaMask, agregarla
 if (error.code === 4902) {
 try {
 await window.ethereum.request({
 method: 'wallet_addEthereumChain',
 params: [{
 chainId: SEPOLIA_CHAIN_ID,
 chainName: 'Sepolia Testnet',
 nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
 rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
 blockExplorerUrls: ['https://sepolia.etherscan.io'],
 }],
 });
 return true;
 } catch {
 return false;
 }
 }
 return false;
 }
 }, []);

 // ── Conectar wallet ──
 const connectWallet = useCallback(async () => {
 if (!window.ethereum) {
 window.open('https://metamask.io/download/', '_blank');
 return;
 }

 setIsConnecting(true);
 try {
 const browserProvider = new ethers.BrowserProvider(window.ethereum);

 // Verificar red y cambiar si es necesario
 const correct = await checkNetwork(browserProvider);
 if (!correct) {
 const switched = await switchToSepolia();
 if (!switched) {
 setIsConnecting(false);
 return;
 }
 // Re-create provider after network switch
 await new Promise(r => setTimeout(r, 500));
 }

 const newProvider = new ethers.BrowserProvider(window.ethereum);
 const newSigner = await newProvider.getSigner();
 const address = await newSigner.getAddress();

 const rwContract = new ethers.Contract(
 contractData.proxyAddress,
 contractData.abi,
 newSigner
 );

 setProvider(newProvider);
 setSigner(newSigner);
 setAccount(address);
 setContract(rwContract);
 setIsCorrectNetwork(true);

 await updateBalance(newProvider, address);
 } catch (error) {
 console.error('Error al conectar wallet:', error);
 } finally {
 setIsConnecting(false);
 }
 }, [checkNetwork, switchToSepolia, updateBalance]);

 // ── Desconectar ──
 const disconnectWallet = useCallback(() => {
 setAccount(null);
 setBalance(null);
 setProvider(null);
 setSigner(null);
 setContract(null);
 }, []);

 // ── Listeners de MetaMask ──
 useEffect(() => {
 if (!window.ethereum) return;

 const handleAccountsChanged = (accounts) => {
 if (accounts.length === 0) {
 disconnectWallet();
 } else if (account) {
 connectWallet();
 }
 };

 const handleChainChanged = () => {
 if (account) {
 connectWallet();
 }
 };

 window.ethereum.on('accountsChanged', handleAccountsChanged);
 window.ethereum.on('chainChanged', handleChainChanged);

 return () => {
 window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
 window.ethereum.removeListener('chainChanged', handleChainChanged);
 };
 }, [account, connectWallet, disconnectWallet]);

 // ── Auto-connect si previamente conectado ──
 useEffect(() => {
 if (window.ethereum) {
 window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
 if (accounts.length > 0) {
 connectWallet();
 }
 });
 }
 }, []); // eslint-disable-line react-hooks/exhaustive-deps

 const value = {
 account,
 balance,
 provider,
 signer,
 contract, // read-write (requires connected wallet)
 readContract, // read-only (always available via public RPC)
 isCorrectNetwork,
 isConnecting,
 connectWallet,
 disconnectWallet,
 switchToSepolia,
 updateBalance,
 contractData,
 };

 return (
 <Web3Context.Provider value={value}>
 {children}
 </Web3Context.Provider>
 );
}
