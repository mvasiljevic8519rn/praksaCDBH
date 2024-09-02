const fs = require('fs');

// Array to store match results
let groupMatchResults = [];
let groupMatchHistory = [];
// Function to generate random scores for the match
function generateRandomScore(fibaRank,coeficient) {
  let bias = 20;
  let cof= Math.ceil(coeficient / 2); 

  if (fibaRank < 5) {
    bias = bias + 5;
  } 
  if (fibaRank > 14) {
    bias = bias - 5;
  }
  if (fibaRank > 22) {
    bias = bias - 5;
  }
  bias = bias - fibaRank;
  

  const min = 50 + bias +cof;
  const max = 100 + bias +cof;

  let value = Math.floor(Math.random() * (max - min + 1)) + min; // Use const for values that do not change
  
  return value; 
}
function generateRandomScoreNoFiba(coeficient) {
  let cof= Math.ceil(coeficient / 2); 
   cof= Math.ceil(coeficient / 2); 

  const min = 50  +cof;
  const max = 100 +cof;

  let value = Math.floor(Math.random() * (max - min + 1)) + min; // Use const for values that do not change
  
  return value; 
}

function updateGroupMatchResults(ISOCode, group, scoreCoef, points) {

  let existingResult = groupMatchResults.find(result => result.ISOCode === ISOCode);
  
  if (existingResult) {
    existingResult.ScoreCOEF += scoreCoef;  
    existingResult.Points += points;        
  } else {
    groupMatchResults.push({
      ScoreCOEF: scoreCoef,
      Points: points,
      ISOCode: ISOCode,
      Group:group
    });
  }
}


function rankGroupStage(groupMatchResults, groupMatchHistory) {
  const allRankedTeams = [];

  for (let i = 'A'.charCodeAt(0); i < 'D'.charCodeAt(0); i++) {
    const group = String.fromCharCode(i);
    const groupTeams = groupMatchResults.filter(team => team.Group === group);
  
    // Sort teams first by points (descending), then by ScoreCOEF (descending)
    groupTeams.sort((a, b) => b.Points - a.Points || b.ScoreCOEF - a.ScoreCOEF);
  
    // Check for teams with the same points
    const rankedTeams = [];
    for (let j = 0; j < groupTeams.length; j++) {
      const currentTeam = groupTeams[j];
      const teamsWithSamePoints = groupTeams.filter(team => team.Points === currentTeam.Points);
  
      if (teamsWithSamePoints.length > 1) {
        // If more than one team with the same points, compare head-to-head results
        teamsWithSamePoints.sort((team1, team2) => {
          const headToHead = groupMatchHistory.find(
            match =>
              (match.team1 === team1.ISOCode && match.team2 === team2.ISOCode) ||
              (match.team1 === team2.ISOCode && match.team2 === team1.ISOCode)
          );
  
          // Determine ranking based on head-to-head result
          if (headToHead) {
            return headToHead.winner === team1.ISOCode ? -1 : 1;
          }
          return 0; // No head-to-head data, keep as is
        });
  
        // Add sorted teams to ranked list and skip further checks for these teams
        rankedTeams.push(...teamsWithSamePoints);
        j += teamsWithSamePoints.length - 1; // Skip the next same points teams
      } else {
        // If only one team, add it directly to ranked list
        rankedTeams.push(currentTeam);
      }
    }
  
    // Remove the lowest-ranked team (last in the sorted list)
    rankedTeams.pop();
  
    // Add the remaining teams to the overall list
    allRankedTeams.push(...rankedTeams);
  }
  
  // Sort all teams by points (descending), then by ScoreCOEF (descending)
  allRankedTeams.sort((a, b) => b.Points - a.Points || b.ScoreCOEF - a.ScoreCOEF);
  
  //removes the 9
  allRankedTeams.pop();
  
  // console.log('Overall Rankings:');
  // allRankedTeams.forEach(team => {
  //   console.log(`Team: ${team.ISOCode}, Points: ${team.Points}, ScoreCOEF: ${team.ScoreCOEF}, Group: ${team.Group}`);
  // });

  return allRankedTeams;
}



function simulateGroupMatches(groupName, teams) {
  
  console.log(`Simulating matches for Group ${groupName}:\n`);

  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];



      const hasPlayed = team1.Matches.filter(match => match.Opponent === team2.ISOCode);
      let coeficient1= 0   
      let coeficient2= 0;            

      if (hasPlayed.length > 0) {
        hasPlayed.forEach(element => {
          let scores = element.Result.split("-");
           coeficient1= +scores[0] - +scores[1];   
           coeficient2= +scores[1] - +scores[0];            
        });
      } 

      // Generate random scores for both teams
      const score1 = generateRandomScore(team1.FIBARanking, coeficient1);
      const score2 = generateRandomScore(team2.FIBARanking, coeficient2);

      let winner;
      if (score1 > score2) {
          updateGroupMatchResults(team1.ISOCode, groupName, score1 - score2, 2); // Winner
          updateGroupMatchResults(team2.ISOCode, groupName, score2 - score1, 0); // Loser
          winner=team1.ISOCode;
        } else {
          updateGroupMatchResults(team2.ISOCode, groupName, score2 - score1, 2); // Winner
          updateGroupMatchResults(team1.ISOCode, groupName, score1 - score2, 0); // Loser
          winner=team2.ISOCode;
        }
      groupMatchHistory.push({
        group: groupName,
        team1: team1.ISOCode,
        team2: team2.ISOCode,
        score1: score1,
        score2: score2,
        winner: winner,        
      });
      
      console.log(`${team1.Team} (${team1.ISOCode}) vs ${team2.Team} (${team2.ISOCode})`);
      console.log(`Score: ${score1} - ${score2}\n`);
      
    }
  }
  
  groupMatchResults.sort((a, b) => {
    if (a.Group < b.Group) return -1;
    if (a.Group > b.Group) return 1;
    
    return b.Points - a.Points;
  });
  // console.log(groupMatchResults);


}



