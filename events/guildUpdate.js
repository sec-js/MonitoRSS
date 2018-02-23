const fileOps = require('../util/fileOps.js')
const currentGuilds = require('../util/storage.js').currentGuilds

module.exports = (bot, oldGuild, newGuild) => {
  if (!currentGuilds.get(oldGuild.id)) return
  const guildRss = currentGuilds.get(oldGuild.id)
  guildRss.name = newGuild.name
  fileOps.updateFile(guildRss)
}
