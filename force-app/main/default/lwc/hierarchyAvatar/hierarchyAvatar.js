import { LightningElement, track, api } from "lwc";
import HIERARCHY_RESOURCES from '@salesforce/resourceUrl/Hierarchy_Resources';

export default class HierarchyAvatar extends LightningElement {
	
	@api deviceSize;
	@api fallbackIconName;
	@api initials;

	@track _src = "";

	hierarchyNoImageFound = HIERARCHY_RESOURCES + '/noimage.png';
	hierarchyStar = HIERARCHY_RESOURCES + '/star.png';

	get showIcon() {
		return !this._src && !this.initials;
	}

	get showInitials() {
		return !this._src && this.initials;
	}

	@api
	get src() {
		return this._src;
	}

	set src(value) {
		this._src = (typeof value === "string" && value.trim()) || "";
	}

	handleImageError() {
		this._src = "";
	}
}