import { BlockAction } from './blocks';
import { TrainAction } from './train';
import { VariableAction } from './variables';

// Merge all actions
export type AppAction = BlockAction | TrainAction | VariableAction;
