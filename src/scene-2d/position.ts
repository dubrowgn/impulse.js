import { Component, ComponentList } from "../ecs/component";

export interface PositionComponent extends Component {
	x: number;
	y: number;
};

export class PositionList extends ComponentList<PositionComponent> {};
