import * as c from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkStackProps extends cdk.StackProps {
    cidr: string
    amazonSideAsn: number
}

export class NetworkStack extends cdk.Stack {

    readonly vpc: ec2.Vpc
    readonly transitGateway: ec2.CfnTransitGateway
    readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment

    constructor(scope: c.Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'vpc', {
            cidr: props.cidr,
            maxAzs: 1,
            subnetConfiguration: [
                {
                    cidrMask: 27,
                    name: 'isolated',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }
            ]
        })

        this.transitGateway = new ec2.CfnTransitGateway(this, 'transit-gateway', {
            amazonSideAsn: props.amazonSideAsn,
            autoAcceptSharedAttachments: 'enable',
            defaultRouteTableAssociation: 'enable',
            defaultRouteTablePropagation: 'enable',
            tags: [{ key: 'type', value: 'multiregion-network' }]
        })

        this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'transit-gateway-attachment', {
            transitGatewayId: this.transitGateway.ref,
            vpcId: this.vpc.vpcId,
            subnetIds: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId)
        })

        this.vpc.isolatedSubnets.forEach((subnet, index) => {
            const route = new ec2.CfnRoute(this, `subnet-tgw-route-${index}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: '0.0.0.0/0',
                transitGatewayId: this.transitGateway.ref
            })
            route.node.addDependency(this.transitGatewayAttachment)
        })

        const stack = cdk.Stack.of(this);
        [
            { id: 'ssm', service: `com.amazonaws.${stack.region}.ssm` },
            { id: 'ec2-messages', service: `com.amazonaws.${stack.region}.ec2messages` },
            { id: 'ssm-messages', service: `com.amazonaws.${stack.region}.ssmmessages` },
        ].forEach(it =>
            new ec2.InterfaceVpcEndpoint(this, it.id, {
                service: new ec2.InterfaceVpcEndpointService(it.service),
                privateDnsEnabled: true,
                vpc: this.vpc
            }))
    }
}
