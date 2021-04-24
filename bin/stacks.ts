#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NetworkStack } from '../lib/network-stack';
import { InstanceStack } from '../lib/instance-stack';
import { TgwPeeringStack } from '../lib/tgw-peering-stack';
import { TgwRouteStack } from '../lib/tgw-route-stack';

const app = new cdk.App();

const usEastEnv = { region: 'us-east-1' }
const usEastCidr = '172.16.0.0/24'

const euWestEnv = { region: 'eu-west-2' }
const euWestCidr = '172.16.1.0/24'

const usEastNetwork = new NetworkStack(app, 'network-us-east-1', {
  env: usEastEnv,
  cidr: usEastCidr,
  amazonSideAsn: 64512
})
const euWestNetwork = new NetworkStack(app, 'network-eu-west-2', {
  env: euWestEnv,
  cidr: euWestCidr,
  amazonSideAsn: 64513
})

const tgwPeering = new TgwPeeringStack(app, 'tgw-peering', {
  env: usEastEnv,
  transitGatewayId: usEastNetwork.transitGateway.ref,
  peerRegion: 'eu-west-2'
})
tgwPeering.node.addDependency(euWestNetwork)

const usEastTgwRoute = new TgwRouteStack(app, 'tgw-route-us-east-1', {
  env: usEastEnv,
  destinationCidrBlock: euWestCidr,
  transitGatewayId: usEastNetwork.transitGateway.ref,
})
usEastTgwRoute.node.addDependency(tgwPeering)
const euWestTgwRoute = new TgwRouteStack(app, 'tgw-route-eu-west-2', {
  env: euWestEnv,
  destinationCidrBlock: usEastCidr,
  transitGatewayId: euWestNetwork.transitGateway.ref,
})
euWestTgwRoute.node.addDependency(tgwPeering)

const cidrIpToAllowPingFrom = '172.16.0.0/16'
new InstanceStack(app, 'instance-us-east-1', {
  env: usEastEnv,
  vpc: usEastNetwork.vpc,
  cidrIpToAllowPingFrom
})
new InstanceStack(app, 'instance-eu-west-2', {
  env: euWestEnv,
  vpc: euWestNetwork.vpc,
  cidrIpToAllowPingFrom
})
