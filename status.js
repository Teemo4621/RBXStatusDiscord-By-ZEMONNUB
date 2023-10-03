const Discord = require('discord.js-selfbot-v13');
const exec = require('child_process').exec;
require("dotenv").config();

const keepAlive = require('./server.js');
keepAlive();

const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false
});

client.on("ready", async () => {
    console.clear()
    console.log(`${client.user.username} - LoadDataSuccess!`);

    function isRunning(win){
      return new Promise(function(resolve, reject){
          const plat = process.platform
          const cmd = "tasklist"
          const proc = plat == 'win32' ? win : ""
          if(cmd === '' || proc === ''){
              resolve(false)
          }
          exec(cmd, function(err, stdout, stderr) {
              resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
          })
      })
    }

    async function getRBXStatus() {
      var headers = {
          'Content-Type': 'application/json',
          "Cookie": ".ROBLOSECURITY=" + process.env.COOKIE,
      }
  
      const reqticket = await fetch("https://auth.roblox.com/v1/authentication-ticket", { method: "POST", headers })
      const csrf = await reqticket.headers.get("X-CSRF-TOKEN");
  
      var headers = {
          'Content-Type': 'application/json',
          "Cookie": ".ROBLOSECURITY=" + process.env.COOKIE,
          "X-CSRF-TOKEN": csrf
      }
  
      const data = JSON.stringify({"userIds": [process.env.RBXUSERID]})
      const reqstatus = await fetch("https://presence.roblox.com/v1/presence/users", { method: "POST", headers, body: data})
      
      const responseJson = await reqstatus.json();
      
      if (responseJson && reqstatus.status == 200 && responseJson.userPresences[0].placeId != null) {
          const lastLocation = responseJson.userPresences[0].lastLocation
          const rootPlaceId = responseJson.userPresences[0].rootPlaceId
          const gameId = responseJson.userPresences[0].gameId
          
          return { lastLocation, rootPlaceId, gameId };
      } else {
          return null;
      }
    }

    async function getGamename(placeId) {
      var headers = {
          'Content-Type': 'application/json',
          "Cookie": ".ROBLOSECURITY=" + process.env.COOKIE,
      }
      const req = await fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`, { method: "GET", headers })
      if (req.status == 200) {
          const res = await req.json()
          const gamename = res[0].name
          const gameurl = res[0].url
          const reqimage = await fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`, {method: "GET", headers})
          const resimage = await reqimage.json()
          const gameimage = resimage.data[0].imageUrl;
          return {gamename, gameurl, gameimage}
      } else {
          return null
      }
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

    while (true) {
      const status = await getRBXStatus()
      var mode = null
      if (status) {
        mode = "Roblox"
        const gameinfo = await getGamename(status.rootPlaceId)
        const imageSet = await Discord.RichPresence.getExternal(client, '820344593357996092', gameinfo.gameimage)
        var r = new Discord.RichPresence()
          .setType("PLAYING")
          .setApplicationId("820344593357996092")
          .setState(`GameId: ${status.gameId}`)
          .setName('Roblox')
          .setDetails(`🎪Map: ${gameinfo.gamename}`)
          .setAssetsLargeImage(`${imageSet[0].external_asset_path}`) //You can put links in tenor or discord and etc.
          .setAssetsLargeText(`ᴅᴇᴠʙʏ: ᴢᴇᴍᴏɴɴᴜʙ`)
          .setAssetsSmallImage('https://cdn.discordapp.com/attachments/1106802842192326717/1106865289880158228/Png.png?ex=651d26a1&is=651bd521&hm=1e82d295472ba5dc5feb81a492aed8fb0e34f1d04cef24572088994404eefef4&')
          .setAssetsSmallText("ᴍʏᴘʀᴏғɪʟᴇ: ᴏᴛᴇᴍᴏᴋᴜɴɢᴏ")
          .addButton("JoinGame", `roblox://placeId=${status.rootPlaceId}`)
          .addButton("MyProfile", "https://www.roblox.com/users/1109741490/profile")
      } else {
          mode = "Sleep"
          var r = new Discord.RichPresence()
            .setType("PLAYING")
            //.setURL('Your Twitch URL') //Must be a youtube video link 
            .setState(`สถานะ: ${isRunning("Code.exe") ? "เขียนโค้ดอยู่ 💻" : "นอน 🛌"}`)
            .setName('นอนอ้วง')
            .setDetails("มีอะไรเร่งด่วน DM มาได้เลยงับ")
            .setAssetsLargeImage('https://cdn.discordapp.com/attachments/1106802842192326717/1135609998932713593/image.png?ex=651ce9fa&is=651b987a&hm=8ba53a47e7c5006f2ad571132b19ed7532bd4c002936ec2f7e0424fe13b5be0e&') //You can put links in tenor or discord and etc.
            .setAssetsLargeText('ZEMONNUB♟')
            .setAssetsSmallImage('https://cdn.discordapp.com/attachments/1106802842192326717/1106843223130914886/image_processing20210909-16731-1cghxf8.gif?ex=651d1214&is=651bc094&hm=8a8a8be423e23426c992eb1d0acf00a057b9a6e9d62e63c48dc021d08c7d9076&Small')
            .setAssetsSmallText("DS: ZEMONDEV | SERVER")
      }
      client.user.setActivity(r);
      await delay(30 * 1000)
    }
})

client.login(process.env.TOKEN);