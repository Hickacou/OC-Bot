import { GuildMember } from "discord.js";

export default interface MusicQueueItem {
	displayDuration: string,
	duration: number,
	imgUrl: string,
	url: string,
	requestedBy: GuildMember,
	title: string
}