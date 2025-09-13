// backend/tournament-service/src/service/casualMatches.service.ts
import {
  CasualMatch,
  CasualMatchState,
  CasualMatchData,
} from '../models/casualMatch.models.js';

interface CreateMatchPayload {
  player1_id: number;
  player2_id: number;
  tournament_id?: number | null;
}

interface SubmitResultPayload {
  winner_id: number;
  score: string;
}

/*export const createMatch = async ({
  player1_id,
  player2_id,
  tournament_id = null,
}: CreateMatchPayload): Promise<CasualMatchData> => {
  return await CasualMatch.create({
    player1_id,
    player2_id,
    state: CasualMatchState.PENDING,
    tournament_id, //support storing tournament reference
  });
};*/

export const createMatch = async ({
  player1_id,
  player2_id,
  tournament_id = null,
}: CreateMatchPayload): Promise<CasualMatchData> => {
  console.log('Creating match with:', { player1_id, player2_id, tournament_id });

  if (!player1_id || !player2_id) {
    throw new Error('Missing required player IDs.');
  }

  return await CasualMatch.create({
    player1_id,
    player2_id,
    state: CasualMatchState.PENDING,
    tournament_id,
  });
};


export const submitResult = async (
  id: number,
  { winner_id, score }: SubmitResultPayload
): Promise<CasualMatchData> => {
  const match = await CasualMatch.findById(id);
  if (!match) {
    throw new Error(`Match with ID ${id} not found.`);
  }

  const updateData: Partial<CasualMatchData> = {
    state: CasualMatchState.COMPLETED,
    winner_id,
    score,
  };

  const success = await CasualMatch.update(id, updateData);
  if (!success) {
    throw new Error(`Failed to update match with ID ${id}.`);
  }

  const updatedMatch = await CasualMatch.findById(id);
  if (!updatedMatch) {
    throw new Error(`Could not retrieve updated match with ID ${id}.`);
  }

  return updatedMatch;
};

export const getCasualMatchesByUserId = async (
  userId: number
): Promise<CasualMatchData[]> => {
  return await CasualMatch.findByPlayerId(userId);
};






















/*import { CasualMatch, CasualMatchState, CasualMatchData } from '../models/casualMatch.models.js';

interface CreateMatchPayload {
    player1_id: number;
    player2_id: number;
}

interface SubmitResultPayload {
    winner_id: number;
    score: string;
}

export const createMatch = async ({ player1_id, player2_id }: CreateMatchPayload): Promise<CasualMatchData> =>
    CasualMatch.create({ player1_id, player2_id, state: CasualMatchState.PENDING });

export const submitResult = async (id: number, { winner_id, score }: SubmitResultPayload): Promise<CasualMatchData> => {
    const match = await CasualMatch.findById(id);
    if (!match) {
        throw new Error(`Casual match with ID ${id} not found.`);
    }
    // Prepare the update data
    const updateData: Partial<CasualMatchData> = {
        state: CasualMatchState.COMPLETED,
        winner_id: winner_id,
        score: score,
    };
    // Call the static update method
    const success = await CasualMatch.update(id, updateData);
    if (!success) {
        throw new Error(`Failed to update casual match with ID ${id}.`);
    }
    const updatedMatch = await CasualMatch.findById(id);
    if (!updatedMatch) {
        throw new Error(`Could not retrieve updated casual match with ID ${id}.`);
    }
    return updatedMatch;
};


//###########################################################################adding this
export const getCasualMatchesByUserId = async (userId: number): Promise<CasualMatchData[]> => {
  return await CasualMatch.findByPlayerId(userId);
};*/


