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

let hours = 3
let minutes = 0

let myOffer = 0

let range_start = 1
let range_finish = 10000

let base_cooldown = 700



const offerInfo = (offerInfo, status) => {
    console.log('-----------------------------------------------------------------------------')
    console.log(`ID:`, `${offerInfo.tokenId}`.bold)
    console.log(`Name:`, `${offerInfo.name}`.bold)
    console.log(' ')
    if (status) {
        console.log(`Expiration:`, `${moment.utc(AdjustTime(moment()) * 1000).format('HH:mm:ss')}`.bold)
        console.log(`Your Offer (WETH):`, `${myOffer}`.bold)
        console.log(`Highest offer:`, `${offerInfo.highestOffer}`.bold)
        console.log(' ')
        console.log(`Floor price:`, `${offerInfo.floorPrice}`.bold)
        console.log(`Estimated profit:`, `${offerInfo.profit}`.bold)
        console.log(' ')
        console.log('Offer made!'.green.bold)
    } else {
        console.log(`Your Offer (WETH):`, `${myOffer}`.bold)
        console.log(`Highest offer:`, `${offerInfo.highestOffer}`.bold)
        console.log(' ')
        console.log(`Floor price:`, `${offerInfo.floorPrice}`.bold)
        console.log(' ')
        console.log('Offer too low.'.red.bold)
    }
    console.log('-----------------------------------------------------------------------------')
}







let end_time = moment().add(hours, 'hours').add(minutes, 'minutes')
const AdjustTime = (current_time) => {
    return end_time.diff(current_time, 'seconds')
}

const getHighestOffer = (data) => {
    let owner_address = data.owner.address
    let orders = data.orders
    let highest = 0
    for (let i = 0; i < orders.length; i++) {
        base_price = orders[i].base_price
        let ss = base_price.substr(0, base_price.length - 18)
        let se = base_price.substr(base_price.length - 18, base_price.length)
        base_price = Number(ss + '.' + se)

        order_maker_address = orders[i].maker.address
        if (base_price > highest && order_maker_address !== owner_address) highest = base_price
    }
    return highest
}





const skip = (asset) => {
    range_start++
    offerInfo(asset, false)
    setTimeout(() => {
        return MakeMultipleOffers()
    }, base_cooldown);
}





let error_count = 0
const AxiosErrorHandle = (err) => {
    if (error_count >= 10) exitProgram()
    error_count++
    console.log('Axios error'.red, `${err.message}`.yellow)
    hold_cooldown = hold_cooldown + 600
    range_start++
    setTimeout(() => {
        return MakeMultipleOffers()
    }, base_cooldown);
}

const OfferErrorHandle=(err)=>{
    if (error_count >= 10) exitProgram()
    console.log('Offer error'.red,`${err.message}`.yellow)
    if(err.message.substring(17,28) == 'Outstanding') exitProgram()
    hold_cooldown = hold_cooldown + 600
}


let first_pass = true

let floorPrice
let profit
const getFloorPrice = async () => {
    await axios({
        url: `https://api.opensea.io/api/v1/collection/sappy-seals/stats`,
        method: 'GET',
        headers: {
            "X-API-KEY": process.env.API_KEY
        }
    }).then(res => {
        floorPrice = res.data.stats.floor_price
        if(first_pass){
            myOffer = (floorPrice * 0.85) - 0.1
            first_pass = false
        }
        profit = (floorPrice * 0.85) - myOffer
        if (((floorPrice * 0.85) - myOffer) < 0.0999999) {
            console.log(`Floor price too low (${floorPrice})`.bgRed)
            console.log(`Estimaed return: ${(floorPrice * 0.85)-myOffer}`.bgRed)
            exitProgram()
        }
    }).catch(err=>{
        console.log(`Floor price error`.red, `${err.message}`.yellow)
    })
}


let hold_cooldown = base_cooldown
const accountAddress = process.env.WALLET_ADDRESS
const MakeMultipleOffers = async () => {

    let startAmount = myOffer
    setTimeout(() => {
        axios({
            url: `https://api.opensea.io/api/v1/asset/${contract_address}/${range_start}/`,
            method: 'GET',
            headers: {
                "X-API-KEY": process.env.API_KEY
            }
        }).then(async res => {
            console.log(hold_cooldown)
            let asset = res.data
            let assetInfo = {
                tokenId: asset.token_id,
                name: asset.name,
                myOffer: myOffer,
                expirationTime: moment.utc(AdjustTime(moment()) * 1000).format('HH:mm:ss'),
                highestOffer: getHighestOffer(asset),
                floorPrice: floorPrice,
                profit: profit
            }
                
            if ((range_start % 20) == 0) getFloorPrice()
            if (assetInfo.highestOffer >= myOffer) return skip(assetInfo)
         
            const offer = seaport.createBuyOrder({
                asset: {
                    tokenAddress: contract_address,
                    tokenId: range_start,
                },
                accountAddress,
                startAmount: startAmount,
                expirationTime: Math.round(Date.now() / 1000 + AdjustTime(moment()))
            }).catch(errOffer => {
                OfferErrorHandle(errOffer)
            })

            offerInfo(assetInfo, true)

            error_count = 0
            hold_cooldown = hold_cooldown - 25 > base_cooldown ? hold_cooldown - 25:base_cooldown
            if (range_start >= range_finish) exitProgram()
            range_start++

            return MakeMultipleOffers()


        })
        .catch(errAxios => {
            return AxiosErrorHandle(errAxios)
        })
    }, hold_cooldown)



}

const exitProgram = () => {
    process.exit(1)
}


getFloorPrice()
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