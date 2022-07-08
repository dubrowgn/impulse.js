import { Component, ComponentList } from "../ecs/component";

export class PositionComponent extends Component {
	public x: number = 0;
	public y: number = 0;
};

export class PositionList extends ComponentList<PositionComponent> {};
