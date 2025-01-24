import { Address, toNano } from '@ton/core';
import { SampleJetton } from '../wrappers/SampleJetton';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "Staked-ton",
        description: "staked",
        symbol: "staked-Ton",
        image: "https://i.postimg.cc/3xkW55DH/toncoin-ton-logo.png",
    };

    // Create content Cell
    let content = buildOnchainMetadata(jettonParams);
    // set Tax address here


    const sampleJetton = provider.open(await SampleJetton.fromInit(provider.sender().address as Address, content, 1000000000000000000n, ));

    await sampleJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Mint',
            amount: 100000000000000000n,
            receiver: provider.sender().address as Address
        }
    );

    await provider.waitForDeploy(sampleJetton.address);

    // run methods on `sampleJetton`
}
