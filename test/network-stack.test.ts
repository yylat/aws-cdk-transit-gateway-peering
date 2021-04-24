import { expect as expectCDK, SynthUtils, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { NetworkStack } from '../lib/network-stack';

test('network stack', () => {
    const app = new cdk.App();
    const stack = new NetworkStack(app, 'network', {
        cidr: '172.16.0.0/24',
        amazonSideAsn: 64512
    });

    const synthStack = SynthUtils.toCloudFormation(stack)

    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::VPC'))
    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::Subnet'))
    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::TransitGateway'))
    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::TransitGatewayAttachment'))
    expectCDK(synthStack).to(haveResourceLike('AWS::SSM::Parameter'))
});
