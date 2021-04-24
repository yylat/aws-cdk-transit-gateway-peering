import { expect as expectCDK, SynthUtils, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { TgwPeeringStack } from '../lib/tgw-peering-stack';
import { TgwRouteStack } from '../lib/tgw-route-stack';

test('tgw route stack', () => {
    const app = new cdk.App();
    const stack = new TgwRouteStack(app, 'tgw-route', {
        destinationCidrBlock: '172.16.1.0/24',
        transitGatewayId: 'tgw-h5h5ejh4gfwmi'
    });

    const synthStack = SynthUtils.toCloudFormation(stack)

    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::TransitGatewayRoute'))
});
