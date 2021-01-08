import Module from '../module';
import * as Discord from 'discord.js';

export default class RoleAssignmentModule implements Module {
	private _client: Discord.Client;

	constructor(client: Discord.Client) {
		this._client = client;

		client.once('ready', () => this.initialise());
	}

	async initialise(): Promise<void> {
		const client = this._client;

		// todo: refactor out into a config
		const guildId = '231275118700003328';
		const channelId = '796760271191277588';
		const introMessage =
			'**Matches Role**\nReact with <:waving:448957747392806932> to be notified when circuit tournament matches start. Users can notify other users by using @matches and including a link to an ongoing game on Showdown.\n\n**Room Tournament Roles**\nYou can react with the following emojis to receive notifications of when any of the given tournaments start.\n<:pogtad:747852764188770384> - LC\n<:totoheart:747943751040893058> - LC UU\n<:yeahok:338908474027016194> - LC Ubers\n<:natu:688948873523494921> - USUM LC\n<:spl:345048569163808769> - ORAS LC\n<:mathematicalimpossibility:321781106330435584> - B2W2 LC\n<:wat:430963035696529409> - DPP LC\n\nYou can unsubscribe from a role by (reacting and) unreacting.';

		const roles = [
			{ emoji: '448957747392806932', roleId: '400043115689541632' }, // matches
			{ emoji: '747852764188770384', roleId: '796760547458154527' }, // lc
			{ emoji: '747943751040893058', roleId: '796760708330815520' }, // lc uu
			{ emoji: '338908474027016194', roleId: '796760836529455115' }, // lc uber
			{ emoji: '688948873523494921', roleId: '796760875292950560' }, // usum
			{ emoji: '345048569163808769', roleId: '796760913167908905' }, // oras
			{ emoji: '321781106330435584', roleId: '796760934747471903' }, // b2w2
			{ emoji: '430963035696529409', roleId: '796760965852168232' } // dpp
		];

		const guild = await client.guilds.fetch(guildId);
		const channel = await client.channels.fetch(channelId);

		if (!channel) {
			throw new Error('Could not find channel.');
		}

		const roleChannel = <Discord.TextChannel>channel;

		await roleChannel.bulkDelete(100);
		const message = await roleChannel.send(introMessage);

		roles.forEach(async (role) => {
			await message.react(role.emoji);
		});

		await roleChannel.fetch(true);
		await message.fetch(true);

		client.on(
			'messageReactionAdd',
			async (reaction: Discord.MessageReaction, user: Discord.User | Discord.PartialUser) => {
				if (reaction.partial) await reaction.fetch();
				if (reaction.message.partial) await reaction.message.fetch();
				if (user.partial) await user.fetch();
				if (user.id === client?.user?.id) return;

				if (reaction.message.id === message.id) {
					const results = roles.filter((role) => role.emoji === reaction.emoji.id);
					if (results.length > 0) {
						const guildUser = await reaction.message.guild?.members.fetch(user.id);

						results.forEach(async (result) => {
							await guildUser?.roles.add(result.roleId);
						});
					} else {
						await reaction.remove();
					}
				}
			}
		);
		client.on(
			'messageReactionRemove',
			async (reaction: Discord.MessageReaction, user: Discord.User | Discord.PartialUser) => {
				if (reaction.partial) await reaction.fetch();
				if (reaction.message.partial) await reaction.message.fetch();
				if (user.partial) await user.fetch();
				if (user.id === client?.user?.id) return;

				if (reaction.message.id === message.id) {
					const results = roles.filter((role) => role.emoji === reaction.emoji.id);
					if (results.length > 0) {
						const guildUser = await reaction.message.guild?.members.fetch(user.id);

						results.forEach(async (result) => {
							await guildUser?.roles.remove(result.roleId);
						});
					} else {
						await reaction.remove();
					}
				}
			}
		);
	}
}
