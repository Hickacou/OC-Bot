import { Message, Snowflake, Collection, PermissionResolvable, TextChannel, DMChannel, NewsChannel } from "discord.js";
import Tofu from "./Client";
import { formatDuration } from "../lib/Time";
import CommandOptions from "../typedefs/CommandOptions";
import { formatPermission } from "../lib/utils";
import BotResponse from "./BotResponse";
import * as log from "../lib/Log";

export default abstract class Command {
	[k: string]: any;
	public aliases: string[];
	protected client: Tofu;
	public cooldown: number;
	protected cooldowned?: Collection<Snowflake, number>;
	public desc: string;
	public hidden: boolean;
	public module: string;
	public name: string;
	public perms?: PermissionResolvable[];
	public props: Map<string, any>;
	public usages?: string[];
	public whitelist?: Snowflake[];
	constructor(client: Tofu, options: CommandOptions) {
		this.aliases = options.aliases ?? [];
		this.client = client;
		this.cooldown = options.cooldown ?? 0;
		this.cooldowned = new Collection<Snowflake, number>();
		this.desc = options.desc;
		this.hidden = options.hidden || false;
		this.module = options.module;
		this.name = options.name;
		this.perms = options.perms;
		this.props = new Map<string, any>();
		this.usages = options.usages;
		this.whitelist = options.whitelist;
	}

	public abstract setup(): Promise<void>;
	public abstract exe(message: Message, args: string[]): Promise<void>;

	public async check(message: Message, callback: Function): Promise<void> {
		if (this.whitelist) {
			if (!this.whitelist.includes(message.author.id)) {
				const msg: Message = await this.error("You're not authorized to use this command.", message.channel)
				setTimeout(() => {
					msg.delete();
					if (message.deletable) message.delete();
				}, 1500);
				return;
			}
		}

		if (this.perms) {
			for (const perm of this.perms) {
				if (!message.member.hasPermission(perm)) {
					this.error(`You need the \`${formatPermission(perm.toString())}\` permission to run this command in this server.`, message.channel);
					return;
				}
			}
		}

		if (this.cooldowned.has(message.author.id)) {
			const duration: string = formatDuration(new Date(this.cooldowned.get(message.author.id)), new Date(), true);
			const msg: Message = await this.error(`You're on cooldown for this command. Please wait another ${duration}.`, message.channel);
			setTimeout(() => {
				msg.delete();
				if (message.deletable) message.delete();
			}, 1500);
			return;
		}
		const cmdU: number = await this.client.db.incrementCommand(this.name);
		const usrU: number = await this.client.db.incrementUser(message.author);
		log.info(`${log.user(message.author)} used ${log.text(message.cleanContent)} | Command uses : ${log.number(cmdU)} - User uses : ${log.number(usrU)} `);
		if (!this.client.admins.includes(message.author.id)) {
			this.cooldowned.set(message.author.id, Date.now() + this.cooldown);
			setTimeout(() => this.cooldowned.delete(message.author.id), this.cooldown);
		}
		callback();
	}

	public async success(message: string, channel: TextChannel | DMChannel | NewsChannel): Promise<Message> {
		const response: BotResponse = new BotResponse(message, "SUCCESS");
		return channel.send(response.toEmbed());
	}

	public async warn(message: string, channel: TextChannel | DMChannel | NewsChannel): Promise<Message> {
		const response: BotResponse = new BotResponse(message, "WARNING");
		return channel.send(response.toEmbed());
	}

	public async error(message: string, channel: TextChannel | DMChannel | NewsChannel, error?: Error): Promise<Message> {
		const response: BotResponse = new BotResponse(message, "ERROR", error);
		return channel.send(response.toEmbed());
	}

}