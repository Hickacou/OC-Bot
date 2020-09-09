import { Message, MessageEmbed } from "discord.js";
import Command from "../../core/base/Command";
import OCBot from "../../core/base/Client";
import { formatDuration } from "../../core/lib/Time";

export = class extends Command {
	constructor(client: OCBot) {
		super(client, {
			name: "uptime",
			desc: "Displays bot's uptime",
			module: "OC Bot",
		});
	}

	public async setup(): Promise<void> { }

	public async exe(message: Message, args: string[]): Promise<void> {
		super.check(message, async () => {
			const embed: MessageEmbed = new MessageEmbed()
				.setDescription("⏱ " + formatDuration(new Date(), new Date(Date.now() + this.client.uptime), true) || "**Just started**")
				.setColor("GREEN")
			message.channel.send(embed);
		});
	}

}