import { Message, MessageEmbed } from "discord.js";
import Command from "../../core/base/Command";
import OCBot from "../../core/base/Client";

export = class extends Command {
	constructor(client: OCBot) {
		super(client, {
			name: "embed",
			desc: "Makes the bot send an embed (Admin only)",
			module: "OC Bot",
			usages: [
				"<options: Object>"
			],
		});
	}

	public async setup(): Promise<void> { }

	public async exe(message: Message, args: string[]): Promise<void> {
		super.check(message, () => {
			try {
				const options: Object = JSON.parse(args.join(" "));
				const embed: MessageEmbed = new MessageEmbed(options);
				message.channel.send(embed);
			} catch (e) {
				message.channel.send(`❌ An error occured :\n\`\`\`${e.toString()}\`\`\``);
			}
		});
	}
}