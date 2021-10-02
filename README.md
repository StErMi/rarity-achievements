# RarityAchievement: Achievement System for Rarity

Rarity Achievement is a smart contract to create a decentralized achievement system for Rarity by [Andre Cronje](https://twitter.com/AndreCronjeTech). The concept of the project can be adapted and adopted by other crypto games in the ecosystem.

### For the summoner

- Track the total amount of achievement points earned by the summoner while playing the game
- Track the list of achievements earned

### For the other contracts/web developers

- Enable a way to unlock achievements when the user interacts with a contract
- Enable to unlock content if the user has reached a certain amount of achievements points or has unlocked a specific achievement

### What does this enable for the ecosystem?

- Players are more engaged to play the game to earn achievements
- Contract with achievements will be used more
- The overall longevity of the game is extended
- Other contracts / dApp could enable some content only if the user has reached a minimum level of achievements points
- Achievements points (that’s just an idea) could be “burned” to purchase specific items payable with achievements points instead of golds
- More concepts to come

# How to interact with the contract?

### For smart contract developers that want to register and award achievements

If you want to see an example of a contract that integrate with RarityAchievement you can look at [RarityBlockSandbox.sol](https://github.com/StErMi/rarity-achievements/blob/main/contracts/utils/RarityBlockSandbox.sol)

What your contract needs to do is

First of all, you need to import both the RarityAchievement interface and Model

```ts
import “../interfaces/AchievementInterface.sol”;
import “../data/AchievementModel.sol”;
```

Save a reference to the RarityAchievement contract like this

`AchievementContractInterface _ac;`

Declare the Achievement Metadata ID used by your contract

```ts
uint256 private mobAchievement;
uint256 private miniBossAchievement;
uint256 private bossAchievement;
```

Register your achievement metadata calling `_ac.registerAchievement(achievementMetadata);` for each of your contract’s achievements.

`registerAchievement` takes a `metadata` as input and return the `metadataID` you need to send the contract when you want to award an achievement to a summoner.

The model of the metadata is like this:

```ts
AchievementModel.AchievementMetadata metadata = AchievementModel.AchievementMetadata({
    id: 0, // ID here is not important, will be replaced by the AchievementContract
    source: address(this), // source is not important, will be replaced by the AchievementContract
    source_name: "The nightmare dungeon!",
    difficulty: AchievementModel.Difficulty.Uncommon,
    title: "Defeated first miniboss",
    description: "You have been brave enough to defeat the Eruptus, the mini boss of 'The Fantom Dungeon'",
    points: 10
})
```

I’ll explain each of those

- `id`is the ID of the metadata. You can pass `0` because it will be replaced by the RarityAchievement contract when you call the registration process
- `source` is your contract’s address
- `source_name` is the name of your contract. For example `The Fantom Dungeon`, it will be used by web apps to know from which contract the achievement comes.
- `difficulty` is how difficult is to get this achievement. It goes from `Common` to `Legendary`
- `title`is the title of the achievement
- `description` is the description of the achievement
- `points` are the number of achievement points that the summoner will receive when awarded the achievement. Try to be **fair** otherwise, your contract will not be used by other web apps/contracts!

`id` and `source` are optional, they will be replaced by the RarityAchievement contract, other properties are **required**, otherwise, the transaction will revert!

When you have registered all your achievement you just need to award those achievements when the summoner has done some specific action like for example

- Beaten a difficult boss
- Crafted 100 swords
- Collected 100.000 gold
- Reached level 10
- Defeated 10 times a dungeon
- …

To award an achievement to a summoner you need to call `_ac.awardAchievement(summonerId, achievementMetadataId);`.

Please be aware that:

1.  You can award only achievement that your contract owns
2.  You cannot award multiple time the same achievement to the same summoner

If you want to be sure that a summoner already owns an achievement you can call `_ac.hasAchievement(summonerId, achievementMetadataId);`

### For web3 developers / other integration

If you want to build a frontend to list the summoner’s achievement you are in the right place. These functions could also be used by other smart contract developers to create derivative contracts.

For example, you could allow a summoner to craft the ultimate sword only if he owns the achievement unlocked after crafting 100 swords. Or you can allow accessing the final dungeon only if the summoner owns all the achievements from previous dungeons and so on. Just use your imagination!

Back to web3 devs. You have 3 utility functions you can call:

`hasAchievement(uint256 summonerId, uint256 metadataId)` will return a `bool`. It will be `true` if the summoner owns a specific achievement.

`getPoints(uint256 summonerId, address[] memory sources)` it will return the total amount of achievement points owned by the summoner.

The `sources` is an array of whitelisted contracts from which you want to filter the achievements from. For example, you want to get only points gained by `ContractA` and `ContractB` contracts, you just need to pass those addresses as an array.

If you don’t want to filter at all, just pass an empty array like this `[]`

`function getAchievements(uint256 summonerId, address[] memory sources, uint256 offset, uint256 limit)` will return the list of Achievements owned by the summoner. The `sources` parameter is used for the same reason: get only the achievement awarded from those contract addresses. The `offset` and `limit` parameters are used to paginate the results (because of RPC limitations). Use them only if you get some errors while querying the contract otherwise just pass `0` as the offset and `9999999999` (or any big number) as the limit.

## Feedback, help, new ideas?

I’m open to discussion and feedback, if you have any please DM me on Twitter [@StErMi](https://twitter.com/StErMi) or open a [GitHub issue/PR](https://github.com/StErMi/rarity-achievements)!
