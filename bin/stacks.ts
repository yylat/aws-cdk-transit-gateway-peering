#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NetworkStack } from '../lib/network-stack';
import { InstanceStack } from '../lib/instance-stack';

const app = new cdk.App();

const usEastEnv = { region: 'us-east-1' }
const euWestEnv = { region: 'eu-west-2' }

const usEastNetwork = new NetworkStack(app, 'network-us-east-1', {
  env: usEastEnv,
  cidr: '172.16.0.0/24',
  amazonSideAsn: 64512
})
const usEastInstance = new InstanceStack(app, 'instance-us-east-1', {
  env: usEastEnv,
  vpc: usEastNetwork.vpc,
  cidrIpToAllowPingFrom: '172.16.0.0/16'
})

const euWestNetwork = new NetworkStack(app, 'network-eu-west-2', {
  env: euWestEnv,
  cidr: '172.16.1.0/24',
  amazonSideAsn: 64513
})
const euWestInstance = new InstanceStack(app, 'instance-eu-west-2', {
  env: euWestEnv,
  vpc: euWestNetwork.vpc,
  cidrIpToAllowPingFrom: '172.16.0.0/16'
})
