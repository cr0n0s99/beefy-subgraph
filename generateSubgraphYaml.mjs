import yaml from "js-yaml"
import fs from "fs"

import { getVaults } from "./getVaults.mjs";

const apiVersion = '0.0.4'
const outputFilename = './subgraph.yaml'

const vaults = await getVaults();

var mutableVaultsList = [];
var mutableVaultsCounter = 0;

for (const vault of vaults) {
  let currentVaultYaml = {
    kind: 'ethereum/contract',
    name: vault.id,
    network: 'bsc',
    source: {
      address: vault.earnedTokenAddress,
      abi: 'BeefyVaultV2',
      startBlock: 2612277,
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      entities: [
        'Vault',
        'Deposit',
        'Withdraw',
        'Harvest',
        'Transfer',
        'AccountVaultBalance',
        'Account',
        'Token'
      ],
      abis: [
        {
          name: 'BeefyVaultV2',
          file: './abis/BeefyVaultV2.json'
        },
        {
          name: 'Strategy',
          file: './abis/Strategy.json'
        },
        {
          name: 'ERC20',
          file: './abis/ERC20.json'
        }
      ],
      eventHandlers: [
        {
          event: 'Transfer(indexed address,indexed address,uint256)',
          handler: 'handleShareTransfer'
        }
      ],
      file: './src/mapping.ts'
    }
  }
  mutableVaultsList.push(currentVaultYaml)
  mutableVaultsCounter += 1
}

let subgraphYaml = {
  specVersion: '0.0.2',
  schema: {
    file: './schema.graphql'
  },
  dataSources: mutableVaultsList,
  templates: [
    {
      name: 'Strategy',
      kind: 'ethereum/contract',
      network: 'bsc',
      source: {
        abi: 'Strategy'
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: apiVersion,
        language: 'wasm/assemblyscript',
        file: './src/mapping.ts',
        entities: [
          'Vault',
          'Deposit',
          'Withdraw',
          'Harvest',
          'Transfer',
          'AccountVaultBalance',
          'Account',
          'Token'
        ],
        abis: [
          {
            name: 'Strategy',
            file: './abis/Strategy.json'
          }
        ],
        eventHandlers: [
          {
            event: 'StratHarvest(indexed address)',
            handler: 'handleHarvest'
          }
        ]
      }

    }
  ]
}

console.log('Generated YAML for', mutableVaultsCounter, 'vaults')
console.log('Writing out YAML to', outputFilename)

let yamlStr = yaml.safeDump(subgraphYaml)
fs.writeFileSync(outputFilename, yamlStr, 'utf8')


