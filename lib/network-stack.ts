import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface NetworkStackProps extends cdk.StackProps {
    cidr: string
    amazonSideAsn: number
}

export class NetworkStack extends cdk.Stack {

    readonly vpc: ec2.Vpc
    readonly transitGateway: ec2.CfnTransitGateway
    readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment

    constructor(scope: cdk.Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'vpc', {
            cidr: props.cidr,
            maxAzs: 1,
            subnetConfiguration: [
                {
                    cidrMask: 27,
                    name: 'isolated',
                    subnetType: ec2.SubnetType.ISOLATED
                }
            ]
        })

        this.transitGateway = new ec2.CfnTransitGateway(this, 'transit-gateway', {
            amazonSideAsn: props.amazonSideAsn,
            autoAcceptSharedAttachments: 'enable',
            defaultRouteTableAssociation: 'enable',
            defaultRouteTablePropagation: 'enable'
        })

        this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'transit-gateway-attachment', {
            transitGatewayId: this.transitGateway.ref,
            vpcId: this.vpc.vpcId,
            subnetIds: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId)
        })

        this.vpc.isolatedSubnets.forEach((subnet, index) =>
            new ec2.CfnRoute(this, `subnet-tgw-route-${index}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: '0.0.0.0/0',
                transitGatewayId: this.transitGateway.ref
            }))
    }
}
