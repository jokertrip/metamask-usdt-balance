import React, { useState, useEffect } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { switchToBscNetwork } from './utils/web3'

const App = () => {
	const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
	const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null)
	const [account, setAccount] = useState(null)
	const [usdtBalance, setUsdtBalance] = useState<string | null>(null)

	useEffect(() => {
		if (window.ethereum) {
			setIsMetaMaskInstalled(true)
			const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
			setProvider(bscProvider)

			const handleChainChanged = (_chainId: string) => {
				if (_chainId !== '0x38') {
					disconnectWallet()
				}
			}

			window.ethereum.on('chainChanged', handleChainChanged)

			return () => {
				window.ethereum.removeListener('chainChanged', handleChainChanged)
			}
		} else {
			setIsMetaMaskInstalled(false)
		}
	}, [])

	const connectWallet = async () => {
		const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })

		if (currentChainId !== '0x38') {
			await switchToBscNetwork()
		}

		const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
		const userAccount = accounts[0]
		setAccount(userAccount)

		if (provider) {
			const usdtContractAddress = '0x55d398326f99059ff775485246999027b3197955'
			const contract = new ethers.Contract(usdtContractAddress, ['function balanceOf(address owner) view returns (uint256)'], provider)
			const balance = await contract.balanceOf(userAccount)
			const humanReadableBalance = ethers.utils.formatUnits(balance, 18)
			const displayBalance = `$ ${parseFloat(humanReadableBalance).toFixed(2)}`
			setUsdtBalance(displayBalance)
		}
	}

	const disconnectWallet = () => {
		setAccount(null)
		setUsdtBalance(null)
	}

	return (
		<div className={'container'}>
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
