import { expect as expectCDK, SynthUtils, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { InstanceStack } from '../lib/instance-stack';
test('network stack', () => {
    const app = new cdk.App();
    new cdk.Stack()
    const stack = new InstanceStack(app, 'instance', {
        vpc: new VpcStack(app, 'vpc').vpc,
        cidrIpToAllowPingFrom: '172.16.0.0/16'
    });

    const synthStack = SynthUtils.toCloudFormation(stack)

    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::Instance'))
    expectCDK(synthStack).to(haveResourceLike('AWS::EC2::SecurityGroup'))
});


class VpcStack extends cdk.Stack {
    readonly vpc: ec2.Vpc
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.vpc = new ec2.Vpc(this, 'vpc')
    }
}
