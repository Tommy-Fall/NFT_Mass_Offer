require('dotenv').config()
const axios = require('axios')
const moment = require('moment')
const colors = require('colors')
const fs = require('fs')
const { OpenSeaPort, Network } = require('opensea-js')

const MnemonicWalletSubprovider = require("@0x/subproviders").MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");

const BASE_DERIVATION_PATH = `44'/60'/0'/0`;
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
    mnemonic: process.env.PRIVATE_KEY,
    baseDerivationPath: BASE_DERIVATION_PATH,
})

const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: process.env.INFURA,
})

const providerEngine = new Web3ProviderEngine()
providerEngine.addProvider(mnemonicWalletSubprovider)
providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.start()


const seaport = new OpenSeaPort(providerEngine, {
    networkName: Network.Main,
    apiKey: process.env.API_KEY
})


// S = 412
// XL = 1075
// M = 2193
// S = 2558
// XL = 3646
// M = 5000


// let S = 2.42
// let M = 3.32
// let XL = 3

// function msToTime(s) {
//     var ms = s % 1000;
//     s = (s - ms) / 1000;
//     var secs = s % 60;
//     s = (s - secs) / 60;
//     var mins = s % 60;
//     var hrs = (s - mins) / 60;

//     return hrs + ':' + mins + ':' + secs + '.' + ms;
// }

// if (OI > 0 && OI <= 412) {
//     startAmount = S
// } else if (OI > 412 && OI <= 1075) {
//     startAmount = XL
// } else if (OI > 1075 && OI <= 2193) {
//     startAmount = M
// } else if (OI > 2193 && OI <= 2558) {
//     startAmount = S
// } else if (OI > 2558 && OI <= 3646) {
//     startAmount = XL
// } else if (OI > 3646 && OI <= 5000) {
//     startAmount = M
// }


let contract_address = '0x364c828ee171616a39897688a831c2499ad972ec'

let hours = 2
let minutes = 0

let myOffer = 1.05

let range_start = 66
let range_finish = 10000





const offerInfo = (offerInfo) => {
    console.log('-----------------------------------------------------------------------------')
    console.log(`ID:`, `${offerInfo.tokenId}`.bold)
    console.log(`Name:`, `${offerInfo.name}`.bold)
    console.log(`My Offer: `, `${offerInfo.myOffer}`.bold)
}



let end_time = moment().add(hours, 'hours').add(minutes, 'minutes')
const AdjustTime = (current_time) => {
    return end_time.diff(current_time, 'seconds')
}

let error_count = 0
const errorHandle = (err) => {
    if (error_count >= 10) exitProgram()
    error_count++
    console.log(err)
    range_start++
    setTimeout(() => {
        return MakeMultipleOffers()
    }, 3000);
}

let time = 600
const accountAddress = process.env.WALLET_ADDRESS
const MakeMultipleOffers = async () => {

    let startAmount = myOffer
    setTimeout(() => {
        
            const offer = seaport.createBuyOrder({
                asset: {
                    tokenAddress: contract_address,
                    tokenId: range_start,
                },
                accountAddress,
                startAmount: startAmount,
                expirationTime: Math.round(Date.now() / 1000 + AdjustTime(moment()))
            }).catch(err=>{
                console.log(err)

            })

            // console.log(offer)
            // offerInfo(assetInfo, true)
            console.log("Offer made "+ range_start)


            error_count = 0
            if (range_start >= range_finish) exitProgram()
            range_start++

            return MakeMultipleOffers()
        
    }, time)



}

const exitProgram = () => {
    process.exit(1)
}



MakeMultipleOffers()















assets = [
    {
        tokenAddress: '0xc8adfb4d437357d0a656d4e62fd9a6d22e401aa0',
        tokenId: '1',
    },
]

const MakeOffer = async () => {
    const accountAddress = process.env.WALLET_ADDRESS
    try {
        const offer = await seaport.createBundleBuyOrder({
            assets,
            accountAddress,
            startAmount: 0.00001,
            expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * 1)
        })
        if (offer) {
            console.log('-----------------------------------------------------------------------------')
            console.log(`ID: ${offer.asset.tokenId}`)
            console.log(`Name: ${offer.asset.name}`)
            console.log(`Wrapped Ether Offer: ${startAmount}`)
            console.log('-----------------------------------------------------------------------------')
        }
    } catch (err) {
        console.log(err)
    }


}

// MakeOffer()

























let start = 3994
let finish = 5000

let counter = start

const loop = () => {
    setTimeout(() => {
        axios({
            url: `https://api.opensea.io/api/v1/asset/0x913ae503153d9a335398d0785ba60a2d63ddb4e2/${counter}/`,
            method: 'GET',
            headers: {
                "X-API-KEY": process.env.API_KEY
            }
        }).then(res => {


            let obj = {
                "tokenId": res.data.token_id,
                "size": res.data.traits[0].value
            }

            assets.parcels.push(obj)

            fs.writeFile('./parcels.json', JSON.stringify(assets), 'utf-8', function (err) {
                if (err) throw err
                console.log(obj)
                if (counter >= finish) {
                    return
                } else {
                    counter++
                    loop()
                }
            })


        })

    }, 50);

}


let Scounter = 0
let Mcounter = 0
let XLcounter = 0

const test = async () => {
    await fs.readFile('./parcels.json', 'utf-8', function (err, data) {
        if (err) throw err
        let test = JSON.parse(data)
        for (let i = 0; i < test.parcels.length; i++) {
            if (test.parcels[i].size == 'S') {
                Scounter++
                // console.log(Scounter)

            } else if (test.parcels[i].size == 'M') {
                Mcounter++
                // console.log(Mcounter)

            } else if (test.parcels[i].size == 'XL') {
                XLcounter++
                console.log(XLcounter)
            }

        }
    })
}
// test()