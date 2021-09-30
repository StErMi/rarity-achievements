# RarityAchievement: Achievement System for Rarity

This project is a general purpose smart contract for a Rarity Achievement System.

### For smart contract developers

If you want to see an example of a contract that integrate with RarityAchievement you can look at [RarityBlockSandbox.sol](https://github.com/StErMi/rarity-achievements/blob/main/contracts/utils/RarityBlockSandbox.sol)

What your contract needs to do is

First of all you need to import both the RarityAchievement inteface and Model

```
import  "../interfaces/AchievementInterface.sol";
import  "../data/AchievementModel.sol";
```

Save reference to the RarityAchievement contract like this

`AchievementContractInterface _ac;`

Declare the Achievement Metadata ID used by your contract

```
uint256  private mobAchievement;
uint256  private miniBossAchievement;
uint256  private bossAchievement;
```

Register your achievement metadata calling `_ac.registerAchievement(achievementMetadata);` for each of your contract's achievement.

`registerAchievement` takes a `metadata` as input and return the `metadataID` you need to send to the contract when you want to award an achievement to a summoner.

The model of the metadata is like this:

```
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

I'll explain each of those

- `id` is the ID of the metadata. You can pass `0` because it will be replaced by the RarityAchievement contract when you call the registration process
- `source` is your contract's address
- `source_name` is the name of your contract. For example `The Fantom Dungeon`, it will be used by webapps to know from which contract the achievement comes from.
- `difficulty` is how difficult is to get this achievement. It goes from `Common` to `Legendary`
- `title` is the title of the achievement
- `description` is the description of the achievement
- `points` are the amount of achievement points that the summoner will receive when awarded the achievement. Try to be **fair** otherwise your contract will not be used by other web app/contracts!

`id` and `source` are optional, they will be replaced by the RarityAchievement contract, other properties are **required**, otherwise the transaction will revert!

When you have registered all your achievement you just need to award those achievements when the summoner has done some specific action like for example

- Beaten a difficult boss
- Crafted 100 swords
- Collected 100.000 gold
- Reached level 10
- Defeated 10 times a dungeon
- ...

To award an achievement to a summoner you need to call `_ac.awardAchievement(summonerId, achievementMetadataId);`.

Please be aware that:

1. You can award only achievement that your contract owns
2. You cannot award multiple time the same achievement to the same summoner

If you want to be sure that a summoner already own an achievement you can call `_ac.hasAchievement(summonerId, achievementMetadataId);`

That's all! Happy developing!

### For web3 developers / other integration

If you want to build a frontend to list the summoner's achievement you are in the right place. These functions could also be used by other smart contract developers to create derivative contracts.

For example you could allow a summoner to craft the ultimate sword only if he ownes the achievement unlocked after crafting 100 swords. Or you can allow to access the final dungeon only if the summoner owns all the achievements from previous dungeons and so on. Just use your imagination!

Back to web3 devs. You have 3 utility functions you can call:

`hasAchievement(uint256 summonerId, uint256 metadataId)` will return a `bool`. It will be `true` if the summoner own a specific achievement.

`getPoints(uint256 summonerId, address[] memory sources)` it will return the total amount of achievement points owned by the summoner.

The `sources` is an array of whitelisted contracts from which you want to filter the achievements from. For example you want to get only points gained by `ContractA` and `ContractB` contracts, you just need to pass those addresses as an array.
If you don't want to filter at all, just pass an empty array like this `[]`

`function getAchievements(uint256 summonerId, address[] memory sources, uint256 offset, uint256 limit)` will return the list of Achievements owned by the summoner. The `sources` parameter is used for the same reason: get only the achievement awarded from those contract addresses. The `offset` and `limit` parameters are used to paginate the results (because of RPC limitations). Use them only if you get some errors while querying the contract otherwise just pass `0` as the offeset and `9999999999` (or any big number) as the limit.

That's it! Happy building!
