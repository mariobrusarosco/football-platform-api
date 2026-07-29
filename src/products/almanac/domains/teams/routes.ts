import express from 'express';
import { getTeamDetail, listTeams } from './service';

const teamsRouter = express.Router();

teamsRouter.get('/', async (_req, res) => {
  try {
    const teams = await listTeams();

    res.json({ teams });
  } catch (error) {
    console.error('Unable to list Almanac teams', error);
    res.status(500).json({ message: 'Unable to list Almanac teams' });
  }
});

teamsRouter.get('/:code', async (req, res) => {
  try {
    const result = await getTeamDetail(req.params.code);

    if (result.status === 'invalid-code') {
      res.status(400).json({ message: 'Invalid national team code' });
      return;
    }

    if (result.status === 'not-found') {
      res.status(404).json({ message: 'National team not found' });
      return;
    }

    res.json({ team: result.team });
  } catch (error) {
    console.error('Unable to get Almanac team', error);
    res.status(500).json({ message: 'Unable to get Almanac team' });
  }
});

export default teamsRouter;
