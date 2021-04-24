import * as lambda from 'aws-lambda';
import * as aws from 'aws-sdk';

const ec2 = new aws.EC2()

export const onEvent = async (event: lambda.CloudFormationCustomResourceEvent) => {
    console.log("event: ", JSON.stringify(event, null, 2))

    switch (event.RequestType) {
        case 'Create':
            return createTgwPeeringAttachment(event)
        case 'Delete':
            return deleteTgwPeeringAttachment(event)
        default:
            throw Error(`${event.RequestType} is not supported`)
    }
}

async function createTgwPeeringAttachment(event: lambda.CloudFormationCustomResourceEvent) {

    const tgwId = event.ResourceProperties.TransitGatewayId
    const peerRegion = event.ResourceProperties.PeerRegion
    const peerAccountId = event.ResourceProperties.PeerAccountId
    const peerTgwId = await getTgwId(peerRegion)

    const tgwPeeringAttachment = await ec2.createTransitGatewayPeeringAttachment({
        TransitGatewayId: tgwId,
        PeerTransitGatewayId: peerTgwId,
        PeerAccountId: peerAccountId,
        PeerRegion: peerRegion
    }).promise()

    const tgwPeeringAttachmentId = tgwPeeringAttachment.TransitGatewayPeeringAttachment?.TransitGatewayAttachmentId
    if (!tgwPeeringAttachmentId) {
        throw Error(`failed to create transit gateway peering attachment`)
    }

    return {
        PhysicalResourceId: tgwPeeringAttachmentId
    }
}

async function deleteTgwPeeringAttachment(event: lambda.CloudFormationCustomResourceDeleteEvent) {
    await ec2.deleteTransitGatewayPeeringAttachment({
        TransitGatewayAttachmentId: event.PhysicalResourceId
    }).promise()
}

async function getTgwId(region: string): Promise<string> {
    const ec2 = new aws.EC2({ region: region })

    const tgws = await ec2.describeTransitGateways({
        Filters: [{ Name: 'tag:type', Values: ['multiregion-network'] }]
    }).promise()

    const tgwId = tgws.TransitGateways?.find(_ => true)?.TransitGatewayId
    if (!tgwId) {
        throw Error(`no transit gateway id param in ${region}`)
    }

    return tgwId
}
