import * as c from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface TgwPeeringStackProps extends cdk.StackProps {
    transitGatewayId: string
    peerRegion: string
}

export class TgwPeeringStack extends cdk.Stack {

    readonly transitGatewayPeering: cdk.CustomResource

    constructor(scope: c.Construct, id: string, props: TgwPeeringStackProps) {
        super(scope, id, props);

        const provider = new cr.Provider(this, 'transit-gateway-peering-provider', {
            onEventHandler: this.createOnEventHandler(),
            isCompleteHandler: this.createIsCompleteHandler(),
            queryInterval: cdk.Duration.seconds(30)
        })

        this.transitGatewayPeering = new cdk.CustomResource(this, 'transit-gateway-peering', {
            serviceToken: provider.serviceToken,
            resourceType: 'Custom::TransitGatewayPeering',
            properties: {
                TransitGatewayId: props.transitGatewayId,
                PeerRegion: props.peerRegion,
                PeerAccountId: cdk.Stack.of(this).account
            }
        })
    }

    private createOnEventHandler(): lambda.Function {
        const stack = cdk.Stack.of(this)

        const describeTgwsPolicy = new iam.PolicyStatement({
            resources: ['*'],
            actions: ['ec2:DescribeTransitGateways']
        })

        const tgwPeeringAttachmentPolicy = new iam.PolicyStatement({
            resources: [`arn:${stack.partition}:ec2:*:${stack.account}:transit-gateway*`],
            actions: [
                'ec2:CreateTransitGatewayPeeringAttachment',
                'ec2:DeleteTransitGatewayPeeringAttachment'
            ]
        })

        return new lambda.Function(this, 'transit-gateway-peering-handler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(`${__dirname}/../dist/lib/lambda/on-event`),
            handler: 'handler.onEvent',
            initialPolicy: [describeTgwsPolicy, tgwPeeringAttachmentPolicy]
        })
    }

    private createIsCompleteHandler(): lambda.Function {
        const stack = cdk.Stack.of(this)

        const describeTgwPeeringAttachmentsPolicy = new iam.PolicyStatement({
            resources: ['*'],
            actions: ['ec2:DescribeTransitGatewayPeeringAttachments']
        })

        const acceptTgwPeeringAttachmentPolicy = new iam.PolicyStatement({
            resources: [`arn:${stack.partition}:ec2:*:${stack.account}:transit-gateway-attachment*`],
            actions: ['ec2:AcceptTransitGatewayPeeringAttachment']
        })

        return new lambda.Function(this, 'transit-gateway-peering-completion-handler', {
            runtime: lambda.Runtime.NODEJS_22_X,
            code: lambda.Code.fromAsset(`${__dirname}/../dist/lib/lambda/is-complete`),
            handler: 'handler.isComplete',
            initialPolicy: [describeTgwPeeringAttachmentsPolicy, acceptTgwPeeringAttachmentPolicy]
        })
    }
}
