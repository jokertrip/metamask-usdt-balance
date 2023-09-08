import React, { useState, useEffect } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { switchToBscNetwork } from './utils/web3'

const App = () => {
	const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
	const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null)
	const [account, setAccount] = useState<string | null>(null)
	const [usdtBalance, setUsdtBalance] = useState<string | null>(null)

	const getBalance = async () => {
		const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
		if (currentChainId !== '0x38') return
		if (provider && account) {
			const usdtContractAddress = '0x55d398326f99059ff775485246999027b3197955'
			const contract = new ethers.Contract(usdtContractAddress, ['function balanceOf(address owner) view returns (uint256)'], provider)
			const balance = await contract.balanceOf(account)
			const humanReadableBalance = ethers.utils.formatUnits(balance, 18)
			setUsdtBalance(`$ ${parseFloat(humanReadableBalance).toFixed(2)}`)
		}
	}

	const connectProvider = () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum)
		setProvider(provider)
	}

	useEffect(() => {
		console.log('getBalance')
		void getBalance()
	}, [provider, account])

	useEffect(() => {
		if (window.ethereum) {
			setIsMetaMaskInstalled(true)
			connectProvider()

			const handleChainChanged = async (_chainId: string) => {
				const savedWallet = localStorage.getItem('connectedWallet')
				if (_chainId !== '0x38' && savedWallet) {
					const newAccount = await switchToBscNetwork()
					if (newAccount) {
						setProvider(new ethers.providers.Web3Provider(window.ethereum))
						setAccount(newAccount)
					}
				}
			}

			window.ethereum.on('chainChanged', handleChainChanged)

			window.ethereum.request({ method: 'eth_chainId' }).then((currentChainId: string) => {
				const savedWallet = localStorage.getItem('connectedWallet')
				console.log('savedWallet', provider)
				if (savedWallet) {
					setAccount(savedWallet)
					if (currentChainId !== '0x38') {
						void handleChainChanged(currentChainId)
					}
				}
			})

			return () => {
				window.ethereum.removeListener('chainChanged', handleChainChanged)
			}
		} else {
			setIsMetaMaskInstalled(false)
		}
	}, [])

	const connectWallet = async () => {
		const newAccount = await switchToBscNetwork()
		if (newAccount) {
			connectProvider()
			setAccount(newAccount)
			localStorage.setItem('connectedWallet', newAccount)
			localStorage.setItem('connectedChainId', '0x38')
		}
	}

	const disconnectWallet = () => {
		setAccount(null)
		setUsdtBalance(null)
		setProvider(null)
		localStorage.removeItem('connectedWallet')
		localStorage.removeItem('connectedChainId')
	}

	return (
		<div className="container">
			{isMetaMaskInstalled ? (
				<>
					<button onClick={connectWallet}>Connect Wallet</button>
					{account && (
						<>
							<p>Connected Account: {account}</p>
							<p>USDT Balance: {usdtBalance}</p>
							<button onClick={disconnectWallet}>Disconnect</button>
						</>
					)}
				</>
			) : (
				<p>Please install MetaMask to use this app.</p>
			)}
		</div>
	)
}

export default App
