import { Message, MessageEmbed } from "discord.js";
import OCBot from "../../core/base/Client";
import Command from "../../core/base/Command";
import nodeFetch from "node-fetch";
import AudioPlayer from "../../core/base/AudioPlayer";
import { AllHtmlEntities } from "html-entities";
import { formatDuration, formatTinyDuration } from "../../core/lib/Time";
export = class extends Command {
	constructor(client: OCBot) {
		super(client, {
			name: "play",
			desc: "Plays a youtube video in voice channel from url or name",
			module: "Music",
			usages: [
				"[video: String]"
			],
		});
	}

	public async setup(): Promise<void> { }

	public async exe(message: Message, args: string[]): Promise<void> {
		this.check(message, async () => {
			const query: string = args.join(" ").trim();
			var player: AudioPlayer;
			if (this.client.audioPlayers.has(message.guild.id)) player = this.client.audioPlayers.get(message.guild.id);
			if (!query) {
				if (!player) {
					this.error("Nothing is playing in this server", message.channel);
					return;
				}
				if (player.paused) {
					if (!message.guild.me.voice.channel) {
						if (!player.channel.joinable || !player.channel.speakable) {
							this.error("I can't join this voice channel.", message.channel);
							this.client.audioPlayers.delete(message.guild.id);
							return;
						}
						return;
					}
					player.resume();
					message.channel.send("▶ **Resumed**");
					return;
				}
				else {
					this.error("The player isn't paused.", message.channel);
					return;
				}
			}
			if (!message.member.voice.channel) {
				this.error("You must be connected to a voice channel to use this command.", message.channel);
				return;
			}
			if (!message.member.voice.channel.joinable) {
				this.error("I can't join this voice channel.", message.channel);
				return;
			}
			if (!message.member.voice.channel.speakable) {
				this.error("I can't play audio to this voice channel.", message.channel);
				return;
			}
			if (player && player.channel !== message.member.voice.channel) {
				this.error("You must be in the same voice channel as I am to use this command.", message.channel);
				return;
			}
			if (!player) {
				player = new AudioPlayer(this.client, message.member.voice.channel);
				this.client.audioPlayers.set(message.guild.id, player);
			}
			try {
				await player.join();
			} catch (err) {
				this.error("An error occured", message.channel, err);
				return;
			}
			const search: any = await nodeFetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&type=video&key=${process.env.YOUTUBE_API_KEY}`);
			const searchResults: any = await search.json();
			if (searchResults.items && searchResults.items.length == 0) {
				this.error(`No result found for **${query}** on YouTube`, message.channel);
				return;
			}
			const vidID: string = searchResults.items[0].id.videoId;
			const vidTitle: string = AllHtmlEntities.decode(searchResults.items[0].snippet.title);
			const imgUrl: string = searchResults.items[0].snippet.thumbnails.high.url;

			const video: any = await nodeFetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${vidID}&key=${process.env.YOUTUBE_API_KEY}`);
			const videoDetails: any = await video.json();
			const isoDuration = videoDetails.items[0].contentDetails.duration;
			const secs = (/(\d+)S/.test(isoDuration)) ? parseInt(/(\d+)S/.exec(isoDuration)[1]) : 0;
			const mins = (/(\d+)M/.test(isoDuration)) ? parseInt(/(\d+)M/.exec(isoDuration)[1]) : 0;
			const hours = (/(\d+)H/.test(isoDuration)) ? parseInt(/(\d+)H/.exec(isoDuration)[1]) : 0;
			const duration: number = secs * 1000 + mins * 1000 * 60 + hours * 1000 * 60 * 60;
			if (duration > 1.8e7) {
				this.error("Can't play a song that is longer than 5 hours", message.channel);
				return;
			}
			const display: string = formatTinyDuration(duration);
			player.queueAdd({
				displayDuration: display,
				duration: duration,
				imgUrl: imgUrl,
				requestedBy: message.member,
				title: vidTitle,
				url: "https://youtube.com/watch?v=" + vidID
			});
			if (!player.playing) {
				player.play(player.queue.shift());
				message.channel.send("▶ Now playing: **" + vidTitle + "**");
				return;
			}
			const embed: MessageEmbed = new MessageEmbed()
				.setAuthor("Queued", message.author.avatarURL())
				.setDescription(`**[${vidTitle}](https://youtube.com/watch?v=${vidID})**`)
				.setImage(imgUrl)
				.addField("Channel", searchResults.items[0].snippet.channelTitle, true)
				.addField("Position in queue", player.queue.length, true)
				.addField("Duration", display, true);
			message.channel.send(embed);
		});
	}

}