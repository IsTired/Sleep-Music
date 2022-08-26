const Discord = require("discord.js")
const { EmbedBuilder, DiscordAPIError } = require('discord.js');
const { SpotifyPlugin } = require('@distube/spotify')
const client = new Discord.Client({ 
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates",
        "MessageContent",
    ]
});


//require things from config
//const token = require(config.json).token


//DisTube Stuffs
const { DisTube, Queue } = require("distube");

client.DisTube = new DisTube(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
        new SpotifyPlugin({
          emitEventsAfterFetching: true
        })]
})



//know when bot is on
client.on("ready", () =>{
    console.log("Bot is ready to play music!!")
})



//message -> event -> event happen
client.on("messageCreate", message => {
    if (message.author.bot || !message.guild) return;
    const prefix = "::"//prefix to use

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift();





    //help
    if (message.content === `${prefix}help`) {
        const helpEmbed = new EmbedBuilder()
            .setColor('DarkGold')
            .setTitle('Help')
            .setDescription('The default prefix is **-**\n\n')
            .addFields(
                { name: 'play <song name>', value: 'Bot joins vc and plays listed song, can add more than 1' },
                { name: 'stop', value: 'stops player' },
                { name: 'pause', value: 'pauses the player can be unpaused' },
                { name: 'resume / unpause', value: 'unpauses the player' },
                { name: 'loop', value: 'loops the current song until stopped' },
                { name: 'skip', value: 'skips current song to next song in player' },
                { name: 'queue', value: 'shows the entire queue' },
                { name: 'leave', value: 'disconnects bot from vc' }
                )
        message.reply({ embeds: [helpEmbed] })
    }


    //customization




    //MAIN COMMANDS

    //embed for if person not in vc
    const not_VC = new EmbedBuilder()
        .setColor('Red')
        .setDescription('You must be in a VC to run this command')

    if (!message.content.toLowerCase().startsWith("::")) return;

    //play
    if (!message.member.voice.channel) return message.channel.send({embeds: [not_VC]});
    else if (command === "play" ) {
        client.DisTube.play(message.member.voice.channel, args.join(" "), {
            member: message.member,
            textChannel: message.channel,
            message
        })
        console.log("Song playing")
        message.react("✅")
    }  
    
    
    //stop
    if (command === "stop") {
        client.DisTube.stop(message);
        console.log("Stopping player")
        message.react("✅")

        const stop = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Stopping player')
        message.channel.send({embeds: [stop]})
        
    }

    //loop / repeat
    if (command === "loop") {
		client.DisTube.setRepeatMode(message)
        message.react("✅")
        console.log("Looping Currnt Song")

        const loop = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Looping current song')
        message.channel.send({embeds: [loop]})
	}

    //pause
    if (command === "pause") {
        client.DisTube.pause(message)
        message.react("✅")
        console.log("Paused")

        const pause = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Pausing current song')
        message.channel.send({embeds: [pause]})
    }

    //resume
    if (command === "resume") {
        client.DisTube.resume(message)
        message.react("✅")
        console.log("Resuming")

        const resume = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Resuming the player')
        message.channel.send({embeds: [resume]})
    }

    //skip
    if (command === "skip") {
        client.DisTube.skip(message)
        message.react("✅")
        console.log("Skipping")

        const skipEmbed = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Skiping current song')
        message.channel.send({ embeds: [helpEmbed] })
    }

    //show queue
    if (command === "queue") {
        const queue = client.DisTube.getQueue(message);
        if (!queue) {
            message.channel.send("Nothing in queue at the moment!")
        } else {
            const Queue = new EmbedBuilder()
                .setColor('DarkPurple')
                .setTitle('The current queue:')
                .setDescription(`Current queue:\n${queue.songs
                    .map(
                        (song, id) =>
                            `**${id ? id : 'Playing'}**. ${
                                song.name
                            } - \`${song.formattedDuration}\``,
                    )
                    .slice(0, 10)
                    .join('\n')}`,)

            message.channel.send({ embeds: [Queue] })
        }
        
    }

    //leave
    if (command === "leave") {
        client.DisTube.disconnect(message)
        message.react("✅")
        console.log("Leaving VC")

        const leave = new EmbedBuilder()
            .setColor('DarkPurple')
            .setDescription('Leaving')
        message.channel.send({embeds: [leave]})
    }

    //filter test
    if (command === "filter") {
        const queue = client.DisTube.getQueue(message)
        if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
        const filter = args[0]
        if (filter === 'off' && queue.filters.size) queue.filters.clear()
        else if (Object.keys(client.DisTube.filters).includes(filter)) {
          if (queue.filters.has(filter)) queue.filters.remove(filter)
          else queue.filters.add(filter)
        } else if (args[0]) return message.channel.send(`Not a valid filter`)
        message.channel.send(`Current Queue Filter: \`${queue.filters.names.join(', ') || 'Off'}\``)
    }


    //varients of commands above
    


})

client.DisTube.setMaxListeners(100)


client.DisTube
.on('playSong', (queue, song) =>
		queue.textChannel?.send(
			`Playing \`${song.name}\` - \`${
				song.formattedDuration
			}`,
		),
	)
	.on('addSong', (queue, song) =>
		queue.textChannel?.send(
			`Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`,
		),
	)
	.on('addList', (queue, playlist) =>
		queue.textChannel?.send(
			`Added \`${playlist.name}\` playlist (${
				playlist.songs.length
			} songs) to queue`,
		),
	)
	.on('error', (textChannel, e) => {
		console.error(e);
		textChannel.send(
			`An error encountered: ${e.message.slice(0, 2000)}`,
		);
	})
	.on('finish', queue => queue.textChannel?.send('Finish queue!'))
	
	.on('disconnect', queue =>
		queue.textChannel?.send('Disconnected!'),
	)
	.on('empty', queue =>
		queue.textChannel?.send(
			'The voice channel is empty! Leaving the voice channel...',
		),
	)
	.on('searchResult', (message, result) => {
		let i = 0;
		message.channel.send(
			`**Choose an option from below**\n${result
				.map(
					song =>
						`**${++i}**. ${song.name} - \`${
							song.formattedDuration
						}\``,
				)
				.join(
					'\n',
				)}\n*Enter anything else or wait 30 seconds to cancel*`,
		);
	})
	.on('searchCancel', message => {
        const cancel = new EmbedBuilder()
            .setDescription('Search canceled!')
            .setColor('DarkRed')
        message.channel.send({embeds: cancel})
    }
	)
	.on('searchInvalidAnswer', message => {

    })
	.on('searchNoResult', message =>
		message.channel.send('No result found!'),
	)
	.on('searchDone', () => {});
 



client.login(token)
