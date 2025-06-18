import * as c from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface InstanceStackProps extends cdk.StackProps {
    vpc: ec2.IVpc
    cidrIpToAllowPingFrom: string
}

export class InstanceStack extends cdk.Stack {

    readonly instance: ec2.Instance

    constructor(scope: c.Construct, id: string, props: InstanceStackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')]
        })

        const securityGroup = new ec2.SecurityGroup(this, 'security-group', {
            vpc: props.vpc
        })
        securityGroup.addIngressRule(ec2.Peer.ipv4(props.cidrIpToAllowPingFrom), ec2.Port.allIcmp())

        this.instance = new ec2.Instance(this, 'instance', {
            vpc: props.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            role,
            securityGroup
        })
    }
}
