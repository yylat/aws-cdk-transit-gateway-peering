import * as c from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';

export interface TgwRouteStackProps extends cdk.StackProps {
    destinationCidrBlock: string
    transitGatewayId: string
}

export class TgwRouteStack extends cdk.Stack {

    readonly transitGatewayRoute: ec2.CfnTransitGatewayRoute

    constructor(scope: c.Construct, id: string, props: TgwRouteStackProps) {
        super(scope, id, props);

        const parameters = {
            Filters: [{ Name: 'transit-gateway-id', Values: [props.transitGatewayId] }]
        }

        const tgwRouteTableIdResource = new cr.AwsCustomResource(this, 'transit-gateway-route-table-id-resource', {
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
            }),
            onCreate: {
                service: 'EC2',
                action: 'describeTransitGateways',
                parameters,
                physicalResourceId: cr.PhysicalResourceId.of('transit-gateway-route-table-id-resource')
            }
        })
        const tgwRouteTableId = tgwRouteTableIdResource.getResponseField('TransitGateways.0.Options.AssociationDefaultRouteTableId')

        const tgwAttachmentIdResource = new cr.AwsCustomResource(this, 'transit-gateway-attachment-id-resource', {
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
            }),
            onCreate: {
                service: 'EC2',
                action: 'describeTransitGatewayPeeringAttachments',
                parameters,
                physicalResourceId: cr.PhysicalResourceId.of('transit-gateway-attachment-id-resource')
            }
        })
        const tgwAttachmentId = tgwAttachmentIdResource.getResponseField('TransitGatewayPeeringAttachments.0.TransitGatewayAttachmentId')

        this.transitGatewayRoute = new ec2.CfnTransitGatewayRoute(this, 'transit-gateway-route', {
            destinationCidrBlock: props.destinationCidrBlock,
            transitGatewayRouteTableId: tgwRouteTableId,
            transitGatewayAttachmentId: tgwAttachmentId
        })
    }
}