// Create quarter-final matches with constraints
function createQuarterFinals(teams) {
  const matches = [];

  // Try to pair teams: 1 vs 8, 2 vs 7, etc.
  for (let i = 0; i < teams.length / 2; i++) {
    let team1 = teams[i];
    let team2 = teams[teams.length - 1 - i];

    // Check if teams are from the same group
    if (team1.Group === team2.Group) {
      // Try to find a valid swap
      for (let j = teams.length - 1 - i - 1; j > i; j--) {
        if (teams[j].Group !== team1.Group) {
          // Swap team2 with a valid one
          [teams[teams.length - 1 - i], teams[j]] = [teams[j], teams[teams.length - 1 - i]];
          team2 = teams[teams.length - 1 - i];
          break;
        }
      }
    }

    // If still from the same group after swapping, continue to next iteration
    if (team1.Group === team2.Group) continue;

    matches.push([team1, team2]);
  }

  return matches;
}

function simulateMatch(team1, team2) {
  const score1 = generateRandomScoreNoFiba( team1.ScoreCOEF);
  const score2 = generateRandomScoreNoFiba( team2.ScoreCOEF);
  
  console.log(`Match: ${team1.ISOCode} vs ${team2.ISOCode} | Scores: ${score1} - ${score2}`);
  
  return score1 > score2 ? team1 : team2;
}

function simulateRound(matchups) {

  return matchups.map(([team1, team2]) => simulateMatch(team1, team2));
}

try {
  const data1 = fs.readFileSync('groups.json', 'utf8'); 
  const groupData = JSON.parse(data1);

  const data2 = fs.readFileSync('exibitions.json', 'utf8'); 
  const exibitionsData = JSON.parse(data2);

  for (const group in groupData) {
    groupData[group] = groupData[group].map(team => {
      const matches = exibitionsData[team.ISOCode] || [];
      return {
        ...team,
        Matches: matches
      };
    });
  }  

  // Simulate matches for each group
  for (const group in groupData) {
    simulateGroupMatches(group, groupData[group]);
  }

  const groupTeamsRanked = rankGroupStage(groupMatchResults,groupMatchHistory);

  console.log('Overall Rankings:');
  groupTeamsRanked.forEach(team => {
    console.log(`Team: ${team.ISOCode}, Points: ${team.Points}, ScoreCOEF: ${team.ScoreCOEF}, Group: ${team.Group}`);
  });

  const quarterFinalMatches = createQuarterFinals(groupTeamsRanked);

  // console.log(quarterFinalMatches);
  
console.log("\nQuarter finals Matches:\n");
// Simulate the quarter-finals
const quarterFinalWinners = simulateRound(quarterFinalMatches);
console.log("\nQuarter-final Winners:\n", quarterFinalWinners.map(team => team.ISOCode));

console.log("SEMI FINAL GAMES: \n");

// Prepare semi-final matchups from quarter-final winners
const semiFinals = [
  [quarterFinalWinners[0], quarterFinalWinners[3]], 
  [quarterFinalWinners[1], quarterFinalWinners[2]]  
];

// Simulate the semi-finals
const semiFinalWinners = simulateRound(semiFinals);
console.log("\nSemi-final Winners:\n", semiFinalWinners.map(team => team.ISOCode));

// Determine the semi-final losers for the bronze match
const semiFinalLosers = [
  quarterFinalWinners.find(team => !semiFinalWinners.includes(team) && 
    (team.ISOCode === semiFinals[0][0].ISOCode || team.ISOCode === semiFinals[0][1].ISOCode)),
  quarterFinalWinners.find(team => !semiFinalWinners.includes(team) && 
    (team.ISOCode === semiFinals[1][0].ISOCode || team.ISOCode === semiFinals[1][1].ISOCode))
];

// Simulate the bronze medal match
console.log("\nBronze Medal Match\n");
const bronzeMatch = simulateMatch(semiFinalLosers[0], semiFinalLosers[1]);
console.log("\nBronze Medal Match Winner:\n", bronzeMatch.ISOCode);

// Prepare the final matchup
const final = [semiFinalWinners[0], semiFinalWinners[1]];

// Simulate the final
console.log("FINAL GAME: \n");

const finalWinner = simulateMatch(final[0], final[1]);
console.log("\n1st Winner:\n", finalWinner.ISOCode);

// Determine the 2nd place team
const secondPlace = finalWinner.ISOCode === final[0].ISOCode ? final[1] : final[0];
console.log("\n2nd Place:\n", secondPlace.ISOCode);

// Determine the 3rd place team
const thirdPlace = bronzeMatch.ISOCode;
console.log("\n3rd Place:\n", thirdPlace);

} catch (err) {
  console.error('Error reading or parsing the JSON file:', err);
}
