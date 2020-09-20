import { Message } from "discord.js";
import OCBot from "../../core/base/Client";
import Command from "../../core/base/Command";
import AudioPlayer from "../../core/base/AudioPlayer";

export = class extends Command {
	constructor(client: OCBot) {
		super(client, {
			name: "pause",
			desc: "Pauses currently playing audio",
			module: "Music"
		});
	}

	public async setup(): Promise<void> { }

	public async exe(message: Message, args: string[]): Promise<void> {
		this.check(message, async () => {
			var player: AudioPlayer;
			if (this.client.audioPlayers.has(message.guild.id)) player = this.client.audioPlayers.get(message.guild.id);
			if (player.paused) {
				this.error("The player is already paused", message.channel);
				return;
			}
			if (!player || !player.playing) {
				this.error("Nothing is playing in this server", message.channel);
				return;
			}
			player.pause();
			message.channel.send("⏸ **Paused**");
		});
	}
}