import React, { useState } from 'react';
import { Provider, Wallet, utils, Contract } from 'zksync-web3';
import * as ethers from 'ethers';
import ERC20Artifact from 'openzeppelin-solidity/build/contracts/ERC20Detailed.json';
import { ContractInterface } from 'ethers';

interface ERC20ArtifactType {
  abi: ContractInterface;
}
const PAYMASTER_ADDRESS = '<PAYMASTER_ADDRESS>';
const TOKEN_ADDRESS = '<TOKEN_ADDRESS>';
const EMPTY_WALLET_PRIVATE_KEY = '<EMPTY_WALLET_PRIVATE_KEY>';

function Paymaster() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  async function handleMint() {
    setLoading(true);
    try {
      const provider = new Provider('https://testnet.era.zksync.dev');
      const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY, provider);

      const erc20 = new Contract(TOKEN_ADDRESS, (ERC20Artifact as ERC20ArtifactType).abi, emptyWallet);

      const gasPrice = await provider.getGasPrice();
      const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
        type: 'ApprovalBased',
        token: TOKEN_ADDRESS,
        minimalAllowance: ethers.BigNumber.from(1),
        innerInput: new Uint8Array(),
      });

      const gasLimit = await erc20.estimateGas.mint(emptyWallet.address, 5, {
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams: paymasterParams,
        },
      });

      const fee = gasPrice.mul(gasLimit.toString());
      console.log('Transaction fee estimation is:', fee.toString());

      console.log('Minting 5 tokens for empty wallet via paymaster...');
      await (
        await erc20.mint(emptyWallet.address, 5, {
          customData: {
            paymasterParams: paymasterParams,
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          },
        })
      ).wait();

      setResult('Minting successful!');
    } catch (error) {
      console.error('Minting failed:', error);
      setResult('Minting failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Paymaster Minting</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleMint}
        disabled={loading}
      >
        {loading ? 'Minting...' : 'Mint Tokens'}
      </button>
      {result && <p className="mt-4">{result}</p>}
    </div>
  );
}

export default Paymaster;