import * as aws from 'aws-sdk';
import { TransitGatewayPeeringAttachment } from 'aws-sdk/clients/ec2';

const ec2 = new aws.EC2()

interface IsCompleteEvent {
    RequestType: string
    PhysicalResourceId: string
}

interface IsCompeteResponse {
    IsComplete: boolean
}

export const isComplete = async (event: IsCompleteEvent): Promise<IsCompeteResponse> => {
    console.log("event: ", JSON.stringify(event, null, 2))

    switch (event.RequestType) {
        case 'Create':
            return isTgwPeeringCreated(event)
        case 'Delete':
            return isTgwPeeringDeleted(event)
        default:
            throw Error(`${event.RequestType} is not supported`)
    }
}

async function isTgwPeeringCreated(event: IsCompleteEvent): Promise<IsCompeteResponse> {

    const tgwPeeringAttachment = await getTgwPeeringAttachment(event)

    console.log(`transit gateway peering state: ${tgwPeeringAttachment?.State}`)

    switch (tgwPeeringAttachment?.State) {
        case 'available':
            return {
                IsComplete: true
            }
        case 'pendingAcceptance': {
            await acceptTgwPeering(event.PhysicalResourceId, tgwPeeringAttachment.AccepterTgwInfo?.Region)
            return {
                IsComplete: false
            }
        }
        case 'failed':
            throw Error('failed to create transit gateway peering')
        default:
            return {
                IsComplete: false
            }
    }
}

async function isTgwPeeringDeleted(event: IsCompleteEvent): Promise<IsCompeteResponse> {

    const tgwPeeringAttachment = await getTgwPeeringAttachment(event)

    let isComplete = false
    if (!tgwPeeringAttachment || tgwPeeringAttachment.State === 'deleted') {
        isComplete = true
    }

    return {
        IsComplete: isComplete
    }
}

async function getTgwPeeringAttachment(event: IsCompleteEvent): Promise<TransitGatewayPeeringAttachment | undefined> {
    const tgwPeeringAttachments = await ec2.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [event.PhysicalResourceId]
    }).promise()

    return tgwPeeringAttachments.TransitGatewayPeeringAttachments?.find(_ => true)
}

async function acceptTgwPeering(tgwAttachmentId: string, accepterRegion?: string): Promise<void> {
    const peerEc2 = new aws.EC2({ region: accepterRegion })

    try {
        const acceptResponse = await peerEc2.acceptTransitGatewayPeeringAttachment({
            TransitGatewayAttachmentId: tgwAttachmentId
        }).promise()
        console.log(`accepted transit gateway peering`)
        console.log(`transit gateway peering state: ${acceptResponse.TransitGatewayPeeringAttachment?.State}`)
    } catch (err) {
        if ('IncorrectState' === (err as aws.AWSError).code) {
            console.log(`accept action has been done already`)
        } else {
            throw err
        }
    }

}
