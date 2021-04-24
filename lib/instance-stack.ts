import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface InstanceStackProps extends cdk.StackProps {
    vpc: ec2.IVpc
    cidrIpToAllowPingFrom: string
}

export class InstanceStack extends cdk.Stack {

    readonly instance: ec2.Instance

    constructor(scope: cdk.Construct, id: string, props: InstanceStackProps) {
        super(scope, id, props);

        const securityGroup = new ec2.SecurityGroup(this, 'security-group', {
            vpc: props.vpc
        })
        securityGroup.addIngressRule(ec2.Peer.ipv4(props.cidrIpToAllowPingFrom), ec2.Port.allIcmp())

        this.instance = new ec2.Instance(this, 'instance', {
            vpc: props.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.latestAmazonLinux({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            }),
            securityGroup
        })
    }
}
