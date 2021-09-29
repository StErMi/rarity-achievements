import chai from 'chai';
const {expect} = chai;

const checkAchievementMetadata = (achievement: any, contractAchievement: any) => {
  expect(achievement.id).to.equal(contractAchievement.id);
  expect(achievement.difficulty).to.equal(contractAchievement.difficulty);
  expect(achievement.source).to.equal(contractAchievement.source);
  expect(achievement.source_name).to.equal(contractAchievement.source_name);
  expect(achievement.title).to.equal(contractAchievement.title);
  expect(achievement.description).to.equal(contractAchievement.description);
  expect(achievement.points).to.equal(contractAchievement.points);
};

export {checkAchievementMetadata};
