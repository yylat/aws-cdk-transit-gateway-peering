import { expect as expectCDK, SynthUtils, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import { TgwPeeringStack } from '../lib/tgw-peering-stack';

test('tgw peering stack', () => {
    const app = new cdk.App();
    const stack = new TgwPeeringStack(app, 'tgw-peering', {
        transitGatewayId: 'tgw-h5h5ejh4gfwmi',
        peerRegion: 'eu-north-1'
    });

    const synthStack = SynthUtils.toCloudFormation(stack)

    expectCDK(synthStack).to(haveResourceLike('Custom::TransitGatewayPeering'))
});
