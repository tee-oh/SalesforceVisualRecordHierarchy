import { LightningElement, api, track } from "lwc";
import FORM_FACTOR from "@salesforce/client/formFactor";

export default class HierarchyRecordContainerChild extends LightningElement {
	
	@api childRecords;
	@api configInfo;
	@api deviceSize;
	@api objectApiName;
	@api parentRecordId;
	@api refObjNameFields;
	@api relationField;
	@api searchDisplayField;
	@api visualType;

	isDefaultItems = false;
	@track minChildRecords;
	@track numberOfPages;
	@track pageNumber = 1;
	pageSize = 30;
	@track showAllMobile = false;
	@track showParents;
	
	get childsToShow() {
		return this.childRecords.slice(0, 8);
	}

	get isChildRecords() {
		return this.childRecords.length > 0 ? true : false;
	}

	get isMoreFlag() {
		return this.childRecords.length > 8;
	}

	@api
	get showParent() {
		return this.showParents;
	}

	set showParent(value) {
		this.showParents = value;
		if (FORM_FACTOR === "Small") {
			this.showAllMobile = !value;
		}
	}

	get showSome() {
		if (FORM_FACTOR === "Large") {
			return true;
		} else if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
			return this.showParents;
		}
	}

	/* 
	get showViewAll() {
		return ((FORM_FACTOR === "Large" || this.showAllMobile) && this.childRecords.length > 0);
	} */

	connectedCallback() {
		if (FORM_FACTOR === "Small") {
			this.pageSize = 10;
		}
	}

	handleRecordClick(event) {
		/* if (FORM_FACTOR === "Small") {
		this.setParentVisibility(true);
		} */
		const search = new CustomEvent("recordselect", {
			detail: event.detail
		});
		this.dispatchEvent(search);
	}

	showMoreItems() {
		const viewall = new CustomEvent("viewall", {
		detail: "isVisible"
		});
		this.dispatchEvent(viewall);
	}

	/* setParentVisibility(isVisible) {
	const setparentsvisible = new CustomEvent("setparentsvisible", {
	  detail: isVisible
	});
	this.dispatchEvent(setparentsvisible);
	} */
}