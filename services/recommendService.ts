import {
  excludeProblemsInSubmitedSet,
  scanProbSubmitedAllUser,
} from "../redis/submissionService";

export {};
const g = require("ger");
const esm = new g.MemESM();
const ger = new g.GER(esm);
export const CODING_PROBLEM_NP = "coding-problem-np";

export type RecommenderSystemEvent = {
  namespace: string;
  person: string;
  action: string;
  thing: string;
  expires_at: string;
};

export const initNamespaceCodingProblem = async () => {
  try {
    await ger.initialize_namespace(CODING_PROBLEM_NP);
    const evts = await scanProbSubmitedAllUser();
    ger.events(evts);
  } catch (error) {
    console.log("ERROR Init Data RS");
    console.log(error);
  }
};

export const getRecommendProblemsForUser = async (username: string) => {
  try {
    const recommen = await ger.recommendations_for_person(
      CODING_PROBLEM_NP,
      username,
      { actions: { likes: 1 } }
    );
    const lst = recommen.recommendations.map((item: any) => item.thing);
    //console.log(lst);
    if (lst.length > 0) {
      const result = await excludeProblemsInSubmitedSet(username, lst);
      return result;
    }
    return [];
  } catch (error) {
    throw error;
  }
};
