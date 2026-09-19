export type MatchSourceRecord = {
  id: string;
  worldCupId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  stage: string;
  groupName: string | null;
  homeScore: number;
  awayScore: number;
  extraTime: boolean;
  penaltyShootout: boolean;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

export type GoalSourceRecord = {
  id: string;
  worldCupId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerTeamId: string;
  minuteRegulation: number;
  minuteStoppage: number;
  matchPeriod: string;
  ownGoal: boolean;
  penalty: boolean;
};

export type CreditedScorerTotalRecord = {
  squadPlayerId: string;
  goalCount: number;
};

export type CreditedScorerTotal = {
  squadPlayerId: string;
  goalCount: number;
};
