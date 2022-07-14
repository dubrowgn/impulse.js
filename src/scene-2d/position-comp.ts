import { Component, ComponentList } from "../ecs/component";

export interface PositionComp extends Component {
	x: number;
	y: number;
};

export class PositionList extends ComponentList<PositionComp> {};
